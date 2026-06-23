/**
 * 智能洞察服务
 * 基于用户的私有数据（岗位、面试记录）计算可操作的瓶颈建议、
 * 跨面试薄弱点模式和 Dashboard 智能提醒。
 * 纯同步计算，无需 AI 接口。
 */

import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import { formatPercent } from "../../../shared/utils/common";

/** 瓶颈洞察类型 */
export type BottleneckInsight = {
  type: "low_reply_rate" | "low_interview_rate" | "channel_concentration";
  severity: "warning" | "critical";
  message: string;
  suggestions: string[];
};

/** 跨面试薄弱点模式 */
export type WeakPointPattern = {
  weakPoint: string;
  frequency: number;
  totalInterviews: number;
  relatedCompanies: string[];
  suggestion: string;
};

/** Dashboard 智能提醒 */
export type DashboardAlert = {
  type: "stale_application" | "upcoming_interview_prep";
  message: string;
  applicationId: string;
  priority: "high" | "medium";
};

/** 洞察聚合结果 */
export type InsightsResult = {
  bottlenecks: BottleneckInsight[];
  weakPointPatterns: WeakPointPattern[];
  dashboardAlerts: DashboardAlert[];
};

/** 识别漏斗瓶颈并给出具体建议 */
function identifyBottlenecks(
  applications: JobApplication[],
  interviewRecords: InterviewRecord[],
): BottleneckInsight[] {
  const total = applications.length;
  if (total < 3) return [];

  const replies = applications.filter((a) =>
    ["interviewing", "offer"].includes(a.status),
  ).length;

  const interviewAppIds = new Set(
    interviewRecords
      .filter((r) => r.inviteStatus !== "cancelled")
      .map((r) => r.jobApplicationId),
  );
  const interviewCount = interviewAppIds.size;

  const channelCounts = applications.reduce(
    (acc, a) => {
      const ch = a.channel || "未填写";
      acc[ch] = (acc[ch] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const bottlenecks: BottleneckInsight[] = [];
  const replyRate = total > 0 ? replies / total : 0;

  // 回复率低
  if (replyRate < 0.3 && total >= 5) {
    bottlenecks.push({
      type: "low_reply_rate",
      severity: replyRate < 0.15 ? "critical" : "warning",
      message: `回复率 ${formatPercent(replyRate)} 偏低（${total} 投递中仅 ${replies} 收到回复）`,
      suggestions: [
        "优化打招呼话术，突出匹配度最高的 2-3 个技术栈关键词",
        "拓宽投递渠道，不要只依赖单一平台",
        "检查投递目标是否与自身经验匹配，减少无效投递",
      ],
    });
  }

  // 面试转化率低
  const interviewRate = replies > 0 ? interviewCount / replies : 0;
  if (interviewRate < 0.4 && replies >= 3) {
    bottlenecks.push({
      type: "low_interview_rate",
      severity: interviewRate < 0.2 ? "critical" : "warning",
      message: `面试转化率偏低（${replies} 次回复中仅 ${interviewCount} 进入面试）`,
      suggestions: [
        "复盘被拒绝的岗位 JD，找出共性要求，针对性准备",
        "优化简历中与高频 JD 要求匹配的内容",
        "检查投递的岗位级别是否合适，避免目标过高",
      ],
    });
  }

  // 渠道过于集中
  const channels = Object.entries(channelCounts).sort(([, a], [, b]) => b - a);
  if (channels.length >= 1 && channels[0][1] / total > 0.8 && total >= 5) {
    const dominant = channels[0];
    bottlenecks.push({
      type: "channel_concentration",
      severity: "warning",
      message: `投递渠道过于集中在「${dominant[0]}」（${Math.round((dominant[1] / total) * 100)}%）`,
      suggestions: [
        "建议拓宽至脉脉、猎聘、公司官网直投、内推等渠道",
        "不同渠道适合不同类型的岗位，多渠道覆盖提高回复率",
      ],
    });
  }

  return bottlenecks;
}

/** 分析跨面试薄弱点模式 */
function analyzeWeakPointPatterns(
  interviews: InterviewRecord[],
  applications: JobApplication[],
): WeakPointPattern[] {
  if (interviews.length < 2) return [];

  const appMap = new Map(applications.map((a) => [a.id, a]));

  // 统计每个薄弱点出现的频率和关联公司
  const frequencyMap = new Map<
    string,
    { count: number; companies: Set<string> }
  >();

  for (const interview of interviews) {
    for (const weak of interview.weakPoints) {
      const existing = frequencyMap.get(weak);
      const company = appMap.get(interview.jobApplicationId)?.companyName || "未知公司";
      if (existing) {
        existing.count++;
        existing.companies.add(company);
      } else {
        frequencyMap.set(weak, { count: 1, companies: new Set([company]) });
      }
    }
  }

  // 出现 >= 2 次的薄弱点生成模式
  return Array.from(frequencyMap.entries())
    .filter(([, { count }]) => count >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([weakPoint, { count, companies }]) => ({
      weakPoint,
      frequency: count,
      totalInterviews: interviews.length,
      relatedCompanies: Array.from(companies),
      suggestion: `你在 ${count} 场面试中「${weakPoint}」表现薄弱，建议整理 2-3 个相关量化案例，用 STAR 结构准备`,
    }));
}

/** 生成 Dashboard 智能提醒 */
function generateDashboardAlerts(
  applications: JobApplication[],
  interviews: InterviewRecord[],
): DashboardAlert[] {
  const now = new Date();
  const alerts: DashboardAlert[] = [];
  const appMap = new Map(applications.map((a) => [a.id, a]));

  // 停滞岗位：applied 状态超过 7 天无反馈
  const staleThreshold = 7 * 24 * 60 * 60 * 1000;
  const staleApps = applications
    .filter((app) => {
      if (app.status !== "applied" || !app.appliedAt) return false;
      return now.getTime() - new Date(app.appliedAt).getTime() > staleThreshold;
    })
    .sort(
      (a, b) =>
        new Date(a.appliedAt!).getTime() - new Date(b.appliedAt!).getTime(),
    )
    .slice(0, 5);

  for (const app of staleApps) {
    const days = Math.floor(
      (now.getTime() - new Date(app.appliedAt!).getTime()) / (24 * 60 * 60 * 1000),
    );
    alerts.push({
      type: "stale_application",
      message: `「${app.companyName} · ${app.jobTitle}」已投递 ${days} 天无回复，建议主动跟进或标记状态`,
      applicationId: app.id,
      priority: days >= 14 ? "high" : "medium",
    });
  }

  // 即将面试 + 历史薄弱点重合提醒
  const twoDaysLater = new Date(now);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const upcomingInterviews = interviews.filter((interview) => {
    if (!interview.scheduledAt || interview.inviteStatus === "cancelled") return false;
    const date = new Date(interview.scheduledAt);
    return date >= now && date <= twoDaysLater;
  });

  // 收集所有历史薄弱点
  const allWeakPoints = new Set(
    interviews.flatMap((i) => i.weakPoints),
  );

  for (const interview of upcomingInterviews) {
    const app = appMap.get(interview.jobApplicationId);
    if (!app || !app.jdText.trim()) continue;

    // 用简单 includes 匹配历史薄弱点与 JD 关键词
    const overlaps = Array.from(allWeakPoints).filter((wp) =>
      app.jdText.toLowerCase().includes(wp.toLowerCase()),
    );

    if (overlaps.length > 0) {
      const topOverlap = overlaps[0];
      alerts.push({
        type: "upcoming_interview_prep",
        message: `即将面试「${app.companyName} · ${app.jobTitle}」，历史薄弱点「${topOverlap}」与 JD 相关，建议重点准备`,
        applicationId: app.id,
        priority: "high",
      });
    }
  }

  return alerts;
}

/**
 * 构建完整洞察结果
 * @param applications - 所有岗位列表
 * @param interviews - 所有面试记录列表
 */
export function buildInsights(
  applications: JobApplication[],
  interviews: InterviewRecord[],
): InsightsResult {
  return {
    bottlenecks: identifyBottlenecks(applications, interviews),
    weakPointPatterns: analyzeWeakPointPatterns(interviews, applications),
    dashboardAlerts: generateDashboardAlerts(applications, interviews),
  };
}
