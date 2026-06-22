import type { ApplicationMetrics } from "../../features/analytics/services/applicationAnalytics";
import { interviewRoundLabels } from "../../features/interviews/types";
import { MetricCard } from "../components/MetricCard";
import { StatusBars } from "../components/StatusBars";
import { formatPercent, formatDate, formatDateTime } from "../../shared/utils/common";

export function DashboardPage({
  metrics,
  onFollowUpClick,
  onLoadSample,
}: {
  metrics: ApplicationMetrics;
  onFollowUpClick: (applicationId: string) => void;
  onLoadSample: () => void;
}) {
  const isEmpty = metrics.total === 0;

  return (
    <section className="page-grid">
      {isEmpty && (
        <section className="panel wide welcome-card">
          <div className="welcome-icon">🚀</div>
          <h2>欢迎使用求职作战台</h2>
          <p className="welcome-desc">
            专为程序员打造的求职管理工具——记录岗位投递、分析 JD 关键词、匹配简历版本、
            追踪面试流程并生成可复用的 AI Prompt，帮助你高效复盘、系统求职。
          </p>
          <div className="welcome-actions">
            <button className="primary" onClick={onLoadSample}>
              加载示例数据，快速体验
            </button>
          </div>
          <p className="welcome-tip">
            或点击右上角「新增岗位」开始记录你的第一个投递。
          </p>
        </section>
      )}

      {!isEmpty && (
        <>
          <MetricCard label="总投递" value={metrics.total} />
          <MetricCard label="本周投递" value={metrics.thisWeek} />
          <MetricCard label="回复数" value={metrics.replies} />
          <MetricCard label="面试数" value={metrics.interviews} />
          <MetricCard label="Offer" value={metrics.offers} />
          <MetricCard label="回复率" value={formatPercent(metrics.replyRate)} />
        </>
      )}

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
                <strong>{formatDateTime(item.interview.scheduledAt)}</strong>
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
                <strong>{formatDate(application.nextFollowUpAt)}</strong>
              </button>
            ))}
          </div>
        )}
      </section>

      {!isEmpty && (
        <section className="panel">
          <div className="panel-header">
            <h2>状态分布</h2>
          </div>
          <StatusBars metrics={metrics.statusCounts} />
        </section>
      )}
    </section>
  );
}
