// Inline emptyPluginConfigSchema to avoid openclaw/plugin-sdk resolution
// issues when loaded by the installed app (asar context).

const plugin = {
  id: "wecom",
  name: "WeCom",
  description: "WeChat channel via WeCom Customer Service",
  configSchema: {
    safeParse(value: unknown) {
      if (value === undefined) return { success: true as const, data: undefined };
      if (!value || typeof value !== "object" || Array.isArray(value))
        return { success: false as const, error: { issues: [{ path: [], message: "expected config object" }] } };
      if (Object.keys(value as Record<string, unknown>).length > 0)
        return { success: false as const, error: { issues: [{ path: [], message: "config must be empty" }] } };
      return { success: true as const, data: value };
    },
    jsonSchema: { type: "object", additionalProperties: false, properties: {} },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(api: any) {
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
          async sendText({ to, text }: { to?: string; text: string }) {
            // Delivery is handled by the EasyClaw desktop gateway via WeCom relay.
            // This adapter exists so the agent knows wechat supports outbound.
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
          async sendMedia({ to, text, mediaUrl }: { to?: string; text: string; mediaUrl?: string }) {
            return { channel: "wechat", messageId: "", chatId: to ?? "" };
          },
        },
      },
    });
  },
};

export default plugin;
