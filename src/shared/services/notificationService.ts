/**
 * 浏览器通知服务
 * 检查待面试和待跟进的岗位，发送浏览器 Notification 提醒。
 */

import type { JobApplication } from "../../features/applications/types";
import type { InterviewRecord } from "../../features/interviews/types";

/** 检查浏览器是否支持通知 */
export function isNotificationSupported(): boolean {
  return "Notification" in window;
}

/** 请求通知权限，返回是否已授权 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** 获取当前通知权限状态 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/** 发送一条浏览器通知 */
function sendNotification(title: string, body: string, tag: string): void {
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      tag, // 相同 tag 会替换而非叠加
      icon: "📅",
    });
  } catch {
    // 某些浏览器环境可能限制 Notification 构造
  }
}

/** 计算距离今天的天数（负数=过去，正数=未来），仅比较日期部分 */
function daysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 检查并发送待面试和待跟进的浏览器通知
 * 仅在通知权限已授权时执行；同一 tag 不会重复发送。
 */
export function checkAndNotify(
  interviews: InterviewRecord[],
  applications: JobApplication[],
  applicationMap: Map<string, JobApplication>,
): number {
  if (Notification.permission !== "granted") return 0;

  let sent = 0;

  // 检查近 3 天内的面试
  for (const record of interviews) {
    if (!record.scheduledAt || record.inviteStatus === "cancelled") continue;
    const days = daysFromToday(record.scheduledAt);
    if (days < 0 || days > 3) continue;

    const app = applicationMap.get(record.jobApplicationId);
    const company = app?.companyName || "未知公司";
    const job = app?.jobTitle || "未知岗位";

    if (days === 0) {
      sendNotification(
        "今天有面试！",
        `${company} · ${job} — ${record.scheduledAt?.replace("T", " ")}`,
        `interview-${record.id}`,
      );
      sent++;
    } else if (days <= 2) {
      sendNotification(
        `${days === 1 ? "明天" : "后天"}有面试`,
        `${company} · ${job} — ${record.scheduledAt?.replace("T", " ")}`,
        `interview-${record.id}`,
      );
      sent++;
    }
  }

  // 检查今天到期的跟进
  for (const app of applications) {
    if (!app.nextFollowUpAt) continue;
    const days = daysFromToday(app.nextFollowUpAt);
    if (days === 0) {
      sendNotification(
        "今天需要跟进",
        `${app.companyName} · ${app.jobTitle}`,
        `followup-${app.id}`,
      );
      sent++;
    } else if (days > 0 && days <= 2) {
      sendNotification(
        `${days} 天后需跟进`,
        `${app.companyName} · ${app.jobTitle} — ${app.nextFollowUpAt}`,
        `followup-${app.id}`,
      );
      sent++;
    }
  }

  return sent;
}
