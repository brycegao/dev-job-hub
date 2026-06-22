import { describe, it, expect } from "vitest";
import { matchResumeToJD } from "./resumeMatchService";
import type { JobApplication } from "../../applications/types";
import type { ResumeVersion } from "../../resumes/types";

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    companyName: "Test Corp",
    jobTitle: "Flutter Developer",
    channel: "Boss直聘",
    jdText: "",
    status: "applied",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeResume(overrides: Partial<ResumeVersion> = {}): ResumeVersion {
  return {
    id: "resume-1",
    name: "My Resume",
    targetRole: "Flutter Developer",
    content: "",
    highlights: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("matchResumeToJD", () => {
  it("produces strength actions with resumeHighlight when JD keyword matches a resume highlight", () => {
    const application = makeApplication({
      jdText: "岗位要求熟练使用 Flutter 和 Android 进行开发。",
    });
    const resume = makeResume({
      highlights: ["3年Flutter跨端开发经验"],
      content: "熟练使用Flutter和Dart进行跨端开发",
    });

    const result = matchResumeToJD(application, resume);

    const strengthActions = result.actions.filter((a) => a.type === "strength");
    const flutterAction = strengthActions.find((a) => a.keyword === "Flutter");
    expect(flutterAction).toBeDefined();
    expect(flutterAction!.resumeHighlight).toBe("3年Flutter跨端开发经验");
    expect(flutterAction!.advice).toContain("Flutter");
  });

  it("produces strength action without resumeHighlight when keyword is found in content but not highlights", () => {
    const application = makeApplication({
      jdText: "岗位要求熟练使用 Kotlin 进行 Android 开发。",
    });
    const resume = makeResume({
      highlights: ["Java后端开发"],
      content: "使用Kotlin进行过Android项目开发",
    });

    const result = matchResumeToJD(application, resume);

    const strengthActions = result.actions.filter((a) => a.type === "strength");
    const kotlinAction = strengthActions.find((a) => a.keyword === "Kotlin");
    expect(kotlinAction).toBeDefined();
    expect(kotlinAction!.resumeHighlight).toBeUndefined();
    expect(kotlinAction!.advice).toContain("Kotlin");
  });

  it("produces gap action when JD requires a capability the resume lacks", () => {
    const application = makeApplication({
      jdText: "要求具备：架构设计（模块化）能力；性能（卡顿）优化经验",
    });
    const resume = makeResume({
      highlights: ["React开发"],
      content: "前端开发工程师",
    });

    const result = matchResumeToJD(application, resume);

    const gapActions = result.actions.filter((a) => a.type === "gap");
    const gapKeywords = gapActions.map((a) => a.keyword);
    expect(gapKeywords).toContain("架构设计");
    expect(gapKeywords).toContain("性能优化");
  });

  it("bonus keyword matched in resume appears as strength, not duplicated as differentiator", () => {
    const application = makeApplication({
      jdText:
        "有 Google Play 上架经验、国际化 i18n 经验者优先。",
    });
    const resume = makeResume({
      highlights: ["主导过应用的国际化多语言适配"],
      content: "有 Google Play 应用上架经验",
    });

    const result = matchResumeToJD(application, resume);

    // bonus keywords that match resume are included in allJDKeywords → appear as strength
    const strengthActions = result.actions.filter((a) => a.type === "strength");
    const strengthKeywords = strengthActions.map((a) => a.keyword);
    expect(strengthKeywords).toContain("Google Play");
    expect(strengthKeywords).toContain("国际化");

    // differentiator does NOT duplicate already-matched bonus keywords
    const diffActions = result.actions.filter((a) => a.type === "differentiator");
    expect(diffActions).toEqual([]);
  });

  it("greetingMessage contains matched keywords when there are matches", () => {
    const application = makeApplication({
      jdText: "岗位要求 Flutter 和 Android 开发经验。",
    });
    const resume = makeResume({
      highlights: ["Flutter开发"],
      content: "Flutter和Android开发经验",
    });

    const result = matchResumeToJD(application, resume);

    expect(result.greetingMessage).toContain("Flutter");
    expect(result.greetingMessage).toContain("比较匹配");
    expect(result.greetingMessage).toContain("Flutter Developer");
  });

  it("greetingMessage uses fallback when no keywords match", () => {
    const application = makeApplication({
      jdText: "岗位要求 Rust 和 Go 语言开发经验。",
      jobTitle: "Rust Engineer",
    });
    const resume = makeResume({
      targetRole: "前端工程师",
      highlights: ["JavaScript开发"],
      content: "纯前端开发，不涉及后端",
    });

    const result = matchResumeToJD(application, resume);

    expect(result.greetingMessage).toContain("前端工程师");
    expect(result.greetingMessage).toContain("Rust Engineer");
  });

  it("total actions reflect matched strengths and gaps (differentiators only for unmatched bonus)", () => {
    const application = makeApplication({
      jdText:
        "要求：Flutter、架构（模块化），有 Google Play 上架经验优先",
    });
    const resume = makeResume({
      highlights: ["Flutter开发", "上架过Google Play应用"],
      content: "使用Flutter进行跨端开发",
    });

    const result = matchResumeToJD(application, resume);

    const strengths = result.actions.filter((a) => a.type === "strength");
    const gaps = result.actions.filter((a) => a.type === "gap");

    // Flutter matched (strength), 架构设计 missing (gap), Google Play matched as strength
    expect(strengths.length).toBeGreaterThanOrEqual(1);
    expect(gaps.length).toBeGreaterThanOrEqual(1);
    // Google Play was already matched as strength, so no differentiator
    const differentiators = result.actions.filter((a) => a.type === "differentiator");
    expect(differentiators.length).toBe(0);
  });
});
