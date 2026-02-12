import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createLogger } from "@easyclaw/logger";

const log = createLogger("channel-config");

export interface ChannelAccountConfig {
  name?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface WriteChannelAccountOptions {
  configPath: string;
  channelId: string;
  accountId: string;
  config: ChannelAccountConfig;
}

export interface RemoveChannelAccountOptions {
  configPath: string;
  channelId: string;
  accountId: string;
}

/**
 * Write or update a channel account configuration in OpenClaw config.json.
 * Creates the channels section and account structure if they don't exist.
 */
export function writeChannelAccount(options: WriteChannelAccountOptions): void {
  const { configPath, channelId, accountId, config } = options;

  // Read existing config
  let existingConfig: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      existingConfig = JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      log.warn(`Failed to parse existing config at ${configPath}:`, err);
    }
  }

  // Ensure channels object exists
  if (!existingConfig.channels || typeof existingConfig.channels !== "object") {
    existingConfig.channels = {};
  }

  const channels = existingConfig.channels as Record<string, unknown>;

  // Ensure channel object exists
  if (!channels[channelId] || typeof channels[channelId] !== "object") {
    channels[channelId] = {};
  }

  const channel = channels[channelId] as Record<string, unknown>;

  // Write to accounts.<accountId> for all accounts (including "default")
  if (!channel.accounts || typeof channel.accounts !== "object") {
    channel.accounts = {};
  }

  const accounts = channel.accounts as Record<string, unknown>;
  accounts[accountId] = config;

  // Auto-enable the channel plugin in plugins.entries so the gateway loads it
  enableChannelPlugin(existingConfig, channelId);

  // Write back to file
  writeFileSync(configPath, JSON.stringify(existingConfig, null, 2), "utf-8");
  log.info(`Wrote channel account: ${channelId}/${accountId}`);
}

/**
 * Remove a channel account from OpenClaw config.json.
 */
export function removeChannelAccount(options: RemoveChannelAccountOptions): void {
  const { configPath, channelId, accountId } = options;

  if (!existsSync(configPath)) {
    log.warn(`Config file not found: ${configPath}`);
    return;
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as Record<string, unknown>;

    if (!config.channels || typeof config.channels !== "object") {
      log.warn("No channels config found");
      return;
    }

    const channels = config.channels as Record<string, unknown>;

    if (!channels[channelId] || typeof channels[channelId] !== "object") {
      log.warn(`Channel ${channelId} not found in config`);
      return;
    }

    const channel = channels[channelId] as Record<string, unknown>;

    // Remove account from accounts.<accountId> (including "default")
    if (channel.accounts && typeof channel.accounts === "object") {
      const accounts = channel.accounts as Record<string, unknown>;
      delete accounts[accountId];

      // If no accounts left, remove the entire channel config and disable the plugin
      if (Object.keys(accounts).length === 0) {
        delete channels[channelId];
        disableChannelPlugin(config, channelId);
      }
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    log.info(`Removed channel account: ${channelId}/${accountId}`);
  } catch (err) {
    log.error(`Failed to remove channel account ${channelId}/${accountId}:`, err);
    throw err;
  }
}

/**
 * Enable a channel's plugin in plugins.entries so the gateway loads it.
 * Channel ID maps directly to plugin ID (e.g., "telegram" → plugins.entries.telegram).
 */
function enableChannelPlugin(config: Record<string, unknown>, channelId: string): void {
  if (!config.plugins || typeof config.plugins !== "object") {
    config.plugins = {};
  }
  const plugins = config.plugins as Record<string, unknown>;

  if (!plugins.entries || typeof plugins.entries !== "object") {
    plugins.entries = {};
  }
  const entries = plugins.entries as Record<string, unknown>;

  const existing = typeof entries[channelId] === "object" && entries[channelId] !== null
    ? (entries[channelId] as Record<string, unknown>)
    : {};
  entries[channelId] = { ...existing, enabled: true };

  log.info(`Enabled channel plugin: ${channelId}`);
}

/**
 * Disable a channel's plugin in plugins.entries when its last account is removed.
 */
function disableChannelPlugin(config: Record<string, unknown>, channelId: string): void {
  if (!config.plugins || typeof config.plugins !== "object") return;
  const plugins = config.plugins as Record<string, unknown>;

  if (!plugins.entries || typeof plugins.entries !== "object") return;
  const entries = plugins.entries as Record<string, unknown>;

  if (typeof entries[channelId] === "object" && entries[channelId] !== null) {
    (entries[channelId] as Record<string, unknown>).enabled = false;
    log.info(`Disabled channel plugin: ${channelId}`);
  }
}

/**
 * Get all account IDs for a specific channel from config.
 */
export function listChannelAccounts(
  configPath: string,
  channelId: string
): string[] {
  if (!existsSync(configPath)) {
    return [];
  }

  try {
    const raw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as Record<string, unknown>;

    if (!config.channels || typeof config.channels !== "object") {
      return [];
    }

    const channels = config.channels as Record<string, unknown>;
    const channel = channels[channelId];

    if (!channel || typeof channel !== "object") {
      return [];
    }

    const channelObj = channel as Record<string, unknown>;

    if (channelObj.accounts && typeof channelObj.accounts === "object") {
      return Object.keys(channelObj.accounts as Record<string, unknown>);
    }

    return [];
  } catch (err) {
    log.error(`Failed to list channel accounts for ${channelId}:`, err);
    return [];
  }
}
