import { describe, expect, it } from "vitest";
import { buildAIContextExport } from "./aiContextExportService";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";

const now = new Date().toISOString();

function makeApp(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    companyName: "测试公司",
    jobTitle: "前端工程师",
    channel: "BOSS直聘",
    city: "北京",
    remoteType: "onsite",
    salaryRange: "20-30K",
    jdText: "要求 React、TypeScript、Ant Design、微前端架构经验",
    status: "interviewing",
    appliedAt: "2026-01-01",
    resumeVersionId: "resume-1",
    notes: "关注微前端架构经验",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeResume(overrides: Partial<ResumeVersion> = {}): ResumeVersion {
  return {
    id: "resume-1",
    name: "前端方向版",
    targetRole: "前端 / React",
    content: "5 年前端开发经验，擅长 React、TypeScript、微前端架构。",
    filePath: "",
    highlights: ["React 性能优化", "微前端架构落地"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeInterview(overrides: Partial<InterviewRecord> = {}): InterviewRecord {
  return {
    id: "interview-1",
    jobApplicationId: "app-1",
    round: "first",
    inviteStatus: "confirmed",
    scheduledAt: now,
    interviewerType: "技术负责人",
    questions: [
      { id: "q1", question: "React 性能优化怎么做的？", answerNotes: "", tags: ["React", "性能"] },
    ],
    selfReview: "React 部分讲得不错",
    weakPoints: ["React 性能优化细节", "TypeScript 类型体操"],
    strengths: ["微前端方案讲解清晰"],
    actionItems: ["整理 3 个性能优化案例"],
    result: "pending",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("buildAIContextExport", () => {
  it("returns markdown with empty sections when no data", () => {
    const result = buildAIContextExport({ applications: [], resumes: [], interviews: [] });
    expect(result).toContain("# 求职者上下文");
    expect(result).toContain("暂无简历版本");
    expect(result).toContain("暂无岗位记录");
    expect(result).toContain("暂无面试记录");
    expect(result).toContain("暂无跨面试高频薄弱点");
    expect(result).toContain("总投递：0");
  });

  it("includes resume details", () => {
    const result = buildAIContextExport({
      applications: [],
      resumes: [makeResume()],
      interviews: [],
    });
    expect(result).toContain("### 简历 1：前端方向版（目标方向：前端 / React）");
    expect(result).toContain("核心卖点：React 性能优化、微前端架构落地");
    expect(result).toContain("简历内容摘要：");
  });

  it("includes application details with JD analysis", () => {
    const result = buildAIContextExport({
      applications: [makeApp()],
      resumes: [makeResume()],
      interviews: [],
    });
    expect(result).toContain("### 岗位 1：测试公司 · 前端工程师");
    expect(result).toContain("渠道：BOSS直聘");
    expect(result).toContain("状态：面试中");
    expect(result).toContain("JD 关键词");
    expect(result).toContain("关联简历：前端方向版");
    expect(result).toContain("React");
  });

  it("includes interview review details", () => {
    const result = buildAIContextExport({
      applications: [makeApp()],
      resumes: [makeResume()],
      interviews: [makeInterview()],
    });
    expect(result).toContain("### 测试公司 · 前端工程师 — 一面");
    expect(result).toContain("面试官类型：技术负责人");
    expect(result).toContain("薄弱点：React 性能优化细节、TypeScript 类型体操");
    expect(result).toContain("亮点：微前端方案讲解清晰");
    expect(result).toContain("行动项：整理 3 个性能优化案例");
    expect(result).toContain("待回答问题");
    expect(result).toContain("React 性能优化怎么做的？");
  });

  it("aggregates cross-interview weak points (frequency >= 2)", () => {
    const result = buildAIContextExport({
      applications: [makeApp(), makeApp({ id: "app-2", companyName: "另一公司" })],
      resumes: [makeResume()],
      interviews: [
        makeInterview({ id: "iv-1", jobApplicationId: "app-1", weakPoints: ["React 性能优化"] }),
        makeInterview({ id: "iv-2", jobApplicationId: "app-2", weakPoints: ["React 性能优化", "TypeScript"] }),
      ],
    });
    expect(result).toContain("**React 性能优化**（出现 2 次");
    // TypeScript only appears once, should NOT be in weak points
    expect(result).not.toContain("**TypeScript**（出现");
  });

  it("includes statistics summary", () => {
    const result = buildAIContextExport({
      applications: [
        makeApp({ status: "applied" }),
        makeApp({ id: "app-2", status: "rejected" }),
        makeApp({ id: "app-3", status: "offer" }),
      ],
      resumes: [],
      interviews: [],
    });
    expect(result).toContain("总投递：3");
    expect(result).toContain("回复：2");
    expect(result).toContain("Offer：1");
    expect(result).toContain("渠道分布：BOSS直聘 3");
  });

  it("ends with prompt template", () => {
    const result = buildAIContextExport({ applications: [], resumes: [], interviews: [] });
    expect(result).toContain("---");
    expect(result).toContain("请基于以上我的求职数据，回答以下问题");
  });
});
