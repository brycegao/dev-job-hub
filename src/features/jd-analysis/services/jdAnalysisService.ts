import { keywordRules } from "../keyword-rules";
import type { JDAnalysisResult, KeywordCategory } from "../types";

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function hasAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => text.includes(alias.toLowerCase()));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function pickByCategory(text: string, category: KeywordCategory): string[] {
  return unique(
    keywordRules
      .filter((rule) => rule.category === category && hasAlias(text, rule.aliases))
      .map((rule) => rule.label),
  );
}

function buildSummary(result: Omit<JDAnalysisResult, "summary">): string {
  const segments: string[] = [];

  if (result.techKeywords.length) {
    segments.push(`技术栈偏向 ${result.techKeywords.slice(0, 4).join("、")}`);
  }

  if (result.domainKeywords.length) {
    segments.push(`业务方向集中在 ${result.domainKeywords.slice(0, 3).join("、")}`);
  }

  if (result.capabilityKeywords.length) {
    segments.push(`重点考察 ${result.capabilityKeywords.slice(0, 3).join("、")}`);
  }

  if (result.bonusKeywords.length) {
    segments.push(`加分项包括 ${result.bonusKeywords.slice(0, 3).join("、")}`);
  }

  if (!segments.length) {
    return "暂未识别出明显技术画像，建议补充更完整的 JD 后再分析。";
  }

  return `${segments.join("；")}。`;
}

export function analyzeJD(jdText: string): JDAnalysisResult {
  const normalized = normalizeText(jdText);
  const result = {
    techKeywords: pickByCategory(normalized, "tech"),
    domainKeywords: pickByCategory(normalized, "domain"),
    capabilityKeywords: pickByCategory(normalized, "capability"),
    bonusKeywords: pickByCategory(normalized, "bonus"),
    risks: pickByCategory(normalized, "risk"),
  };

  return {
    ...result,
    summary: buildSummary(result),
  };
}

