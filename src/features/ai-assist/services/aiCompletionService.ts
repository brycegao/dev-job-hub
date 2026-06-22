import type { AICompletionInput } from "../types";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveOpenAIUrl(baseUrl: string): string {
  const normalized = trimTrailingSlash(baseUrl.trim());
  return normalized.endsWith("/v1")
    ? `${normalized}/chat/completions`
    : `${normalized}/v1/chat/completions`;
}

export async function generateAICompletion({
  prompt,
  config,
}: AICompletionInput): Promise<string> {
  if (config.provider === "openai-compatible") {
    const response = await fetch(resolveOpenAIUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "user",
            content: prompt,
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

  if (config.provider === "ollama") {
    const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt,
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
