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
import { analyzeJD } from "../features/jd-analysis/services/jdAnalysisService";
import type { JDAnalysisResult } from "../features/jd-analysis/types";
import { matchResumeToJD } from "../features/resume-match/services/resumeMatchService";
import type { ResumeMatchResult } from "../features/resume-match/types";
import {
  createResume,
  deleteResume,
  getResumes,
  updateResume,
} from "../features/resumes/services/resumeService";
import type { ResumeVersion, ResumeVersionInput } from "../features/resumes/types";

type Page = "dashboard" | "applications" | "resumes" | "analytics";

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
  { key: "resumes", label: "简历" },
  { key: "analytics", label: "统计" },
];

const defaultResumeInput: ResumeVersionInput = {
  name: "",
  targetRole: "",
  content: "",
  filePath: "",
  highlights: [],
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [input, setInput] = useState<JobApplicationInput>(defaultInput);
  const [resumeInput, setResumeInput] = useState<ResumeVersionInput>(defaultResumeInput);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    const [nextApplications, nextResumes] = await Promise.all([
      getApplications(),
      getResumes(),
    ]);
    setApplications(nextApplications);
    setResumes(nextResumes);
    setIsLoading(false);
    if (!selectedId && nextApplications.length > 0) {
      setSelectedId(nextApplications[0].id);
    }
    if (!selectedResumeId && nextResumes.length > 0) {
      setSelectedResumeId(nextResumes[0].id);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selectedApplication = applications.find(
    (application) => application.id === selectedId,
  );
  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);

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

  async function handleResumeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeInput.name.trim() || !resumeInput.targetRole.trim()) {
      return;
    }

    if (isEditingResume && selectedResume) {
      const updated = await updateResume({
        ...selectedResume,
        ...resumeInput,
      });
      setSelectedResumeId(updated.id);
    } else {
      const created = await createResume(resumeInput);
      setSelectedResumeId(created.id);
    }

    setResumeInput(defaultResumeInput);
    setIsEditingResume(false);
    await refresh();
  }

  function startResumeEdit(resume: ResumeVersion) {
    setSelectedResumeId(resume.id);
    setResumeInput({
      name: resume.name,
      targetRole: resume.targetRole,
      content: resume.content,
      filePath: resume.filePath,
      highlights: resume.highlights,
    });
    setIsEditingResume(true);
    setPage("resumes");
  }

  async function handleResumeDelete(resume: ResumeVersion) {
    await deleteResume(resume.id);
    setSelectedResumeId(null);
    await refresh();
  }

  async function handleApplicationResumeLink(
    application: JobApplication,
    resumeVersionId: string,
  ) {
    const updated = await updateApplication({
      ...application,
      resumeVersionId: resumeVersionId || undefined,
    });
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
                  resumes={resumes}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onResumeLink={handleApplicationResumeLink}
                />
              )}
            </div>
          </section>
        )}

        {page === "resumes" && (
          <section className="workspace">
            <div className="list-pane">
              <div className="panel-header">
                <h2>简历版本</h2>
              </div>
              {resumes.length === 0 ? (
                <p className="empty">还没有简历版本。先添加一个 Android / Flutter / AI 应用方向简历。</p>
              ) : (
                <div className="application-list">
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      className={selectedResumeId === resume.id ? "selected" : ""}
                      onClick={() => setSelectedResumeId(resume.id)}
                    >
                      <span className="status-pill">{resume.targetRole}</span>
                      <strong>{resume.name}</strong>
                      <span>{resume.highlights.slice(0, 2).join(" / ") || "暂无核心卖点"}</span>
                      <small>{resume.updatedAt.slice(0, 10)}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-pane">
              <ResumeForm
                input={resumeInput}
                isEditing={isEditingResume}
                onInputChange={setResumeInput}
                onSubmit={handleResumeSubmit}
                onCancel={() => {
                  setResumeInput(defaultResumeInput);
                  setIsEditingResume(false);
                }}
              />
              {selectedResume && (
                <ResumeDetail
                  resume={selectedResume}
                  onEdit={startResumeEdit}
                  onDelete={handleResumeDelete}
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
  resumes,
  onEdit,
  onDelete,
  onStatusChange,
  onResumeLink,
}: {
  application: JobApplication;
  resumes: ResumeVersion[];
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobStatus) => void;
  onResumeLink: (application: JobApplication, resumeVersionId: string) => void;
}) {
  const [analysis, setAnalysis] = useState<JDAnalysisResult | null>(null);
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null);
  const linkedResume = resumes.find((resume) => resume.id === application.resumeVersionId);

  useEffect(() => {
    setAnalysis(null);
    setMatchResult(null);
  }, [application.id, application.jdText]);

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
      <label>
        关联简历版本
        <select
          value={application.resumeVersionId ?? ""}
          onChange={(event) => {
            setMatchResult(null);
            onResumeLink(application, event.target.value);
          }}
        >
          <option value="">暂不关联</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name} · {resume.targetRole}
            </option>
          ))}
        </select>
      </label>
      <div className="detail-section">
        <div className="section-title-row">
          <h3>JD 原文</h3>
          <button
            type="button"
            className="secondary-action"
            disabled={!application.jdText.trim()}
            onClick={() => setAnalysis(analyzeJD(application.jdText))}
          >
            分析 JD
          </button>
        </div>
        <p>{application.jdText || "暂未填写 JD。"}</p>
      </div>
      {analysis && <JDAnalysisCard analysis={analysis} />}
      {linkedResume && (
        <div className="match-actions">
          <button
            className="secondary-action"
            type="button"
            disabled={!application.jdText.trim()}
            onClick={() => setMatchResult(matchResumeToJD(application, linkedResume))}
          >
            生成简历匹配建议
          </button>
          <span>当前关联：{linkedResume.name}</span>
        </div>
      )}
      {matchResult && <ResumeMatchCard result={matchResult} />}
      <div className="detail-section">
        <h3>备注</h3>
        <p>{application.notes || "暂未填写备注。"}</p>
      </div>
    </section>
  );
}

