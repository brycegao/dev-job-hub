/**
 * 求职申请分析服务
 * 提供投递漏斗指标、渠道统计、待跟进列表和近期面试日程的聚合计算。
 */

import type { JobApplication, JobStatus } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";

/** 即将到来的面试信息 */
export type UpcomingInterview = {
  /** 面试记录 */
  interview: InterviewRecord;
  /** 公司名称 */
  companyName: string;
  /** 岗位名称 */
  jobTitle: string;
  /** 关联的职位申请 ID */
  applicationId: string;
};

/** 求职申请聚合指标 */
export type ApplicationMetrics = {
  /** 投递总数 */
  total: number;
  /** 本周投递数 */
  thisWeek: number;
  /** 收到回复数（含面试/offer/拒绝） */
  replies: number;
  /** 进入面试数 */
  interviews: number;
  /** 收到 offer 数 */
  offers: number;
  /** 回复率 */
  replyRate: number;
  /** 面试转化率（面试数 / 回复数） */
  interviewRate: number;
  /** 各状态计数 */
  statusCounts: Record<JobStatus, number>;
  /** 各渠道计数 */
  channelCounts: Record<string, number>;
  /** 待跟进的申请列表（最多 5 条） */
  followUps: JobApplication[];
  /** 近 7 天内的面试列表（最多 10 条） */
  upcomingInterviews: UpcomingInterview[];
};

/** 计算给定日期所在周的周一（一周起始日） */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 构建求职申请聚合指标
 * @param applications - 所有职位申请列表
 * @param interviewRecords - 所有面试记录列表（可选）
 * @returns 包含漏斗数据、渠道统计和近期面试的完整指标
 */
export function buildApplicationMetrics(
  applications: JobApplication[],
  interviewRecords: InterviewRecord[] = [],
): ApplicationMetrics {
  const weekStart = startOfWeek(new Date());
  const statusCounts = applications.reduce(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<JobStatus, number>,
  );

  const channelCounts = applications.reduce(
    (acc, application) => {
      const channel = application.channel || "未填写";
      acc[channel] = (acc[channel] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const replies = applications.filter((application) =>
    ["interviewing", "offer", "rejected"].includes(application.status),
  ).length;
  const applicationIdsWithInterviews = new Set(
    interviewRecords
      .filter((record) => record.inviteStatus !== "cancelled")
      .map((record) => record.jobApplicationId),
  );
  const interviewCount = applications.filter((application) =>
    applicationIdsWithInterviews.has(application.id) ||
    ["interviewing", "offer", "rejected"].includes(application.status),
  ).length;
  const offers = applications.filter((application) => application.status === "offer").length;
  const thisWeek = applications.filter((application) => {
    if (!application.appliedAt) {
      return false;
    }
    return new Date(application.appliedAt) >= weekStart;
  }).length;
  const followUps = applications
    .filter((application) => application.nextFollowUpAt)
    .sort((a, b) => String(a.nextFollowUpAt).localeCompare(String(b.nextFollowUpAt)))
    .slice(0, 5);

  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const applicationMap = new Map(applications.map((a) => [a.id, a]));
  const upcomingInterviews = interviewRecords
    .filter((record) => {
      if (!record.scheduledAt || record.inviteStatus === "cancelled") return false;
      const date = new Date(record.scheduledAt);
      return date >= now && date <= sevenDaysLater;
    })
    .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""))
    .slice(0, 10)
    .map((record) => {
      const app = applicationMap.get(record.jobApplicationId);
      return {
        interview: record,
        companyName: app?.companyName || "未知公司",
        jobTitle: app?.jobTitle || "未知岗位",
        applicationId: record.jobApplicationId,
      };
    });

  return {
    total: applications.length,
    thisWeek,
    replies,
    interviews: interviewCount,
    offers,
    replyRate: applications.length ? replies / applications.length : 0,
    interviewRate: replies ? interviewCount / replies : 0,
    statusCounts,
    channelCounts,
    followUps,
    upcomingInterviews,
  };
}
