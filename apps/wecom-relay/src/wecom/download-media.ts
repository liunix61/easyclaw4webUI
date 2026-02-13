import { createLogger } from "@easyclaw/logger";

const log = createLogger("wecom:media");

const WECOM_API_BASE = "https://qyapi.weixin.qq.com";

export interface MediaDownloadResult {
  data: Buffer;
  contentType: string;
}

/**
 * Download a media file from WeCom by its media_id.
 *
 * WeCom API: GET /cgi-bin/media/get?access_token=TOKEN&media_id=MEDIA_ID
 * Returns the raw binary file with appropriate Content-Type header.
 */
export async function downloadMedia(
  accessToken: string,
  mediaId: string,
): Promise<MediaDownloadResult> {
  const url = `${WECOM_API_BASE}/cgi-bin/media/get?access_token=${encodeURIComponent(accessToken)}&media_id=${encodeURIComponent(mediaId)}`;

  log.info(`Downloading media: ${mediaId}`);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Media download HTTP error: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";

  // If the response is JSON, it's an error from the WeCom API
  if (contentType.includes("application/json") || contentType.includes("text/plain")) {
    const body = await res.json() as { errcode?: number; errmsg?: string };
    throw new Error(`WeCom media API error: ${body.errcode} ${body.errmsg}`);
  }

  const data = Buffer.from(await res.arrayBuffer());
  log.info(`Downloaded ${data.length} bytes, type=${contentType}`);
  return { data, contentType };
}
