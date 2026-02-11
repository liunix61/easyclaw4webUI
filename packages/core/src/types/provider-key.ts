export type ProviderKeyAuthType = "api_key" | "oauth";

export interface ProviderKeyEntry {
  id: string;
  provider: string;
  label: string;
  model: string;
  isDefault: boolean;
  proxyBaseUrl?: string | null;
  authType?: ProviderKeyAuthType;
  createdAt: string;
  updatedAt: string;
}
