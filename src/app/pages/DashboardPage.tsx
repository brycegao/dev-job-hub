import { useEffect, useRef, useState } from "react";
import type { ApplicationMetrics, ChannelFunnel } from "../../features/analytics/services/applicationAnalytics";
import type { DashboardAlert } from "../../features/analytics/services/insightsService";
import type { TodayAction, TodayActionPriority, TodayActionSummary } from "../../features/action-plan/services/todayActionService";
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
  onNavigateToAnalytics,
}: {
  metrics: ApplicationMetrics;
  channelFunnels: ChannelFunnel[];
  actions: TodayAction[];
  actionSummary: TodayActionSummary;
  alerts: DashboardAlert[];
  onFollowUpClick: (applicationId: string) => void;
  onLoadSample: () => void;
  onNavigateToAnalytics?: () => void;
}) {
  const isEmpty = metrics.total === 0;
  const actionListRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<TodayActionPriority | null>(null);
  const prevEmpty = useRef(true);
  const [showGuidance, setShowGuidance] = useState(false);

  /** 首次从空状态变为非空时，显示 8 秒引导横幅 */
  useEffect(() => {
    if (prevEmpty.current && !isEmpty) {
      setShowGuidance(true);
      const timer = setTimeout(() => setShowGuidance(false), 8000);
      return () => clearTimeout(timer);
    }
    prevEmpty.current = isEmpty;
  }, [isEmpty]);



  function handlePriorityClick(priority: TodayActionPriority) {
    setActiveFilter((prev) => prev === priority ? null : priority);
    // 滚动到行动列表
    actionListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="dashboard-layout">
      {/* 首次加载示例数据后的引导横幅 */}
      {showGuidance && (
        <div className="guidance-banner">
          <span>
            ✅ 示例数据已加载！试试这些操作：
            <strong>点击岗位状态标签一键切换</strong> →
            <strong>查看今日行动台</strong> →
            <strong>打开统计页看瓶颈分析</strong>
          </span>
          <button className="guidance-banner-close" onClick={() => setShowGuidance(false)} aria-label="关闭引导">×</button>
        </div>
      )}

      {isEmpty && (
        <section className="panel dashboard-full welcome-hero">
          <h2 className="welcome-hero-title">程序员求职作战台</h2>
          <p className="welcome-hero-tagline">
            粘贴 JD，3 秒建档。追踪投递漏斗，AI 辅助面试准备。
          </p>
          <div className="welcome-features">
            {[
              { icon: "📋", title: "粘贴 JD 自动建档", desc: "薪资、城市、渠道自动提取，少打 80% 字段" },
              { icon: "📊", title: "渠道漏斗可视化", desc: "投递→回复→面试→Offer 转化率，一眼看出瓶颈" },
              { icon: "🎯", title: "今日行动优先排序", desc: "跟进、面试、复盘、补资料，按紧急度聚合" },
            ].map((f) => (
              <div key={f.title} className="welcome-feature-card">
                <div className="welcome-feature-icon">{f.icon}</div>
                <div className="welcome-feature-title">{f.title}</div>
                <div className="welcome-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="welcome-cta">
            <button className="primary" onClick={onLoadSample}>
              🚀 一键加载示例数据，快速体验
            </button>
            <p className="welcome-cta-desc">
              加载 3 个岗位 · 2 份简历 · 1 条面试 → 数据不离开浏览器
            </p>
          </div>
          <div className="welcome-divider" />
          <p className="welcome-alt">
            或点击右上角「新增岗位」从头开始
          </p>
        </section>
      )}

      {!isEmpty && (
        <>
          <section className="panel dashboard-full action-hero">
            <div>
              <p className="eyebrow">Today Action Desk</p>
              <h2>今日行动台</h2>
              <p>
                先处理高优先级任务，再补全会影响 AI 建议和求职复盘的数据。
              </p>
            </div>
            <div className="action-summary">
              <button
                className={activeFilter === "high" ? "action-summary-active" : ""}
                onClick={() => handlePriorityClick("high")}
              >
                <strong>{actionSummary.high}</strong>
                优先处理
              </button>
              <button
                className={activeFilter === "medium" ? "action-summary-active" : ""}
                onClick={() => handlePriorityClick("medium")}
              >
                <strong>{actionSummary.medium}</strong>
                今日推进
              </button>
              <button
                className={activeFilter === "low" ? "action-summary-active" : ""}
                onClick={() => handlePriorityClick("low")}
              >
                <strong>{actionSummary.low}</strong>
                资料补全
              </button>
            </div>
          </section>

          <MetricCard label="总投递" value={metrics.total} onClick={onNavigateToAnalytics} />
          <MetricCard label="本周投递" value={metrics.thisWeek} onClick={onNavigateToAnalytics} />
        </>
      )}

      {/* 智能提醒 */}
      {alerts.length > 0 && (
        <section className="panel dashboard-full">
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

      <section className="panel dashboard-full" ref={actionListRef}>
        <div className="panel-header">
          <div>
            <h2>今天先做什么</h2>
            <p>按紧急度聚合跟进、面试、复盘和资料补全任务。</p>
          </div>
          {activeFilter && (
            <button className="secondary-action" onClick={() => setActiveFilter(null)}>
              显示全部
            </button>
          )}
        </div>
        {actions.length === 0 ? (
          <div className="empty-action-state">
            <strong>今天没有阻塞项</strong>
            <p>可以继续新增岗位、粘贴 JD，或去统计页复盘渠道和简历版本效果。</p>
          </div>
        ) : (
          <div className="action-list">
            {(activeFilter ? actions.filter((a) => a.priority === activeFilter) : actions).map((action) => (
              <button
                key={action.id}
                className={`action-item action-item--${action.priority}${activeFilter && action.priority !== activeFilter ? " action-item--dimmed" : ""}`}
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

      <div className="dashboard-panels">
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
        <section className="panel">
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

      <section className="panel">
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
      </div>
    </section>
  );
}
