import { describe, it, expect } from "vitest";
import { buildInsights } from "./insightsService";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";

const today = new Date().toISOString().slice(0, 10);

function makeApplication(
  overrides: Partial<JobApplication> = {},
): JobApplication {
  return {
    id: "app-1",
    companyName: "Test Corp",
    jobTitle: "Developer",
    channel: "BOSS直聘",
    jdText: "",
    status: "applied",
    appliedAt: today,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeInterview(
  overrides: Partial<InterviewRecord> = {},
): InterviewRecord {
  return {
    id: "int-1",
    jobApplicationId: "app-1",
    round: "first",
    result: "pending",
    questions: [],
    weakPoints: [],
    strengths: [],
    actionItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildInsights", () => {
  it("returns empty insights for very few applications", () => {
    const result = buildInsights([makeApplication()], []);
    expect(result.bottlenecks).toEqual([]);
    expect(result.weakPointPatterns).toEqual([]);
    expect(result.dashboardAlerts).toEqual([]);
  });

  describe("bottlenecks", () => {
    it("detects low reply rate", () => {
      const applications: JobApplication[] = [
        makeApplication({ id: "a1", status: "applied" }),
        makeApplication({ id: "a2", status: "applied" }),
        makeApplication({ id: "a3", status: "applied" }),
        makeApplication({ id: "a4", status: "applied" }),
        makeApplication({ id: "a5", status: "applied" }),
        makeApplication({ id: "a6", status: "interviewing" }),
      ];

      const result = buildInsights(applications, []);

      const bottleneck = result.bottlenecks.find((b) => b.type === "low_reply_rate");
      expect(bottleneck).toBeDefined();
      expect(bottleneck!.message).toContain("回复率");
      expect(bottleneck!.suggestions.length).toBeGreaterThan(0);
    });

    it("detects channel concentration", () => {
      const applications: JobApplication[] = Array.from({ length: 6 }, (_, i) =>
        makeApplication({ id: `a${i}`, channel: "BOSS直聘" }),
      );

      const result = buildInsights(applications, []);

      const bottleneck = result.bottlenecks.find((b) => b.type === "channel_concentration");
      expect(bottleneck).toBeDefined();
      expect(bottleneck!.message).toContain("BOSS直聘");
    });

    it("does not flag concentration when channels are diverse", () => {
      const applications: JobApplication[] = [
        makeApplication({ id: "a1", channel: "BOSS直聘" }),
        makeApplication({ id: "a2", channel: "脉脉" }),
        makeApplication({ id: "a3", channel: "猎聘" }),
        makeApplication({ id: "a4", channel: "内推" }),
        makeApplication({ id: "a5", channel: "拉勾" }),
      ];

      const result = buildInsights(applications, []);
      expect(result.bottlenecks.find((b) => b.type === "channel_concentration")).toBeUndefined();
    });
  });

  describe("weakPointPatterns", () => {
    it("detects recurring weak points across interviews", () => {
      const interviews: InterviewRecord[] = [
        makeInterview({
          id: "i1",
          jobApplicationId: "a1",
          weakPoints: ["Flutter 性能优化", "系统设计"],
        }),
        makeInterview({
          id: "i2",
          jobApplicationId: "a2",
          weakPoints: ["Flutter 性能优化", "算法"],
        }),
      ];
      const applications: JobApplication[] = [
        makeApplication({ id: "a1", companyName: "公司A" }),
        makeApplication({ id: "a2", companyName: "公司B" }),
      ];

      const result = buildInsights(applications, interviews);

      expect(result.weakPointPatterns.length).toBeGreaterThanOrEqual(1);
      const pattern = result.weakPointPatterns.find(
        (p) => p.weakPoint === "Flutter 性能优化",
      );
      expect(pattern).toBeDefined();
      expect(pattern!.frequency).toBe(2);
      expect(pattern!.suggestion).toContain("Flutter 性能优化");
    });

    it("returns empty for single interview", () => {
      const result = buildInsights(
        [makeApplication()],
        [makeInterview({ weakPoints: ["架构设计"] })],
      );
      expect(result.weakPointPatterns).toEqual([]);
    });

    it("does not include weak points appearing only once", () => {
      const interviews: InterviewRecord[] = [
        makeInterview({ id: "i1", weakPoints: ["架构设计"] }),
        makeInterview({ id: "i2", weakPoints: ["算法"] }),
      ];

      const result = buildInsights(
        [makeApplication({ id: "a1" }), makeApplication({ id: "a2" })],
        interviews,
      );
      expect(result.weakPointPatterns).toEqual([]);
    });
  });

  describe("dashboardAlerts", () => {
    it("detects stale applications (applied > 7 days)", () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const applications: JobApplication[] = [
        makeApplication({
          id: "a1",
          appliedAt: tenDaysAgo.toISOString().slice(0, 10),
        }),
      ];

      const result = buildInsights(applications, []);

      const stale = result.dashboardAlerts.find((a) => a.type === "stale_application");
      expect(stale).toBeDefined();
      expect(stale!.message).toContain("10 天");
      expect(stale!.priority).toBe("medium");
    });

    it("gives high priority to very stale applications (>14 days)", () => {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      const applications: JobApplication[] = [
        makeApplication({
          id: "a1",
          appliedAt: twentyDaysAgo.toISOString().slice(0, 10),
        }),
      ];

      const result = buildInsights(applications, []);

      const stale = result.dashboardAlerts.find((a) => a.type === "stale_application");
      expect(stale).toBeDefined();
      expect(stale!.priority).toBe("high");
    });

    it("detects upcoming interview prep with weak point overlap", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const interviews: InterviewRecord[] = [
        // Past interview with weak point
        makeInterview({
          id: "i1",
          jobApplicationId: "a1",
          weakPoints: ["Flutter 性能优化"],
        }),
        // Upcoming interview
        makeInterview({
          id: "i2",
          jobApplicationId: "a2",
          scheduledAt: tomorrow.toISOString(),
          inviteStatus: "confirmed",
        }),
      ];

      const applications: JobApplication[] = [
        makeApplication({ id: "a1" }),
        makeApplication({
          id: "a2",
          companyName: "新公司",
          jobTitle: "Flutter 工程师",
          jdText: "要求精通 Flutter 性能优化和内存管理",
        }),
      ];

      const result = buildInsights(applications, interviews);

      const prep = result.dashboardAlerts.find((a) => a.type === "upcoming_interview_prep");
      expect(prep).toBeDefined();
      expect(prep!.message).toContain("Flutter 性能优化");
      expect(prep!.priority).toBe("high");
    });

    it("does not alert for interviews with no weak point overlap", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const interviews: InterviewRecord[] = [
        makeInterview({
          id: "i1",
          jobApplicationId: "a1",
          weakPoints: ["算法"],
        }),
        makeInterview({
          id: "i2",
          jobApplicationId: "a2",
          scheduledAt: tomorrow.toISOString(),
          inviteStatus: "confirmed",
        }),
      ];

      const applications: JobApplication[] = [
        makeApplication({ id: "a1" }),
        makeApplication({
          id: "a2",
          jdText: "要求 Flutter 开发经验",
        }),
      ];

      const result = buildInsights(applications, interviews);
      expect(result.dashboardAlerts.find((a) => a.type === "upcoming_interview_prep")).toBeUndefined();
    });

    it("does not alert for recently applied applications", () => {
      const applications: JobApplication[] = [
        makeApplication({ id: "a1", appliedAt: today }),
      ];

      const result = buildInsights(applications, []);
      expect(result.dashboardAlerts.find((a) => a.type === "stale_application")).toBeUndefined();
    });
  });
});
