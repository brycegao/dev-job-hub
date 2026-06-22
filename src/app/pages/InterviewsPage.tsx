import type { AIProviderConfig } from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import type { InterviewRecord } from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { InterviewRecordCard } from "../components/InterviewRecordCard";

export function InterviewsPage({
  interviews,
  applications,
  resumes,
  aiConfig,
  onDelete,
  onUpdate,
}: {
  interviews: InterviewRecord[];
  applications: JobApplication[];
  resumes: ResumeVersion[];
  aiConfig: AIProviderConfig;
  onDelete: (interview: InterviewRecord) => void;
  onUpdate: (interview: InterviewRecord) => void;
}) {
  return (
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
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
