export type KeywordCategory =
  | "tech"
  | "domain"
  | "capability"
  | "bonus"
  | "risk";

export type KeywordRule = {
  label: string;
  aliases: string[];
  category: KeywordCategory;
  weight?: number;
};

export type JDAnalysisResult = {
  techKeywords: string[];
  domainKeywords: string[];
  capabilityKeywords: string[];
  bonusKeywords: string[];
  risks: string[];
  summary: string;
};

