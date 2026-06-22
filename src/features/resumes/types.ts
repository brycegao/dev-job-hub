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

export type ResumeVersionInput = Omit<
  ResumeVersion,
  "id" | "createdAt" | "updatedAt"
>;

