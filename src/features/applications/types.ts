export type JobStatus =
  | "evaluating"
  | "applied"
  | "contacted"
  | "interviewing"
  | "offer"
  | "rejected"
  | "no_response"
  | "not_fit";

export type RemoteType = "onsite" | "hybrid" | "remote";

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

export type JobApplicationInput = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
>;

export const statusLabels: Record<JobStatus, string> = {
  evaluating: "待评估",
  applied: "已投递",
  contacted: "已沟通",
  interviewing: "面试中",
  offer: "Offer",
  rejected: "已拒绝",
  no_response: "无反馈",
  not_fit: "不合适",
};

export const activeStatuses: JobStatus[] = [
  "evaluating",
  "applied",
  "contacted",
  "interviewing",
  "offer",
];

export const closedStatuses: JobStatus[] = ["rejected", "no_response", "not_fit"];
