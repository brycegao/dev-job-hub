import { useRef, useState, type FormEvent } from "react";
import { extractJDFields } from "../../features/jd-analysis/services/jdAnalysisService";
import {
  activeStatuses,
  remoteTypeLabels,
  statusLabels,
  type JobApplicationInput,
  type JobStatus,
  type RemoteType,
} from "../../features/applications/types";

const autoFillLabels: Record<string, string> = {
  companyName: "公司",
  jobTitle: "岗位",
  channel: "渠道",
  jobUrl: "链接",
  city: "城市",
  salaryRange: "薪资",
  remoteType: "工作方式",
};

export function ApplicationForm({
  input,
  isEditing,
  channelHistory,
  onInputChange,
  onSubmit,
  onCancel,
}: {
  input: JobApplicationInput;
  isEditing: boolean;
  channelHistory?: string[];
  onInputChange: (next: JobApplicationInput) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [autoFillMessage, setAutoFillMessage] = useState("");
  const isPastingRef = useRef(false);

  function handleJDPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText.trim()) return;

    isPastingRef.current = true;

    // 让 React 先处理默认粘贴行为设置 jdText，再用 setTimeout 填充其他字段
    setTimeout(() => {
      const extracted = extractJDFields(pastedText);
      const patch: Partial<JobApplicationInput> = {};
      const filled = new Set<string>();

      if (extracted.companyName && !input.companyName) {
        patch.companyName = extracted.companyName;
        filled.add("companyName");
      }
      if (extracted.jobTitle && !input.jobTitle) {
        patch.jobTitle = extracted.jobTitle;
        filled.add("jobTitle");
      }
      if (extracted.channel && input.channel !== extracted.channel) {
        patch.channel = extracted.channel;
        filled.add("channel");
      }
      if (extracted.jobUrl && !input.jobUrl) {
        patch.jobUrl = extracted.jobUrl;
        filled.add("jobUrl");
      }
      if (extracted.salaryRange && !input.salaryRange) {
        patch.salaryRange = extracted.salaryRange;
        filled.add("salaryRange");
      }
      if (extracted.city && !input.city) {
        patch.city = extracted.city;
        filled.add("city");
      }
      if (extracted.remoteType && input.remoteType !== extracted.remoteType) {
        patch.remoteType = extracted.remoteType;
        filled.add("remoteType");
      }

      if (Object.keys(patch).length > 0) {
        onInputChange({ ...input, ...patch });
        setAutoFilledFields(filled);
        setAutoFillMessage(
          `已自动填充：${Array.from(filled).map((field) => autoFillLabels[field]).join("、")}`,
        );
        // 1.5 秒后清除高亮
        setTimeout(() => setAutoFilledFields(new Set()), 1500);
        setTimeout(() => setAutoFillMessage(""), 4500);
      }

      isPastingRef.current = false;
    }, 0);
  }

  return (
    <form className="panel form-panel" onSubmit={onSubmit}>
      <div className="panel-header">
        <h2>{isEditing ? "编辑岗位" : "新增岗位"}</h2>
      </div>
      <div className="form-grid">
        <label>
          公司
          <input
            className={autoFilledFields.has("companyName") ? "auto-filled-highlight" : ""}
            value={input.companyName}
            onChange={(event) =>
              onInputChange({ ...input, companyName: event.target.value })
            }
            placeholder="例如：某出海工具团队"
            required
          />
        </label>
        <label>
          岗位
          <input
            className={autoFilledFields.has("jobTitle") ? "auto-filled-highlight" : ""}
            value={input.jobTitle}
            onChange={(event) =>
              onInputChange({ ...input, jobTitle: event.target.value })
            }
            placeholder="例如：Flutter 高级开发"
            required
          />
        </label>
        <label>
          渠道
          <input
            className={autoFilledFields.has("channel") ? "auto-filled-highlight" : ""}
            value={input.channel}
            onChange={(event) =>
              onInputChange({ ...input, channel: event.target.value })
            }
            list="channel-history"
          />
          {channelHistory && channelHistory.length > 0 && (
            <datalist id="channel-history">
              {channelHistory.map((ch) => (
                <option key={ch} value={ch} />
              ))}
            </datalist>
          )}
        </label>
        <label>
          状态
          <select
            value={input.status}
            onChange={(event) =>
              onInputChange({ ...input, status: event.target.value as JobStatus })
            }
          >
            {activeStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          城市
          <input
            className={autoFilledFields.has("city") ? "auto-filled-highlight" : ""}
            value={input.city}
            onChange={(event) => onInputChange({ ...input, city: event.target.value })}
            placeholder="上海 / 北京 / 远程"
          />
        </label>
        <label>
          薪资
          <input
            className={autoFilledFields.has("salaryRange") ? "auto-filled-highlight" : ""}
            value={input.salaryRange}
            onChange={(event) =>
              onInputChange({ ...input, salaryRange: event.target.value })
            }
            placeholder="25-35K"
          />
        </label>
        <label>
          工作方式
          <select
            className={autoFilledFields.has("remoteType") ? "auto-filled-highlight" : ""}
            value={input.remoteType}
            onChange={(event) =>
              onInputChange({ ...input, remoteType: event.target.value as RemoteType })
            }
          >
            {(Object.entries(remoteTypeLabels) as [RemoteType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          投递日期
          <input
            type="date"
            value={input.appliedAt}
            onChange={(event) =>
              onInputChange({ ...input, appliedAt: event.target.value })
            }
          />
        </label>
        <label>
          下次跟进
          <input
            type="date"
            value={input.nextFollowUpAt}
            onChange={(event) =>
              onInputChange({ ...input, nextFollowUpAt: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        岗位链接
        <input
          className={autoFilledFields.has("jobUrl") ? "auto-filled-highlight" : ""}
          value={input.jobUrl}
          onChange={(event) => onInputChange({ ...input, jobUrl: event.target.value })}
          placeholder="https://..."
        />
      </label>
      <label>
        <span className="field-title-row">
          <span>JD 原文</span>
          {autoFillMessage && <small>{autoFillMessage}</small>}
        </span>
        <textarea
          value={input.jdText}
          onChange={(event) => onInputChange({ ...input, jdText: event.target.value })}
          onPaste={handleJDPaste}
          placeholder="粘贴岗位 JD，后续会用于关键词分析和简历匹配"
          rows={5}
        />
      </label>
      <label>
        备注
        <textarea
          value={input.notes}
          onChange={(event) => onInputChange({ ...input, notes: event.target.value })}
          placeholder="记录 HR 信息、沟通重点、内推人等"
          rows={3}
        />
      </label>
      <div className="form-actions">
        <button className="primary" type="submit">
          {isEditing ? "保存修改" : "保存岗位"}
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
