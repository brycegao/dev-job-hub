import type { AIProviderConfig } from "../types";

const STORAGE_KEY = "developer-job-hunt-crm.ai-config";

export const defaultAIConfig: AIProviderConfig = {
  provider: "none",
  baseUrl: "",
  apiKey: "",
  model: "",
};

export function loadAIConfig(): AIProviderConfig {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultAIConfig;
  }

  try {
    return {
      ...defaultAIConfig,
      ...(JSON.parse(raw) as Partial<AIProviderConfig>),
    };
  } catch {
    return defaultAIConfig;
  }
}

export function saveAIConfig(config: AIProviderConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isAIConfigured(config: AIProviderConfig): boolean {
  if (config.provider === "none") {
    return false;
  }
  if (config.provider === "ollama") {
    return Boolean(config.baseUrl.trim() && config.model.trim());
  }
  return Boolean(config.baseUrl.trim() && config.apiKey.trim() && config.model.trim());
}
