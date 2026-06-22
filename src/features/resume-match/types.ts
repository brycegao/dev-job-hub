/**
 * 简历匹配领域类型定义。
 */

/** 匹配行动项类型 */
export type MatchActionType = "strength" | "gap" | "differentiator";

/** 单条匹配行动项 */
export type MatchAction = {
  /** 行动类型：strength=可直接讲 gap=缺口需补 differentiator=差异化卖点 */
  type: MatchActionType;
  /** 对应的 JD 关键词 */
  keyword: string;
  /** 对应的简历亮点（strength/differentiator 时有值） */
  resumeHighlight?: string;
  /** 具体可执行的建议 */
  advice: string;
};

/** 简历与 JD 的匹配结果 */
export type ResumeMatchResult = {
  /** 结构化行动项列表 */
  actions: MatchAction[];
  /** 自动拼接的打招呼话术 */
  greetingMessage: string;
};
