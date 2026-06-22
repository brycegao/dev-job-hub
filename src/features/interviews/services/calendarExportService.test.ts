import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JobApplication } from "../../applications/types";
import type { InterviewRecord, InterviewRound } from "../types";
import { exportInterviewToCalendar, exportAllInterviewsToCalendar } from "./calendarExportService";

/** 捕获 Blob 内容的工具 */
function captureBlob(): { getBlob: () => string; restore: () => void } {
  let captured = "";
  const OriginalBlob = globalThis.Blob;

  // Use a function expression (not arrow) so it works as a constructor with `new`
  function MockBlob(this: Blob, parts: BlobPart[], options?: BlobPropertyBag) {
    captured = parts[0] as string;
    return new OriginalBlob(parts, options);
  }
  MockBlob.prototype = Object.create(OriginalBlob.prototype);
  vi.stubGlobal("Blob", MockBlob);

  // Mock URL.createObjectURL to avoid actual URL creation
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");

  // Mock anchor click (happy-dom may not fire click)
  const clickSpy = vi.fn();
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    const el = originalCreateElement(tag);
    if (tag === "a") {
      el.click = clickSpy;
    }
    return el;
  });

  return {
    getBlob: () => captured,
    restore: () => {
      vi.stubGlobal("Blob", OriginalBlob);
    },
  };
}

function futureDate(days: number, hour = 14, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const mockApplication: JobApplication = {
  id: "app-1",
  companyName: "星海科技",
  jobTitle: "Flutter 工程师",
  channel: "BOSS直聘",
  jdText: "负责 Flutter 开发",
  status: "interviewing",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockInterview: InterviewRecord = {
  id: "interview-1",
  jobApplicationId: "app-1",
  round: "first",
  inviteStatus: "confirmed",
  scheduledAt: futureDate(1, 14, 30),
  interviewerType: "技术负责人",
  inviteNotes: "HR 通知一面",
  questions: [],
  selfReview: "",
  weakPoints: [],
  strengths: [],
  actionItems: [],
  result: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("exportInterviewToCalendar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("生成包含 VCALENDAR 和 VEVENT 的 ICS 内容", () => {
    const { getBlob, restore } = captureBlob();

    exportInterviewToCalendar(mockInterview, mockApplication);

    const ics = getBlob();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    restore();
  });

  it("ICS 包含正确的 DTSTART/DTEND/SUMMARY", () => {
    const { getBlob, restore } = captureBlob();

    exportInterviewToCalendar(mockInterview, mockApplication);

    const ics = getBlob();
    expect(ics).toContain("DTSTART:");
    expect(ics).toContain("DTEND:");
    expect(ics).toContain("SUMMARY:");
    expect(ics).toContain("星海科技");
    expect(ics).toContain("Flutter 工程师");
    expect(ics).toContain("一面");
    restore();
  });

  it("ICS 包含面试官类型和备注", () => {
    const { getBlob, restore } = captureBlob();

    exportInterviewToCalendar(mockInterview, mockApplication);

    const ics = getBlob();
    expect(ics).toContain("技术负责人");
    expect(ics).toContain("HR 通知一面");
    restore();
  });

  it("无 scheduledAt 时不生成下载", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    const noDateInterview = { ...mockInterview, scheduledAt: undefined };
    exportInterviewToCalendar(noDateInterview, mockApplication);

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("无关联 application 时使用默认公司名", () => {
    const { getBlob, restore } = captureBlob();

    exportInterviewToCalendar(mockInterview);

    const ics = getBlob();
    expect(ics).toContain("未知公司");
    restore();
  });
});

describe("exportAllInterviewsToCalendar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("多个面试生成单个包含多个 VEVENT 的 ICS", () => {
    const { getBlob, restore } = captureBlob();

    const interviews = [
      mockInterview,
      {
        ...mockInterview,
        id: "interview-2",
        round: "second" as InterviewRound,
        scheduledAt: futureDate(3),
      },
    ];

    exportAllInterviewsToCalendar(interviews, [mockApplication]);

    const ics = getBlob();
    expect(ics).toContain("BEGIN:VCALENDAR");
    // 每个 interview 一个 VEVENT
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);
    restore();
  });

  it("无 scheduledAt 的面试被过滤掉", () => {
    const { getBlob, restore } = captureBlob();

    const interviews = [
      mockInterview,
      { ...mockInterview, id: "interview-2", scheduledAt: undefined },
    ];

    exportAllInterviewsToCalendar(interviews, [mockApplication]);

    const ics = getBlob();
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(1);
    restore();
  });

  it("全部无 scheduledAt 时不生成下载", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    exportAllInterviewsToCalendar(
      [{ ...mockInterview, scheduledAt: undefined }],
      [mockApplication],
    );

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
