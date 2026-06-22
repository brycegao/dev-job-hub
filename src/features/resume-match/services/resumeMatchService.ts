/**
 * 简历匹配服务
 * 将简历版本与 JD 进行交叉分析，基于私有数据生成具体可执行的行动建议。
 */

import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import type { JobApplication } from "../../applications/types";
import type { ResumeVersion } from "../../resumes/types";
import type { MatchAction, ResumeMatchResult } from "../types";

/** 文本统一为小写用于比较 */
function normalize(text: string): string {
  return text.toLowerCase();
}

/** 判断文本中是否包含指定值（忽略大小写） */
function includesAny(text: string, value: string): boolean {
  return normalize(text).includes(normalize(value));
}

/** 查找简历中哪条亮点匹配了某个关键词 */
function findMatchingHighlight(
  keyword: string,
  highlights: string[],
): string | undefined {
  return highlights.find((highlight) => includesAny(highlight, keyword));
}

/**
 * 将简历与 JD 进行匹配分析，生成结构化行动建议
 */
export function matchResumeToJD(
  application: JobApplication,
  resume: ResumeVersion,
): ResumeMatchResult {
  const jdAnalysis = analyzeJD(application.jdText);
  const resumeText = `${resume.name}\n${resume.targetRole}\n${resume.highlights.join("\n")}\n${resume.content}`;
  const allJDKeywords = [
    ...jdAnalysis.techKeywords,
    ...jdAnalysis.domainKeywords,
    ...jdAnalysis.capabilityKeywords,
    ...jdAnalysis.bonusKeywords,
  ];

  const matchedPoints = allJDKeywords.filter((keyword) =>
    includesAny(resumeText, keyword),
  );
  const missingPoints = allJDKeywords.filter(
    (keyword) => !includesAny(resumeText, keyword),
  );

  const actions: MatchAction[] = [];

  // strength：JD 关键词 × 简历亮点，给出具体怎么讲
  for (const keyword of matchedPoints) {
    const highlight = findMatchingHighlight(keyword, resume.highlights);
    if (highlight) {
      actions.push({
        type: "strength",
        keyword,
        resumeHighlight: highlight,
        advice: `你的简历有「${highlight}」，和 JD「${keyword}」强匹配，面试重点讲这个案例`,
      });
    } else {
      actions.push({
        type: "strength",
        keyword,
        advice: `你的简历涉及「${keyword}」，面试中准备好相关项目细节和量化结果`,
      });
    }
  }

  // gap：JD 要求但简历缺失
  for (const keyword of missingPoints) {
    actions.push({
      type: "gap",
      keyword,
      advice: `JD 要求「${keyword}」但你的简历未提及，建议准备 1 个相关案例或补充到简历`,
    });
  }

  // differentiator：JD 加分项 × 简历亮点，差异化卖点（排除已被 strength 覆盖的）
  const matchedStrengths = new Set(actions.filter((a) => a.type === "strength").map((a) => a.keyword));
  for (const bonus of jdAnalysis.bonusKeywords) {
    if (matchedStrengths.has(bonus)) continue;
    if (includesAny(resumeText, bonus)) {
      const highlight = findMatchingHighlight(bonus, resume.highlights);
      actions.push({
        type: "differentiator",
        keyword: bonus,
        resumeHighlight: highlight,
        advice: highlight
          ? `你有「${highlight}」经验，JD 加分项提到「${bonus}」，打招呼时可突出`
          : `你有「${bonus}」相关经验，JD 加分项提到，面试中主动展示`,
      });
    }
  }

  return {
    actions,
    greetingMessage: buildGreeting(application, matchedPoints, resume),
  };
}

/** 根据匹配结果生成 BOSS/脉脉 打招呼话术 */
function buildGreeting(
  application: JobApplication,
  matchedPoints: string[],
  resume: ResumeVersion,
): string {
  const matchedText = matchedPoints.length
    ? `我过往经历和 ${matchedPoints.slice(0, 4).join("、")} 比较匹配`
    : `我有 ${resume.targetRole || application.jobTitle} 相关经验`;

  return `您好，我关注到贵司「${application.jobTitle}」岗位，${matchedText}。希望有机会进一步沟通。`;
}
