import type { ApplicationMetrics } from "../../features/analytics/services/applicationAnalytics";
import type {
  BottleneckInsight,
  InsightsResult,
  WeakPointPattern,
} from "../../features/analytics/services/insightsService";
import { MetricCard } from "../components/MetricCard";
import { TextList } from "../components/TextList";
import { formatPercent } from "../../shared/utils/common";

const FUNNEL_STEPS = [
  { key: "total", label: "投递" },
  { key: "replies", label: "回复" },
  { key: "interviews", label: "面试" },
  { key: "offers", label: "Offer" },
] as const;

export function AnalyticsPage({
  metrics,
  insights,
}: {
  metrics: ApplicationMetrics;
  insights: InsightsResult;
}) {
  return (
    <section className="page-grid">
      <MetricCard label="投递总数" value={metrics.total} />
      <MetricCard label="投递到回复" value={formatPercent(metrics.replyRate)} />
      <MetricCard label="回复到面试" value={formatPercent(metrics.interviewRate)} />
      <MetricCard label="本周投递" value={metrics.thisWeek} />
      <MetricCard label="Offer 数" value={metrics.offers} />

      {/* 瓶颈提示 */}
      {insights.bottlenecks.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>🔍 瓶颈提示</h2>
          </div>
          <div className="insights-list">
            {insights.bottlenecks.map((bn) => (
              <BottleneckCard key={bn.type} bottleneck={bn} />
            ))}
          </div>
        </section>
      )}

      <section className="panel wide">
        <div className="panel-header">
          <h2>投递漏斗</h2>
        </div>
        <div className="funnel">
          {FUNNEL_STEPS.map((step, index) => {
            const count = metrics[step.key];
            const width = metrics.total > 0 ? (count / metrics.total) * 100 : 0;
            const rate = index > 0 && metrics[FUNNEL_STEPS[index - 1].key] > 0
              ? count / metrics[FUNNEL_STEPS[index - 1].key]
              : 0;
            return (
              <div key={step.key} className="funnel-step">
                <div className="funnel-label">
                  <span>{step.label}</span>
                  <strong>{count}</strong>
                  {index > 0 && (
                    <small className="funnel-rate">
                      转化 {formatPercent(rate)}
                    </small>
                  )}
                </div>
                <div className="funnel-bar-track">
                  <i style={{ width: `${Math.max(width, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 高频薄弱点 */}
      {insights.weakPointPatterns.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>📊 高频薄弱点</h2>
            <span className="muted">跨面试统计</span>
          </div>
          <div className="pattern-list">
            {insights.weakPointPatterns.map((pattern) => (
              <WeakPointPatternCard key={pattern.weakPoint} pattern={pattern} />
            ))}
          </div>
        </section>
      )}

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

/** 瓶颈提示卡片 */
function BottleneckCard({ bottleneck }: { bottleneck: BottleneckInsight }) {
  return (
    <div className={`insight-card ${bottleneck.severity === "critical" ? "critical" : ""}`}>
      <strong>{bottleneck.severity === "critical" ? "⚠️" : "💡"} {bottleneck.message}</strong>
      <ol className="insight-suggestions">
        {bottleneck.suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

/** 薄弱点模式卡片 */
function WeakPointPatternCard({ pattern }: { pattern: WeakPointPattern }) {
  return (
    <div className="pattern-item">
      <div className="pattern-header">
        <strong>{pattern.weakPoint}</strong>
        <span className="pattern-frequency">{pattern.frequency} 次</span>
      </div>
      <p className="pattern-companies">
        相关面试：{pattern.relatedCompanies.join("、")}
      </p>
      <p className="pattern-suggestion">{pattern.suggestion}</p>
    </div>
  );
}
