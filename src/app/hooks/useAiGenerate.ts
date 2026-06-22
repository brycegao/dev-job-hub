/**
 * AI 生成 Hook。
 * 封装复制 Prompt 和调用 AI 生成的通用逻辑，供 ApplicationDetail 和 InterviewRecordCard 复用。
 */
import { useState } from "react";
import { createTimeoutSignal, generateAICompletion } from "../../features/ai-assist/services/aiCompletionService";
import { isAIConfigured } from "../../features/ai-assist/services/aiConfigService";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import { copyText } from "../constants";

export function useAiGenerate() {
  const [copyMessage, setCopyMessage] = useState("");
  const [aiResult, setAIResult] = useState("");
  const [aiStatus, setAIStatus] = useState("");

  /** 重置所有状态 */
  function reset() {
    setCopyMessage("");
    setAIResult("");
    setAIStatus("");
  }

  /** 复制 Prompt 到剪贴板并显示提示消息 */
  async function handleCopy(prompt: string, message: string) {
    await copyText(prompt);
    setCopyMessage(message);
  }

  /** 调用 AI Provider 生成补全结果 */
  async function handleGenerate(prompt: string, aiConfig: AIProviderConfig) {
    if (!isAIConfigured(aiConfig)) {
      setAIStatus("请先在设置页配置 AI Provider，或继续使用复制 Prompt。");
      return;
    }

    try {
      setAIStatus("AI 生成中...");
      const { signal, clear } = createTimeoutSignal();
      const result = await generateAICompletion({ prompt, config: aiConfig }, signal);
      clear();
      setAIResult(result);
      setAIStatus("AI 生成完成。");
    } catch (error) {
      setAIStatus(
        error instanceof Error ? error.message : "AI 生成失败，请检查配置。",
      );
    }
  }

  return { copyMessage, aiResult, aiStatus, reset, handleCopy, handleGenerate };
}
