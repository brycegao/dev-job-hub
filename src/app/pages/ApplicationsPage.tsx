import { useMemo, useState, type FormEvent } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import {
  activeStatuses,
  closedStatuses,
  statusLabels,
  statusPillClass,
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
          <p className="empty">
            {searchText ? "没有匹配的结果。" : "还没有岗位记录。先新增一个目标岗位。"}
          </p>
        ) : (
          <div className="application-list">
            {displayedApplications.map((application) => (
              <button
                key={application.id}
                className={selectedId === application.id ? "selected" : ""}
                onClick={() => onSelectApplication(application.id)}
              >
                <span className={`status-pill ${statusPillClass[application.status]}`}>{statusLabels[application.status]}</span>
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
          <p className="empty">选择左侧岗位查看详情，或点击「新增岗位」创建。</p>
        )}
      </div>
    </section>
  );
}
