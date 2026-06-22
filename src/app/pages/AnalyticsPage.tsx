import { formatPercent } from "../constants";
import { MetricCard } from "../components/MetricCard";

export function AnalyticsPage({
  metrics,
}: {
  metrics: {
    replyRate: number;
    interviewRate: number;
    channelCounts: Record<string, number>;
  };
}) {
  return (
    <section className="page-grid">
      <MetricCard label="投递到回复" value={formatPercent(metrics.replyRate)} />
      <MetricCard label="回复到面试" value={formatPercent(metrics.interviewRate)} />
      <MetricCard label="渠道数" value={Object.keys(metrics.channelCounts).length} />

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
