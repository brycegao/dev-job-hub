import { describe, it, expect } from "vitest";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import {
  buildInterviewPrepPack,
  buildInterviewAnswerPack,
} from "./promptPackService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseApplication: JobApplication = {
  id: "app-1",
  companyName: "字节跳动",
  jobTitle: "Flutter 高级工程师",
  channel: "Boss直聘",
  city: "北京",
  salaryRange: "40k-60k",
  jdText:
    "岗位要求：Flutter、Dart 开发经验；Android、iOS 双端适配；性能（优化）、架构（设计）能力；CI/CD 自动化构建；出海 业务优先",
  status: "interviewing",
  appliedAt: "2025-01-15T10:00:00.000Z",
  createdAt: "2025-01-15T10:00:00.000Z",
  updatedAt: "2025-01-15T10:00:00.000Z",
};

const matchingResume: ResumeVersion = {
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
    createdAt: "2025-01-20T14:00:00.000Z",
    updatedAt: "2025-01-20T16:00:00.000Z",
  },
];

const interviewWithActionItems: InterviewRecord = {
  id: "int-2",
  jobApplicationId: "app-1",
  round: "second",
  result: "pending",
  scheduledAt: "2025-01-25T14:00:00.000Z",
  questions: [
    { id: "q1", question: "Flutter性能优化你做了哪些工作", tags: ["技术"] },
    { id: "q2", question: "如何做架构设计", tags: ["架构"] },
  ],
  weakPoints: ["Flutter性能优化", "表达不够结构化"],
  strengths: [],
  actionItems: [
    "复习Flutter性能优化，准备具体案例",
    "用STAR结构重新组织回答",
  ],
  selfReview: "第二个问题回答比较乱",
  createdAt: "2025-01-25T14:00:00.000Z",
  updatedAt: "2025-01-25T16:00:00.000Z",
};

// ---------------------------------------------------------------------------
// buildInterviewPrepPack
// ---------------------------------------------------------------------------

describe("buildInterviewPrepPack", () => {
  it("generates focusAreas with match pattern when resume highlights match JD keywords", () => {
    const pack = buildInterviewPrepPack(baseApplication, matchingResume);

    // "Flutter" is a JD keyword and appears in a highlight
    const matchedFocus = pack.focusAreas.find(
      (f) => f.includes("你有「") && f.includes("」经验") && f.includes("匹配")
    );
    expect(matchedFocus).toBeDefined();
    expect(matchedFocus).toContain("Flutter");
  });

  it("uses fallback suggestion when resume is not provided", () => {
    const pack = buildInterviewPrepPack(baseApplication);

    // Without resume, every focusArea should suggest preparing a case
    const fallbackItems = pack.focusAreas.filter(
      (f) => f.includes("建议准备 1 个相关案例") || f.includes("你的简历未涉及")
    );
    expect(fallbackItems.length).toBeGreaterThan(0);
  });

  it("has no weak-point cross-reference items in reviewChecklist when no interviews provided", () => {
    const pack = buildInterviewPrepPack(baseApplication);

    // No interviews → no ⚠️ items
    const warningItems = pack.reviewChecklist.filter((c) => c.includes("⚠️"));
    expect(warningItems).toHaveLength(0);
  });

  it("includes ⚠️ items in reviewChecklist when interviews have weakPoints matching JD keywords", () => {
    const pack = buildInterviewPrepPack(
      baseApplication,
      matchingResume,
      interviewsWithWeakPoints
    );

    const warningItems = pack.reviewChecklist.filter((c) => c.includes("⚠️"));
    expect(warningItems.length).toBeGreaterThan(0);

    // The overlapping weak point "Flutter性能优化" should appear in a ⚠️ item
    const flutterWarning = warningItems.find(
      (w) => w.includes("Flutter") && w.includes("薄弱点")
    );
    expect(flutterWarning).toBeDefined();
  });

  it("prompt contains company name, job title, JD text, and resume highlights", () => {
    const pack = buildInterviewPrepPack(baseApplication, matchingResume);

    expect(pack.prompt).toContain(baseApplication.companyName);
    expect(pack.prompt).toContain(baseApplication.jobTitle);
    expect(pack.prompt).toContain("Flutter");
    expect(pack.prompt).toContain(matchingResume.name);
    expect(pack.prompt).toContain("使用Flutter开发出海电商App，性能优化提升30%");
  });

  it("caps likelyQuestions at 10", () => {
    const pack = buildInterviewPrepPack(baseApplication, matchingResume);
    expect(pack.likelyQuestions.length).toBeLessThanOrEqual(10);
  });

  it("caps reviewChecklist at 10", () => {
    const pack = buildInterviewPrepPack(
      baseApplication,
      matchingResume,
      interviewsWithWeakPoints
    );
    expect(pack.reviewChecklist.length).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// buildInterviewAnswerPack
// ---------------------------------------------------------------------------

describe("buildInterviewAnswerPack", () => {
  it("references actionItems in answerAngles when weakPoints match actionItems", () => {
    const pack = buildInterviewAnswerPack({
      interview: interviewWithActionItems,
      application: baseApplication,
      resume: matchingResume,
    });

    // "Flutter性能优化" should match "复习Flutter性能优化，准备具体案例"
    const actionAngle = pack.answerAngles.find(
      (a) => a.includes("行动项") && a.includes("复习Flutter性能优化")
    );
    expect(actionAngle).toBeDefined();
  });

  it("uses default weakPoints when interview has none", () => {
    const interviewNoWeakPoints: InterviewRecord = {
      ...interviewWithActionItems,
      weakPoints: [],
      actionItems: [],
    };

    const pack = buildInterviewAnswerPack({
      interview: interviewNoWeakPoints,
    });

    // Default weakPoints should appear in the prompt
    expect(pack.prompt).toContain("补充技术细节");
    expect(pack.prompt).toContain("补充项目结果指标");
    expect(pack.prompt).toContain("表达更结构化");
  });

  it("prompt contains interview questions, weakPoints, and selfReview", () => {
    const pack = buildInterviewAnswerPack({
      interview: interviewWithActionItems,
      application: baseApplication,
    });

    expect(pack.prompt).toContain("Flutter性能优化你做了哪些工作");
    expect(pack.prompt).toContain("Flutter性能优化");
    expect(pack.prompt).toContain("第二个问题回答比较乱");
  });
});
