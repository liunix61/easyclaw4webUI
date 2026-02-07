/* =============================================================
   EasyClaw — Lightweight i18n for static site
   Auto-detects browser language. Falls back to English.
   ============================================================= */

const translations = {
  en: {
    "nav.features": "Features",
    "nav.download": "Download",
    "nav.requirements": "Requirements",
    "hero.title": "Desktop Runtime Manager<br>for OpenClaw",
    "hero.subtitle":
      "EasyClaw gives you a local tray app to manage your OpenClaw gateway, configure rules and permissions, and keep everything running smoothly &mdash; without touching the command line.",
    "hero.download": "Download Now",
    "hero.github": "View on GitHub",
    "features.title": "Features",
    "features.tray.title": "Tray App Control",
    "features.tray.desc":
      "Start, stop, and restart your OpenClaw gateway from the system tray. No terminal required.",
    "features.panel.title": "Local Management Panel",
    "features.panel.desc":
      "A browser-based panel running on localhost for configuring rules, channels, and permissions.",
    "features.rules.title": "Rules & Guards",
    "features.rules.desc":
      "Define policies and guards that take effect immediately &mdash; no gateway restart needed.",
    "features.secrets.title": "Secure Secrets",
    "features.secrets.desc":
      "API keys stored in macOS Keychain or Windows DPAPI. Never written to plaintext config files.",
    "features.skill.title": "Skill Hot Reload",
    "features.skill.desc":
      "Action bundle rules automatically materialize as SKILL.md files that OpenClaw picks up in milliseconds.",
    "features.update.title": "Auto-Updates",
    "features.update.desc":
      "Built-in update checker notifies you when a new version is available. One-click download.",
    "download.title": "Download EasyClaw",
    "download.version": "Version",
    "download.mac.btn": "Download .dmg",
    "download.win.btn": "Download .exe",
    "download.note":
      'Verify your download by comparing the SHA-256 hash above with the output of <code>shasum -a 256</code> (macOS/Linux) or <code>Get-FileHash</code> (PowerShell).',
    "requirements.title": "System Requirements",
    "requirements.mac.os": "macOS 12 (Monterey) or later",
    "requirements.mac.arch": "Apple Silicon (M1+) or Intel",
    "requirements.mac.disk": "200 MB disk space",
    "requirements.win.os": "Windows 10 (version 1903+) or later",
    "requirements.win.arch": "x64 architecture",
    "requirements.win.disk": "200 MB disk space",
    "footer.text": "&copy; 2026 EasyClaw. Open source on",
  },
  zh: {
    "nav.features": "\u529F\u80FD",
    "nav.download": "\u4E0B\u8F7D",
    "nav.requirements": "\u7CFB\u7EDF\u8981\u6C42",
    "hero.title":
      "OpenClaw \u684C\u9762\u8FD0\u884C\u65F6\u7BA1\u7406\u5668",
    "hero.subtitle":
      "EasyClaw \u63D0\u4F9B\u4E00\u4E2A\u672C\u5730\u6258\u76D8\u5E94\u7528\uFF0C\u7528\u4E8E\u7BA1\u7406 OpenClaw \u7F51\u5173\u3001\u914D\u7F6E\u89C4\u5219\u548C\u6743\u9650\uFF0C\u8BA9\u4E00\u5207\u5E73\u7A33\u8FD0\u884C\u2014\u2014\u65E0\u9700\u547D\u4EE4\u884C\u64CD\u4F5C\u3002",
    "hero.download": "\u7ACB\u5373\u4E0B\u8F7D",
    "hero.github": "\u5728 GitHub \u4E0A\u67E5\u770B",
    "features.title": "\u529F\u80FD\u7279\u6027",
    "features.tray.title": "\u6258\u76D8\u63A7\u5236",
    "features.tray.desc":
      "\u4ECE\u7CFB\u7EDF\u6258\u76D8\u542F\u52A8\u3001\u505C\u6B62\u548C\u91CD\u542F OpenClaw \u7F51\u5173\uFF0C\u65E0\u9700\u7EC8\u7AEF\u3002",
    "features.panel.title": "\u672C\u5730\u7BA1\u7406\u9762\u677F",
    "features.panel.desc":
      "\u57FA\u4E8E\u6D4F\u89C8\u5668\u7684\u672C\u5730\u9762\u677F\uFF0C\u7528\u4E8E\u914D\u7F6E\u89C4\u5219\u3001\u6E20\u9053\u548C\u6743\u9650\u3002",
    "features.rules.title": "\u89C4\u5219\u548C\u5B88\u536B",
    "features.rules.desc":
      "\u5B9A\u4E49\u7B56\u7565\u548C\u5B88\u536B\uFF0C\u7ACB\u5373\u751F\u6548\u2014\u2014\u65E0\u9700\u91CD\u542F\u7F51\u5173\u3002",
    "features.secrets.title": "\u5B89\u5168\u5BC6\u94A5\u5B58\u50A8",
    "features.secrets.desc":
      "API \u5BC6\u94A5\u5B58\u50A8\u5728 macOS \u94A5\u5319\u4E32\u6216 Windows DPAPI \u4E2D\uFF0C\u7EDD\u4E0D\u4EE5\u660E\u6587\u5199\u5165\u914D\u7F6E\u6587\u4EF6\u3002",
    "features.skill.title": "\u6280\u80FD\u70ED\u91CD\u8F7D",
    "features.skill.desc":
      "\u52A8\u4F5C\u5305\u89C4\u5219\u81EA\u52A8\u751F\u6210 SKILL.md \u6587\u4EF6\uFF0COpenClaw \u5728\u6BEB\u79D2\u5185\u52A0\u8F7D\u3002",
    "features.update.title": "\u81EA\u52A8\u66F4\u65B0",
    "features.update.desc":
      "\u5185\u7F6E\u66F4\u65B0\u68C0\u67E5\u5668\uFF0C\u65B0\u7248\u672C\u53EF\u7528\u65F6\u901A\u77E5\u60A8\uFF0C\u4E00\u952E\u4E0B\u8F7D\u3002",
    "download.title": "\u4E0B\u8F7D EasyClaw",
    "download.version": "\u7248\u672C",
    "download.mac.btn": "\u4E0B\u8F7D .dmg",
    "download.win.btn": "\u4E0B\u8F7D .exe",
    "download.note":
      '\u901A\u8FC7\u5C06\u4E0A\u65B9\u7684 SHA-256 \u54C8\u5E0C\u4E0E <code>shasum -a 256</code>\uFF08macOS/Linux\uFF09\u6216 <code>Get-FileHash</code>\uFF08PowerShell\uFF09\u7684\u8F93\u51FA\u8FDB\u884C\u6BD4\u8F83\u6765\u9A8C\u8BC1\u4E0B\u8F7D\u3002',
    "requirements.title": "\u7CFB\u7EDF\u8981\u6C42",
    "requirements.mac.os":
      "macOS 12 (Monterey) \u6216\u66F4\u9AD8\u7248\u672C",
    "requirements.mac.arch": "Apple Silicon (M1+) \u6216 Intel",
    "requirements.mac.disk": "200 MB \u78C1\u76D8\u7A7A\u95F4",
    "requirements.win.os":
      "Windows 10\uFF081903+\uFF09\u6216\u66F4\u9AD8\u7248\u672C",
    "requirements.win.arch": "x64 \u67B6\u6784",
    "requirements.win.disk": "200 MB \u78C1\u76D8\u7A7A\u95F4",
    "footer.text": "&copy; 2026 EasyClaw\u3002\u5F00\u6E90\u4E8E",
  },
  ja: {
    "nav.features": "\u6A5F\u80FD",
    "nav.download": "\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "nav.requirements": "\u52D5\u4F5C\u74B0\u5883",
    "hero.title":
      "OpenClaw \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30E9\u30F3\u30BF\u30A4\u30E0\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC",
    "hero.subtitle":
      "EasyClaw \u306F OpenClaw \u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u306E\u7BA1\u7406\u3001\u30EB\u30FC\u30EB\u3084\u6A29\u9650\u306E\u8A2D\u5B9A\u3092\u884C\u3046\u30ED\u30FC\u30AB\u30EB\u30C8\u30EC\u30A4\u30A2\u30D7\u30EA\u3067\u3059\u3002\u30B3\u30DE\u30F3\u30C9\u30E9\u30A4\u30F3\u4E0D\u8981\u3067\u3001\u3059\u3079\u3066\u3092\u30B9\u30E0\u30FC\u30BA\u306B\u7A3C\u50CD\u3055\u305B\u307E\u3059\u3002",
    "hero.download":
      "\u4ECA\u3059\u3050\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "hero.github": "GitHub \u3067\u898B\u308B",
    "features.title": "\u6A5F\u80FD\u4E00\u89A7",
    "features.tray.title": "\u30C8\u30EC\u30A4\u30A2\u30D7\u30EA\u64CD\u4F5C",
    "features.tray.desc":
      "\u30B7\u30B9\u30C6\u30E0\u30C8\u30EC\u30A4\u304B\u3089 OpenClaw \u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u306E\u8D77\u52D5\u30FB\u505C\u6B62\u30FB\u518D\u8D77\u52D5\u304C\u53EF\u80FD\u3002\u30BF\u30FC\u30DF\u30CA\u30EB\u4E0D\u8981\u3002",
    "features.panel.title":
      "\u30ED\u30FC\u30AB\u30EB\u7BA1\u7406\u30D1\u30CD\u30EB",
    "features.panel.desc":
      "localhost \u3067\u52D5\u4F5C\u3059\u308B\u30D6\u30E9\u30A6\u30B6\u30D9\u30FC\u30B9\u306E\u30D1\u30CD\u30EB\u3067\u3001\u30EB\u30FC\u30EB\u30FB\u30C1\u30E3\u30F3\u30CD\u30EB\u30FB\u6A29\u9650\u3092\u8A2D\u5B9A\u3002",
    "features.rules.title":
      "\u30EB\u30FC\u30EB\u3068\u30AC\u30FC\u30C9",
    "features.rules.desc":
      "\u30DD\u30EA\u30B7\u30FC\u3068\u30AC\u30FC\u30C9\u3092\u5B9A\u7FA9\u3057\u3001\u5373\u5EA7\u306B\u53CD\u6620\u3002\u30B2\u30FC\u30C8\u30A6\u30A7\u30A4\u306E\u518D\u8D77\u52D5\u306F\u4E0D\u8981\u3002",
    "features.secrets.title":
      "\u30BB\u30AD\u30E5\u30A2\u306A\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u7BA1\u7406",
    "features.secrets.desc":
      "API \u30AD\u30FC\u306F macOS \u30AD\u30FC\u30C1\u30A7\u30FC\u30F3\u307E\u305F\u306F Windows DPAPI \u306B\u4FDD\u5B58\u3002\u5E73\u6587\u306E\u8A2D\u5B9A\u30D5\u30A1\u30A4\u30EB\u306B\u306F\u66F8\u304D\u8FBC\u307E\u308C\u307E\u305B\u3093\u3002",
    "features.skill.title":
      "\u30B9\u30AD\u30EB\u30DB\u30C3\u30C8\u30EA\u30ED\u30FC\u30C9",
    "features.skill.desc":
      "\u30A2\u30AF\u30B7\u30E7\u30F3\u30D0\u30F3\u30C9\u30EB\u30EB\u30FC\u30EB\u304C\u81EA\u52D5\u7684\u306B SKILL.md \u3092\u751F\u6210\u3057\u3001OpenClaw \u304C\u30DF\u30EA\u79D2\u3067\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002",
    "features.update.title": "\u81EA\u52D5\u30A2\u30C3\u30D7\u30C7\u30FC\u30C8",
    "features.update.desc":
      "\u5185\u8535\u306E\u30A2\u30C3\u30D7\u30C7\u30FC\u30C8\u30C1\u30A7\u30C3\u30AB\u30FC\u304C\u65B0\u30D0\u30FC\u30B8\u30E7\u30F3\u3092\u901A\u77E5\u3002\u30EF\u30F3\u30AF\u30EA\u30C3\u30AF\u3067\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u3002",
    "download.title":
      "EasyClaw \u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "download.version": "\u30D0\u30FC\u30B8\u30E7\u30F3",
    "download.mac.btn": ".dmg \u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "download.win.btn": ".exe \u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
    "download.note":
      '\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u306E\u691C\u8A3C\uFF1A\u4E0A\u8A18\u306E SHA-256 \u30CF\u30C3\u30B7\u30E5\u3092 <code>shasum -a 256</code>\uFF08macOS/Linux\uFF09\u307E\u305F\u306F <code>Get-FileHash</code>\uFF08PowerShell\uFF09\u306E\u51FA\u529B\u3068\u6BD4\u8F03\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
    "requirements.title": "\u52D5\u4F5C\u74B0\u5883",
    "requirements.mac.os":
      "macOS 12 (Monterey) \u4EE5\u964D",
    "requirements.mac.arch": "Apple Silicon (M1+) \u307E\u305F\u306F Intel",
    "requirements.mac.disk": "200 MB \u306E\u30C7\u30A3\u30B9\u30AF\u7A7A\u304D\u5BB9\u91CF",
    "requirements.win.os":
      "Windows 10\uFF081903+\uFF09\u4EE5\u964D",
    "requirements.win.arch": "x64 \u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3",
    "requirements.win.disk": "200 MB \u306E\u30C7\u30A3\u30B9\u30AF\u7A7A\u304D\u5BB9\u91CF",
    "footer.text":
      "&copy; 2026 EasyClaw\u3002\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\uFF1A",
  },
};

const LANG_LABELS = { en: "EN", zh: "\u4E2D\u6587", ja: "\u65E5\u672C\u8A9E" };
const SUPPORTED = Object.keys(translations);
const STORAGE_KEY = "easyclaw-lang";

function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("ja")) return "ja";
  return "en";
}

function applyLang(lang) {
  const dict = translations[lang] || translations.en;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.innerHTML = dict[key];
  });
  localStorage.setItem(STORAGE_KEY, lang);
  // Update switcher active state
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function initI18n() {
  const lang = detectLang();
  applyLang(lang);
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      applyLang(btn.dataset.lang);
    });
  });
}

document.addEventListener("DOMContentLoaded", initI18n);
