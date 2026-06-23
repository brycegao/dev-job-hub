import { describe, expect, it } from "vitest";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";
import type { ResumeVersion } from "../../resumes/types";
import { buildTodayActions } from "./todayActionService";

const now = new Date("2026-06-23T09:00:00");

function app(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    companyName: "星海科技",
    jobTitle: "Flutter 工程师",
    channel: "BOSS直聘",
    jdText: "负责 Flutter 开发",
    status: "applied",
    appliedAt: "2026-06-20",
    resumeVersionId: "resume-1",
    createdAt: "2026-06-20T10:00:00",
    updatedAt: "2026-06-20T10:00:00",
    ...overrides,
  };
}

function interview(overrides: Partial<InterviewRecord> = {}): InterviewRecord {
  return {
    id: "interview-1",
    jobApplicationId: "app-1",
    round: "first",
    inviteStatus: "confirmed",
    scheduledAt: "2026-06-24T10:00",
    questions: [],
    weakPoints: [],
    strengths: [],
    actionItems: [],
    result: "pending",
    createdAt: "2026-06-22T10:00:00",
    updatedAt: "2026-06-22T10:00:00",
    ...overrides,
  };
}

const resumes: ResumeVersion[] = [
  {
    id: "resume-1",
    name: "Flutter 简历",
    targetRole: "Flutter",
    content: "Flutter 工程化经验",
    highlights: [],
    createdAt: "2026-06-20T10:00:00",
    updatedAt: "2026-06-20T10:00:00",
  },
];

describe("buildTodayActions", () => {
  it("creates high priority action for overdue follow-up", () => {
    const result = buildTodayActions(
      [app({ nextFollowUpAt: "2026-06-21" })],
      [],
      resumes,
      now,
    );

    expect(result.actions[0]).toMatchObject({
      category: "follow_up",
      priority: "high",
      dueLabel: "已超期 2 天",
      applicationId: "app-1",
    });
    expect(result.summary.high).toBe(1);
  });

  it("creates interview prep action for interviews within 72 hours", () => {
    const result = buildTodayActions(
      [app()],
      [interview({ scheduledAt: "2026-06-23T18:00", location: "腾讯会议" })],
      resumes,
      now,
    );

    expect(result.actions[0]).toMatchObject({
      category: "interview",
      priority: "high",
      dueLabel: "9 小时内",
    });
    expect(result.actions[0].description).toContain("腾讯会议");
  });

  it("creates review action for recent interview without review content", () => {
    const result = buildTodayActions(
      [app()],
      [interview({ scheduledAt: "2026-06-22T18:00", inviteStatus: "completed" })],
      resumes,
      now,
    );

    expect(result.actions[0]).toMatchObject({
      category: "review",
      priority: "high",
      title: "复盘 星海科技 一面",
    });
  });

  it("does not create review action when interview already has review content", () => {
    const result = buildTodayActions(
      [app()],
      [interview({ scheduledAt: "2026-06-22T18:00", selfReview: "回答还不错" })],
      resumes,
      now,
    );

    expect(result.actions.some((action) => action.category === "review")).toBe(false);
  });

  it("creates data hygiene action when resume is missing", () => {
    const result = buildTodayActions(
      [app({ resumeVersionId: undefined })],
      [],
      resumes,
      now,
    );

    expect(result.actions[0]).toMatchObject({
      category: "data_hygiene",
      priority: "medium",
      title: "关联 星海科技 的投递简历",
    });
  });

  it("creates stale action for applied jobs without feedback after 7 days", () => {
    const result = buildTodayActions(
      [app({ appliedAt: "2026-06-10", nextFollowUpAt: undefined })],
      [],
      resumes,
      now,
    );

    expect(result.actions[0]).toMatchObject({
      category: "stale",
      priority: "medium",
      dueLabel: "7 天以上",
    });
  });
});
