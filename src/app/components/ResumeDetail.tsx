import type { ResumeVersion } from "../../features/resumes/types";
import { confirmDelete } from "../constants";

export function ResumeDetail({
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
          <button className="danger" onClick={() => {
            if (confirmDelete("简历版本")) onDelete(resume);
          }}>
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
