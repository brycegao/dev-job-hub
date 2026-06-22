import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  checkAndNotify,
} from "./notificationService";
import type { JobApplication } from "../../features/applications/types";
import type { InterviewRecord } from "../../features/interviews/types";

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  // 使用本地时间，与 daysFromToday 中的 new Date() 解析一致
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Simulated Notification instances created during a test */
let sentNotifications: Array<{ title: string; body: string; tag: string }>;

/** Override Notification before each test so checkAndNotify can use it */
function installNotificationMock() {
  sentNotifications = [];

  const MockNotification = vi.fn(function (
    this: Notification,
    title: string,
    options?: NotificationOptions,
  ) {
    this.title = title;
    this.body = options?.body ?? "";
    this.tag = options?.tag ?? "";
    sentNotifications.push({ title, body: this.body, tag: this.tag });
  }) as unknown as { new (title: string, options?: NotificationOptions): Notification };

  Object.defineProperty(MockNotification, "permission", {
    value: "granted",
    writable: true,
    configurable: true,
  });
  MockNotification.requestPermission = vi.fn().mockResolvedValue("granted");

  vi.stubGlobal("Notification", MockNotification);
}

function uninstallNotificationMock() {
  vi.unstubAllGlobals();
}

const mockApplication: JobApplication = {
  id: "app-1",
  companyName: "TestCorp",
  jobTitle: "Frontend Dev",
  channel: "BOSS直聘",
  jdText: "React development",
  status: "applied",
  appliedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const applicationMap = new Map<string, JobApplication>([
  ["app-1", mockApplication],
]);

function makeInterview(
  id: string,
  scheduledAt: string,
  inviteStatus?: string,
): InterviewRecord {
  return {
    id,
    jobApplicationId: "app-1",
    scheduledAt,
    inviteStatus: inviteStatus as InterviewRecord["inviteStatus"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    questions: [],
    selfReview: "",
    weakPoints: [],
    strengths: [],
    actionItems: [],
    result: "pending",
  };
}

describe("isNotificationSupported", () => {
  beforeEach(() => installNotificationMock());
  afterEach(() => uninstallNotificationMock());

  it("returns true when Notification is available", () => {
    expect(isNotificationSupported()).toBe(true);
  });
});

describe("requestNotificationPermission", () => {
  beforeEach(() => installNotificationMock());
  afterEach(() => uninstallNotificationMock());

  it("returns true when permission is granted", async () => {
    vi.spyOn(Notification, "requestPermission").mockResolvedValue("granted");
    const result = await requestNotificationPermission();
    expect(result).toBe(true);
  });

  it("returns false when permission is denied", async () => {
    vi.spyOn(Notification, "requestPermission").mockResolvedValue("denied");
    const result = await requestNotificationPermission();
    expect(result).toBe(false);
  });
});

describe("getNotificationPermission", () => {
  beforeEach(() => installNotificationMock());
  afterEach(() => uninstallNotificationMock());

  it("returns the current Notification.permission value", () => {
    Object.defineProperty(Notification, "permission", { value: "default", writable: true, configurable: true });
    expect(getNotificationPermission()).toBe("default");
  });
});

describe("checkAndNotify", () => {
  beforeEach(() => installNotificationMock());
  afterEach(() => uninstallNotificationMock());

  it('sends "今天有面试！" for an interview scheduled today', () => {
    const interviews = [makeInterview("int-today", futureDate(0))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(1);
    expect(sentNotifications[0].title).toBe("今天有面试！");
  });

  it('sends "明天有面试" for an interview scheduled 1 day from now', () => {
    const interviews = [makeInterview("int-tomorrow", futureDate(1))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(1);
    expect(sentNotifications[0].title).toContain("明天");
  });

  it("sends notification for an interview scheduled 2 days from now", () => {
    const interviews = [makeInterview("int-2d", futureDate(2))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(1);
  });

  it("does NOT send notification for an interview scheduled 3 days from now", () => {
    const interviews = [makeInterview("int-3d", futureDate(3))];
    const count = checkAndNotify(interviews, [], applicationMap);
    // days=3 passes the >3 check, but only days<=2 sends (non-today)
    expect(count).toBe(0);
  });

  it("does NOT send notification for an interview scheduled 4 days from now", () => {
    const interviews = [makeInterview("int-4d", futureDate(4))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(0);
  });

  it("does NOT send notification for an interview scheduled in the past", () => {
    const interviews = [makeInterview("int-past", futureDate(-1))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(0);
  });

  it("does NOT send notification for a cancelled interview", () => {
    const interviews = [
      makeInterview("int-cancelled", futureDate(0), "cancelled"),
    ];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(0);
  });

  it("returns 0 and sends no notifications when permission is not granted", () => {
    Object.defineProperty(Notification, "permission", { value: "denied", writable: true, configurable: true });
    const interviews = [makeInterview("int-today", futureDate(0))];
    const count = checkAndNotify(interviews, [], applicationMap);
    expect(count).toBe(0);
  });

  it("sends notification for follow-up due today", () => {
    const app: JobApplication = {
      ...mockApplication,
      id: "app-2",
      nextFollowUpAt: futureDate(0),
    };
    const apps = [app];
    const count = checkAndNotify([], apps, applicationMap);
    expect(count).toBe(1);
    expect(sentNotifications[0].title).toContain("跟进");
  });

  it("returns the total count of sent notifications", () => {
    const interviewToday = makeInterview("int-a", futureDate(0));
    const interviewTomorrow = makeInterview("int-b", futureDate(1));
    const interviews = [interviewToday, interviewTomorrow];
    const app: JobApplication = {
      ...mockApplication,
      id: "app-follow",
      nextFollowUpAt: futureDate(0),
    };
    const apps = [app];
    const count = checkAndNotify(interviews, apps, applicationMap);
    expect(count).toBe(3);
  });
});
