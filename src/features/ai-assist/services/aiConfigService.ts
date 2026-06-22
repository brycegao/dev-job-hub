/**
 * AI 配置管理服务
 * 负责 AI Provider 配置的读取、保存和校验。
 * 配置持久化存储在 localStorage 中。
 */

import type { AIProviderConfig } from "../types";

/** localStorage 存储键名 */
const STORAGE_KEY = "developer-job-hunt-crm.ai-config";

/** 默认 AI 配置（未配置状态） */
export const defaultAIConfig: AIProviderConfig = {
  provider: "none",
  baseUrl: "",
  apiKey: "",
  model: "",
};

/**
 * 从 localStorage 加载 AI 配置
 * @returns 当前保存的 AI 配置，若无则返回默认配置
 */
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

/**
 * 将 AI 配置保存到 localStorage
 * @param config - 要保存的 AI 配置
 */
export function saveAIConfig(config: AIProviderConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * 判断 AI 配置是否完整可用
 * @param config - 要检查的 AI 配置
 * @returns 配置是否满足调用 AI 的最低要求
 */
export function isAIConfigured(config: AIProviderConfig): boolean {
  if (config.provider === "none") {
    return false;
  }
  if (config.provider === "ollama") {
    return Boolean(config.baseUrl.trim() && config.model.trim());
  }
  return Boolean(config.baseUrl.trim() && config.apiKey.trim() && config.model.trim());
}
