import type { JobApplication } from "../../applications/types";
import {
  interviewRoundLabels,
  type InterviewRecord,
} from "../types";

interface ICSBuildOptions {
  interview: InterviewRecord;
  application?: JobApplication;
  durationMinutes?: number;
}

function formatICSDateTime(value: string): string {
  // 输入格式："2026-06-22T14:30" 或 "2026-06-22"
  // 输出格式：YYYYMMDDTHHMMSS（无时区，UTC）
  const cleaned = value.replace(/[-:]/g, "");
  // 如果只有日期部分（YYYYMMDD），补上 T000000
  if (cleaned.length === 8) {
    return `${cleaned}T000000`;
  }
  // 如果有 T 但缺秒数（YYYYMMDDTHHMM），补上 00
  if (cleaned.length === 13) {
    return `${cleaned}00`;
  }
  return cleaned.slice(0, 15);
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildEventICS(options: ICSBuildOptions): string {
  const { interview, application, durationMinutes = 60 } = options;

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const dtStart = formatICSDateTime(interview.scheduledAt!);

  const endDate = new Date(interview.scheduledAt!);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  const dtEnd = formatICSDateTime(endDate.toISOString().slice(0, 16));

  const company = application?.companyName || "未知公司";
  const jobTitle = application?.jobTitle || "";
  const round = interviewRoundLabels[interview.round] || interview.round;
  const summary = jobTitle
    ? `${company} · ${jobTitle} - ${round}`
    : `${company} - ${round}`;

  const descParts: string[] = [];
  if (interview.interviewerType) {
    descParts.push(`面试官：${interview.interviewerType}`);
  }
  if (interview.inviteNotes) {
    descParts.push(`备注：${interview.inviteNotes}`);
  }
  if (interview.summary) {
    descParts.push(`总结：${interview.summary}`);
  }

  return [
    "BEGIN:VEVENT",
    `UID:${interview.id}@job-hunt-crm`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(descParts.join("\\n"))}`,
    `X-WR-CALNAME:求职作战台`,
    "END:VEVENT",
  ].join("\r\n");
}

function buildICSWrapper(events: string[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//求职作战台//Developer Job Hunt CRM//CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

function downloadICS(icsText: string, filename: string): void {
  const blob = new Blob([icsText], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportInterviewToCalendar(
  interview: InterviewRecord,
  application?: JobApplication,
): void {
  if (!interview.scheduledAt) return;

  const company = application?.companyName || "未知公司";
  const round = interviewRoundLabels[interview.round] || interview.round;
  const event = buildEventICS({ interview, application });
  const ics = buildICSWrapper([event]);

  const date = interview.scheduledAt.slice(0, 10).replace(/-/g, "");
  downloadICS(ics, `面试-${round}-${company}-${date}.ics`);
}

export function exportAllInterviewsToCalendar(
  interviews: InterviewRecord[],
  applications: JobApplication[],
): void {
  const scheduled = interviews.filter((i) => i.scheduledAt);
  if (scheduled.length === 0) return;

  const events = scheduled.map((interview) => {
    const application = applications.find(
      (a) => a.id === interview.jobApplicationId,
    );
    return buildEventICS({ interview, application });
  });

  const ics = buildICSWrapper(events);
  const today = new Date().toISOString().slice(0, 10);
  downloadICS(ics, `全部面试日程-${today}.ics`);
}
