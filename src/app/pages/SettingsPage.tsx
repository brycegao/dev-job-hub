import { useEffect, useState } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import { MetricCard } from "../components/MetricCard";

export function SettingsPage({
  applicationsCount,
  resumesCount,
  interviewsCount,
  message,
  lastExportTime,
  onExport,
  onImport,
  onLoadSample,
  onClearAll,
  aiConfig,
  onAIConfigSave,
}: {
  applicationsCount: number;
  resumesCount: number;
  interviewsCount: number;
  message: string;
  lastExportTime: string | null;
  onExport: () => void;
  onImport: (file: File | null) => void;
  onLoadSample: () => void;
  onClearAll: () => void;
  aiConfig: AIProviderConfig;
  onAIConfigSave: (config: AIProviderConfig) => void;
}) {
  const [draftAIConfig, setDraftAIConfig] = useState<AIProviderConfig>(aiConfig);
  const [showAIHelp, setShowAIHelp] = useState(false);

  useEffect(() => {
    setDraftAIConfig(aiConfig);
  }, [aiConfig]);

  const hasData = applicationsCount > 0 || resumesCount > 0 || interviewsCount > 0;

  /** 计算距离上次导出的天数 */
  function daysSinceLastExport(): number | null {
    if (!lastExportTime) return null;
    const diff = Date.now() - new Date(lastExportTime).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  const daysSince = daysSinceLastExport();
  const showExportWarning = hasData && (!lastExportTime || daysSince === null || daysSince >= 7);

  return (
    <section className="page-grid">
      <MetricCard label="岗位记录" value={applicationsCount} />
      <MetricCard label="简历版本" value={resumesCount} />
      <MetricCard label="面试记录" value={interviewsCount} />

      {/* 数据安全提醒 */}
      {showExportWarning && (
        <section className="panel wide backup-warning">
          <div className="backup-warning-content">
            <strong>{lastExportTime ? "⚠️ 距离上次导出已超过 7 天，建议立即备份" : "⚠️ 你还没有导出过数据"}</strong>
            <p>
              所有数据保存在浏览器本地，清理浏览器数据或更换设备会导致数据丢失。
              {lastExportTime && (
                <> 上次导出时间：<strong>{new Date(lastExportTime).toLocaleDateString("zh-CN")}</strong></>
              )}
            </p>
            <button className="primary" onClick={onExport}>
              立即导出备份
            </button>
          </div>
        </section>
      )}

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>数据导入导出</h2>
            <p>
              所有数据默认保存在本机浏览器 IndexedDB，可导出 JSON 备份。
              {lastExportTime && !showExportWarning && (
                <> 上次导出：<strong>{new Date(lastExportTime).toLocaleDateString("zh-CN")}</strong></>
              )}
            </p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="primary" onClick={onExport}>
            导出 JSON
          </button>
          <label className="file-action">
            导入 JSON
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                void onImport(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          <button className="secondary-action" type="button" onClick={onLoadSample}>
            加载示例数据
          </button>
        </div>
        {message && <p className="settings-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>本地数据说明</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>导入 JSON 会替换当前本地数据。</li>
            <li>示例数据可用于演示 JD 分析、简历匹配和面试复盘。</li>
            <li>卸载浏览器或清理站点数据可能导致本地记录丢失。</li>
          </ul>
        </div>
        {hasData && (
          <div className="clear-data-section">
            <button className="danger-lite" type="button" onClick={onClearAll}>
              清除所有数据
            </button>
          </div>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <div className="title-with-help">
              <h2>AI Provider</h2>
              <button
                type="button"
                className="help-button"
                aria-label="查看 AI Provider 帮助"
                aria-expanded={showAIHelp}
                onClick={() => setShowAIHelp((value) => !value)}
              >
                ?
              </button>
              {showAIHelp && (
                <div className="help-popover" role="note">
                  <strong>AI Provider 怎么选？</strong>
                  <ul>
                    <li>不启用：使用本地建议和复制 Prompt，零成本、零配置。</li>
                    <li>OpenAI Compatible：填写兼容接口地址、模型和 API Key。</li>
                    <li>Ollama：填写本地地址和模型名，API Key 可留空。</li>
                    <li>API Key 只保存在当前浏览器 localStorage。</li>
                    <li>纯 Web 直连云 API 可能遇到 CORS 限制。</li>
                  </ul>
                </div>
              )}
            </div>
            <p>可选配置。未配置时仍可使用本地建议和一键复制 Prompt。</p>
          </div>
        </div>
        <form
          className="form-panel"
          onSubmit={(event) => {
            event.preventDefault();
            onAIConfigSave(draftAIConfig);
          }}
        >
          <div className="form-grid">
            <label>
              Provider
              <select
                value={draftAIConfig.provider}
                onChange={(event) =>
                  setDraftAIConfig({
                    ...draftAIConfig,
                    provider: event.target.value as AIProviderConfig["provider"],
                  })
                }
              >
                <option value="none">不启用，使用 Prompt Pack</option>
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="ollama">Ollama 本地模型</option>
              </select>
            </label>
            <label>
              Model
              <input
                value={draftAIConfig.model}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, model: event.target.value })
                }
                placeholder="gpt-4.1-mini / deepseek-chat / qwen2.5"
              />
            </label>
            <label>
              Base URL
              <input
                value={draftAIConfig.baseUrl}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, baseUrl: event.target.value })
                }
                placeholder="https://api.openai.com / http://localhost:11434"
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={draftAIConfig.apiKey}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, apiKey: event.target.value })
                }
                placeholder="Ollama 可留空"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">
              保存 AI 配置
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
