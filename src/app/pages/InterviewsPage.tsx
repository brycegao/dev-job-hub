import { useMemo, useState } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import type { InterviewRecord } from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { InterviewRecordCard } from "../components/InterviewRecordCard";
import { exportAllInterviewsToCalendar } from "../../features/interviews/services/calendarExportService";

function matchesSearch(
  interview: InterviewRecord,
  keyword: string,
  applicationMap: Map<string, JobApplication>,
): boolean {
  const lowered = keyword.toLowerCase();
  const app = applicationMap.get(interview.jobApplicationId);
  if (app) {
    if (
      app.companyName.toLowerCase().includes(lowered) ||
      app.jobTitle.toLowerCase().includes(lowered)
    ) {
      return true;
    }
  }
  if (
    (interview.interviewerType || "").toLowerCase().includes(lowered) ||
    (interview.summary || "").toLowerCase().includes(lowered) ||
    (interview.inviteNotes || "").toLowerCase().includes(lowered)
  ) {
    return true;
  }
  return interview.questions.some((q) =>
    q.question.toLowerCase().includes(lowered),
  );
}

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
  const [searchText, setSearchText] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const applicationMap = useMemo(
    () => new Map(applications.map((a) => [a.id, a])),
    [applications],
  );

  const displayedInterviews = useMemo(() => {
    if (!searchText.trim()) return interviews;
    return interviews.filter((i) => matchesSearch(i, searchText, applicationMap));
  }, [interviews, searchText, applicationMap]);

  const hasScheduledInterviews = displayedInterviews.some((i) => i.scheduledAt);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>面试复盘</h2>
        {hasScheduledInterviews && (
          <button
            className="secondary-action"
            onClick={() => {
              exportAllInterviewsToCalendar(displayedInterviews, applications);
              setExportMsg("已导出日程文件");
              setTimeout(() => setExportMsg(""), 2000);
            }}
          >
            {exportMsg || "导出全部日程"}
          </button>
        )}
      </div>
      <div className="list-filters">
        <input
          className="search-input"
          placeholder="搜索公司 / 问题 / 备注..."
          aria-label="搜索面试"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {displayedInterviews.length === 0 ? (
        searchText ? (
          <p className="empty">没有匹配的结果。</p>
        ) : (
          <div className="inline-hint">
            <div className="inline-hint-icon">🎙️</div>
            <div className="inline-hint-body">
              <span className="inline-hint-step">第 3 步</span>
              <div className="inline-hint-title">记录面试复盘</div>
              <div className="inline-hint-desc">进入「岗位」页选择目标岗位，添加一面、二面、HR 面等面试记录，结构化复盘。</div>
            </div>
          </div>
        )
      ) : (
        <div className="interview-board">
          {displayedInterviews.map((interview) => {
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
