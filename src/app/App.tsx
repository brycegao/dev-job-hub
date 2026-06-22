/**
 * 应用根组件。
 * 管理页面路由、全局数据加载和各子模块的状态协调。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApplicationMetrics } from "../features/analytics/services/applicationAnalytics";
import { getApplications } from "../features/applications/services/applicationService";
import { getInterviews } from "../features/interviews/services/interviewService";
import { getResumes } from "../features/resumes/services/resumeService";
import { navItems, type Page } from "./constants";
import { useApplicationData } from "./hooks/useApplicationData";
import { useInterviewData } from "./hooks/useInterviewData";
import { useResumeData } from "./hooks/useResumeData";
import { useSettings } from "./hooks/useSettings";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HelpPage } from "./pages/HelpPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { ResumesPage } from "./pages/ResumesPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  checkAndNotify,
  getNotificationPermission,
  requestNotificationPermission,
} from "../shared/services/notificationService";

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notifyPermission, setNotifyPermission] = useState(getNotificationPermission());
  type RefreshFn = (nextSelection?: { applicationId?: string | null; resumeId?: string | null }) => Promise<void>;
  const refreshRef = useRef<RefreshFn>(undefined);

  /** 安全调用 refresh，避免首次 render 前 refreshRef 为空 */
  function callRefresh(...args: Parameters<RefreshFn>): Promise<void> {
    return refreshRef.current ? refreshRef.current(...args) : Promise.resolve();
  }

  const interviewData = useInterviewData({
    refresh: () => callRefresh(),
    onError: setErrorMessage,
  });
  const appData = useApplicationData({
    refresh: callRefresh,
    setPage,
    deleteInterviewsByApplication: interviewData.deleteInterviewsByApplication,
    onError: setErrorMessage,
  });
  const resumeData = useResumeData({
    refresh: callRefresh,
    setPage,
    onError: setErrorMessage,
    applications: appData.applications,
  });
  const settings = useSettings({
    applications: appData.applications,
    resumes: resumeData.resumes,
    interviews: interviewData.interviews,
    refresh: callRefresh,
  });

  /** 从 IndexedDB 重新加载所有数据，并可选地设置选中项 */
  async function refresh(nextSelection?: {
    applicationId?: string | null;
    resumeId?: string | null;
  }) {
    setIsLoading(true);
    try {
      const [nextApplications, nextResumes, nextInterviews] = await Promise.all([
        getApplications(),
        getResumes(),
        getInterviews(),
      ]);
      appData.setApplicationsFromRefresh(nextApplications);
      resumeData.setResumesFromRefresh(nextResumes);
      interviewData.setInterviewsFromRefresh(nextInterviews);

      if (nextSelection?.applicationId !== undefined) {
        appData.setSelectedId(nextSelection.applicationId);
      } else if (!appData.selectedId && nextApplications.length > 0) {
        appData.setSelectedId(nextApplications[0].id);
      }

      if (nextSelection?.resumeId !== undefined) {
        resumeData.setSelectedResumeId(nextSelection.resumeId);
      } else if (!resumeData.selectedResumeId && nextResumes.length > 0) {
        resumeData.setSelectedResumeId(nextResumes[0].id);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
      setErrorMessage("数据加载失败，请刷新页面重试。");
    } finally {
      setIsLoading(false);
    }
  }

  refreshRef.current = refresh;

  /** 首次加载数据后检查并发送浏览器通知 */
  useEffect(() => {
    void refresh();
    settings.initAIConfig();
  }, []);

  useEffect(() => {
    if (appData.applications.length === 0 || notifyPermission !== "granted") return;
    const applicationMap = new Map(appData.applications.map((a) => [a.id, a]));
    checkAndNotify(interviewData.interviews, appData.applications, applicationMap);
  }, [appData.applications.length, notifyPermission]);

  async function handleEnableNotify() {
    const granted = await requestNotificationPermission();
    setNotifyPermission(granted ? "granted" : "denied");
  }

  const metrics = useMemo(
    () => buildApplicationMetrics(appData.applications, interviewData.interviews),
    [appData.applications, interviewData.interviews],
  );

  const handleFollowUpClick = useCallback((id: string) => {
    appData.setSelectedId(id);
    setPage("applications");
  }, [appData.setSelectedId]);

  const handleSelectApplication = useCallback((id: string | null) => {
    appData.setSelectedId(id);
    appData.hideForm();
  }, [appData.setSelectedId, appData.hideForm]);

  const handleApplicationsCancelEdit = useCallback(() => appData.hideForm(), [appData.hideForm]);

  const handleResumesCancelEdit = useCallback(() => {
    resumeData.setResumeInput({ name: "", targetRole: "", content: "", filePath: "", highlights: [] });
    resumeData.setIsEditingResume(false);
  }, [resumeData.setResumeInput, resumeData.setIsEditingResume]);

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
            onClick={() => appData.showCreateForm()}
          >
            新增岗位
          </button>
          {notifyPermission !== "granted" && (
            <button className="secondary-action" onClick={handleEnableNotify}>
              🔔 开启提醒
            </button>
          )}
        </header>
        {errorMessage && (
          <div className="error-banner" role="alert">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")}>×</button>
          </div>
        )}

        {page === "dashboard" && (
          <DashboardPage
            metrics={metrics}
            onFollowUpClick={handleFollowUpClick}
          />
        )}

        {page === "applications" && (
          <ApplicationsPage
            isLoading={isLoading}
            applications={appData.applications}
            filteredApplications={appData.filteredApplications}
            selectedId={appData.selectedId}
            filterStatus={appData.filterStatus}
            input={appData.input}
            isEditing={appData.isEditing}
            formVisible={appData.formVisible}
            resumes={resumeData.resumes}
            interviews={interviewData.interviews}
            aiConfig={settings.aiConfig}
            onFilterChange={appData.setFilterStatus}
            onSelectApplication={handleSelectApplication}
            onInputChange={appData.setInput}
            onSubmit={appData.handleSubmit}
            onCancelEdit={handleApplicationsCancelEdit}
            onEdit={appData.startEdit}
            onDelete={appData.handleDelete}
            onStatusChange={appData.handleStatusChange}
            onResumeLink={appData.handleApplicationResumeLink}
            onInterviewCreate={interviewData.handleInterviewCreate}
            onInterviewDelete={interviewData.handleInterviewDelete}
            onInterviewUpdate={interviewData.handleInterviewUpdate}
          />
        )}

        {page === "resumes" && (
          <ResumesPage
            resumes={resumeData.resumes}
            selectedResumeId={resumeData.selectedResumeId}
            resumeInput={resumeData.resumeInput}
            isEditingResume={resumeData.isEditingResume}
            onSelectResume={resumeData.setSelectedResumeId}
            onInputChange={resumeData.setResumeInput}
            onSubmit={resumeData.handleResumeSubmit}
            onCancelEdit={handleResumesCancelEdit}
            onEdit={resumeData.startResumeEdit}
            onDelete={resumeData.handleResumeDelete}
          />
        )}

        {page === "interviews" && (
          <InterviewsPage
            interviews={interviewData.interviews}
            applications={appData.applications}
            resumes={resumeData.resumes}
            aiConfig={settings.aiConfig}
            onDelete={interviewData.handleInterviewDelete}
            onUpdate={interviewData.handleInterviewUpdate}
          />
        )}

        {page === "analytics" && <AnalyticsPage metrics={metrics} />}

        {page === "settings" && (
          <SettingsPage
            applicationsCount={appData.applications.length}
            resumesCount={resumeData.resumes.length}
            interviewsCount={interviewData.interviews.length}
            message={settings.settingsMessage}
            onExport={settings.handleExportData}
            onImport={settings.handleImportFile}
            onLoadSample={settings.handleLoadSampleData}
            aiConfig={settings.aiConfig}
            onAIConfigSave={settings.handleAIConfigSave}
          />
        )}

        {page === "help" && <HelpPage />}
      </main>
    </div>
  );
}
