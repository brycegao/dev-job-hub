import {
  activeStatuses,
  closedStatuses,
  statusLabels,
  type JobStatus,
} from "../../features/applications/types";

export function StatusBars({ metrics }: { metrics: Partial<Record<JobStatus, number>> }) {
  const statuses = [...activeStatuses, ...closedStatuses];
  const total = statuses.reduce((sum, status) => sum + (metrics[status] ?? 0), 0);

  return (
    <div className="status-bars">
      {statuses.map((status) => {
        const count = metrics[status] ?? 0;
        const width = total ? `${Math.max((count / total) * 100, count ? 8 : 0)}%` : "0%";
        return (
          <div key={status} className="status-row">
            <span>{statusLabels[status]}</span>
            <div>
              <i style={{ width }} />
            </div>
            <strong>{count}</strong>
          </div>
        );
      })}
    </div>
  );
}
