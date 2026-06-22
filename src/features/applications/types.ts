/**
 * 岗位投递领域类型定义。
 */

/** 投递状态 */
export type JobStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "no_response"
  | "not_fit";

/** 远程工作类型 */
export type RemoteType = "onsite" | "hybrid" | "remote";

/** 岗位投递记录 */
export type JobApplication = {
  id: string;
  companyName: string;
  jobTitle: string;
  channel: string;
  city?: string;
  remoteType?: RemoteType;
  salaryRange?: string;
  jobUrl?: string;
  jdText: string;
  status: JobStatus;
  appliedAt?: string;
  nextFollowUpAt?: string;
  resumeVersionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

/** 创建/更新岗位时的输入类型（不含自动生成字段） */
export type JobApplicationInput = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
>;

/** 状态中文标签映射 */
export const statusLabels: Record<JobStatus, string> = {
  applied: "已投递",
  interviewing: "面试中",
  offer: "Offer",
  rejected: "已拒绝",
  no_response: "无反馈",
  not_fit: "不合适",
};

/** 活跃状态列表（未关闭） */
export const activeStatuses: JobStatus[] = [
  "applied",
  "interviewing",
  "offer",
];

/** 已关闭状态列表 */
export const closedStatuses: JobStatus[] = ["rejected", "no_response", "not_fit"];

/**
 * 状态流转规则：每个状态允许转到的目标状态。
 */
export const statusTransitions: Record<JobStatus, JobStatus[]> = {
  applied: ["interviewing", "offer", "rejected", "no_response", "not_fit"],
  interviewing: ["offer", "rejected"],
  offer: [],
  rejected: [],
  no_response: [],
  not_fit: [],
};
