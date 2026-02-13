import type { IncomingMessage, ServerResponse } from "node:http";
import { createLogger } from "@easyclaw/logger";
import type { Config } from "../config.js";
import { decodeEncodingAESKey } from "../crypto/encoding-aes-key.js";
import { verifySignature } from "../crypto/signature.js";
import { decrypt } from "../crypto/decrypt.js";
import { parseCallbackXml, extractEncryptedBody } from "./message-parser.js";
import { getAccessToken } from "./access-token.js";
import { syncMessages } from "./sync-messages.js";
import { handleInboundMessages } from "../relay/inbound.js";

const log = createLogger("wecom:webhook");

/**
 * Create the HTTP request handler for WeCom webhook callbacks.
 *
 * GET: URL verification — decrypt echostr, return plaintext.
 * POST: Verify signature, decrypt body, handle event, respond immediately.
 */
export function createWebhookHandler(config: Config) {
  const keyPair = decodeEncodingAESKey(config.WECOM_ENCODING_AES_KEY);

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname !== "/webhook") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    if (req.method === "GET") {
      handleVerification(url, config, keyPair, res);
      return;
    }

    if (req.method === "POST") {
      // Respond immediately (WeCom requires response within 5 seconds)
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("success");

      // Process asynchronously
      processCallback(req, url, config, keyPair).catch((err) => {
        log.error("Error processing webhook callback:", err);
      });
      return;
    }

    res.writeHead(405);
    res.end("Method Not Allowed");
  };
}

function handleVerification(
  url: URL,
  config: Config,
  keyPair: ReturnType<typeof decodeEncodingAESKey>,
  res: ServerResponse,
): void {
  const msgSignature = url.searchParams.get("msg_signature") ?? "";
  const timestamp = url.searchParams.get("timestamp") ?? "";
  const nonce = url.searchParams.get("nonce") ?? "";
  const echostr = url.searchParams.get("echostr") ?? "";

  if (!verifySignature(config.WECOM_TOKEN, timestamp, nonce, echostr, msgSignature)) {
    log.warn("GET verification signature mismatch");
    res.writeHead(403);
    res.end("Signature verification failed");
    return;
  }

  const plaintext = decrypt(echostr, keyPair, config.WECOM_CORPID);
  log.info("GET verification successful");

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(plaintext);
}

async function processCallback(
  req: IncomingMessage,
  url: URL,
  config: Config,
  keyPair: ReturnType<typeof decodeEncodingAESKey>,
): Promise<void> {
  const body = await readBody(req);

  const msgSignature = url.searchParams.get("msg_signature") ?? "";
  const timestamp = url.searchParams.get("timestamp") ?? "";
  const nonce = url.searchParams.get("nonce") ?? "";

  // Extract encrypted content from XML body
  const encryptedContent = extractEncryptedBody(body);

  // Verify signature
  if (!verifySignature(config.WECOM_TOKEN, timestamp, nonce, encryptedContent, msgSignature)) {
    log.warn("POST callback signature mismatch");
    return;
  }

  // Decrypt message
  const xml = decrypt(encryptedContent, keyPair, config.WECOM_CORPID);
  const event = parseCallbackXml(xml);

  log.info(`Received callback: MsgType=${event.MsgType}, Event=${event.Event ?? "none"}`);

  // Only process kf_msg_or_event events
  if (event.MsgType === "event" && event.Event === "kf_msg_or_event") {
    const accessToken = await getAccessToken(config.WECOM_CORPID, config.WECOM_APP_SECRET);
    const messages = await syncMessages(accessToken, event.Token);

    await handleInboundMessages(messages, config);
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
