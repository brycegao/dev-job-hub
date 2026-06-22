import type { ApplicationMetrics } from "../../features/analytics/services/applicationAnalytics";
import { MetricCard } from "../components/MetricCard";
import { TextList } from "../components/TextList";
import { formatPercent } from "../constants";

export function AnalyticsPage({
  metrics,
}: {
  metrics: ApplicationMetrics;
}) {
  return (
    <section className="page-grid">
      <MetricCard label="投递总数" value={metrics.total} />
      <MetricCard label="投递到回复" value={formatPercent(metrics.replyRate)} />
      <MetricCard label="回复到面试" value={formatPercent(metrics.interviewRate)} />
      <MetricCard label="本周投递" value={metrics.thisWeek} />
      <MetricCard label="Offer 数" value={metrics.offers} />

      {metrics.followUps.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>待跟进岗位</h2>
          </div>
          <TextList
            title={`共 ${metrics.followUps.length} 条待跟进`}
            values={metrics.followUps.map(
              (app) => `${app.companyName} · ${app.jobTitle} — ${app.nextFollowUpAt}`,
            )}
          />
        </section>
      )}

      {metrics.upcomingInterviews.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>近 7 天面试日程</h2>
          </div>
          <TextList
            title={`共 ${metrics.upcomingInterviews.length} 场`}
            values={metrics.upcomingInterviews.map(
              (item) => `${item.companyName} · ${item.jobTitle} — ${item.interview.scheduledAt}`,
            )}
          />
        </section>
      )}

      <section className="panel wide">
        <div className="panel-header">
          <h2>渠道分布</h2>
        </div>
        <div className="channel-grid">
          {Object.entries(metrics.channelCounts).map(([channel, count]) => (
            <div key={channel} className="channel-item">
              <span>{channel}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
