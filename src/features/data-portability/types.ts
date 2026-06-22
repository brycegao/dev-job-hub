/**
 * 数据导入导出类型定义
 * 定义 JSON 导出文件的结构类型。
 */

import type { JobApplication } from "../applications/types";
import type { InterviewRecord } from "../interviews/types";
import type { ResumeVersion } from "../resumes/types";

/** 应用数据导出格式，用于 JSON 导入导出 */
export type AppDataExport = {
  /** 固定的应用标识 */
  app: "developer-job-hunt-crm";
  /** 数据格式版本号 */
  version: 1;
  /** 导出时间（ISO 格式） */
  exportedAt: string;
  /** 职位申请列表 */
  applications: JobApplication[];
  /** 简历版本列表 */
  resumes: ResumeVersion[];
  /** 面试记录列表 */
  interviews: InterviewRecord[];
};
