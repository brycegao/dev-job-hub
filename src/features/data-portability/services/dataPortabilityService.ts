import { clearStore, putInStore } from "../../../shared/storage/indexedDb";
import { openDatabase } from "../../../shared/storage/indexedDb";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import type { AppDataExport } from "../types";

function isValidRecord(record: unknown, requiredFields: string[]): boolean {
  if (!record || typeof record !== "object") return false;
  return requiredFields.every(
    (field) => (record as Record<string, unknown>)[field] !== undefined,
  );
}

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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
