import { useTranslation } from "react-i18next";
import { PROVIDER_URLS, PROVIDER_LABELS } from "@easyclaw/core";
import type { LLMProvider } from "@easyclaw/core";
import type { ProviderPricing } from "../api.js";

function isFree(price: string): boolean {
  return price === "0" || price === "0.00" || price === "—";
}

export function PricingTable({
  provider,
  pricingList,
  loading,
}: {
  provider: string;
  pricingList: ProviderPricing[] | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  const data = pricingList?.find((p) => p.provider === provider) ?? null;
  const currencySymbol = data?.currency === "CNY" ? "¥" : "$";
  const providerLabel = PROVIDER_LABELS[provider as LLMProvider] ?? provider;

  // Find the first free model to highlight as recommended
  const recommendedId = data?.models.find(
    (m) => isFree(m.inputPricePerMillion) && isFree(m.outputPricePerMillion),
  )?.modelId ?? null;

  return (
    <div className="section-card pricing-card">
      <h4 className="pricing-heading">
        {providerLabel} — {t("providers.pricingTitle")}
        <span className="pricing-subtitle">
          {t("providers.pricingPerMillion")}
        </span>
      </h4>

      {loading && (
        <div className="pricing-status">
          <span className="spinner" style={{ marginRight: 6 }} />
          {t("common.loading")}
        </div>
      )}

      {!loading && !data && (
        <div className="pricing-status-compact">
          <div>{t("providers.pricingUnavailable")}</div>
          <a
            href={PROVIDER_URLS[provider as LLMProvider]}
            target="_blank"
            rel="noopener noreferrer"
            className="pricing-link"
            style={{ marginTop: 6, display: "inline-block" }}
          >
            {t("providers.pricingViewFull")} &rarr;
          </a>
        </div>
      )}

      {!loading && data && (
        <>
          {data.currency !== "USD" && (
            <div className="pricing-currency-note">
              {t("providers.pricingCurrency")}: {data.currency}
            </div>
          )}
          <div className="pricing-scroll">
            <table className="pricing-inner-table">
              <thead>
                <tr>
                  <th>
                    {t("providers.pricingModel")}
                  </th>
                  <th>
                    {t("providers.pricingInput")}
                  </th>
                  <th>
                    {t("providers.pricingOutput")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.models.map((m) => {
                  const isRecommended = m.modelId === recommendedId;
                  const modelFree = isFree(m.inputPricePerMillion) && isFree(m.outputPricePerMillion);
                  return (
                    <tr key={m.modelId}>
                      <td>
                        <div className="pricing-model-name">
                          {m.displayName}
                          {isRecommended && (
                            <span className="pricing-badge">
                              {t("providers.pricingRecommended")}
                            </span>
                          )}
                        </div>
                        {m.note && (
                          <div className="pricing-model-note">{m.note}</div>
                        )}
                      </td>
                      <td className={`pricing-price${modelFree ? " pricing-price-free" : ""}`}>
                        {modelFree ? t("providers.pricingFree") : m.inputPricePerMillion === "—" ? "—" : `${currencySymbol}${m.inputPricePerMillion}`}
                      </td>
                      <td className={`pricing-price${modelFree ? " pricing-price-free" : ""}`}>
                        {modelFree ? t("providers.pricingFree") : m.outputPricePerMillion === "—" ? "—" : `${currencySymbol}${m.outputPricePerMillion}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pricing-disclaimer">
            {t("providers.pricingDisclaimer")}
          </div>
          <div style={{ marginTop: 4, flexShrink: 0 }}>
            <a
              href={data.pricingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pricing-link"
            >
              {t("providers.pricingViewFull")} &rarr;
            </a>
          </div>
        </>
      )}
    </div>
  );
}
