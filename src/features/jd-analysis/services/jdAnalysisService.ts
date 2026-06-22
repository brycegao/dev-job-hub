/**
 * JD 分析服务
 * 基于关键词规则库对 JD 文本进行分析，提取技术栈、业务领域、能力要求等关键信息。
 * 使用纯本地规则，无需 AI 接口。
 */

import { keywordRules } from "../keyword-rules";
import type { JDAnalysisResult, KeywordCategory } from "../types";

/** 将文本统一为小写并压缩空白字符 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/** 检查文本中是否包含任一别名（支持词边界匹配） */
function hasAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;，；、（）()\\-])${escaped}(?:$|[\\s,;，；、（）()\\-])`, "i");
    return regex.test(text);
  });
}

/** 数组去重 */
function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

/** 按分类从规则库中提取匹配的关键词 */
function pickByCategory(text: string, category: KeywordCategory): string[] {
  return unique(
    keywordRules
      .filter((rule) => rule.category === category && hasAlias(text, rule.aliases))
      .map((rule) => rule.label),
  );
}

/** 根据分析结果生成简要的文字摘要 */
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

/**
 * 分析 JD 文本，提取关键词分类和摘要
 * @param jdText - 原始 JD 文本内容
 * @returns 包含各分类关键词和文字摘要的分析结果
 */
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
