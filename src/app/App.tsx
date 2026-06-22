import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { buildApplicationMetrics } from "../features/analytics/services/applicationAnalytics";
import { generateAICompletion } from "../features/ai-assist/services/aiCompletionService";
import {
  defaultAIConfig,
  isAIConfigured,
  loadAIConfig,
  saveAIConfig,
} from "../features/ai-assist/services/aiConfigService";
import {
  buildInterviewAnswerPack,
  buildInterviewPrepPack,
} from "../features/ai-assist/services/promptPackService";
import type {
  AIProviderConfig,
  InterviewAnswerPack,
  InterviewPrepPack,
} from "../features/ai-assist/types";
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
import { sampleData } from "../data/sampleData";
import {
  buildExportData,
  downloadJson,
  parseImportData,
  replaceAllData,
} from "../features/data-portability/services/dataPortabilityService";
import {
  createInterview,
  deleteInterview,
  getInterviews,
} from "../features/interviews/services/interviewService";
import {
  interviewResultLabels,
  interviewRoundLabels,
  type InterviewQuestion,
  type InterviewRecord,
  type InterviewRecordInput,
  type InterviewResult,
  type InterviewRound,
} from "../features/interviews/types";
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

type Page =
  | "dashboard"
  | "applications"
  | "resumes"
  | "interviews"
  | "analytics"
  | "settings"
  | "help";

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
  { key: "interviews", label: "面试" },
  { key: "analytics", label: "统计" },
  { key: "settings", label: "设置" },
  { key: "help", label: "帮助" },
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

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<JobStatus | "all">("all");
  const [input, setInput] = useState<JobApplicationInput>(defaultInput);
  const [resumeInput, setResumeInput] = useState<ResumeVersionInput>(defaultResumeInput);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [aiConfig, setAIConfig] = useState<AIProviderConfig>(defaultAIConfig);

  async function refresh(nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) {
    setIsLoading(true);
    const [nextApplications, nextResumes, nextInterviews] = await Promise.all([
      getApplications(),
      getResumes(),
      getInterviews(),
    ]);
    setApplications(nextApplications);
    setResumes(nextResumes);
    setInterviews(nextInterviews);
    setIsLoading(false);

    if (nextSelection?.applicationId !== undefined) {
      setSelectedId(nextSelection.applicationId);
    } else if (!selectedId && nextApplications.length > 0) {
      setSelectedId(nextApplications[0].id);
    }

    if (nextSelection?.resumeId !== undefined) {
      setSelectedResumeId(nextSelection.resumeId);
    } else if (!selectedResumeId && nextResumes.length > 0) {
      setSelectedResumeId(nextResumes[0].id);
    }
  }

  useEffect(() => {
    void refresh();
    setAIConfig(loadAIConfig());
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

  async function handleInterviewCreate(input: InterviewRecordInput) {
    await createInterview(input);
    await refresh();
  }

  async function handleInterviewDelete(interview: InterviewRecord) {
    await deleteInterview(interview.id);
    await refresh();
  }

  function handleExportData() {
    const data = buildExportData({ applications, resumes, interviews });
    downloadJson(data, `developer-job-hunt-crm-${new Date().toISOString().slice(0, 10)}.json`);
    setSettingsMessage("已导出当前本地数据。");
  }

  async function handleImportFile(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = parseImportData(text);
      await replaceAllData(data);
      await refresh({
        applicationId: data.applications[0]?.id ?? null,
        resumeId: data.resumes[0]?.id ?? null,
      });
      setSettingsMessage("导入完成，已替换当前本地数据。");
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : "导入失败，请检查文件格式。");
    }
  }

  async function handleLoadSampleData() {
    await replaceAllData(sampleData);
    await refresh({
      applicationId: "sample-app-1",
      resumeId: "sample-resume-1",
    });
    setSettingsMessage("已加载示例数据，可用于演示 JD 分析、简历匹配和面试复盘。");
  }

  function handleAIConfigSave(config: AIProviderConfig) {
    saveAIConfig(config);
    setAIConfig(config);
    setSettingsMessage(
      isAIConfigured(config)
        ? "AI 配置已保存，可在岗位详情和面试复盘中直接生成。"
        : "AI 配置已保存。当前未启用 Provider，仍使用零配置 Prompt Pack。",
    );
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
                  interviews={interviews.filter(
                    (interview) => interview.jobApplicationId === selectedApplication.id,
                  )}
                  aiConfig={aiConfig}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onResumeLink={handleApplicationResumeLink}
                  onInterviewCreate={handleInterviewCreate}
                  onInterviewDelete={handleInterviewDelete}
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

        {page === "interviews" && (
          <section className="panel">
            <div className="panel-header">
              <h2>面试复盘</h2>
            </div>
            {interviews.length === 0 ? (
              <p className="empty">还没有面试记录。进入岗位详情后可以添加一面、二面、HR 面等复盘。</p>
            ) : (
              <div className="interview-board">
                {interviews.map((interview) => {
                  const application = applications.find(
                    (item) => item.id === interview.jobApplicationId,
                  );
                  return (
                    <InterviewRecordCard
                      key={interview.id}
                      interview={interview}
                      application={application}
                      resume={resumes.find(
                        (resume) => resume.id === application?.resumeVersionId,
                      )}
                      aiConfig={aiConfig}
                      onDelete={handleInterviewDelete}
                    />
                  );
                })}
              </div>
            )}
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

        {page === "settings" && (
          <SettingsPage
            applicationsCount={applications.length}
            resumesCount={resumes.length}
            interviewsCount={interviews.length}
            message={settingsMessage}
            onExport={handleExportData}
            onImport={handleImportFile}
            onLoadSample={handleLoadSampleData}
            aiConfig={aiConfig}
            onAIConfigSave={handleAIConfigSave}
          />
        )}

        {page === "help" && <HelpPage />}
      </main>
    </div>
  );
}

function HelpPage() {
  return (
    <section className="page-grid">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>如何使用求职作战台</h2>
            <p>按岗位、简历、面试、AI 准备这条线，把求职过程沉淀成可复盘的数据。</p>
          </div>
        </div>
        <div className="help-steps">
          <article>
            <span>1</span>
            <div>
              <strong>录入目标岗位</strong>
              <p>进入“岗位”，添加公司、岗位、渠道、状态、JD 原文和下次跟进日期。JD 是后续关键词分析、简历匹配和 AI 准备的基础。</p>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <strong>维护简历版本</strong>
              <p>进入“简历”，为不同方向准备不同版本，例如 Flutter 出海、Android 金融、AI 应用开发。每个版本填写核心卖点和简历正文。</p>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <strong>关联岗位和简历</strong>
              <p>回到岗位详情，选择最匹配的简历版本，再生成简历匹配建议，查看已匹配点、缺失点和沟通话术。</p>
            </div>
          </article>
          <article>
            <span>4</span>
            <div>
              <strong>准备面试</strong>
              <p>在岗位详情点击“分析 JD”和“生成准备包”。未配置 AI 时可复制 Prompt；配置 Provider 后可直接生成面试准备内容。</p>
            </div>
          </article>
          <article>
            <span>5</span>
            <div>
              <strong>复盘面试</strong>
              <p>每轮面试后记录问题、标签、薄弱点、自我复盘和结果。之后可以生成参考答案 Prompt，持续改进表达。</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>常用入口</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>“概览”查看总投递、本周投递、回复率和跟进提醒。</li>
            <li>“统计”查看渠道分布和投递转化情况。</li>
            <li>“设置”导入导出 JSON，加载示例数据，配置 AI Provider。</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>AI 使用建议</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>默认使用本地建议和 Prompt Pack，不产生模型调用成本。</li>
            <li>需要页面内直接生成时，在“设置”里配置 OpenAI compatible 或 Ollama。</li>
            <li>API Key 只保存在当前浏览器 localStorage，不会进入导出的求职数据。</li>
          </ul>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <h2>推荐工作流</h2>
        </div>
        <div className="workflow-strip">
          <span>新增岗位</span>
          <i>→</i>
          <span>粘贴 JD</span>
          <i>→</i>
          <span>关联简历</span>
          <i>→</i>
          <span>生成准备包</span>
          <i>→</i>
          <span>面试复盘</span>
          <i>→</i>
          <span>调整简历</span>
        </div>
      </section>
    </section>
  );
}

function SettingsPage({
  applicationsCount,
  resumesCount,
  interviewsCount,
  message,
  onExport,
  onImport,
  onLoadSample,
  aiConfig,
  onAIConfigSave,
}: {
  applicationsCount: number;
  resumesCount: number;
  interviewsCount: number;
  message: string;
  onExport: () => void;
  onImport: (file: File | null) => void;
  onLoadSample: () => void;
  aiConfig: AIProviderConfig;
  onAIConfigSave: (config: AIProviderConfig) => void;
}) {
  const [draftAIConfig, setDraftAIConfig] = useState<AIProviderConfig>(aiConfig);
  const [showAIHelp, setShowAIHelp] = useState(false);

  useEffect(() => {
    setDraftAIConfig(aiConfig);
  }, [aiConfig]);

  return (
    <section className="page-grid">
      <MetricCard label="岗位记录" value={applicationsCount} />
      <MetricCard label="简历版本" value={resumesCount} />
      <MetricCard label="面试记录" value={interviewsCount} />

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <h2>数据导入导出</h2>
            <p>所有数据默认保存在本机浏览器 IndexedDB，可导出 JSON 备份。</p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="primary" onClick={onExport}>
            导出 JSON
          </button>
          <label className="file-action">
            导入 JSON
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                void onImport(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          <button className="secondary-action" type="button" onClick={onLoadSample}>
            加载示例数据
          </button>
        </div>
        {message && <p className="settings-message">{message}</p>}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>本地数据说明</h2>
        </div>
        <div className="text-list">
          <ul>
            <li>导入 JSON 会替换当前本地数据。</li>
            <li>示例数据可用于演示 JD 分析、简历匹配和面试复盘。</li>
            <li>卸载浏览器或清理站点数据可能导致本地记录丢失。</li>
          </ul>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <div className="title-with-help">
              <h2>AI Provider</h2>
              <button
                type="button"
                className="help-button"
                aria-label="查看 AI Provider 帮助"
                aria-expanded={showAIHelp}
                onClick={() => setShowAIHelp((value) => !value)}
              >
                ?
              </button>
              {showAIHelp && (
                <div className="help-popover" role="note">
                  <strong>AI Provider 怎么选？</strong>
                  <ul>
                    <li>不启用：使用本地建议和复制 Prompt，零成本、零配置。</li>
                    <li>OpenAI Compatible：填写兼容接口地址、模型和 API Key。</li>
                    <li>Ollama：填写本地地址和模型名，API Key 可留空。</li>
                    <li>API Key 只保存在当前浏览器 localStorage。</li>
                    <li>纯 Web 直连云 API 可能遇到 CORS 限制。</li>
                  </ul>
                </div>
              )}
            </div>
            <p>可选配置。未配置时仍可使用本地建议和一键复制 Prompt。</p>
          </div>
        </div>
        <form
          className="form-panel"
          onSubmit={(event) => {
            event.preventDefault();
            onAIConfigSave(draftAIConfig);
          }}
        >
          <div className="form-grid">
            <label>
              Provider
              <select
                value={draftAIConfig.provider}
                onChange={(event) =>
                  setDraftAIConfig({
                    ...draftAIConfig,
                    provider: event.target.value as AIProviderConfig["provider"],
                  })
                }
              >
                <option value="none">不启用，使用 Prompt Pack</option>
                <option value="openai-compatible">OpenAI Compatible</option>
                <option value="ollama">Ollama 本地模型</option>
              </select>
            </label>
            <label>
              Model
              <input
                value={draftAIConfig.model}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, model: event.target.value })
                }
                placeholder="gpt-4.1-mini / deepseek-chat / qwen2.5"
              />
            </label>
            <label>
              Base URL
              <input
                value={draftAIConfig.baseUrl}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, baseUrl: event.target.value })
                }
                placeholder="https://api.openai.com / http://localhost:11434"
              />
            </label>
            <label>
              API Key
              <input
                type="password"
                value={draftAIConfig.apiKey}
                onChange={(event) =>
                  setDraftAIConfig({ ...draftAIConfig, apiKey: event.target.value })
                }
                placeholder="Ollama 可留空"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary" type="submit">
              保存 AI 配置
            </button>
          </div>
        </form>
      </section>
    </section>
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
  interviews,
  aiConfig,
  onEdit,
  onDelete,
  onStatusChange,
  onResumeLink,
  onInterviewCreate,
  onInterviewDelete,
}: {
  application: JobApplication;
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
  aiConfig: AIProviderConfig;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobStatus) => void;
  onResumeLink: (application: JobApplication, resumeVersionId: string) => void;
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
}) {
  const [analysis, setAnalysis] = useState<JDAnalysisResult | null>(null);
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null);
  const [prepPack, setPrepPack] = useState<InterviewPrepPack | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [aiPrepResult, setAIPrepResult] = useState("");
  const [aiPrepStatus, setAIPrepStatus] = useState("");
  const linkedResume = resumes.find((resume) => resume.id === application.resumeVersionId);

  useEffect(() => {
    setAnalysis(null);
    setMatchResult(null);
    setPrepPack(null);
    setCopyMessage("");
    setAIPrepResult("");
    setAIPrepStatus("");
  }, [application.id, application.jdText]);

  async function handleCopyPrepPrompt(prompt: string) {
    await copyText(prompt);
    setCopyMessage("已复制面试准备 Prompt，可粘贴到 ChatGPT / DeepSeek / 豆包。");
  }

  async function handleGeneratePrepWithAI(prompt: string) {
    if (!isAIConfigured(aiConfig)) {
      setAIPrepStatus("请先在设置页配置 AI Provider，或继续使用复制 Prompt。");
      return;
    }

    try {
      setAIPrepStatus("AI 生成中...");
      const result = await generateAICompletion({ prompt, config: aiConfig });
      setAIPrepResult(result);
      setAIPrepStatus("AI 生成完成。");
    } catch (error) {
      setAIPrepStatus(
        error instanceof Error ? error.message : "AI 生成失败，请检查配置。",
      );
    }
  }

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
      <div className="ai-panel">
        <div className="section-title-row">
          <div>
            <h3>AI 面试准备</h3>
            <p>零配置生成基础准备建议，也可复制完整 Prompt 到常用 AI。</p>
          </div>
          <button
            type="button"
            className="secondary-action"
            disabled={!application.jdText.trim()}
            onClick={() => setPrepPack(buildInterviewPrepPack(application, linkedResume))}
          >
            生成准备包
          </button>
        </div>
        {prepPack ? (
          <PromptPackCard
            title="面试准备包"
            prompt={prepPack.prompt}
            copyLabel="复制 Prompt"
            onCopy={() => handleCopyPrepPrompt(prepPack.prompt)}
            onGenerateAI={() => handleGeneratePrepWithAI(prepPack.prompt)}
            aiEnabled={isAIConfigured(aiConfig)}
            aiStatus={aiPrepStatus}
            aiText={aiPrepResult}
            message={copyMessage}
          >
            <TextList title="重点准备" values={prepPack.focusAreas} />
            <TextList title="可能被问" values={prepPack.likelyQuestions} />
            <TextList title="项目素材" values={prepPack.projectStories} />
            <TextList title="复习清单" values={prepPack.reviewChecklist} />
          </PromptPackCard>
        ) : (
          <p className="empty">粘贴 JD 后可生成面试准备建议。关联简历后，Prompt 会自动带上简历卖点。</p>
        )}
      </div>
      <div className="detail-section">
        <h3>备注</h3>
        <p>{application.notes || "暂未填写备注。"}</p>
      </div>
      <InterviewSection
        application={application}
        resume={linkedResume}
        aiConfig={aiConfig}
        interviews={interviews}
        onInterviewCreate={onInterviewCreate}
        onInterviewDelete={onInterviewDelete}
      />
    </section>
  );
}

