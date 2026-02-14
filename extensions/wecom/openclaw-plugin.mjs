// Plain JS plugin — avoids jiti/esbuild transpilation issues in installed app.

// Pending outbound images queue — sendMedia stores items here,
// panel-server retrieves them via the wecom_get_pending_images gateway method.
const pendingImages = [];

const plugin = {
  id: "wecom",
  name: "WeCom",
  description: "WeChat channel via WeCom Customer Service",
  configSchema: {
    safeParse(value) {
      if (value === undefined) return { success: true, data: undefined };
      if (!value || typeof value !== "object" || Array.isArray(value))
        return { success: false, error: { issues: [{ path: [], message: "expected config object" }] } };
      if (Object.keys(value).length > 0)
        return { success: false, error: { issues: [{ path: [], message: "config must be empty" }] } };
      return { success: true, data: value };
    },
    jsonSchema: { type: "object", additionalProperties: false, properties: {} },
  },
  register(api) {
    // Register custom gateway method so panel-server can retrieve pending images.
    api.registerGatewayMethod("wecom_get_pending_images", ({ respond }) => {
      const images = pendingImages.splice(0, pendingImages.length);
      respond(true, { images });
    });

    api.registerChannel({
      plugin: {
        id: "wechat",
        meta: {
          id: "wechat",
          label: "WeChat",
          selectionLabel: "WeChat (微信)",
          docsPath: "/channels/wechat",
          blurb: "WeChat messaging via WeCom Customer Service relay.",
          aliases: ["wecom"],
        },
        capabilities: {
          chatTypes: ["direct"],
          media: true,
        },
        config: {
          listAccountIds: () => [],
          resolveAccount: () => null,
        },
        outbound: {
          deliveryMode: "gateway",
          textChunkLimit: 2048,
          async sendText({ to, text }) {
            // Text delivery is handled by chat events → panel-server → relay.
            // This stub exists so the agent knows wechat supports outbound.
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
          async sendMedia({ to, text, mediaUrl }) {
            // Queue image for panel-server to pick up via wecom_get_pending_images.
            // The panel-server reads the file, base64 encodes it, and sends via relay.
            pendingImages.push({ to: to ?? "", mediaUrl: mediaUrl ?? "", text: text ?? "" });
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
        },
      },
    });
  },
};

export default plugin;
