import { useMemo, useState, type FormEvent } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import {
  activeStatuses,
  closedStatuses,
  statusLabels,
  statusPillClass,
  statusTransitions,
  type JobApplication,
  type JobApplicationInput,
  type JobStatus,
} from "../../features/applications/types";
import type { InterviewRecord, InterviewRecordInput } from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { ApplicationDetail } from "../components/ApplicationDetail";
import { ApplicationForm } from "../components/ApplicationForm";

function matchesSearch(application: JobApplication, keyword: string): boolean {
  const lowered = keyword.toLowerCase();
  return (
    application.companyName.toLowerCase().includes(lowered) ||
    application.jobTitle.toLowerCase().includes(lowered) ||
    (application.channel || "").toLowerCase().includes(lowered) ||
    (application.city || "").toLowerCase().includes(lowered) ||
    (application.jdText || "").toLowerCase().includes(lowered) ||
    (application.notes || "").toLowerCase().includes(lowered)
  );
}

export function ApplicationsPage({
  isLoading,
  applications,
  filteredApplications,
  selectedId,
  filterStatus,
  input,
  isEditing,
  formVisible,
  resumes,
  interviews,
  aiConfig,
  onFilterChange,
  onSelectApplication,
  onInputChange,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
  onStatusChange,
  onResumeLink,
  onInterviewCreate,
  onInterviewDelete,
  onInterviewUpdate,
}: {
  isLoading: boolean;
  applications: JobApplication[];
  filteredApplications: JobApplication[];
  selectedId: string | null;
  filterStatus: JobStatus | "all";
  input: JobApplicationInput;
  isEditing: boolean;
  formVisible: boolean;
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
  aiConfig: AIProviderConfig;
  onFilterChange: (status: JobStatus | "all") => void;
  onSelectApplication: (id: string | null) => void;
  onInputChange: (input: JobApplicationInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobStatus) => void;
  onResumeLink: (application: JobApplication, resumeVersionId: string) => void;
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
  onInterviewUpdate: (interview: InterviewRecord) => void;
}) {
  const [searchText, setSearchText] = useState("");

  const channelHistory = useMemo(
    () => Array.from(new Set(applications.map((a) => a.channel).filter(Boolean))),
    [applications],
  );

  const displayedApplications = useMemo(() => {
    if (!searchText.trim()) return filteredApplications;
    return filteredApplications.filter((app) => matchesSearch(app, searchText));
  }, [filteredApplications, searchText]);

  const selectedApplication = applications.find(
    (application) => application.id === selectedId,
  );

  const showForm = formVisible;

  return (
    <section className="workspace">
      <div className="list-pane">
        <div className="panel-header">
          <h2>岗位列表</h2>
        </div>
        <div className="list-filters">
          <input
            className="search-input"
            placeholder="搜索公司 / 岗位 / JD..."
            aria-label="搜索岗位"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            aria-label="按状态筛选"
            value={filterStatus}
            onChange={(event) =>
              onFilterChange(event.target.value as JobStatus | "all")
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
        ) : displayedApplications.length === 0 ? (
          searchText ? (
            <p className="empty">没有匹配的结果。</p>
          ) : (
            <div className="inline-hint">
              <div className="inline-hint-icon">📋</div>
              <div className="inline-hint-body">
                <span className="inline-hint-step">第 1 步</span>
                <div className="inline-hint-title">添加你的第一个目标岗位</div>
                <div className="inline-hint-desc">点击右上角「新增岗位」，粘贴招聘 JD —— 薪资、城市、渠道会自动提取。</div>
              </div>
            </div>
          )
        ) : (
          <div className="application-list">
            {displayedApplications.map((application) => (
              <button
                key={application.id}
                className={selectedId === application.id ? "selected" : ""}
                onClick={() => onSelectApplication(application.id)}
              >
                <span
                  className={`status-pill ${statusPillClass[application.status]}`}
                  title={statusTransitions[application.status].length > 0
                    ? `点击切换到「${statusLabels[statusTransitions[application.status][0]]}」`
                    : undefined}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    const transitions = statusTransitions[application.status];
                    if (transitions.length > 0) {
                      onStatusChange(application, transitions[0]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      const transitions = statusTransitions[application.status];
                      if (transitions.length > 0) {
                        onStatusChange(application, transitions[0]);
                      }
                    }
                  }}
                >{statusLabels[application.status]}</span>
                <strong>{application.companyName}</strong>
                <span>{application.jobTitle}</span>
                <small>{application.channel} · {application.appliedAt || "未投递"}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-pane">
        {showForm ? (
          <ApplicationForm
            input={input}
            isEditing={isEditing}
            channelHistory={channelHistory}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            onCancel={onCancelEdit}
          />
        ) : selectedApplication ? (
          <ApplicationDetail
            application={selectedApplication}
            resumes={resumes}
            interviews={interviews.filter(
              (interview) => interview.jobApplicationId === selectedApplication.id,
            )}
            aiConfig={aiConfig}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onResumeLink={onResumeLink}
            onInterviewCreate={onInterviewCreate}
            onInterviewDelete={onInterviewDelete}
            onInterviewUpdate={onInterviewUpdate}
          />
        ) : (
          <div className="inline-hint">
            <div className="inline-hint-icon">👆</div>
            <div className="inline-hint-body">
              <div className="inline-hint-title">选择左侧岗位查看详情</div>
              <div className="inline-hint-desc">查看 JD 分析结果、关联简历版本、添加面试记录。</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
