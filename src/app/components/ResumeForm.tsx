import { type FormEvent } from "react";
import type { ResumeVersionInput } from "../../features/resumes/types";

export function ResumeForm({
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
