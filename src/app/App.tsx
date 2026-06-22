import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildApplicationMetrics } from "../features/analytics/services/applicationAnalytics";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  updateApplicationStatus,
} from "../features/applications/services/applicationService";
import {
  activeStatuses,
  closedStatuses,
  statusLabels,
  type JobApplication,
  type JobApplicationInput,
  type JobStatus,
} from "../features/applications/types";

type Page = "dashboard" | "applications" | "analytics";

const defaultInput: JobApplicationInput = {
  companyName: "",
  jobTitle: "",
  channel: "BOSS直聘",
  city: "",
  remoteType: "onsite",
  salaryRange: "",
  jobUrl: "",
  jdText: "",
  status: "evaluating",
  appliedAt: new Date().toISOString().slice(0, 10),
  nextFollowUpAt: "",
  notes: "",
};

const navItems: Array<{ key: Page; label: string }> = [
  { key: "dashboard", label: "概览" },
  { key: "applications", label: "岗位" },
  { key: "analytics", label: "统计" },
];

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [input, setInput] = useState<JobApplicationInput>(defaultInput);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    const nextApplications = await getApplications();
    setApplications(nextApplications);
    setIsLoading(false);
    if (!selectedId && nextApplications.length > 0) {
      setSelectedId(nextApplications[0].id);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selectedApplication = applications.find(
    (application) => application.id === selectedId,
  );

  const metrics = useMemo(
    () => buildApplicationMetrics(applications),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    if (filterStatus === "all") {
      return applications;
    }
    return applications.filter((application) => application.status === filterStatus);
  }, [applications, filterStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.companyName.trim() || !input.jobTitle.trim()) {
      return;
    }

    if (isEditing && selectedApplication) {
      const updated = await updateApplication({
        ...selectedApplication,
        ...input,
      });
      setSelectedId(updated.id);
    } else {
      const created = await createApplication(input);
      setSelectedId(created.id);
    }

    setInput(defaultInput);
    setIsEditing(false);
    await refresh();
  }

  function startEdit(application: JobApplication) {
    setSelectedId(application.id);
    setInput({
      companyName: application.companyName,
      jobTitle: application.jobTitle,
      channel: application.channel,
      city: application.city,
      remoteType: application.remoteType,
      salaryRange: application.salaryRange,
      jobUrl: application.jobUrl,
      jdText: application.jdText,
      status: application.status,
      appliedAt: application.appliedAt,
      nextFollowUpAt: application.nextFollowUpAt,
      resumeVersionId: application.resumeVersionId,
      notes: application.notes,
    });
    setIsEditing(true);
    setPage("applications");
  }

  async function handleDelete(application: JobApplication) {
    await deleteApplication(application.id);
    setSelectedId(null);
    await refresh();
  }

  async function handleStatusChange(application: JobApplication, status: JobStatus) {
    const updated = await updateApplicationStatus(application, status);
    setSelectedId(updated.id);
    await refresh();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <strong>求职作战台</strong>
            <small>Developer Job CRM</small>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={page === item.key ? "active" : ""}
              onClick={() => setPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">本地优先 · 无登录 · 无云同步</p>
            <h1>程序员求职作战台</h1>
          </div>
          <button
            className="primary"
            onClick={() => {
              setPage("applications");
              setIsEditing(false);
              setInput(defaultInput);
            }}
          >
            新增岗位
          </button>
        </header>

        {page === "dashboard" && (
          <section className="page-grid">
            <MetricCard label="总投递" value={metrics.total} />
            <MetricCard label="本周投递" value={metrics.thisWeek} />
            <MetricCard label="回复数" value={metrics.replies} />
            <MetricCard label="面试数" value={metrics.interviews} />
            <MetricCard label="Offer" value={metrics.offers} />
            <MetricCard label="回复率" value={formatPercent(metrics.replyRate)} />

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
                      onClick={() => {
                        setSelectedId(application.id);
                        setPage("applications");
                      }}
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
        )}

        {page === "applications" && (
          <section className="workspace">
            <div className="list-pane">
              <div className="panel-header">
                <h2>岗位列表</h2>
                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value as JobStatus | "all")
                  }
                >
                  <option value="all">全部状态</option>
                  {[...activeStatuses, ...closedStatuses].map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              {isLoading ? (
                <p className="empty">加载中...</p>
              ) : filteredApplications.length === 0 ? (
                <p className="empty">还没有岗位记录。先新增一个目标岗位。</p>
              ) : (
                <div className="application-list">
                  {filteredApplications.map((application) => (
                    <button
                      key={application.id}
                      className={selectedId === application.id ? "selected" : ""}
                      onClick={() => setSelectedId(application.id)}
                    >
                      <span className="status-pill">{statusLabels[application.status]}</span>
                      <strong>{application.companyName}</strong>
                      <span>{application.jobTitle}</span>
                      <small>{application.channel} · {application.appliedAt || "未投递"}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-pane">
              <ApplicationForm
                input={input}
                isEditing={isEditing}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setInput(defaultInput);
                  setIsEditing(false);
                }}
              />

              {selectedApplication && (
                <ApplicationDetail
                  application={selectedApplication}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </section>
        )}

        {page === "analytics" && (
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
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <section className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function StatusBars({ metrics }: { metrics: Partial<Record<JobStatus, number>> }) {
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

function ApplicationForm({
  input,
  isEditing,
  onInputChange,
  onSubmit,
  onCancel,
}: {
  input: JobApplicationInput;
  isEditing: boolean;
  onInputChange: (next: JobApplicationInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="panel form-panel" onSubmit={onSubmit}>
      <div className="panel-header">
        <h2>{isEditing ? "编辑岗位" : "新增岗位"}</h2>
      </div>
      <div className="form-grid">
        <label>
          公司
          <input
            value={input.companyName}
            onChange={(event) =>
              onInputChange({ ...input, companyName: event.target.value })
            }
            placeholder="例如：某出海工具团队"
            required
          />
        </label>
        <label>
          岗位
          <input
            value={input.jobTitle}
            onChange={(event) =>
              onInputChange({ ...input, jobTitle: event.target.value })
            }
            placeholder="例如：Flutter 高级开发"
            required
          />
        </label>
        <label>
          渠道
          <input
            value={input.channel}
            onChange={(event) =>
              onInputChange({ ...input, channel: event.target.value })
            }
          />
        </label>
        <label>
          状态
          <select
            value={input.status}
            onChange={(event) =>
              onInputChange({ ...input, status: event.target.value as JobStatus })
            }
          >
            {[...activeStatuses, ...closedStatuses].map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          城市
          <input
            value={input.city}
            onChange={(event) => onInputChange({ ...input, city: event.target.value })}
            placeholder="上海 / 北京 / 远程"
          />
        </label>
        <label>
          薪资
          <input
            value={input.salaryRange}
            onChange={(event) =>
              onInputChange({ ...input, salaryRange: event.target.value })
            }
            placeholder="25-35K"
          />
        </label>
        <label>
          投递日期
          <input
            type="date"
            value={input.appliedAt}
            onChange={(event) =>
              onInputChange({ ...input, appliedAt: event.target.value })
            }
          />
        </label>
        <label>
          下次跟进
          <input
            type="date"
            value={input.nextFollowUpAt}
            onChange={(event) =>
              onInputChange({ ...input, nextFollowUpAt: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        岗位链接
        <input
          value={input.jobUrl}
          onChange={(event) => onInputChange({ ...input, jobUrl: event.target.value })}
          placeholder="https://..."
        />
      </label>
      <label>
        JD 原文
        <textarea
          value={input.jdText}
          onChange={(event) => onInputChange({ ...input, jdText: event.target.value })}
          placeholder="粘贴岗位 JD，后续会用于关键词分析和简历匹配"
          rows={5}
        />
      </label>
      <label>
        备注
        <textarea
          value={input.notes}
          onChange={(event) => onInputChange({ ...input, notes: event.target.value })}
          placeholder="记录 HR 信息、沟通重点、内推人等"
          rows={3}
        />
      </label>
      <div className="form-actions">
        <button className="primary" type="submit">
          {isEditing ? "保存修改" : "保存岗位"}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel}>
            取消编辑
          </button>
        )}
      </div>
    </form>
  );
}

function ApplicationDetail({
  application,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobStatus) => void;
}) {
  return (
    <section className="panel detail-card">
      <div className="panel-header">
        <div>
          <h2>{application.companyName}</h2>
          <p>{application.jobTitle}</p>
        </div>
        <div className="inline-actions">
          <button onClick={() => onEdit(application)}>编辑</button>
          <button className="danger" onClick={() => onDelete(application)}>
            删除
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <span>渠道</span>
        <strong>{application.channel || "未填写"}</strong>
        <span>城市</span>
        <strong>{application.city || "未填写"}</strong>
        <span>薪资</span>
        <strong>{application.salaryRange || "未填写"}</strong>
        <span>投递日期</span>
        <strong>{application.appliedAt || "未填写"}</strong>
      </div>
      <label>
        快速更新状态
        <select
          value={application.status}
          onChange={(event) =>
            onStatusChange(application, event.target.value as JobStatus)
          }
        >
          {[...activeStatuses, ...closedStatuses].map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="detail-section">
        <h3>JD 原文</h3>
        <p>{application.jdText || "暂未填写 JD。"}</p>
      </div>
      <div className="detail-section">
        <h3>备注</h3>
        <p>{application.notes || "暂未填写备注。"}</p>
      </div>
    </section>
  );
}
