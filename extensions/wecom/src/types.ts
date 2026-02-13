/** WebSocket protocol frame types (mirrors relay server types) */

export interface HelloFrame {
  type: "hello";
  gateway_id: string;
  auth_token: string;
}

export interface InboundFrame {
  type: "inbound";
  id: string;
  external_user_id: string;
  msg_type: string;
  content: string;
  timestamp: number;
  /** Base64-encoded media data (for voice/image messages). */
  media_data?: string;
  /** MIME type of the media (e.g. "audio/amr"). */
  media_mime?: string;
}

export interface ReplyFrame {
  type: "reply";
  id: string;
  external_user_id: string;
  content: string;
}

export interface AckFrame {
  type: "ack";
  id: string;
}

export interface ErrorFrame {
  type: "error";
  message: string;
}

export interface CreateBindingFrame {
  type: "create_binding";
  gateway_id: string;
}

export interface CreateBindingAckFrame {
  type: "create_binding_ack";
  token: string;
  customer_service_url: string;
}

export type WsFrame =
  | HelloFrame
  | InboundFrame
  | ReplyFrame
  | AckFrame
  | ErrorFrame
  | CreateBindingFrame
  | CreateBindingAckFrame;

/* ── Type guards ─────────────────────────────────────────────────── */

export function isHelloFrame(f: WsFrame): f is HelloFrame {
  return f.type === "hello";
}

export function isInboundFrame(f: WsFrame): f is InboundFrame {
  return f.type === "inbound";
}

export function isReplyFrame(f: WsFrame): f is ReplyFrame {
  return f.type === "reply";
}

export function isAckFrame(f: WsFrame): f is AckFrame {
  return f.type === "ack";
}

export function isErrorFrame(f: WsFrame): f is ErrorFrame {
  return f.type === "error";
}

export function isCreateBindingAckFrame(f: WsFrame): f is CreateBindingAckFrame {
  return f.type === "create_binding_ack";
}

/**
 * Parse a raw JSON string into a WsFrame.
 * Returns `null` if the string is not valid JSON or lacks a known `type`.
 */
export function parseFrame(raw: string): WsFrame | null {
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (typeof obj !== "object" || obj === null) return null;
    const validTypes = ["hello", "inbound", "reply", "ack", "error", "create_binding", "create_binding_ack"];
    if (!validTypes.includes(obj.type as string)) return null;
    return obj as unknown as WsFrame;
  } catch {
    return null;
  }
}
