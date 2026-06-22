import { clearStore, putInStore } from "../../../shared/storage/indexedDb";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import type { AppDataExport } from "../types";

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

export function downloadJson(data: AppDataExport, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

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

  return {
    app: "developer-job-hunt-crm",
    version: 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    applications: data.applications,
    resumes: data.resumes,
    interviews: data.interviews,
  };
}

export async function replaceAllData(data: AppDataExport): Promise<void> {
  await Promise.all([
    clearStore("applications"),
    clearStore("resumes"),
    clearStore("interviews"),
  ]);

  await Promise.all([
    ...data.applications.map((application) =>
      putInStore("applications", application),
    ),
    ...data.resumes.map((resume) => putInStore("resumes", resume)),
    ...data.interviews.map((interview) => putInStore("interviews", interview)),
  ]);
}
