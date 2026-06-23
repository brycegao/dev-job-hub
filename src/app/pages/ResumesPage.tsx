import { type FormEvent } from "react";
import type { ResumeVersion, ResumeVersionInput } from "../../features/resumes/types";
import { ResumeForm } from "../components/ResumeForm";
import { ResumeDetail } from "../components/ResumeDetail";

export function ResumesPage({
  resumes,
  selectedResumeId,
  resumeInput,
  isEditingResume,
  formVisible,
  onSelectResume,
  onInputChange,
  onSubmit,
  onCancelEdit,
  onEdit,
  onDelete,
  onShowCreateForm,
}: {
  resumes: ResumeVersion[];
  selectedResumeId: string | null;
  resumeInput: ResumeVersionInput;
  isEditingResume: boolean;
  formVisible: boolean;
  onSelectResume: (id: string | null) => void;
  onInputChange: (input: ResumeVersionInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onEdit: (resume: ResumeVersion) => void;
  onDelete: (resume: ResumeVersion) => void;
  onShowCreateForm: () => void;
}) {
  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);

  return (
    <section className="workspace">
      <div className="list-pane">
        <div className="panel-header">
          <h2>简历版本</h2>
          <button className="secondary-action" type="button" onClick={onShowCreateForm}>
            新增简历
          </button>
        </div>
        {resumes.length === 0 ? (
          <div className="inline-hint">
            <div className="inline-hint-icon">📄</div>
            <div className="inline-hint-body">
              <span className="inline-hint-step">第 2 步</span>
              <div className="inline-hint-title">创建简历版本</div>
              <div className="inline-hint-desc">多简历版本可与不同岗位 JD 交叉匹配，找出简历差距。</div>
            </div>
          </div>
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
        {formVisible ? (
          <ResumeForm
            input={resumeInput}
            isEditing={isEditingResume}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            onCancel={onCancelEdit}
          />
        ) : selectedResume ? (
          <ResumeDetail
            resume={selectedResume}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <div className="inline-hint">
            <div className="inline-hint-icon">👆</div>
            <div className="inline-hint-body">
              <div className="inline-hint-title">选择左侧简历查看详情</div>
              <div className="inline-hint-desc">查看核心卖点、简历正文，以及与 JD 的匹配分析。</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
