// Plain JS plugin — avoids jiti/esbuild transpilation issues in installed app.

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
            // Delivery is handled by the EasyClaw desktop gateway via WeCom relay.
            // This adapter exists so the agent knows wechat supports outbound.
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
          async sendMedia({ to, text, mediaUrl }) {
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
        },
      },
    });
  },
};

export default plugin;
