import type { ApplicationMetrics, ChannelFunnel } from "../../features/analytics/services/applicationAnalytics";
import type { DashboardAlert } from "../../features/analytics/services/insightsService";
import type { TodayAction, TodayActionSummary } from "../../features/action-plan/services/todayActionService";
import { interviewRoundLabels } from "../../features/interviews/types";
import { MetricCard } from "../components/MetricCard";
import { StatusBars } from "../components/StatusBars";
import { formatPercent, formatDate, formatDateTime } from "../../shared/utils/common";

const priorityLabels: Record<TodayAction["priority"], string> = {
  high: "优先",
  medium: "今天",
  low: "补全",
};

const categoryLabels: Record<TodayAction["category"], string> = {
  follow_up: "跟进",
  interview: "面试",
  review: "复盘",
  stale: "无反馈",
  data_hygiene: "补资料",
};

export function DashboardPage({
  metrics,
  channelFunnels,
  actions,
  actionSummary,
  alerts,
  onFollowUpClick,
  onLoadSample,
}: {
  metrics: ApplicationMetrics;
  channelFunnels: ChannelFunnel[];
  actions: TodayAction[];
  actionSummary: TodayActionSummary;
  alerts: DashboardAlert[];
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
          <section className="panel wide action-hero">
            <div>
              <p className="eyebrow">Today Action Desk</p>
              <h2>今日行动台</h2>
              <p>
                先处理高优先级任务，再补全会影响 AI 建议和求职复盘的数据。
              </p>
            </div>
            <div className="action-summary">
              <span>
                <strong>{actionSummary.high}</strong>
                优先处理
              </span>
              <span>
                <strong>{actionSummary.medium}</strong>
                今日推进
              </span>
              <span>
                <strong>{actionSummary.low}</strong>
                资料补全
              </span>
            </div>
          </section>

          <MetricCard label="总投递" value={metrics.total} />
          <MetricCard label="本周投递" value={metrics.thisWeek} />
        </>
      )}

      {/* 智能提醒 */}
      {alerts.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>💡 智能提醒</h2>
          </div>
          <div className="alert-list">
            {alerts.map((alert) => (
              <button
                key={`${alert.type}-${alert.applicationId}`}
                className={`alert-card alert-card--${alert.priority}`}
                onClick={() => onFollowUpClick(alert.applicationId)}
              >
                <span className="alert-priority">
                  {alert.priority === "high" ? "⚠️ 紧急" : "📌 建议"}
                </span>
                <span className="alert-message">{alert.message}</span>
                <small className="alert-action">点击查看 →</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>今天先做什么</h2>
            <p>按紧急度聚合跟进、面试、复盘和资料补全任务。</p>
          </div>
        </div>
        {actions.length === 0 ? (
          <div className="empty-action-state">
            <strong>今天没有阻塞项</strong>
            <p>可以继续新增岗位、粘贴 JD，或去统计页复盘渠道和简历版本效果。</p>
          </div>
        ) : (
          <div className="action-list">
            {actions.map((action) => (
              <button
                key={action.id}
                className={`action-item action-item--${action.priority}`}
                onClick={() => action.applicationId && onFollowUpClick(action.applicationId)}
              >
                <span className="action-badge">{priorityLabels[action.priority]}</span>
                <span className="action-copy">
                  <strong>{action.title}</strong>
                  <small>{action.description}</small>
                </span>
                <span className="action-meta">
                  <small>{categoryLabels[action.category]}</small>
                  <strong>{action.dueLabel}</strong>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel wide">
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
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <h2>求职健康度</h2>
              <p>把统计当作复盘线索，不抢今天的行动优先级。</p>
            </div>
          </div>
          <div className="health-grid">
            <span>
              <strong>{metrics.replies}</strong>
              回复数
            </span>
            <span>
              <strong>{metrics.interviews}</strong>
              面试数
            </span>
            <span>
              <strong>{metrics.offers}</strong>
              Offer
            </span>
            <span>
              <strong>{formatPercent(metrics.replyRate)}</strong>
              回复率
            </span>
          </div>
          <StatusBars metrics={metrics.statusCounts} />
        </section>
      )}

      {channelFunnels.length > 0 && (
        <section className="panel wide">
          <div className="panel-header">
            <h2>渠道转化漏斗</h2>
          </div>
          <div className="channel-funnel-list">
            {channelFunnels.map((cf) => (
              <div key={cf.channel} className="channel-funnel-item">
                <div className="channel-funnel-header">
                  <strong>{cf.channel}</strong>
                  <span>{cf.total} 个岗位</span>
                </div>
                <div className="channel-funnel-bars">
                  <div className="funnel-bar-row">
                    <span>已投递</span>
                    <div className="funnel-bar">
                      <div className="funnel-bar-fill" style={{ width: cf.total ? "100%" : "0%" }} />
                    </div>
                    <span>{cf.total}</span>
                  </div>
                  <div className="funnel-bar-row">
                    <span>已回复</span>
                    <div className="funnel-bar">
                      <div className="funnel-bar-fill" style={{ width: cf.total ? `${(cf.contacted / cf.total) * 100}%` : "0%" }} />
                    </div>
                    <span>{cf.contacted}</span>
                  </div>
                  <div className="funnel-bar-row">
                    <span>面试中</span>
                    <div className="funnel-bar">
                      <div className="funnel-bar-fill" style={{ width: cf.total ? `${(cf.interviewed / cf.total) * 100}%` : "0%" }} />
                    </div>
                    <span>{cf.interviewed}</span>
                  </div>
                  <div className="funnel-bar-row">
                    <span>Offer</span>
                    <div className="funnel-bar">
                      <div className="funnel-bar-fill" style={{ width: cf.total ? `${(cf.offer / cf.total) * 100}%` : "0%" }} />
                    </div>
                    <span>{cf.offer}</span>
                  </div>
                </div>
                <div className="channel-funnel-rates">
                  <span>回复率 {formatPercent(cf.responseRate)}</span>
                  <span>面试率 {formatPercent(cf.interviewRate)}</span>
                  <span>Offer率 {formatPercent(cf.offerRate)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
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
    </section>
  );
}
