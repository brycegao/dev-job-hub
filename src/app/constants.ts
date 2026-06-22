import type { JobApplicationInput } from "../features/applications/types";
import type { ResumeVersionInput } from "../features/resumes/types";

export type Page =
  | "dashboard"
  | "applications"
  | "resumes"
  | "interviews"
  | "analytics"
  | "settings"
  | "help";

export const navItems: Array<{ key: Page; label: string }> = [
  { key: "dashboard", label: "概览" },
  { key: "applications", label: "岗位" },
  { key: "resumes", label: "简历" },
  { key: "interviews", label: "面试" },
  { key: "analytics", label: "统计" },
  { key: "settings", label: "设置" },
  { key: "help", label: "帮助" },
];

export const defaultInput: JobApplicationInput = {
  companyName: "",
  jobTitle: "",
  channel: "BOSS直聘",
  city: "",
  remoteType: "onsite",
  salaryRange: "",
  jobUrl: "",
  jdText: "",
  status: "applied",
  appliedAt: new Date().toISOString().slice(0, 10),
  nextFollowUpAt: "",
  notes: "",
};

export const defaultResumeInput: ResumeVersionInput = {
  name: "",
  targetRole: "",
  content: "",
  filePath: "",
  highlights: [],
};

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
