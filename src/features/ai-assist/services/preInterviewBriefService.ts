/**
 * 面试前简报服务
 * 综合 JD 分析 + 简历匹配 + 历史面试数据，生成面试前简报。
 */

import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import { matchResumeToJD } from "../../resume-match/services/resumeMatchService";
import type { ResumeVersion } from "../../resumes/types";
import type { PreInterviewBrief } from "../types";
import { unique } from "../../../shared/utils/common";

/** 截断文本 */
function limitText(text: string | undefined, max: number): string {
  if (!text) return "未填写";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/** 将标题和列表值格式化为 Markdown */
function lines(title: string, values: string[]): string {
  return [`## ${title}`, ...values.map((v) => `- ${v}`)].join("\n");
}

/**
 * 构建面试前简报
 * 综合所有私有数据生成可执行的面试准备方案。
 */
export function buildPreInterviewBrief(input: {
  application: JobApplication;
  resume?: ResumeVersion;
  interviews?: InterviewRecord[];
}): PreInterviewBrief {
  const { application, resume, interviews = [] } = input;
  const jdAnalysis = analyzeJD(application.jdText);
  const allKeywords = unique([
    ...jdAnalysis.techKeywords,
    ...jdAnalysis.domainKeywords,
    ...jdAnalysis.capabilityKeywords,
    ...jdAnalysis.bonusKeywords,
  ]);

  // 匹配度概览
  let matchOverview: string;
  if (resume) {
    const matchResult = matchResumeToJD(application, resume);
    const strengths = matchResult.actions.filter((a) => a.type === "strength").length;
    const gaps = matchResult.actions.filter((a) => a.type === "gap").length;
    const diffs = matchResult.actions.filter((a) => a.type === "differentiator").length;
    matchOverview = `${strengths} 个强匹配、${gaps} 个缺口${diffs > 0 ? `、${diffs} 个差异化卖点` : ""}`;
  } else {
    matchOverview = "未关联简历，建议先关联简历以获得匹配分析";
  }

  // 历史薄弱点 × JD 关键词重合
  const historicalWeakPoints = unique(interviews.flatMap((i) => i.weakPoints));
  const weakPointOverlaps = historicalWeakPoints
    .map((wp) => {
      const relatedKeyword = allKeywords.find((k) =>
        wp.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(wp.toLowerCase()),
      );
      return relatedKeyword
        ? `⚠️「${wp}」— 本轮 JD 涉及「${relatedKeyword}」，必须准备改进`
        : null;
    })
    .filter(Boolean) as string[];

  // 优先复习清单
  const priorityChecklist = unique([
    ...weakPointOverlaps.map((item) => item),
    ...historicalWeakPoints
      .filter(
        (wp) => !weakPointOverlaps.some((overlap) => overlap.includes(wp)),
      )
      .slice(0, 2)
      .map((wp) => `上次薄弱点「${wp}」→ 面试中展示改进或主动规避`),
    ...allKeywords.slice(0, 3).map((k) => `复习「${k}」的核心概念和项目实践`),
    "准备 1 分钟自我介绍，贴合岗位关键词",
  ]).slice(0, 8);

  // 综合 prompt
  const historicalReviews = interviews
    .filter((i) => i.selfReview || i.summary)
    .map((i) => {
      const parts: string[] = [];
      if (i.summary) parts.push(`总结：${i.summary}`);
      if (i.selfReview) parts.push(`复盘：${i.selfReview}`);
      return parts.join("；");
    });

  const prompt = [
    "你是资深面试教练。请基于下面的综合信息，帮我生成一份面试前简报。",
    "",
    "输出格式：",
    "1. 岗位画像（30 字内）",
    "2. 我的 3 个核心卖点（每个 1 句话，附具体数据和项目）",
    "3. 面试中必须准备回答的 5 个重点问题",
    "4. 我的风险点及应对策略",
    "5. 面试前 24 小时最后复习清单（按优先级排序）",
    "",
    `公司：${application.companyName}`,
    `岗位：${application.jobTitle}`,
    `城市/薪资：${application.city || "未填写"} / ${application.salaryRange || "未填写"}`,
    "",
    `JD：\n${limitText(application.jdText, 3000)}`,
    "",
    resume
      ? `简历版本：${resume.name} / ${resume.targetRole}\n简历核心卖点：\n${resume.highlights.join("\n")}\n简历正文：\n${limitText(resume.content, 3000)}`
      : "简历：未关联",
    "",
    historicalWeakPoints.length
      ? `历史面试薄弱点：\n${lines("薄弱点", historicalWeakPoints.slice(0, 6))}`
      : "",
    historicalReviews.length
      ? `历史面试复盘：\n${lines("复盘", historicalReviews.slice(0, 4))}`
      : "",
    interviews.some((i) => i.actionItems.length > 0)
      ? `改进计划：\n${lines("行动项", unique(interviews.flatMap((i) => i.actionItems)).slice(0, 6))}`
      : "",
    "",
    "要求：建议要具体可执行，引用我简历中的真实项目，不要泛泛而谈。",
  ].join("\n");

  return {
    profileSummary: jdAnalysis.summary,
    matchOverview,
    weakPointOverlaps,
    priorityChecklist,
    prompt,
  };
}
