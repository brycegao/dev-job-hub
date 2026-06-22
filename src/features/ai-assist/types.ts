export type InterviewPrepPack = {
  focusAreas: string[];
  likelyQuestions: string[];
  projectStories: string[];
  reviewChecklist: string[];
  prompt: string;
};

export type InterviewAnswerPack = {
  answerAngles: string[];
  starTemplate: string[];
  followUpQuestions: string[];
  prompt: string;
};

export type AIProviderType = "none" | "openai-compatible" | "ollama";

export type AIProviderConfig = {
  provider: AIProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type AICompletionInput = {
  prompt: string;
  config: AIProviderConfig;
};
