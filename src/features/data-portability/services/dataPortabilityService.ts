/**
 * 数据导入导出服务
 * 支持将求职数据导出为 JSON 文件，以及从 JSON 文件导入数据并替换本地 IndexedDB 中的内容。
 */

import { openDatabase } from "../../../shared/storage/indexedDb";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import type { AppDataExport } from "../types";

/** 校验导入记录是否包含必要的字段 */
function isValidRecord(record: unknown, requiredFields: string[]): boolean {
  if (!record || typeof record !== "object") return false;
  return requiredFields.every(
    (field) => (record as Record<string, unknown>)[field] !== undefined,
  );
}

/**
 * 构建导出数据对象
 * @param input - 包含申请、简历和面试数据的输入
 * @returns 符合 AppDataExport 格式的导出数据
 */
export function buildExportData(input: {
  applications: JobApplication[];
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
}): AppDataExport {
  return {
    app: "developer-job-hunt-crm",
    version: 1,
    exportedAt: new Date().toISOString(),
    applications: input.applications,
    resumes: input.resumes,
    interviews: input.interviews,
  };
}

/**
 * 将数据下载为 JSON 文件
 * @param data - 要导出的数据对象
 * @param filename - 下载文件名
 */
export function downloadJson(data: AppDataExport, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 解析并校验导入的 JSON 文本
 * @param text - JSON 文本内容
 * @returns 校验通过的导入数据
 * @throws 格式不匹配或缺少必要数据列表时抛出错误
 */
export function parseImportData(text: string): AppDataExport {
  const data = JSON.parse(text) as Partial<AppDataExport>;
  if (data.app !== "developer-job-hunt-crm" || data.version !== 1) {
    throw new Error("导入文件格式不匹配");
  }
  if (
    !Array.isArray(data.applications) ||
    !Array.isArray(data.resumes) ||
    !Array.isArray(data.interviews)
  ) {
    throw new Error("导入文件缺少必要的数据列表");
  }

  const validApplications = (data.applications as unknown[]).filter((r) =>
    isValidRecord(r, ["id", "companyName", "jobTitle", "status"]),
  ) as JobApplication[];
  const validResumes = (data.resumes as unknown[]).filter((r) =>
    isValidRecord(r, ["id", "name", "targetRole"]),
  ) as ResumeVersion[];
  const validInterviews = (data.interviews as unknown[]).filter((r) =>
    isValidRecord(r, ["id", "jobApplicationId"]),
  ) as InterviewRecord[];

  return {
    app: "developer-job-hunt-crm",
    version: 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    applications: validApplications,
    resumes: validResumes,
    interviews: validInterviews,
  };
}

/**
 * 用导入数据完全替换本地 IndexedDB 中的数据
 * 清空现有数据后逐条写入，使用事务保证原子性。
 * @param data - 要导入的完整数据集
 */
export async function replaceAllData(data: AppDataExport): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(
    ["applications", "resumes", "interviews"],
    "readwrite",
  );
  const appStore = transaction.objectStore("applications");
  const resumeStore = transaction.objectStore("resumes");
  const interviewStore = transaction.objectStore("interviews");

  appStore.clear();
  resumeStore.clear();
  interviewStore.clear();

  for (const application of data.applications) {
    appStore.put(application);
  }
  for (const resume of data.resumes) {
    resumeStore.put(resume);
  }
  for (const interview of data.interviews) {
    interviewStore.put(interview);
  }

  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
