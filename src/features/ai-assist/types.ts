/**
 * AI 辅助领域类型定义。
 */

/** 面试准备包（零配置生成） */
export type InterviewPrepPack = {
  focusAreas: string[];
  likelyQuestions: string[];
  projectStories: string[];
  reviewChecklist: string[];
  prompt: string;
};

/** 面试参考答案包 */
export type InterviewAnswerPack = {
  answerAngles: string[];
  starTemplate: string[];
  followUpQuestions: string[];
  prompt: string;
};

/** 面试前简报 */
export type PreInterviewBrief = {
  /** 岗位画像摘要 */
  profileSummary: string;
  /** 匹配度概览 */
  matchOverview: string;
  /** 历史薄弱点与本轮 JD 重合项 */
  weakPointOverlaps: string[];
  /** 按优先级排序的复习清单 */
  priorityChecklist: string[];
  /** 给外部 AI 的综合 prompt */
  prompt: string;
};

/** AI Provider 类型 */
export type AIProviderType = "none" | "openai-compatible" | "ollama";

/** AI Provider 配置 */
export type AIProviderConfig = {
  provider: AIProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
};

/** AI 补全请求输入 */
export type AICompletionInput = {
  prompt: string;
  config: AIProviderConfig;
};
