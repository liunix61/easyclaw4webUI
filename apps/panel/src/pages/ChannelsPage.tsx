import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchChannelStatus, deleteChannelAccount, type ChannelsStatusSnapshot, type ChannelAccountSnapshot } from "../api.js";
import { AddChannelAccountModal } from "../components/AddChannelAccountModal.js";
import { ManageAllowlistModal } from "../components/ManageAllowlistModal.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { Select } from "../components/Select.js";

// OpenClaw built-in channels
const KNOWN_CHANNELS = [
  { id: "telegram", labelKey: "channels.channelTelegram", tutorialUrl: "https://docs.openclaw.ai/channels/telegram", tooltip: "channels.tooltipTelegram" },
  { id: "whatsapp", labelKey: "channels.channelWhatsApp", tutorialUrl: "https://docs.openclaw.ai/channels/whatsapp", tooltip: "channels.tooltipWhatsApp" },
  { id: "discord", labelKey: "channels.channelDiscord", tutorialUrl: "https://docs.openclaw.ai/channels/discord", tooltip: "channels.tooltipDiscord" },
  { id: "slack", labelKey: "channels.channelSlack", tutorialUrl: "https://docs.openclaw.ai/channels/slack", tooltip: "channels.tooltipSlack" },
  { id: "googlechat", labelKey: "channels.channelGoogleChat", tutorialUrl: "https://docs.openclaw.ai/channels/googlechat", tooltip: "channels.tooltipGoogleChat" },
  { id: "signal", labelKey: "channels.channelSignal", tutorialUrl: "https://docs.openclaw.ai/channels/signal", tooltip: "channels.tooltipSignal" },
  { id: "imessage", labelKey: "channels.channelIMessage", tutorialUrl: "https://docs.openclaw.ai/channels/imessage", tooltip: "channels.tooltipIMessage" },
  { id: "feishu", labelKey: "channels.channelFeishu", tutorialUrl: "https://docs.openclaw.ai/channels/feishu", tooltip: "channels.tooltipFeishu" },
  { id: "line", labelKey: "channels.channelLine", tutorialUrl: "https://docs.openclaw.ai/channels/line", tooltip: "channels.tooltipLine" },
  { id: "matrix", labelKey: "channels.channelMatrix", tutorialUrl: "https://docs.openclaw.ai/channels/matrix", tooltip: "channels.tooltipMatrix" },
  { id: "mattermost", labelKey: "channels.channelMattermost", tutorialUrl: "https://docs.openclaw.ai/channels/mattermost", tooltip: "channels.tooltipMattermost" },
  { id: "msteams", labelKey: "channels.channelMsteams", tutorialUrl: "https://docs.openclaw.ai/channels/msteams", tooltip: "channels.tooltipMsteams" },
] as const;

// Channels that require services blocked in mainland China (GFW)
const CHINA_BLOCKED_CHANNELS = new Set([
  "telegram", "whatsapp", "discord", "signal", "line", "googlechat", "slack",
]);

function StatusBadge({ status, t }: { status: boolean | null | undefined; t: (key: string) => string }) {
  const variant = status === true ? "badge-success" : status === false ? "badge-danger" : "badge-warning";
  const text = status === true ? t("channels.statusYes") : status === false ? t("channels.statusNo") : t("channels.statusUnknown");

  return (
    <span className={`badge ${variant}`}>
      {text}
    </span>
  );
}

