/**
 * AI 补全服务
 * 负责调用 OpenAI 兼容接口或 Ollama 本地模型，生成 AI 补全结果。
 * 支持超时控制和请求取消。
 */

import type { AICompletionInput } from "../types";

/** 默认请求超时时间（60秒） */
const TIMEOUT_MS = 60_000;

/** 去除 URL 末尾的斜杠 */
function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** 根据 baseUrl 拼接 OpenAI chat completions 端点 */
function resolveOpenAIUrl(baseUrl: string): string {
  const normalized = trimTrailingSlash(baseUrl.trim());
  return normalized.endsWith("/v1")
    ? `${normalized}/chat/completions`
    : `${normalized}/v1/chat/completions`;
}

/**
 * 调用 AI 服务生成补全结果
 * @param input - 包含 provider 配置和 prompt 的输入对象
 * @param signal - 可选的 AbortSignal，用于取消请求
 * @returns AI 返回的文本内容
 */
export async function generateAICompletion(
  input: AICompletionInput,
  signal?: AbortSignal,
): Promise<string> {
  if (input.config.provider === "openai-compatible") {
    const response = await fetch(resolveOpenAIUrl(input.config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.config.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: input.config.model,
        messages: [
          {
            role: "user",
            content: input.prompt,
          },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 请求失败：${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || "AI 未返回有效内容。";
  }

  if (input.config.provider === "ollama") {
    const response = await fetch(`${trimTrailingSlash(input.config.baseUrl)}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        model: input.config.model,
        prompt: input.prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama 请求失败：${response.status}`);
    }

    const data = (await response.json()) as { response?: string };
    return data.response?.trim() || "Ollama 未返回有效内容。";
  }

  throw new Error("请先在设置页配置 AI Provider。");
}

/**
 * 创建带超时控制的 AbortSignal
 * @param timeoutMs - 超时毫秒数，默认 60 秒
 * @returns 包含 signal 和 clear 方法的对象，clear 用于取消超时计时器
 */
export function createTimeoutSignal(timeoutMs: number = TIMEOUT_MS): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}
