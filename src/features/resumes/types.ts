/**
 * 简历版本领域类型定义。
 */

/** 简历版本 */
export type ResumeVersion = {
  id: string;
  name: string;
  targetRole: string;
  content: string;
  filePath?: string;
  highlights: string[];
  createdAt: string;
  updatedAt: string;
};

/** 创建/更新简历时的输入类型（不含自动生成字段） */
export type ResumeVersionInput = Omit<
  ResumeVersion,
  "id" | "createdAt" | "updatedAt"
>;
