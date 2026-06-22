import { type FormEvent } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import {
  activeStatuses,
  closedStatuses,
  statusLabels,
  type JobApplication,
  type JobApplicationInput,
  type JobStatus,
} from "../../features/applications/types";
import type { InterviewRecord, InterviewRecordInput } from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { ApplicationDetail } from "../components/ApplicationDetail";
import { ApplicationForm } from "../components/ApplicationForm";

export function ApplicationsPage({
  isLoading,
  filteredApplications,
  selectedId,
  filterStatus,
  input,
  isEditing,
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
}: {
  isLoading: boolean;
  filteredApplications: JobApplication[];
  selectedId: string | null;
  filterStatus: JobStatus | "all";
  input: JobApplicationInput;
  isEditing: boolean;
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
}) {
  const selectedApplication = filteredApplications.find(
    (application) => application.id === selectedId,
  );

  return (
    <section className="workspace">
      <div className="list-pane">
        <div className="panel-header">
          <h2>岗位列表</h2>
          <select
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
        ) : filteredApplications.length === 0 ? (
          <p className="empty">还没有岗位记录。先新增一个目标岗位。</p>
        ) : (
          <div className="application-list">
            {filteredApplications.map((application) => (
              <button
                key={application.id}
                className={selectedId === application.id ? "selected" : ""}
                onClick={() => onSelectApplication(application.id)}
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
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          onCancel={onCancelEdit}
        />

        {selectedApplication && (
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
          />
        )}
      </div>
    </section>
  );
}