function InterviewSection({
  application,
  resume,
  aiConfig,
  interviews,
  onInterviewCreate,
  onInterviewDelete,
}: {
  application: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  interviews: InterviewRecord[];
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
}) {
  const [round, setRound] = useState<InterviewRound>("first");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewerType, setInterviewerType] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [tagsText, setTagsText] = useState("项目经历\n架构设计");
  const [weakPointsText, setWeakPointsText] = useState("");
  const [selfReview, setSelfReview] = useState("");
  const [result, setResult] = useState<InterviewResult>("pending");
  const [summary, setSummary] = useState("");

  function resetForm() {
    setRound("first");
    setScheduledAt("");
    setInterviewerType("");
    setQuestionsText("");
    setTagsText("项目经历\n架构设计");
    setWeakPointsText("");
    setSelfReview("");
    setResult("pending");
    setSummary("");
  }

  function parseLines(text: string): string[] {
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const questions = parseLines(questionsText).map<InterviewQuestion>((question) => ({
      id: `${Date.now()}-${question}`,
      question,
      tags: parseLines(tagsText),
    }));

    onInterviewCreate({
      jobApplicationId: application.id,
      round,
      scheduledAt,
      interviewerType,
      questions,
      selfReview,
      weakPoints: parseLines(weakPointsText),
      result,
      summary,
    });
    resetForm();
  }

  return (
    <section className="interview-section">
      <div className="section-title-row">
        <h3>面试记录</h3>
        <span className="muted-count">{interviews.length} 条</span>
      </div>
      <form className="interview-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            轮次
            <select
              value={round}
              onChange={(event) => setRound(event.target.value as InterviewRound)}
            >
              {Object.entries(interviewRoundLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            面试时间
            <input
              type="date"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
          <label>
            面试官类型
            <input
              value={interviewerType}
              onChange={(event) => setInterviewerType(event.target.value)}
              placeholder="技术负责人 / HR / 业务面"
            />
          </label>
          <label>
            结果
            <select
              value={result}
              onChange={(event) => setResult(event.target.value as InterviewResult)}
            >
              {Object.entries(interviewResultLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          面试问题
          <textarea
            value={questionsText}
            onChange={(event) => setQuestionsText(event.target.value)}
            placeholder="每行一个问题，例如：你如何做 Flutter 多语言？"
            rows={4}
          />
        </label>
        <label>
          问题标签
          <textarea
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="每行一个标签"
            rows={2}
          />
        </label>
        <label>
          薄弱点
          <textarea
            value={weakPointsText}
            onChange={(event) => setWeakPointsText(event.target.value)}
            placeholder="每行一个需要补强的点"
            rows={2}
          />
        </label>
        <label>
          自我复盘
          <textarea
            value={selfReview}
            onChange={(event) => setSelfReview(event.target.value)}
            placeholder="这轮哪里答得好，哪里需要改"
            rows={3}
          />
        </label>
        <label>
          总结
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="一句话总结这轮面试"
          />
        </label>
        <div className="form-actions">
          <button className="primary" type="submit">
            保存面试记录
          </button>
        </div>
      </form>
      <div className="interview-board">
        {interviews.map((interview) => (
          <InterviewRecordCard
            key={interview.id}
            interview={interview}
            application={application}
            resume={resume}
            aiConfig={aiConfig}
            onDelete={onInterviewDelete}
          />
        ))}
      </div>
    </section>
  );
}

function InterviewRecordCard({
  interview,
  application,
  resume,
  aiConfig,
  onDelete,
}: {
  interview: InterviewRecord;
  application?: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  onDelete: (interview: InterviewRecord) => void;
}) {
  const [answerPack, setAnswerPack] = useState<InterviewAnswerPack | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [aiAnswerResult, setAIAnswerResult] = useState("");
  const [aiAnswerStatus, setAIAnswerStatus] = useState("");

  async function handleCopyAnswerPrompt(prompt: string) {
    await copyText(prompt);
    setCopyMessage("已复制参考答案 Prompt。");
  }

  async function handleGenerateAnswerWithAI(prompt: string) {
    if (!isAIConfigured(aiConfig)) {
      setAIAnswerStatus("请先在设置页配置 AI Provider，或继续使用复制 Prompt。");
      return;
    }

    try {
      setAIAnswerStatus("AI 生成中...");
      const result = await generateAICompletion({ prompt, config: aiConfig });
      setAIAnswerResult(result);
      setAIAnswerStatus("AI 生成完成。");
    } catch (error) {
      setAIAnswerStatus(
        error instanceof Error ? error.message : "AI 生成失败，请检查配置。",
      );
    }
  }

  return (
    <article className="interview-card">
      <div className="interview-card-header">
        <div>
          <strong>{interviewRoundLabels[interview.round]}</strong>
          <span>{application ? `${application.companyName} · ${application.jobTitle}` : "未知岗位"}</span>
        </div>
        <button className="danger-lite" onClick={() => onDelete(interview)}>
          删除
        </button>
      </div>
      <div className="detail-grid compact">
        <span>时间</span>
        <strong>{interview.scheduledAt || "未填写"}</strong>
        <span>面试官</span>
        <strong>{interview.interviewerType || "未填写"}</strong>
        <span>结果</span>
        <strong>{interviewResultLabels[interview.result]}</strong>
      </div>
      {interview.summary && <p className="interview-summary">{interview.summary}</p>}
      <TextList
        title="问题"
        values={interview.questions.map((question) => question.question)}
      />
      <KeywordGroup
        title="标签"
        values={Array.from(new Set(interview.questions.flatMap((question) => question.tags)))}
      />
      <TextList title="薄弱点" values={interview.weakPoints} />
      {interview.selfReview && (
        <div className="detail-section">
          <h3>自我复盘</h3>
          <p>{interview.selfReview}</p>
        </div>
      )}
      <div className="ai-panel compact">
        <div className="section-title-row">
          <h3>AI 参考答案</h3>
          <button
            className="secondary-action"
            type="button"
            onClick={() =>
              setAnswerPack(
                buildInterviewAnswerPack({
                  interview,
                  application,
                  resume,
                }),
              )
            }
          >
            生成 Prompt
          </button>
        </div>
        {answerPack && (
          <PromptPackCard
            title="参考答案 Prompt"
            prompt={answerPack.prompt}
            copyLabel="复制 Prompt"
            onCopy={() => handleCopyAnswerPrompt(answerPack.prompt)}
            onGenerateAI={() => handleGenerateAnswerWithAI(answerPack.prompt)}
            aiEnabled={isAIConfigured(aiConfig)}
            aiStatus={aiAnswerStatus}
            aiText={aiAnswerResult}
            message={copyMessage}
          >
            <TextList title="回答角度" values={answerPack.answerAngles} />
            <TextList title="STAR 结构" values={answerPack.starTemplate} />
            <TextList title="可能追问" values={answerPack.followUpQuestions} />
          </PromptPackCard>
        )}
      </div>
    </article>
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

function PromptPackCard({
  title,
  prompt,
  copyLabel,
  message,
  aiEnabled,
  aiStatus,
  aiText,
  onCopy,
  onGenerateAI,
  children,
}: {
  title: string;
  prompt: string;
  copyLabel: string;
  message: string;
  aiEnabled: boolean;
  aiStatus: string;
  aiText: string;
  onCopy: () => void;
  onGenerateAI: () => void;
  children: ReactNode;
}) {
  return (
    <div className="prompt-pack">
      <div className="prompt-pack-header">
        <span>{title}</span>
        <div className="prompt-actions">
          <button className="secondary-action" type="button" onClick={onGenerateAI}>
            {aiEnabled ? "直接生成" : "未配置 AI"}
          </button>
          <button className="secondary-action" type="button" onClick={onCopy}>
            {copyLabel}
          </button>
        </div>
      </div>
      <div className="prompt-pack-grid">{children}</div>
      {aiStatus && <p className="ai-status">{aiStatus}</p>}
      {aiText && (
        <div className="ai-result">
          <span>AI 结果</span>
          <pre>{aiText}</pre>
        </div>
      )}
      <details className="prompt-preview">
        <summary>查看完整 Prompt</summary>
        <pre>{prompt}</pre>
      </details>
      {message && <p className="settings-message">{message}</p>}
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
