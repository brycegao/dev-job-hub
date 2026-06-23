/**
 * 面试日程导出服务。
 * 将面试记录导出为 ICS 日历文件，支持单条和批量导出。
 */
import type { JobApplication } from "../../applications/types";
import {
  interviewRoundLabels,
  type InterviewRecord,
} from "../types";

/** ICS 构建选项 */
interface ICSBuildOptions {
  interview: InterviewRecord;
  application?: JobApplication;
  durationMinutes?: number;
}

/** 将 ISO 日期字符串转换为 ICS 格式（YYYYMMDDTHHMMSS） */
function formatICSDateTime(value: string): string {
  const cleaned = value.replace(/[-:]/g, "");
  if (cleaned.length === 8) {
    return `${cleaned}T000000`;
  }
  if (cleaned.length === 13) {
    return `${cleaned}00`;
  }
  return cleaned.slice(0, 15);
}

/** 转义 ICS 文本中的特殊字符 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** 构建单个 ICS VEVENT 字符串 */
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
  if (interview.location) {
    descParts.push(`地点：${interview.location}`);
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
    interview.location ? `LOCATION:${escapeICS(interview.location)}` : "",
    `DESCRIPTION:${escapeICS(descParts.join("\\n"))}`,
    `X-WR-CALNAME:求职作战台`,
    "END:VEVENT",
  ].filter(Boolean).join("\r\n");
}

/** 将多个 VEVENT 包装为完整的 ICS 日历字符串 */
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

/** 触发浏览器下载 ICS 文件 */
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

/** 导出单条面试记录到日历文件 */
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

/** 批量导出所有已安排的面试记录到日历文件 */
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
