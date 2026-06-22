import type { ApplicationMetrics } from "../../features/analytics/services/applicationAnalytics";
import { interviewRoundLabels } from "../../features/interviews/types";
import { MetricCard } from "../components/MetricCard";
import { StatusBars } from "../components/StatusBars";
import { formatPercent } from "../constants";

export function DashboardPage({
  metrics,
  onFollowUpClick,
}: {
  metrics: ApplicationMetrics;
  onFollowUpClick: (applicationId: string) => void;
}) {
  return (
    <section className="page-grid">
      <MetricCard label="总投递" value={metrics.total} />
      <MetricCard label="本周投递" value={metrics.thisWeek} />
      <MetricCard label="回复数" value={metrics.replies} />
      <MetricCard label="面试数" value={metrics.interviews} />
      <MetricCard label="Offer" value={metrics.offers} />
      <MetricCard label="回复率" value={formatPercent(metrics.replyRate)} />

      <section className="panel wide">
        <div className="panel-header">
          <h2>近 7 天待面试</h2>
        </div>
        {metrics.upcomingInterviews.length === 0 ? (
          <p className="empty">暂无近 7 天的面试邀约。</p>
        ) : (
          <div className="simple-list">
            {metrics.upcomingInterviews.map((item) => (
              <button
                key={item.interview.id}
                onClick={() => onFollowUpClick(item.applicationId)}
              >
                <span>
                  {item.companyName} · {item.jobTitle}
                  <small> {interviewRoundLabels[item.interview.round]}</small>
                </span>
                <strong>{item.interview.scheduledAt?.replace("T", " ")}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>最近需要跟进</h2>
        </div>
        {metrics.followUps.length === 0 ? (
          <p className="empty">暂无跟进项。给重点岗位设置下次跟进日期后会显示在这里。</p>
        ) : (
          <div className="simple-list">
            {metrics.followUps.map((application) => (
              <button
                key={application.id}
                onClick={() => onFollowUpClick(application.id)}
              >
                <span>{application.companyName} · {application.jobTitle}</span>
                <strong>{application.nextFollowUpAt}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>状态分布</h2>
        </div>
        <StatusBars metrics={metrics.statusCounts} />
      </section>
    </section>
  );
}
