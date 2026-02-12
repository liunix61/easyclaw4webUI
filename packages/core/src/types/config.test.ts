import { describe, it, expect } from "vitest";
import { easyClawConfigSchema } from "./config.js";

describe("easyClawConfigSchema", () => {
  it("accepts a valid config", () => {
    const result = easyClawConfigSchema.safeParse({
      region: "cn",
      language: "zh",
      gatewayVersion: "2026.2.10",
      panelPort: 3210,
    });
    expect(result.success).toBe(true);
  });

  it("rejects port below 1024", () => {
    const result = easyClawConfigSchema.safeParse({
      region: "us",
      language: "en",
      gatewayVersion: "0.0.0",
      panelPort: 80,
    });
    expect(result.success).toBe(false);
  });

  it("rejects port above 65535", () => {
    const result = easyClawConfigSchema.safeParse({
      region: "us",
      language: "en",
      gatewayVersion: "0.0.0",
      panelPort: 70000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer port", () => {
    const result = easyClawConfigSchema.safeParse({
      region: "us",
      language: "en",
      gatewayVersion: "0.0.0",
      panelPort: 3210.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = easyClawConfigSchema.safeParse({
      region: "us",
    });
    expect(result.success).toBe(false);
  });
});
