import type { JobApplication, JobStatus } from "../../applications/types";

export type ApplicationMetrics = {
  total: number;
  thisWeek: number;
  replies: number;
  interviews: number;
  offers: number;
  replyRate: number;
  interviewRate: number;
  statusCounts: Record<JobStatus, number>;
  channelCounts: Record<string, number>;
  followUps: JobApplication[];
};

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function buildApplicationMetrics(
  applications: JobApplication[],
): ApplicationMetrics {
  const weekStart = startOfWeek(new Date());
  const statusCounts = applications.reduce(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<JobStatus, number>,
  );

  const channelCounts = applications.reduce(
    (acc, application) => {
      const channel = application.channel || "未填写";
      acc[channel] = (acc[channel] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const replies = applications.filter((application) =>
    ["contacted", "interviewing", "offer", "rejected"].includes(application.status),
  ).length;
  const interviews = applications.filter((application) =>
    ["interviewing", "offer", "rejected"].includes(application.status),
  ).length;
  const offers = applications.filter((application) => application.status === "offer").length;
  const thisWeek = applications.filter((application) => {
    if (!application.appliedAt) {
      return false;
    }
    return new Date(application.appliedAt) >= weekStart;
  }).length;
  const followUps = applications
    .filter((application) => application.nextFollowUpAt)
    .sort((a, b) => String(a.nextFollowUpAt).localeCompare(String(b.nextFollowUpAt)))
    .slice(0, 5);

  return {
    total: applications.length,
    thisWeek,
    replies,
    interviews,
    offers,
    replyRate: applications.length ? replies / applications.length : 0,
    interviewRate: replies ? interviews / replies : 0,
    statusCounts,
    channelCounts,
    followUps,
  };
}
