import { execSync } from "node:child_process";

export default function globalSetup() {
  if (process.platform === "darwin") {
    try {
      execSync("pkill -x EasyClaw 2>/dev/null || true", { stdio: "ignore" });
    } catch {}
  }
  if (process.platform === "win32") {
    try {
      execSync("taskkill /F /IM EasyClaw.exe 2>nul || exit 0", { stdio: "ignore" });
    } catch {}
  }
}
