/**
 * JD 分析领域类型定义。
 */

/** 关键词分类 */
export type KeywordCategory =
  | "tech"
  | "domain"
  | "capability"
  | "bonus"
  | "risk";

/** 关键词匹配规则 */
export type KeywordRule = {
  label: string;
  aliases: string[];
  category: KeywordCategory;
  weight?: number;
};

/** JD 分析结果 */
export type JDAnalysisResult = {
  techKeywords: string[];
  domainKeywords: string[];
  capabilityKeywords: string[];
  bonusKeywords: string[];
  risks: string[];
  summary: string;
};
