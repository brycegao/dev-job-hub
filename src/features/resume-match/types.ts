/**
 * 简历匹配领域类型定义。
 */

/** 简历与 JD 的匹配结果 */
export type ResumeMatchResult = {
  /** JD 中与简历匹配的关键词 */
  matchedPoints: string[];
  /** JD 中简历未覆盖的关键词 */
  missingPoints: string[];
  /** 建议补充的项目亮点 */
  suggestedProjects: string[];
  /** 建议在简历中补充的关键词 */
  suggestedKeywords: string[];
  /** 自动拼接的打招呼话术 */
  greetingMessage: string;
  /** 面试准备建议 */
  interviewPrep: string[];
};
