/**
 * 设置页数据管理 Hook。
 * 管理数据导入导出、示例数据加载、AI 配置和数据安全提醒。
 */
import { useEffect, useState } from "react";
import {
  defaultAIConfig,
  isAIConfigured,
  loadAIConfig,
  saveAIConfig,
} from "../../features/ai-assist/services/aiConfigService";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import {
  buildExportData,
  downloadJson,
  parseImportData,
  replaceAllData,
} from "../../features/data-portability/services/dataPortabilityService";
import type { InterviewRecord } from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { sampleData } from "../../data/sampleData";

const LAST_EXPORT_KEY = "developer-job-hunt-crm.last-export";

/** 读取上次导出时间（ISO 字符串或 null） */
function loadLastExportTime(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

/** 保存当前导出时间 */
function saveLastExportTime(): void {
  try {
    localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString());
  } catch {
    // localStorage 不可用时静默失败
  }
}

export function useSettings({
  applications,
  resumes,
  interviews,
  refresh,
}: {
  applications: JobApplication[];
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
  refresh: (nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) => Promise<void>;
}) {
  const [settingsMessage, setSettingsMessage] = useState("");
  const [aiConfig, setAIConfig] = useState<AIProviderConfig>(defaultAIConfig);
  const [lastExportTime, setLastExportTime] = useState<string | null>(loadLastExportTime);

  /** 从 localStorage 初始化 AI 配置 */
  function initAIConfig() {
    setAIConfig(loadAIConfig());
  }

  /** 每次组件渲染时同步 lastExportTime（跨标签页场景） */
  useEffect(() => {
    setLastExportTime(loadLastExportTime());
  }, [applications.length, resumes.length, interviews.length]);

  /** 导出全部数据为 JSON 文件 */
  function handleExportData() {
    const data = buildExportData({ applications, resumes, interviews });
    downloadJson(data, `developer-job-hunt-crm-${new Date().toISOString().slice(0, 10)}.json`);
    saveLastExportTime();
    setLastExportTime(loadLastExportTime());
    setSettingsMessage("已导出当前本地数据。");
  }

  /** 从 JSON 文件导入数据并替换本地数据 */
  async function handleImportFile(file: File | null) {
    if (!file) {
      return;
    }

    // 导入前确认，避免误操作覆盖全部数据
    const hasExisting = applications.length > 0 || resumes.length > 0 || interviews.length > 0;
    if (hasExisting) {
      const confirmed = window.confirm(
        `当前本地数据：${applications.length} 个岗位、${resumes.length} 个简历、${interviews.length} 条面试记录。\n\n导入将替换以上全部数据，此操作不可撤销。确定继续？`,
      );
      if (!confirmed) return;
    }

    try {
      const text = await file.text();
      const data = parseImportData(text);
      await replaceAllData(data);
      await refresh({
        applicationId: data.applications[0]?.id ?? null,
        resumeId: data.resumes[0]?.id ?? null,
      });
      setSettingsMessage("导入完成，已替换当前本地数据。");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "导入失败，请检查文件格式。");
    }
  }

  /** 加载示例数据用于演示 */
  async function handleLoadSampleData() {
    // 加载示例数据前确认
    const hasExisting = applications.length > 0 || resumes.length > 0 || interviews.length > 0;
    if (hasExisting) {
      const confirmed = window.confirm(
        `当前本地数据：${applications.length} 个岗位、${resumes.length} 个简历、${interviews.length} 条面试记录。\n\n加载示例数据将替换以上全部数据，确定继续？`,
      );
      if (!confirmed) return;
    }

    await replaceAllData(sampleData);
    await refresh({
      applicationId: "sample-app-1",
      resumeId: "sample-resume-1",
    });
    setSettingsMessage("已加载示例数据，可用于演示 JD 分析、简历匹配和面试复盘。");
  }

  /** 清除所有本地数据 */
  async function handleClearAllData() {
    const hasExisting = applications.length > 0 || resumes.length > 0 || interviews.length > 0;
    if (!hasExisting) {
      setSettingsMessage("当前没有数据需要清除。");
      return;
    }

    const confirmed = window.confirm(
      `即将删除全部本地数据：\n${applications.length} 个岗位、${resumes.length} 个简历、${interviews.length} 条面试记录。\n\n建议先导出备份后再清除。此操作不可撤销！`,
    );
    if (!confirmed) return;

    try {
      await replaceAllData({ app: "developer-job-hunt-crm", version: 1, exportedAt: new Date().toISOString(), applications: [], resumes: [], interviews: [] });
      await refresh();
      setSettingsMessage("已清除全部本地数据。");
    } catch (error) {
      setSettingsMessage("清除数据失败，请刷新页面重试。");
    }
  }

  /** 保存 AI Provider 配置到 localStorage */
  function handleAIConfigSave(config: AIProviderConfig) {
    saveAIConfig(config);
    setAIConfig(config);
    setSettingsMessage(
      isAIConfigured(config)
        ? "AI 配置已保存，可在岗位详情和面试复盘中直接生成。"
        : "AI 配置已保存。当前未启用 Provider，仍使用零配置 Prompt Pack。",
    );
  }

  return {
    settingsMessage,
    aiConfig,
    lastExportTime,
    initAIConfig,
    handleExportData,
    handleImportFile,
    handleLoadSampleData,
    handleClearAllData,
    handleAIConfigSave,
  };
}
