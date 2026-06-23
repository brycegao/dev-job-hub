/**
 * 一键导出 AI 上下文服务。
 * 聚合所有用户数据（简历、岗位、面试复盘、薄弱点、统计）为一份结构化 Markdown，
 * 可直接粘贴到 ChatGPT / DeepSeek / 豆包等 AI 工具。
 */

import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import { statusLabels } from "../../applications/types";
import { interviewRoundLabels } from "../../interviews/types";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";

/** 跨面试薄弱点统计 */
function aggregateWeakPoints(interviews: InterviewRecord[]): Array<{
  weakPoint: string;
  frequency: number;
  relatedCompanies: string[];
}> {
  const map = new Map<string, { frequency: number; companies: string[] }>();
  for (const interview of interviews) {
    for (const wp of interview.weakPoints) {
      const entry = map.get(wp) ?? { frequency: 0, companies: [] };
      entry.frequency++;
      if (entry.companies.length < 3) entry.companies.push(interview.jobApplicationId);
      map.set(wp, entry);
    }
  }
  return [...map.entries()]
    .filter(([, v]) => v.frequency >= 2)
    .sort((a, b) => b[1].frequency - a[1].frequency)
    .slice(0, 5)
    .map(([weakPoint, v]) => ({
      weakPoint,
      frequency: v.frequency,
      relatedCompanies: v.companies,
    }));
}

export function buildAIContextExport(input: {
  applications: JobApplication[];
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
}): string {
  const { applications, resumes, interviews } = input;
  const appMap = new Map(applications.map((a) => [a.id, a]));
  const resumeMap = new Map(resumes.map((r) => [r.id, r]));
  const lines: string[] = [];

  lines.push("# 求职者上下文（由求职作战台导出）\n");

  // ── 简历版本 ──
  lines.push("## 我的简历版本\n");
  if (resumes.length === 0) {
    lines.push("暂无简历版本。\n");
  } else {
    resumes.forEach((r, i) => {
      lines.push(`### 简历 ${i + 1}：${r.name}（目标方向：${r.targetRole}）`);
      if (r.highlights.length > 0) {
        lines.push(`核心卖点：${r.highlights.join("、")}`);
      }
      if (r.content) {
        const summary = r.content.length > 500 ? r.content.slice(0, 500) + "…" : r.content;
        lines.push(`简历内容摘要：${summary}`);
      }
      lines.push("");
    });
  }

  // ── 岗位 ──
  lines.push("## 当前投递中的岗位\n");
  if (applications.length === 0) {
    lines.push("暂无岗位记录。\n");
  } else {
    applications.forEach((app, i) => {
      lines.push(`### 岗位 ${i + 1}：${app.companyName} · ${app.jobTitle}`);
      const meta: string[] = [];
      if (app.channel) meta.push(`渠道：${app.channel}`);
      if (app.city) meta.push(`城市：${app.city}`);
      if (app.salaryRange) meta.push(`薪资：${app.salaryRange}`);
      if (app.remoteType) meta.push(`工作方式：${app.remoteType}`);
      meta.push(`状态：${statusLabels[app.status]}`);
      lines.push(`- ${meta.join(" | ")}`);

      if (app.jdText) {
        const analysis = analyzeJD(app.jdText);
        const kw: string[] = [];
        if (analysis.techKeywords.length > 0) kw.push(`技术栈：${analysis.techKeywords.join("、")}`);
        if (analysis.capabilityKeywords.length > 0) kw.push(`能力要求：${analysis.capabilityKeywords.join("、")}`);
        if (analysis.domainKeywords.length > 0) kw.push(`领域方向：${analysis.domainKeywords.join("、")}`);
        if (kw.length > 0) lines.push(`- JD 关键词：${kw.join("；")}`);
      }

      if (app.resumeVersionId) {
        const resume = resumeMap.get(app.resumeVersionId);
        if (resume) lines.push(`- 关联简历：${resume.name}`);
      }

      if (app.notes) lines.push(`- 备注：${app.notes}`);
      lines.push("");
    });
  }

  // ── 面试复盘 ──
  lines.push("## 面试复盘记录\n");
  if (interviews.length === 0) {
    lines.push("暂无面试记录。\n");
  } else {
    interviews.forEach((iv) => {
      const app = appMap.get(iv.jobApplicationId);
      const company = app?.companyName ?? "未知公司";
      const title = app?.jobTitle ?? "未知岗位";
      lines.push(`### ${company} · ${title} — ${interviewRoundLabels[iv.round]}`);
      if (iv.interviewerType) lines.push(`- 面试官类型：${iv.interviewerType}`);
      if (iv.selfReview) lines.push(`- 自我评估：${iv.selfReview}`);
      if (iv.weakPoints.length > 0) lines.push(`- 薄弱点：${iv.weakPoints.join("、")}`);
      if (iv.strengths.length > 0) lines.push(`- 亮点：${iv.strengths.join("、")}`);
      if (iv.actionItems.length > 0) lines.push(`- 行动项：${iv.actionItems.join("、")}`);

      const unanswered = iv.questions.filter((q) => !q.answerNotes?.trim());
      if (unanswered.length > 0) {
        lines.push("- 待回答问题：");
        unanswered.forEach((q, qi) => {
          const tags = q.tags.length > 0 ? `（标签：${q.tags.join("、")}）` : "";
          lines.push(`  ${qi + 1}. ${q.question} ${tags}`);
        });
      }
      lines.push("");
    });
  }

  // ── 跨面试高频薄弱点 ──
  const weakPatterns = aggregateWeakPoints(interviews);
  lines.push("## 跨面试高频薄弱点\n");
  if (weakPatterns.length === 0) {
    lines.push("暂无跨面试高频薄弱点。\n");
  } else {
    weakPatterns.forEach((wp) => {
      lines.push(`- **${wp.weakPoint}**（出现 ${wp.frequency} 次，面试 ID：${wp.relatedCompanies.join("、")}）`);
    });
    lines.push("");
  }

  // ── 统计摘要 ──
  lines.push("## 统计摘要\n");
  const total = applications.length;
  const replies = applications.filter((a) => a.status === "interviewing" || a.status === "offer" || a.status === "rejected").length;
  const ints = applications.filter((a) => a.status === "interviewing" || a.status === "offer").length;
  const offers = applications.filter((a) => a.status === "offer").length;
  lines.push(`- 总投递：${total} | 回复：${replies}（${total > 0 ? Math.round((replies / total) * 100) : 0}%） | 面试：${ints}（${replies > 0 ? Math.round((ints / replies) * 100) : 0}%） | Offer：${offers}`);

  const channelCounts = new Map<string, number>();
  for (const a of applications) {
    if (a.channel) channelCounts.set(a.channel, (channelCounts.get(a.channel) ?? 0) + 1);
  }
  if (channelCounts.size > 0) {
    lines.push(`- 渠道分布：${[...channelCounts.entries()].map(([ch, cnt]) => `${ch} ${cnt}`).join("、")}`);
  }
  lines.push("");
  lines.push("---\n");
  lines.push("请基于以上我的求职数据，回答以下问题：\n（在此输入你的问题）\n");

  return lines.join("\n");
}
