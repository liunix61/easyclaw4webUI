import { createLogger } from "@easyclaw/logger";
import type { WeComMessage } from "../types.js";

const log = createLogger("wecom:sync-messages");

const WECOM_API_BASE = "https://qyapi.weixin.qq.com";

interface SyncMsgResponse {
  errcode: number;
  errmsg: string;
  next_cursor?: string;
  has_more?: number;
  msg_list?: WeComSyncMessage[];
}

interface WeComSyncMessage {
  msgid: string;
  open_kfid: string;
  external_userid: string;
  send_time: number;
  origin: number;
  msgtype: string;
  text?: { content: string };
  image?: { media_id: string };
  voice?: { media_id: string };
  event?: { event_type: string };
}

/** In-memory cursor for sync_msg pagination */
let syncCursor = "";

/**
 * Fetch new messages from WeCom Customer Service API.
 *
 * POST /cgi-bin/kf/sync_msg?access_token=TOKEN
 * Body: { cursor, token, limit, voice_format }
 */
export async function syncMessages(
  accessToken: string,
  token?: string,
): Promise<WeComMessage[]> {
  const url = `${WECOM_API_BASE}/cgi-bin/kf/sync_msg?access_token=${encodeURIComponent(accessToken)}`;

  const body: Record<string, unknown> = {
    cursor: syncCursor,
    limit: 1000,
    voice_format: 0,
  };

  if (token) {
    body.token = token;
  }

  log.info("Syncing messages from WeCom");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`sync_msg request failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as SyncMsgResponse;

  if (data.errcode !== 0) {
    throw new Error(`sync_msg API error: ${data.errcode} ${data.errmsg}`);
  }

  if (data.next_cursor) {
    syncCursor = data.next_cursor;
  }

  const messages: WeComMessage[] = (data.msg_list ?? []).map((m) => {
    switch (m.msgtype) {
      case "text":
        return {
          msgtype: "text" as const,
          external_userid: m.external_userid,
          text: m.text?.content ?? "",
          msgid: m.msgid,
          send_time: m.send_time,
          open_kfid: m.open_kfid,
          origin: m.origin,
        };
      case "image":
        return {
          msgtype: "image" as const,
          external_userid: m.external_userid,
          media_id: m.image?.media_id ?? "",
          msgid: m.msgid,
          send_time: m.send_time,
          open_kfid: m.open_kfid,
          origin: m.origin,
        };
      case "voice":
        return {
          msgtype: "voice" as const,
          external_userid: m.external_userid,
          media_id: m.voice?.media_id ?? "",
          msgid: m.msgid,
          send_time: m.send_time,
          open_kfid: m.open_kfid,
          origin: m.origin,
        };
      case "event":
        return {
          msgtype: "event" as const,
          event_type: m.event?.event_type ?? "",
          external_userid: m.external_userid,
          open_kfid: m.open_kfid,
          send_time: m.send_time,
        };
      default:
        return {
          msgtype: "text" as const,
          external_userid: m.external_userid,
          text: `[Unsupported message type: ${m.msgtype}]`,
          msgid: m.msgid,
          send_time: m.send_time,
          open_kfid: m.open_kfid,
          origin: m.origin,
        };
    }
  });

  log.info(`Synced ${messages.length} messages`);
  return messages;
}

/**
 * Reset sync cursor. For testing only.
 * @internal
 */
export function _resetSyncCursor(): void {
  syncCursor = "";
}
