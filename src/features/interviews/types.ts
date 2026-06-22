export type InterviewRound =
  | "first"
  | "second"
  | "third"
  | "hr"
  | "final"
  | "other";

export type InterviewResult = "pending" | "passed" | "failed" | "unknown";

export type InterviewInviteStatus =
  | "not_scheduled"
  | "invited"
  | "confirmed"
  | "completed"
  | "cancelled";

export type InterviewQuestion = {
  id: string;
  question: string;
  answerNotes?: string;
  tags: string[];
};

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
  result: InterviewResult;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

export type InterviewRecordInput = Omit<
  InterviewRecord,
  "id" | "createdAt" | "updatedAt"
>;

export const interviewRoundLabels: Record<InterviewRound, string> = {
  first: "一面",
  second: "二面",
  third: "三面",
  hr: "HR 面",
  final: "终面",
  other: "其他",
};

export const interviewResultLabels: Record<InterviewResult, string> = {
  pending: "待反馈",
  passed: "通过",
  failed: "未通过",
  unknown: "未知",
};

export const interviewInviteStatusLabels: Record<InterviewInviteStatus, string> = {
  not_scheduled: "未预约",
  invited: "已邀约",
  confirmed: "已确认",
  completed: "已结束",
  cancelled: "已取消",
};
