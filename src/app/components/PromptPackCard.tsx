import { type ReactNode } from "react";

export function PromptPackCard({
  title,
  prompt,
  copyLabel,
  message,
  aiEnabled,
  aiStatus,
  aiLoading,
  aiText,
  onCopy,
  onGenerateAI,
  children,
}: {
  title: string;
  prompt: string;
  copyLabel: string;
  message: string;
  aiEnabled: boolean;
  aiStatus: string;
  aiLoading: boolean;
  aiText: string;
  onCopy: () => void;
  onGenerateAI: () => void;
  children: ReactNode;
}) {
  return (
    <div className="prompt-pack">
      <div className="prompt-pack-header">
        <span>{title}</span>
        <div className="prompt-actions">
          <button
            className="secondary-action"
            type="button"
            disabled={!aiEnabled || aiLoading}
            onClick={onGenerateAI}
          >
            {aiLoading ? "生成中..." : aiEnabled ? "直接生成" : "未配置 AI"}
          </button>
          <button className="secondary-action" type="button" onClick={onCopy}>
            {copyLabel}
          </button>
        </div>
      </div>
      <div className="prompt-pack-grid">{children}</div>
      {aiStatus && <p className="ai-status">{aiStatus}</p>}
      {aiText && (
        <div className="ai-result">
          <span>AI 结果</span>
          <pre>{aiText}</pre>
        </div>
      )}
      <details className="prompt-preview">
        <summary>查看完整 Prompt</summary>
        <pre>{prompt}</pre>
      </details>
      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}