function ResumeForm({
  input,
  isEditing,
  onInputChange,
  onSubmit,
  onCancel,
}: {
  input: ResumeVersionInput;
  isEditing: boolean;
  onInputChange: (next: ResumeVersionInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="panel form-panel" onSubmit={onSubmit}>
      <div className="panel-header">
        <h2>{isEditing ? "编辑简历版本" : "新增简历版本"}</h2>
      </div>
      <div className="form-grid">
        <label>
          简历名称
          <input
            value={input.name}
            onChange={(event) => onInputChange({ ...input, name: event.target.value })}
            placeholder="例如：Flutter 出海方向版"
            required
          />
        </label>
        <label>
          目标方向
          <input
            value={input.targetRole}
            onChange={(event) =>
              onInputChange({ ...input, targetRole: event.target.value })
            }
            placeholder="Flutter / Android / AI 应用"
            required
          />
        </label>
      </div>
      <label>
        核心卖点
        <textarea
          value={input.highlights.join("\n")}
          onChange={(event) =>
            onInputChange({
              ...input,
              highlights: event.target.value
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
          placeholder="每行一个卖点，例如：Flutter 出海多语言 / Google Play 合规 / 移动端工程化"
          rows={4}
        />
      </label>
      <label>
        简历正文
        <textarea
          value={input.content}
          onChange={(event) => onInputChange({ ...input, content: event.target.value })}
          placeholder="粘贴简历核心内容，后续用于 JD 匹配"
          rows={8}
        />
      </label>
      <label>
        文件路径
        <input
          value={input.filePath}
          onChange={(event) => onInputChange({ ...input, filePath: event.target.value })}
          placeholder="/Users/.../resume.pdf"
        />
      </label>
      <div className="form-actions">
        <button className="primary" type="submit">
          {isEditing ? "保存修改" : "保存简历"}
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

function ResumeDetail({
  resume,
  onEdit,
  onDelete,
}: {
  resume: ResumeVersion;
  onEdit: (resume: ResumeVersion) => void;
  onDelete: (resume: ResumeVersion) => void;
}) {
  return (
    <section className="panel detail-card">
      <div className="panel-header">
        <div>
          <h2>{resume.name}</h2>
          <p>{resume.targetRole}</p>
        </div>
        <div className="inline-actions">
          <button onClick={() => onEdit(resume)}>编辑</button>
          <button className="danger" onClick={() => onDelete(resume)}>
            删除
          </button>
        </div>
      </div>
      <div className="keyword-group">
        <span>核心卖点</span>
        <div className="keyword-list">
          {resume.highlights.length ? (
            resume.highlights.map((highlight) => <i key={highlight}>{highlight}</i>)
          ) : (
            <p>暂未填写</p>
          )}
        </div>
      </div>
      <div className="detail-section">
        <h3>简历正文</h3>
        <p>{resume.content || "暂未填写正文。"}</p>
      </div>
    </section>
  );
}

function ResumeMatchCard({ result }: { result: ResumeMatchResult }) {
  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>简历匹配建议</span>
        <strong>{result.greetingMessage}</strong>
      </div>
      <KeywordGroup title="已匹配" values={result.matchedPoints} />
      <KeywordGroup title="建议补充" values={result.missingPoints} tone="risk" />
      <TextList title="建议突出项目" values={result.suggestedProjects} />
      <TextList title="面试准备方向" values={result.interviewPrep} />
    </div>
  );
}

function TextList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="text-list">
      <span>{title}</span>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

function JDAnalysisCard({ analysis }: { analysis: JDAnalysisResult }) {
  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>JD 技术画像</span>
        <strong>{analysis.summary}</strong>
      </div>
      <KeywordGroup title="技术栈" values={analysis.techKeywords} />
      <KeywordGroup title="业务方向" values={analysis.domainKeywords} />
      <KeywordGroup title="能力要求" values={analysis.capabilityKeywords} />
      <KeywordGroup title="加分项" values={analysis.bonusKeywords} />
      <KeywordGroup title="风险提示" values={analysis.risks} tone="risk" />
    </div>
  );
}

function KeywordGroup({
  title,
  values,
  tone = "default",
}: {
  title: string;
  values: string[];
  tone?: "default" | "risk";
}) {
  return (
    <div className="keyword-group">
      <span>{title}</span>
      {values.length ? (
        <div className="keyword-list">
          {values.map((value) => (
            <i key={value} className={tone === "risk" ? "risk" : ""}>
              {value}
            </i>
          ))}
        </div>
      ) : (
        <p>未识别</p>
      )}
    </div>
  );
}
