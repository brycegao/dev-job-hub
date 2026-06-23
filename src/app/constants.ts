/**
 * 应用常量和工具函数。
 * 包含页面路由、默认表单值、格式化工具等。
 */
import type { JobApplicationInput } from "../features/applications/types";
import type { ResumeVersionInput } from "../features/resumes/types";

/** 应用页面类型 */
export type Page =
  | "dashboard"
  | "applications"
  | "resumes"
  | "interviews"
  | "analytics"
  | "settings"
  | "help";

/** 侧边栏导航项 */
export const navItems: Array<{ key: Page; label: string }> = [
  { key: "dashboard", label: "概览" },
  { key: "applications", label: "岗位" },
  { key: "resumes", label: "简历" },
  { key: "interviews", label: "面试" },
  { key: "analytics", label: "统计" },
  { key: "settings", label: "设置" },
  { key: "help", label: "帮助" },
];

/** 岗位表单默认值：投递日期默认今天，跟进日期默认 7 天后 */
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
  nextFollowUpAt: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })(),
  notes: "",
};

/** 简历表单默认值 */
export const defaultResumeInput: ResumeVersionInput = {
  name: "",
  targetRole: "",
  content: "",
  filePath: "",
  highlights: [],
};

/** 复制文本到剪贴板，返回是否成功 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** 弹出删除确认对话框 */
export function confirmDelete(label: string): boolean {
  return window.confirm(`确定删除该${label}？删除后不可恢复。`);
}
