import { describe, it, expect } from "vitest";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import { buildPreInterviewBrief } from "./preInterviewBriefService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const application: JobApplication = {
  id: "app-1",
  companyName: "字节跳动",
  jobTitle: "Flutter 高级工程师",
  channel: "Boss直聘",
  city: "北京",
  salaryRange: "40k-60k",
  jdText:
    "岗位要求 Flutter, Dart 开发经验; Android, iOS 双端适配; 性能（优化）, 架构（设计）能力; CI/CD 自动化构建; 出海 业务优先",
  status: "interviewing",
  appliedAt: "2025-01-15T10:00:00.000Z",
  createdAt: "2025-01-15T10:00:00.000Z",
  updatedAt: "2025-01-15T10:00:00.000Z",
};

const resume: ResumeVersion = {
  id: "resume-1",
  name: "Flutter 精选版",
  targetRole: "Flutter 工程师",
  content: "5年Flutter开发经验，主导过多个出海App项目...",
  highlights: [
    "使用Flutter开发出海电商App，性能优化提升30%",
    "搭建CI/CD自动化构建流程",
  ],
  createdAt: "2025-01-10T08:00:00.000Z",
  updatedAt: "2025-01-10T08:00:00.000Z",
};

const interviewsWithWeakPoints: InterviewRecord[] = [
  {
    id: "int-1",
    jobApplicationId: "app-1",
    round: "first",
    result: "pending",
    scheduledAt: "2025-01-20T14:00:00.000Z",
    questions: [{ id: "q1", question: "讲一个Flutter性能优化的案例", tags: ["技术"] }],
    weakPoints: ["Flutter性能优化", "系统设计能力薄弱"],
    strengths: ["项目经验丰富"],
    actionItems: ["复习Flutter性能优化，准备优化案例"],
    selfReview: "回答偏泛泛，需要更多细节",
    summary: "一面整体表现一般",
    createdAt: "2025-01-20T14:00:00.000Z",
    updatedAt: "2025-01-20T16:00:00.000Z",
  },
  {
    id: "int-2",
    jobApplicationId: "app-1",
    round: "second",
    result: "failed",
    questions: [{ id: "q2", question: "如何做架构设计", tags: ["架构"] }],
    weakPoints: ["架构设计经验不够具体"],
    strengths: [],
    actionItems: ["准备架构设计案例"],
    selfReview: "架构问题没有给出具体方案",
    createdAt: "2025-01-25T14:00:00.000Z",
    updatedAt: "2025-01-25T16:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// buildPreInterviewBrief
// ---------------------------------------------------------------------------

describe("buildPreInterviewBrief", () => {
  it("returns weakPointOverlaps when interviews have weakPoints matching JD keywords", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
      interviews: interviewsWithWeakPoints,
    });

    expect(brief.weakPointOverlaps.length).toBeGreaterThan(0);

    // "Flutter性能优化" overlaps with JD keyword "Flutter" (via "Flutter" or "性能优化")
    const flutterOverlap = brief.weakPointOverlaps.find(
      (o) => o.includes("Flutter") && o.includes("⚠️")
    );
    expect(flutterOverlap).toBeDefined();
  });

  it("returns no overlaps when only JD is provided (no resume, no interviews)", () => {
    const brief = buildPreInterviewBrief({
      application,
    });

    expect(brief.weakPointOverlaps).toHaveLength(0);
  });

  it("returns basic matchOverview when only JD is provided", () => {
    const brief = buildPreInterviewBrief({
      application,
    });

    expect(brief.matchOverview).toContain("未关联简历");
  });

  it("returns matchOverview with match counts when resume is provided", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
    });

    // Should contain numbers for strengths/gaps
    expect(brief.matchOverview).toMatch(/\d+\s*个强匹配/);
  });

  it("prompt is a non-empty string containing the application data", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
      interviews: interviewsWithWeakPoints,
    });

    expect(brief.prompt.length).toBeGreaterThan(0);
    expect(brief.prompt).toContain(application.companyName);
    expect(brief.prompt).toContain(application.jobTitle);
    expect(brief.prompt).toContain("Flutter");
  });

  it("prompt includes historical weak points when interviews are provided", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
      interviews: interviewsWithWeakPoints,
    });

    expect(brief.prompt).toContain("历史面试薄弱点");
    expect(brief.prompt).toContain("Flutter性能优化");
  });

  it("prompt includes historical reviews when interviews have selfReview or summary", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
      interviews: interviewsWithWeakPoints,
    });

    expect(brief.prompt).toContain("历史面试复盘");
    expect(brief.prompt).toContain("一面整体表现一般");
  });

  it("profileSummary is non-empty and derived from JD analysis", () => {
    const brief = buildPreInterviewBrief({
      application,
    });

    expect(brief.profileSummary.length).toBeGreaterThan(0);
    expect(brief.profileSummary).toContain("Flutter");
  });

  it("priorityChecklist is capped at 8 items", () => {
    const brief = buildPreInterviewBrief({
      application,
      resume,
      interviews: interviewsWithWeakPoints,
    });

    expect(brief.priorityChecklist.length).toBeLessThanOrEqual(8);
  });
});
