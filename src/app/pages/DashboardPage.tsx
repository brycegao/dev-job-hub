import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ApplicationMetrics, ChannelFunnel } from "../../features/analytics/services/applicationAnalytics";
import type { DashboardAlert } from "../../features/analytics/services/insightsService";
import type { TodayAction, TodayActionPriority, TodayActionSummary } from "../../features/action-plan/services/todayActionService";
import { interviewRoundLabels } from "../../features/interviews/types";
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

const channelColors = ["#2f7df6", "#26d9c7", "#f5b640", "#8b5cf6", "#ef5b65"];

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

  const closedCount =
    (metrics.statusCounts.rejected ?? 0) +
    (metrics.statusCounts.no_response ?? 0) +
    (metrics.statusCounts.not_fit ?? 0);
  const funnelSteps = [
    { key: "total", label: "投递岗位", value: metrics.total, accent: "blue" },
    { key: "replies", label: "收到回复", value: metrics.replies, accent: "teal" },
    { key: "interviews", label: "进入面试", value: metrics.interviews, accent: "amber" },
    { key: "offers", label: "Offer", value: metrics.offers, accent: "red" },
  ] as const;
  const topChannels = channelFunnels.slice(0, 5);
  const commandActions = (activeFilter ? actions.filter((a) => a.priority === activeFilter) : actions).slice(0, 4);
  const featuredInterview = metrics.upcomingInterviews[0];
  const channelTotal = topChannels.reduce((sum, channel) => sum + channel.total, 0);
  let channelCursor = 0;
  const channelSegments = topChannels.map((channel, index) => {
    const start = channelTotal > 0 ? (channelCursor / channelTotal) * 100 : 0;
    channelCursor += channel.total;
    const end = channelTotal > 0 ? (channelCursor / channelTotal) * 100 : 0;
    return {
      channel,
      color: channelColors[index % channelColors.length],
      start,
      end,
      share: channelTotal > 0 ? channel.total / channelTotal : 0,
    };
  });
  const channelDonutStyle: CSSProperties = {
    background: channelSegments.length > 0
      ? `conic-gradient(${channelSegments.map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(", ")})`
      : "#e8eef6",
  };

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
              加载 6 个岗位 · 2 份简历 · 1 条面试 → 数据不离开浏览器
            </p>
          </div>
          <div className="welcome-divider" />
          <p className="welcome-alt">
            或点击右上角「新增岗位」从头开始
          </p>
        </section>
      )}

      {!isEmpty && (
        <section className="dashboard-command dashboard-full">
          <div className="command-main">
            <div className="command-heading">
              <p className="eyebrow">Job Hunt Command Center</p>
              <h2>求职概览</h2>
              <p>用数据把投递、回复、面试和复盘串起来，今天先处理真正影响转化的事项。</p>
            </div>

            <div className="command-metrics" aria-label="核心求职指标">
              {[
                { label: "投递岗位", value: metrics.total, meta: `本周新增 ${metrics.thisWeek}`, tone: "blue", icon: "send" },
                { label: "面试中", value: metrics.interviews, meta: `回复率 ${formatPercent(metrics.replyRate)}`, tone: "teal", icon: "chat" },
                { label: "Offer", value: metrics.offers, meta: `面试转化 ${formatPercent(metrics.interviewRate)}`, tone: "amber", icon: "trophy" },
                { label: "关闭/无反馈", value: closedCount, meta: "用于复盘瓶颈", tone: "red", icon: "close" },
              ].map((item) => (
                <button key={item.label} className={`command-metric command-metric--${item.tone}`} onClick={onNavigateToAnalytics}>
                  <i className={`command-metric-icon command-metric-icon--${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.meta}</small>
                </button>
              ))}
            </div>

            <div className="command-funnel-card">
              <div className="command-card-title">
                <div>
                  <h3>投递漏斗</h3>
                  <p>从投递到 Offer 的真实转化，不再凭感觉判断问题在哪。</p>
                </div>
                <button className="secondary-action" onClick={onNavigateToAnalytics}>查看统计</button>
              </div>
              <div className="command-funnel">
                {funnelSteps.map((step, index) => {
                  const width = metrics.total > 0 ? Math.max(8, (step.value / metrics.total) * 100) : 0;
                  const previousValue = index === 0 ? metrics.total : funnelSteps[index - 1].value;
                  const rate = index === 0 ? 1 : previousValue > 0 ? step.value / previousValue : 0;
                  return (
                    <div key={step.key} className={`command-funnel-step command-funnel-step--${step.accent}`}>
                      <div className="command-funnel-label">
                        <span>{step.label}</span>
                        <strong>{step.value}</strong>
                        {index > 0 && <small>{formatPercent(rate)}</small>}
                      </div>
                      <div className="command-funnel-track">
                        <i style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="command-side" aria-label="求职复盘侧栏">
            <section className="command-side-card">
              <div className="command-card-title compact">
                <h3>渠道分布</h3>
                <span>{topChannels.length} 个渠道</span>
              </div>
              {topChannels.length === 0 ? (
                <p className="command-empty">还没有渠道数据。</p>
              ) : (
                <div className="command-channel-visual">
                  <div className="command-channel-donut" style={channelDonutStyle} aria-hidden="true">
                    <span>{channelTotal}</span>
                    <small>岗位</small>
                  </div>
                  <div className="command-channel-list">
                    {channelSegments.map((segment) => (
                      <div key={segment.channel.channel} className="command-channel-item">
                        <div>
                          <strong>
                            <i style={{ background: segment.color }} />
                            {segment.channel.channel}
                          </strong>
                          <span>{formatPercent(segment.share)}</span>
                        </div>
                        <small>{segment.channel.total} 个岗位 · 回复率 {formatPercent(segment.channel.responseRate)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="command-side-card">
              <div className="command-card-title compact">
                <h3>最近行动</h3>
                <div className="command-priority-tabs">
                  {(["high", "medium", "low"] as TodayActionPriority[]).map((priority) => (
                    <button
                      key={priority}
                      className={activeFilter === priority ? "active" : ""}
                      onClick={() => handlePriorityClick(priority)}
                    >
                      {priorityLabels[priority]} {actionSummary[priority]}
                    </button>
                  ))}
                </div>
              </div>
              {commandActions.length === 0 ? (
                <p className="command-empty">今天没有阻塞项，可以继续新增岗位或复盘渠道。</p>
              ) : (
                <div className="command-action-list">
                  {commandActions.map((action) => (
                    <button
                      key={action.id}
                      className={`command-action command-action--${action.priority}`}
                      onClick={() => action.applicationId && onFollowUpClick(action.applicationId)}
                    >
                      <span>{categoryLabels[action.category]}</span>
                      <strong>{action.title}</strong>
                      <small>{action.dueLabel}</small>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="command-side-card">
              <div className="command-card-title compact">
                <h3>面试复盘</h3>
                <span>{metrics.upcomingInterviews.length} 场近 7 天面试</span>
              </div>
              {featuredInterview ? (
                <button
                  className="command-interview-card"
                  onClick={() => onFollowUpClick(featuredInterview.applicationId)}
                >
                  <span>{interviewRoundLabels[featuredInterview.interview.round]}</span>
                  <strong>{featuredInterview.companyName} · {featuredInterview.jobTitle}</strong>
                  <small>{formatDateTime(featuredInterview.interview.scheduledAt)}</small>
                </button>
              ) : (
                <p className="command-empty">暂无近 7 天面试邀约。</p>
              )}
            </section>
          </aside>
        </section>
      )}

      {!isEmpty && alerts.length > 0 && (
        <section className="panel dashboard-full">
          <div className="panel-header">
            <h2>智能提醒</h2>
          </div>
          <div className="alert-list">
            {alerts.slice(0, 3).map((alert) => (
              <button
                key={`${alert.type}-${alert.applicationId}`}
                className={`alert-card alert-card--${alert.priority}`}
                onClick={() => onFollowUpClick(alert.applicationId)}
              >
                <span className="alert-priority">
                  {alert.priority === "high" ? "紧急" : "建议"}
                </span>
                <span className="alert-message">{alert.message}</span>
                <small className="alert-action">点击查看</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {!isEmpty && (
      <section className="panel dashboard-full command-action-panel" ref={actionListRef}>
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
      )}

      {!isEmpty && (
      <div className="dashboard-panels">
        <section className="panel">
          <div className="panel-header">
            <h2>最近需要跟进</h2>
          </div>
          {metrics.followUps.length === 0 ? (
            <div className="inline-hint">
              <div className="inline-hint-icon">📌</div>
              <div className="inline-hint-body">
                <div className="inline-hint-title">暂无跟进项</div>
                <div className="inline-hint-desc">给重点岗位设置下次跟进日期后会显示在这里。</div>
              </div>
            </div>
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

        <section className="panel">
          <div className="panel-header">
            <h2>近 7 天待面试</h2>
          </div>
          {metrics.upcomingInterviews.length === 0 ? (
            <div className="inline-hint">
              <div className="inline-hint-icon">📅</div>
              <div className="inline-hint-body">
                <div className="inline-hint-title">暂无近 7 天的面试邀约</div>
              </div>
            </div>
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

        {channelFunnels.length > 0 && (
          <section className="panel">
            <div className="panel-header">
              <h2>渠道转化</h2>
            </div>
            <div className="channel-funnel-list">
              {channelFunnels.slice(0, 3).map((cf) => (
                <div key={cf.channel} className="channel-funnel-item">
                  <div className="channel-funnel-header">
                    <strong>{cf.channel}</strong>
                    <span>{cf.total} 个岗位</span>
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
      </div>
      )}
    </section>
  );
}
