/**
 * 设置页数据管理 Hook。
 * 管理数据导入导出、示例数据加载和 AI 配置。
 */
import { useState } from "react";
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

  /** 从 localStorage 初始化 AI 配置 */
  function initAIConfig() {
    setAIConfig(loadAIConfig());
  }

  /** 导出全部数据为 JSON 文件 */
  function handleExportData() {
    const data = buildExportData({ applications, resumes, interviews });
    downloadJson(data, `developer-job-hunt-crm-${new Date().toISOString().slice(0, 10)}.json`);
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
    initAIConfig,
    handleExportData,
    handleImportFile,
    handleLoadSampleData,
    handleAIConfigSave,
  };
}
