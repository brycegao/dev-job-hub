import { describe, it, expect } from "vitest";
import { buildApplicationMetrics } from "./applicationAnalytics";
import type { JobApplication, JobStatus } from "../../applications/types";
import type { InterviewRecord } from "../../interviews/types";

const today = new Date().toISOString().slice(0, 10);

function makeApplication(
  overrides: Partial<JobApplication> = {},
): JobApplication {
  return {
    id: "app-1",
    companyName: "Test Corp",
    jobTitle: "Developer",
    channel: "Boss直聘",
    jdText: "JD text",
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

describe("buildApplicationMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const metrics = buildApplicationMetrics([], []);

    expect(metrics.total).toBe(0);
    expect(metrics.thisWeek).toBe(0);
    expect(metrics.replies).toBe(0);
    expect(metrics.interviews).toBe(0);
    expect(metrics.offers).toBe(0);
    expect(metrics.replyRate).toBe(0);
    expect(metrics.interviewRate).toBe(0);
    expect(metrics.statusCounts).toEqual({} as Record<JobStatus, number>);
    expect(metrics.channelCounts).toEqual({} as Record<string, number>);
    expect(metrics.followUps).toEqual([]);
    expect(metrics.upcomingInterviews).toEqual([]);
  });

  it("counts statuses correctly in statusCounts", () => {
    const applications: JobApplication[] = [
      makeApplication({ id: "a1", status: "applied" }),
      makeApplication({ id: "a2", status: "applied" }),
      makeApplication({ id: "a3", status: "interviewing" }),
      makeApplication({ id: "a4", status: "offer" }),
      makeApplication({ id: "a5", status: "rejected" }),
      makeApplication({ id: "a6", status: "no_response" }),
    ];

    const metrics = buildApplicationMetrics(applications);

    expect(metrics.statusCounts["applied"]).toBe(2);
    expect(metrics.statusCounts["interviewing"]).toBe(1);
    expect(metrics.statusCounts["offer"]).toBe(1);
    expect(metrics.statusCounts["rejected"]).toBe(1);
    expect(metrics.statusCounts["no_response"]).toBe(1);
  });

  it("counts channels correctly in channelCounts", () => {
    const applications: JobApplication[] = [
      makeApplication({ id: "a1", channel: "Boss直聘" }),
      makeApplication({ id: "a2", channel: "Boss直聘" }),
      makeApplication({ id: "a3", channel: "脉脉" }),
    ];

    const metrics = buildApplicationMetrics(applications);

    expect(metrics.channelCounts["Boss直聘"]).toBe(2);
    expect(metrics.channelCounts["脉脉"]).toBe(1);
  });

  it("calculates replyRate as replies / total", () => {
    const applications: JobApplication[] = [
      makeApplication({ id: "a1", status: "interviewing" }),
      makeApplication({ id: "a2", status: "applied" }),
      makeApplication({ id: "a3", status: "applied" }),
      makeApplication({ id: "a4", status: "applied" }),
    ];

    const metrics = buildApplicationMetrics(applications);

    // interviewing = reply, so replies = 1, total = 4
    expect(metrics.replies).toBe(1);
    expect(metrics.replyRate).toBeCloseTo(1 / 4);
  });

  it("calculates interviewRate as interviews / replies (0 when no replies)", () => {
    // Case 1: no replies -> interviewRate is 0
    const noReplies = [makeApplication({ id: "a1", status: "applied" })];
    const m1 = buildApplicationMetrics(noReplies);
    expect(m1.replies).toBe(0);
    expect(m1.interviewRate).toBe(0);

    // Case 2: has replies but no interview records -> interviewRate = 0
    const withReplies: JobApplication[] = [
      makeApplication({ id: "a1", status: "interviewing" }),
      makeApplication({ id: "a2", status: "interviewing" }),
      makeApplication({ id: "a3", status: "applied" }),
    ];
    const m2 = buildApplicationMetrics(withReplies);
    // interviewing status counts as reply (rejected no longer counts)
    expect(m2.replies).toBe(2);
    // no interview records -> interview count is 0
    expect(m2.interviewRate).toBe(0);
  });

  it("counts thisWeek only for applications with appliedAt in the current week", () => {
    const now = new Date();
    const applications: JobApplication[] = [
      makeApplication({ id: "a1", appliedAt: now.toISOString().slice(0, 10) }),
      makeApplication({ id: "a2", appliedAt: now.toISOString().slice(0, 10) }),
    ];

    const metrics = buildApplicationMetrics(applications);
    expect(metrics.thisWeek).toBe(2);
  });

  it("returns followUps sorted by nextFollowUpAt, capped at 5", () => {
    const applications: JobApplication[] = [
      makeApplication({ id: "a1", nextFollowUpAt: "2026-07-05" }),
      makeApplication({ id: "a2", nextFollowUpAt: "2026-06-25" }),
      makeApplication({ id: "a3", nextFollowUpAt: "2026-07-01" }),
      makeApplication({ id: "a4", nextFollowUpAt: "2026-06-20" }),
      makeApplication({ id: "a5", nextFollowUpAt: "2026-07-10" }),
      makeApplication({ id: "a6", nextFollowUpAt: "2026-07-15" }),
    ];

    const metrics = buildApplicationMetrics(applications);

    expect(metrics.followUps).toHaveLength(5);
    // Sorted ascending by nextFollowUpAt
    expect(metrics.followUps[0].id).toBe("a4");
    expect(metrics.followUps[1].id).toBe("a2");
    expect(metrics.followUps[2].id).toBe("a3");
    expect(metrics.followUps[3].id).toBe("a1");
    expect(metrics.followUps[4].id).toBe("a5");
  });

  it("returns upcomingInterviews within 7-day window, sorted, capped at 10, excluding cancelled", () => {
    const now = new Date();
    const inTwoDays = new Date(now);
    inTwoDays.setDate(inTwoDays.getDate() + 2);

    const inFiveDays = new Date(now);
    inFiveDays.setDate(inFiveDays.getDate() + 5);

    const inTenDays = new Date(now);
    inTenDays.setDate(inTenDays.getDate() + 10);

    const applications: JobApplication[] = [
      makeApplication({ id: "app-1", companyName: "Company A", jobTitle: "Engineer" }),
      makeApplication({ id: "app-2", companyName: "Company B", jobTitle: "Senior Dev" }),
    ];

    const interviews: InterviewRecord[] = [
      makeInterview({
        id: "int-1",
        jobApplicationId: "app-1",
        scheduledAt: inTwoDays.toISOString(),
        inviteStatus: "confirmed",
      }),
      makeInterview({
        id: "int-2",
        jobApplicationId: "app-2",
        scheduledAt: inFiveDays.toISOString(),
        inviteStatus: "invited",
      }),
      // Cancelled interview should be excluded
      makeInterview({
        id: "int-3",
        jobApplicationId: "app-1",
        scheduledAt: inTwoDays.toISOString(),
        inviteStatus: "cancelled",
      }),
      // Outside 7-day window should be excluded
      makeInterview({
        id: "int-4",
        jobApplicationId: "app-1",
        scheduledAt: inTenDays.toISOString(),
        inviteStatus: "confirmed",
      }),
    ];

    const metrics = buildApplicationMetrics(applications, interviews);

    expect(metrics.upcomingInterviews).toHaveLength(2);
    // Sorted by scheduledAt ascending
    expect(metrics.upcomingInterviews[0].interview.id).toBe("int-1");
    expect(metrics.upcomingInterviews[1].interview.id).toBe("int-2");
    expect(metrics.upcomingInterviews[0].companyName).toBe("Company A");
    expect(metrics.upcomingInterviews[0].jobTitle).toBe("Engineer");
    expect(metrics.upcomingInterviews[0].applicationId).toBe("app-1");
  });

  it("counts applications with non-cancelled interviews via interviewRecords", () => {
    const applications: JobApplication[] = [
      makeApplication({ id: "app-1", status: "applied" }),
    ];

    const interviews: InterviewRecord[] = [
      makeInterview({
        id: "int-1",
        jobApplicationId: "app-1",
        inviteStatus: "confirmed",
      }),
    ];

    const metrics = buildApplicationMetrics(applications, interviews);

    // The application should be counted as having an interview
    expect(metrics.interviews).toBe(1);
  });
});
