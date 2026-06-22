/**
 * 面试记录领域类型定义。
 */

/** 面试轮次 */
export type InterviewRound =
  | "first"
  | "second"
  | "third"
  | "hr"
  | "final"
  | "other";

/** 面试结果 */
export type InterviewResult = "pending" | "passed" | "failed";

/** 面试邀约状态 */
export type InterviewInviteStatus =
  | "not_scheduled"
  | "invited"
  | "confirmed"
  | "completed"
  | "cancelled";

/** 单个面试问题 */
export type InterviewQuestion = {
  id: string;
  question: string;
  answerNotes?: string;
  tags: string[];
};

/** 面试记录 */
export type InterviewRecord = {
  id: string;
  jobApplicationId: string;
  round: InterviewRound;
  inviteStatus?: InterviewInviteStatus;
  invitedAt?: string;
  scheduledAt?: string;
  confirmedAt?: string;
  interviewerType?: string;
  nextRound?: InterviewRound;
  nextScheduledAt?: string;
  inviteNotes?: string;
  questions: InterviewQuestion[];
  selfReview?: string;
  weakPoints: string[];
  strengths: string[];
  actionItems: string[];
  rating?: number;
  result: InterviewResult;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

/** 创建面试记录时的输入类型（不含自动生成字段） */
export type InterviewRecordInput = Omit<
  InterviewRecord,
  "id" | "createdAt" | "updatedAt"
>;

/** 面试轮次中文标签 */
export const interviewRoundLabels: Record<InterviewRound, string> = {
  first: "一面",
  second: "二面",
  third: "三面",
  hr: "HR 面",
  final: "终面",
  other: "其他",
};

/** 面试结果中文标签 */
export const interviewResultLabels: Record<InterviewResult, string> = {
  pending: "待反馈",
  passed: "通过",
  failed: "未通过",
};

/** 面试邀约状态中文标签 */
export const interviewInviteStatusLabels: Record<InterviewInviteStatus, string> = {
  not_scheduled: "未预约",
  invited: "已邀约",
  confirmed: "已确认",
  completed: "已结束",
  cancelled: "已取消",
};

/** 面试评分中文标签 */
export const ratingLabels: Record<number, string> = {
  1: "很差",
  2: "较差",
  3: "一般",
  4: "较好",
  5: "很好",
};
