/**
 * 今日行动台服务。
 * 将岗位、面试和简历数据转换成用户今天可以直接执行的任务。
 */
import { activeStatuses, type JobApplication } from "../../applications/types";
import { interviewRoundLabels, type InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";

export type TodayActionPriority = "high" | "medium" | "low";

export type TodayActionCategory =
  | "follow_up"
  | "interview"
  | "review"
  | "stale"
  | "data_hygiene";

export type TodayAction = {
  id: string;
  category: TodayActionCategory;
  priority: TodayActionPriority;
  title: string;
  description: string;
  dueLabel: string;
  applicationId?: string;
  interviewId?: string;
};

export type TodayActionSummary = {
  high: number;
  medium: number;
  low: number;
  total: number;
};

const priorityRank: Record<TodayActionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function diffInDays(target: string | undefined, now: Date): number | null {
  if (!target) return null;
  const date = new Date(target);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86400000);
}

function diffInHours(target: string | undefined, now: Date): number | null {
  if (!target) return null;
  const date = new Date(target);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date.getTime() - now.getTime()) / 3600000);
}

function formatDayDistance(days: number): string {
  if (days === 0) return "今天";
  if (days === 1) return "明天";
  if (days === -1) return "昨天";
  if (days > 1) return `${days} 天后`;
  return `已超期 ${Math.abs(days)} 天`;
}

function hasReviewContent(interview: InterviewRecord): boolean {
  return Boolean(
    interview.selfReview?.trim()
      || interview.summary?.trim()
      || interview.questions.length
      || interview.weakPoints.length
      || interview.strengths.length
      || interview.actionItems.length,
  );
}

function isActive(application: JobApplication): boolean {
  return activeStatuses.includes(application.status);
}

function buildSummary(actions: TodayAction[]): TodayActionSummary {
  return actions.reduce<TodayActionSummary>(
    (summary, action) => {
      summary[action.priority] += 1;
      summary.total += 1;
      return summary;
    },
    { high: 0, medium: 0, low: 0, total: 0 },
  );
}

export function buildTodayActions(
  applications: JobApplication[],
  interviews: InterviewRecord[],
  resumes: ResumeVersion[],
  now = new Date(),
): { actions: TodayAction[]; summary: TodayActionSummary } {
  const actions: TodayAction[] = [];
  const applicationMap = new Map(applications.map((application) => [application.id, application]));
  const resumeIds = new Set(resumes.map((resume) => resume.id));

  for (const application of applications) {
    if (!isActive(application)) continue;

    const followUpDiff = diffInDays(application.nextFollowUpAt, now);
    if (followUpDiff !== null && followUpDiff <= 0) {
      actions.push({
        id: `follow-up-${application.id}`,
        category: "follow_up",
        priority: followUpDiff < 0 ? "high" : "medium",
        title: `跟进 ${application.companyName}`,
        description: `${application.jobTitle} 需要更新沟通状态或给 HR 发一次轻量跟进。`,
        dueLabel: formatDayDistance(followUpDiff),
        applicationId: application.id,
      });
    }

    const appliedDiff = diffInDays(application.appliedAt, now);
    if (
      application.status === "applied"
      && appliedDiff !== null
      && appliedDiff <= -7
      && !application.nextFollowUpAt
    ) {
      actions.push({
        id: `stale-${application.id}`,
        category: "stale",
        priority: "medium",
        title: `${application.companyName} 已投递 ${Math.abs(appliedDiff)} 天无反馈`,
        description: "建议标记为无反馈、补一次跟进，或复盘该岗位是否值得继续投入。",
        dueLabel: "7 天以上",
        applicationId: application.id,
      });
    }

    if (!application.jdText.trim()) {
      actions.push({
        id: `missing-jd-${application.id}`,
        category: "data_hygiene",
        priority: "low",
        title: `补充 ${application.companyName} 的 JD`,
        description: "粘贴 JD 后才能做关键词分析、简历匹配和面试准备建议。",
        dueLabel: "可补充",
        applicationId: application.id,
      });
    }

    if (!application.resumeVersionId || !resumeIds.has(application.resumeVersionId)) {
      actions.push({
        id: `missing-resume-${application.id}`,
        category: "data_hygiene",
        priority: application.jdText.trim() ? "medium" : "low",
        title: `关联 ${application.companyName} 的投递简历`,
        description: "把岗位和简历版本连起来，后续才能复盘哪版简历带来更多面试。",
        dueLabel: "待关联",
        applicationId: application.id,
      });
    }
  }

  for (const interview of interviews) {
    if (interview.inviteStatus === "cancelled") continue;
    const application = applicationMap.get(interview.jobApplicationId);
    const companyName = application?.companyName || "未知公司";
    const jobTitle = application?.jobTitle || "未知岗位";
    const hours = diffInHours(interview.scheduledAt, now);

    if (hours !== null && hours >= 0 && hours <= 72 && interview.inviteStatus !== "completed") {
      actions.push({
        id: `interview-${interview.id}`,
        category: "interview",
        priority: hours <= 24 ? "high" : "medium",
        title: `准备 ${companyName} ${interviewRoundLabels[interview.round]}`,
        description: `${jobTitle}${interview.location ? ` · ${interview.location}` : ""}，建议生成面试准备卡片并复查 JD。`,
        dueLabel: hours <= 1 ? "1 小时内" : `${hours} 小时内`,
        applicationId: interview.jobApplicationId,
        interviewId: interview.id,
      });
    }

    if (hours !== null && hours < 0 && hours >= -72 && !hasReviewContent(interview)) {
      actions.push({
        id: `review-${interview.id}`,
        category: "review",
        priority: "high",
        title: `复盘 ${companyName} ${interviewRoundLabels[interview.round]}`,
        description: "趁记忆还新，补充面试问题、薄弱点和下一步行动项。",
        dueLabel: formatDayDistance(diffInDays(interview.scheduledAt, now) ?? 0),
        applicationId: interview.jobApplicationId,
        interviewId: interview.id,
      });
    }
  }

  const sorted = actions.sort((a, b) => {
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title, "zh-CN");
  });

  return {
    actions: sorted.slice(0, 12),
    summary: buildSummary(sorted),
  };
}
