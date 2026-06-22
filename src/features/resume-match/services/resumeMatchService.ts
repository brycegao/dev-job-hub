import { analyzeJD } from "../../jd-analysis/services/jdAnalysisService";
import type { JobApplication } from "../../applications/types";
import type { ResumeVersion } from "../../resumes/types";
import type { ResumeMatchResult } from "../types";

function normalize(text: string): string {
  return text.toLowerCase();
}

function includesAny(text: string, value: string): boolean {
  return normalize(text).includes(normalize(value));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).filter(Boolean);
}

export function matchResumeToJD(
  application: JobApplication,
  resume: ResumeVersion,
): ResumeMatchResult {
  const jdAnalysis = analyzeJD(application.jdText);
  const resumeText = `${resume.name}\n${resume.targetRole}\n${resume.highlights.join("\n")}\n${resume.content}`;
  const allJDKeywords = unique([
    ...jdAnalysis.techKeywords,
    ...jdAnalysis.domainKeywords,
    ...jdAnalysis.capabilityKeywords,
    ...jdAnalysis.bonusKeywords,
  ]);
  const matchedPoints = allJDKeywords.filter((keyword) =>
    includesAny(resumeText, keyword),
  );
  const missingPoints = allJDKeywords.filter(
    (keyword) => !includesAny(resumeText, keyword),
  );
  const suggestedProjects = resume.highlights.length
    ? resume.highlights.slice(0, 3)
    : ["补充 1-2 个与岗位技术栈、业务方向直接相关的项目亮点。"];
  const suggestedKeywords = missingPoints.slice(0, 8);
  const interviewPrep = unique([
    ...jdAnalysis.capabilityKeywords.map((keyword) => `准备 ${keyword} 的项目案例和量化结果`),
    ...jdAnalysis.techKeywords.slice(0, 4).map((keyword) => `复盘 ${keyword} 的核心实践细节`),
    ...jdAnalysis.risks.map((risk) => `提前准备关于「${risk}」的解释或替代优势`),
  ]).slice(0, 8);

  return {
    matchedPoints,
    missingPoints,
    suggestedProjects,
    suggestedKeywords,
    greetingMessage: buildGreeting(application, matchedPoints, resume),
    interviewPrep,
  };
}

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

