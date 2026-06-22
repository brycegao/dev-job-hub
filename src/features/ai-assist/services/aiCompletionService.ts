import type { AICompletionInput } from "../types";

const TIMEOUT_MS = 60_000;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveOpenAIUrl(baseUrl: string): string {
  const normalized = trimTrailingSlash(baseUrl.trim());
  return normalized.endsWith("/v1")
    ? `${normalized}/chat/completions`
    : `${normalized}/v1/chat/completions`;
}

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
