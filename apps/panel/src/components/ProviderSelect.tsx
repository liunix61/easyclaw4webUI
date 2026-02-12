import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ALL_PROVIDERS } from "@easyclaw/core";
import { fetchModelCatalog } from "../api.js";

/** Domestic Chinese LLM providers — shown first (in this order) when UI language is Chinese. */
const CHINA_FIRST_PROVIDERS = [
  "zhipu",
  "volcengine",
  "deepseek",
  "moonshot",
  "qwen",
  "minimax",
  "xiaomi",
];

/** Extra provider IDs appended after a divider (e.g. OAuth providers). */
const OAUTH_PROVIDERS = ["google-gemini-cli"];

export function ProviderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (provider: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [catalogProviders, setCatalogProviders] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetchModelCatalog().then((data) => {
      setCatalogProviders(new Set(Object.keys(data)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sort: Chinese domestic providers first (in defined order) when UI language is Chinese
  const sortedProviders = useMemo(() => {
    const available = ALL_PROVIDERS.filter((p) => !catalogProviders || catalogProviders.has(p));
    if (i18n.language !== "zh") return available;
    const availableSet = new Set(available);
    const china = CHINA_FIRST_PROVIDERS.filter((p) => availableSet.has(p));
    const rest = available.filter((p) => !CHINA_FIRST_PROVIDERS.includes(p));
    return [...china, ...rest];
  }, [catalogProviders, i18n.language]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="provider-select-trigger"
      >
        <span>
          <strong>{t(`providers.label_${value}`)}</strong>
          <span className="provider-select-desc">
            {t(`providers.desc_${value}`)}
          </span>
        </span>
        <span className="provider-select-arrow">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div className="provider-select-dropdown">
          {sortedProviders.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`provider-select-option${p === value ? " provider-select-option-active" : ""}`}
            >
              <div className="provider-select-option-label">
                {t(`providers.label_${p}`)}
              </div>
              <div className="provider-select-option-desc">
                {t(`providers.desc_${p}`)}
              </div>
            </button>
          ))}
          {/* OAuth providers section */}
          <div className="provider-select-section-header">
            {t("providers.oauthSectionTitle")}
          </div>
          {OAUTH_PROVIDERS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`provider-select-option${p === value ? " provider-select-option-active" : ""}`}
            >
              <div className="provider-select-option-label">
                {t(`providers.label_${p}`)}
              </div>
              <div className="provider-select-option-desc">
                {t(`providers.desc_${p}`)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
