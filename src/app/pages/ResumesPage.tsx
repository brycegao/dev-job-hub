import { type FormEvent } from "react";
import type { ResumeVersion, ResumeVersionInput } from "../../features/resumes/types";
import { ResumeForm } from "../components/ResumeForm";
import { ResumeDetail } from "../components/ResumeDetail";

export function ResumesPage({
  resumes,
  selectedResumeId,
  resumeInput,
  isEditingResume,
  onSelectResume,
  onInputChange,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  resumes: ResumeVersion[];
  selectedResumeId: string | null;
  resumeInput: ResumeVersionInput;
  isEditingResume: boolean;
  onSelectResume: (id: string | null) => void;
  onInputChange: (input: ResumeVersionInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onEdit: (resume: ResumeVersion) => void;
  onDelete: (resume: ResumeVersion) => void;
}) {
  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);

  return (
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
                onClick={() => onSelectResume(resume.id)}
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
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          onCancel={onCancelEdit}
        />
        {selectedResume && (
          <ResumeDetail
            resume={selectedResume}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </section>
  );
}
