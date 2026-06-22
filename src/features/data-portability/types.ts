import type { JobApplication } from "../applications/types";
import type { InterviewRecord } from "../interviews/types";
import type { ResumeVersion } from "../resumes/types";

export type AppDataExport = {
  app: "developer-job-hunt-crm";
  version: 1;
  exportedAt: string;
  applications: JobApplication[];
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
};