export function ChannelsPage() {
  const { t, i18n } = useTranslation();
  const [snapshot, setSnapshot] = useState<ChannelsStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedChannelLabel, setSelectedChannelLabel] = useState<string>("");
  const [editingAccount, setEditingAccount] = useState<{ accountId: string; name?: string; config: Record<string, unknown> } | undefined>(undefined);

  // Allowlist modal state
  const [allowlistModalOpen, setAllowlistModalOpen] = useState(false);
  const [allowlistChannelId, setAllowlistChannelId] = useState<string>("");
  const [allowlistChannelLabel, setAllowlistChannelLabel] = useState<string>("");

  // Delete confirm dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ channelId: string; accountId: string; label: string } | null>(null);
  // Track which account is being deleted (for spinner)
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Dropdown selection state for add account
  const [selectedDropdownChannel, setSelectedDropdownChannel] = useState<string>("");

  const visibleChannels = i18n.language === "zh"
    ? KNOWN_CHANNELS.filter(ch => !CHINA_BLOCKED_CHANNELS.has(ch.id) || ch.id === selectedDropdownChannel)
    : KNOWN_CHANNELS;

  async function loadChannelStatus(showLoading = true) {
    if (showLoading) setLoading(true);
    if (showLoading) setError(null);

    try {
      const data = await fetchChannelStatus(true);
      setError(null);
      setSnapshot(data);
    } catch (err) {
      // Only show error on initial load; background refreshes keep existing data
      if (showLoading || !snapshot) {
        setError(String(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /** Retry loading until gateway is back (after config changes trigger a restart). */
  function retryUntilReady(attempt = 0) {
    const delays = [1500, 3000, 5000];
    const delay = delays[attempt] ?? delays[delays.length - 1];
    setTimeout(async () => {
      try {
        const data = await fetchChannelStatus(true);
        setError(null);
        setSnapshot(data);
      } catch {
        if (attempt < delays.length - 1) {
          retryUntilReady(attempt + 1);
        }
      }
    }, delay);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      setRefreshing(true);
      try {
        const data = await fetchChannelStatus(true);
        setError(null);
        setSnapshot(data);
        setLoading(false);
        setRefreshing(false);
        // Healthy — next poll in 30s
        timer = setTimeout(poll, 30000);
      } catch (err) {
        setLoading(false);
        setRefreshing(false);
        if (!snapshot) setError(String(err));
        // Gateway not ready — retry in 2s
        timer = setTimeout(poll, 2000);
      }
    }

    poll();

    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadChannelStatus(false);
  }

  function handleAddAccountFromDropdown() {
    if (!selectedDropdownChannel) return;

    const knownChannel = KNOWN_CHANNELS.find(c => c.id === selectedDropdownChannel);
    const label = knownChannel ? t(knownChannel.labelKey) : selectedDropdownChannel;

    setSelectedChannelId(selectedDropdownChannel);
    setSelectedChannelLabel(label);
    setEditingAccount(undefined);
    setModalOpen(true);

    // Reset dropdown
    setSelectedDropdownChannel("");
  }

  function handleEditAccount(channelId: string, account: ChannelAccountSnapshot) {
    const knownChannel = KNOWN_CHANNELS.find(c => c.id === channelId);
    const label = knownChannel ? t(knownChannel.labelKey) : snapshot?.channelLabels[channelId] || channelId;

    setSelectedChannelId(channelId);
    setSelectedChannelLabel(label);

    // Build config from account snapshot
    const config: Record<string, unknown> = {
      enabled: account.enabled ?? true,
    };

    // Add channel-specific fields if they exist
    if (account.dmPolicy) config.dmPolicy = account.dmPolicy;
    if (account.groupPolicy) config.groupPolicy = account.groupPolicy;
    if (account.streamMode) config.streamMode = account.streamMode;
    if (account.webhookUrl) config.webhookUrl = account.webhookUrl;
    if (account.mode) config.mode = account.mode;

    setEditingAccount({
      accountId: account.accountId,
      name: account.name || undefined,
      config,
    });
    setModalOpen(true);
  }

  function handleDeleteAccount(channelId: string, accountId: string) {
    const knownChannel = KNOWN_CHANNELS.find(c => c.id === channelId);
    const label = knownChannel ? t(knownChannel.labelKey) : channelId;
    setDeleteConfirm({ channelId, accountId, label });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    const { channelId, accountId } = deleteConfirm;
    const key = `${channelId}-${accountId}`;
    setDeleteConfirm(null);
    setDeletingKey(key);

    try {
      setDeleteError(null);
      await deleteChannelAccount(channelId, accountId);

      // Initial delay — give gateway time to receive SIGUSR1 and start reloading
      await new Promise(r => setTimeout(r, 800));

      // Poll until gateway responds with fresh data
      for (let i = 0; i < 15; i++) {
        try {
          const data = await fetchChannelStatus(true);
          setError(null);
          setSnapshot(data);
          break;
        } catch {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (err) {
      setDeleteError(`${t("channels.failedToDelete")} ${String(err)}`);
    } finally {
      setDeletingKey(null);
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingAccount(undefined);
  }

  async function handleModalSuccess(): Promise<void> {
    // Initial delay — give gateway time to receive SIGUSR1 and start reloading
    await new Promise(r => setTimeout(r, 800));

    // Poll until gateway responds with fresh data
    for (let i = 0; i < 15; i++) {
      try {
        const data = await fetchChannelStatus(true);
        setError(null);
        setSnapshot(data);
        return;
      } catch {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  }

  function handleManageAllowlist(channelId: string) {
    const knownChannel = KNOWN_CHANNELS.find(c => c.id === channelId);
    const label = knownChannel ? t(knownChannel.labelKey) : snapshot?.channelLabels[channelId] || channelId;

    setAllowlistChannelId(channelId);
    setAllowlistChannelLabel(label);
    setAllowlistModalOpen(true);
  }

  if (loading) {
    return (
      <div>
        <h1>{t("channels.title")}</h1>
        <div className="centered-muted">
          {t("channels.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>{t("channels.title")}</h1>
        <div className="error-alert">
          <strong>{t("channels.errorLoadingChannels")}</strong> {error}
          <div className="error-alert-actions">
            <button className="btn btn-danger" onClick={() => loadChannelStatus()}>
              {t("channels.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div>
        <h1>{t("channels.title")}</h1>
        <div className="centered-muted">
          {t("channels.gatewayNotConnected")}
        </div>
      </div>
    );
  }

  // Collect all accounts from all channels, filtering out synthetic "default" placeholders
  const allAccounts: Array<{ channelId: string; channelLabel: string; account: ChannelAccountSnapshot }> = [];

  for (const [channelId, accounts] of Object.entries(snapshot.channelAccounts)) {
    const knownChannel = KNOWN_CHANNELS.find(c => c.id === channelId);
    const channelLabel = knownChannel ? t(knownChannel.labelKey) : snapshot.channelLabels[channelId] || channelId;

    for (const account of accounts) {
      // Skip synthetic "default" placeholder accounts (auto-generated by gateway when no config exists)
      // Identify by: accountId="default" + not configured + no name + no token source
      const isSyntheticDefault =
        account.accountId === "default" &&
        account.configured === false &&
        !account.name &&
        (account as any).tokenSource === "none";

      if (isSyntheticDefault) {
        continue;
      }
      allAccounts.push({ channelId, channelLabel, account });
    }
  }

  return (
    <div>
      {/* Delete error banner */}
      {deleteError && (
        <div className="error-alert">
          {deleteError}
          <button className="btn btn-secondary btn-sm" onClick={() => setDeleteError(null)}>
            {t("common.close")}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="channel-header">
        <div className="channel-title-row">
          <h1 className="channel-title">{t("channels.title")}</h1>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? t("channels.refreshing") : `↻ ${t("channels.refreshButton")}`}
          </button>
        </div>
        <p className="channel-subtitle">
          {t("channels.statusSubtitle")}
        </p>
      </div>

      {/* Add Account Section */}
      <div className="section-card channel-add-section">
        <h3>{t("channels.addAccount")}</h3>
        <div className="channel-selector-col">
          <div className="channel-selector-row">
            <label className="channel-selector-label">
              {t("channels.selectChannelType")}
            </label>
            <Select
              value={selectedDropdownChannel}
              onChange={setSelectedDropdownChannel}
              placeholder={t("channels.selectChannel")}
              options={visibleChannels.map(ch => ({
                value: ch.id,
                label: t(ch.labelKey),
              }))}
              className="select-min-w-200"
            />
            <button
              className="btn btn-primary"
              onClick={handleAddAccountFromDropdown}
              disabled={!selectedDropdownChannel}
            >
              {t("channels.addAccount")}
            </button>
          </div>

          {/* Tooltip and tutorial link for selected channel */}
          {selectedDropdownChannel && (() => {
            const selected = KNOWN_CHANNELS.find(ch => ch.id === selectedDropdownChannel);
            if (!selected) return null;

            return (
              <div className="channel-info-box">
                <div className="channel-info-title">
                  ℹ️ {t(selected.tooltip)}
                </div>
                <div>
                  <a
                    href={selected.tutorialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                  >
                    📖 {t("channels.viewTutorial")} →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="section-card">
        <h3>{t("channels.allAccounts")}</h3>
        <div className="table-scroll-wrap">
        <table className="channel-table">
          <thead>
            <tr>
              <th>{t("channels.colChannel")}</th>
              <th>{t("channels.colName")}</th>
              <th>{t("channels.statusConfigured")}</th>
              <th>{t("channels.statusRunning")}</th>
              <th>{t("channels.colDmPolicy")}</th>
              <th>{t("channels.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {allAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  {t("channels.noAccountsConfigured")}
                </td>
              </tr>
            ) : (
              allAccounts.map(({ channelId, channelLabel, account }) => {
                const rowKey = `${channelId}-${account.accountId}`;
                const isDeleting = deletingKey === rowKey;
                return (
                  <tr key={rowKey} className={`table-hover-row${isDeleting ? " row-deleting" : ""}`}>
                    <td className="font-medium">{channelLabel}</td>
                    <td>{account.name || "—"}</td>
                    <td><StatusBadge status={account.configured} t={t} /></td>
                    <td><StatusBadge status={account.running} t={t} /></td>
                    <td>{account.dmPolicy ? t(`channels.dmPolicyLabel_${account.dmPolicy}`, { defaultValue: account.dmPolicy }) : "—"}</td>
                    <td>
                      <div className="td-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditAccount(channelId, account)}
                          disabled={isDeleting}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleManageAllowlist(channelId)}
                          title={t("pairing.manageAllowlist")}
                          disabled={isDeleting}
                        >
                          {t("pairing.allowlist")}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteAccount(channelId, account.accountId)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? t("channels.deleting") : t("common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Last Updated */}
      <div className="channel-last-updated">
        {t("channels.lastUpdated")} {new Date(snapshot.ts).toLocaleString()}
      </div>

      {/* Add/Edit Account Modal */}
      <AddChannelAccountModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        channelId={selectedChannelId}
        channelLabel={selectedChannelLabel}
        existingAccount={editingAccount}
        onSuccess={handleModalSuccess}
      />

      {/* Manage Allowlist Modal */}
      <ManageAllowlistModal
        isOpen={allowlistModalOpen}
        onClose={() => setAllowlistModalOpen(false)}
        channelId={allowlistChannelId}
        channelLabel={allowlistChannelLabel}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={deleteConfirm ? t("channels.deleteConfirmTitle", { channel: deleteConfirm.label }) : ""}
        message={t("channels.deleteConfirmMessage")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
      />
    </div>
  );
}
