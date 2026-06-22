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
