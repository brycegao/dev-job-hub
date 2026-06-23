import { useState, type FormEvent } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import {
  interviewInviteStatusLabels,
  interviewResultLabels,
  interviewRoundLabels,
  ratingLabels,
  type InterviewInviteStatus,
  type InterviewQuestion,
  type InterviewRecord,
  type InterviewRecordInput,
  type InterviewResult,
  type InterviewRound,
} from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { createId, parseLines } from "../../shared/utils/common";
import { InterviewRecordCard } from "./InterviewRecordCard";

export function InterviewSection({
  application,
  resume,
  aiConfig,
  interviews,
  onInterviewCreate,
  onInterviewDelete,
  onInterviewUpdate,
  onApplicationStatusAutoUpdate,
}: {
  application: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  interviews: InterviewRecord[];
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
  onInterviewUpdate: (interview: InterviewRecord) => void;
  onApplicationStatusAutoUpdate?: () => void;
}) {
  const [editingInterview, setEditingInterview] = useState<InterviewRecord | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [round, setRound] = useState<InterviewRound>("first");
  const [inviteStatus, setInviteStatus] = useState<InterviewInviteStatus>("invited");
  const [invitedAt, setInvitedAt] = useState(new Date().toISOString().slice(0, 16));
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [confirmedAt, setConfirmedAt] = useState("");
  const [interviewerType, setInterviewerType] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [tagsText, setTagsText] = useState("项目经历\n架构设计");
  const [weakPointsText, setWeakPointsText] = useState("");
  const [selfReview, setSelfReview] = useState("");
  const [result, setResult] = useState<InterviewResult>("pending");
  const [summary, setSummary] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [strengthsText, setStrengthsText] = useState("");
  const [actionItemsText, setActionItemsText] = useState("");

  function resetForm() {
    setRound("first");
    setInviteStatus("invited");
    setInvitedAt(new Date().toISOString().slice(0, 16));
    setScheduledAt("");
    setLocation("");
    setConfirmedAt("");
    setInterviewerType("");
    setInviteNotes("");
    setQuestionsText("");
    setTagsText("项目经历\n架构设计");
    setWeakPointsText("");
    setSelfReview("");
    setResult("pending");
    setSummary("");
    setRating(0);
    setStrengthsText("");
    setActionItemsText("");
  }

  /** 将已有面试记录填充到表单，进入编辑模式 */
  function startEditInterview(interview: InterviewRecord) {
    setEditingInterview(interview);
    setRound(interview.round);
    setInviteStatus(interview.inviteStatus ?? "invited");
    setInvitedAt(interview.invitedAt || new Date().toISOString().slice(0, 16));
    setScheduledAt(interview.scheduledAt || "");
    setLocation(interview.location || "");
    setConfirmedAt(interview.confirmedAt || "");
    setInterviewerType(interview.interviewerType || "");
    setInviteNotes(interview.inviteNotes || "");
    setQuestionsText(interview.questions.map((q) => q.question).join("\n"));
    // 合并所有问题的标签去重作为默认值
    const allTags = Array.from(new Set(interview.questions.flatMap((q) => q.tags)));
    setTagsText(allTags.join("\n") || "");
    setWeakPointsText(interview.weakPoints.join("\n"));
    setSelfReview(interview.selfReview || "");
    setResult(interview.result);
    setSummary(interview.summary || "");
    setRating(interview.rating || 0);
    setStrengthsText(interview.strengths.join("\n"));
    setActionItemsText(interview.actionItems.join("\n"));
  }

  /** 取消编辑，恢复表单默认值 */
  function cancelEditInterview() {
    setEditingInterview(null);
    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const questionLines = parseLines(questionsText);
    const tagList = parseLines(tagsText);

    if (editingInterview) {
      // 编辑模式：保留已有问题的 ID，新增的问题生成新 ID
      const questions = questionLines.map<InterviewQuestion>((question, index) => {
        const existing = editingInterview.questions[index];
        return {
          id: existing?.id || createId(),
          question,
          answerNotes: existing?.answerNotes,
          tags: tagList,
        };
      });

      const updated: InterviewRecord = {
        ...editingInterview,
        round,
        inviteStatus,
        invitedAt,
        scheduledAt,
        location,
        confirmedAt,
        interviewerType,
        inviteNotes,
        questions: questionLines ? questions : [],
        result,
        selfReview,
        weakPoints: parseLines(weakPointsText),
        strengths: parseLines(strengthsText),
        actionItems: parseLines(actionItemsText),
        rating: rating || undefined,
        summary,
        updatedAt: new Date().toISOString(),
      };

      onInterviewUpdate(updated);
      cancelEditInterview();
    } else {
      // 新建模式
      const questions = questionLines.map<InterviewQuestion>((question) => ({
        id: createId(),
        question,
        tags: tagList,
      }));

      const parsedWeakPoints = parseLines(weakPointsText);
      const parsedStrengths = parseLines(strengthsText);
      const parsedActionItems = parseLines(actionItemsText);

      const base = {
        jobApplicationId: application.id,
        round,
        inviteStatus,
        invitedAt,
        scheduledAt,
        location,
        confirmedAt,
        interviewerType,
        inviteNotes,
        questions: questionsText ? questions : [],
        result,
      };

      // 仅在用户实际填写复盘字段时才提交，避免"空复盘"与"未复盘"无法区分
      const hasReview = parsedWeakPoints.length || parsedStrengths.length || parsedActionItems.length || rating > 0 || selfReview || summary;

      onInterviewCreate({
        ...base,
        ...(hasReview
          ? {
              selfReview,
              weakPoints: parsedWeakPoints,
              strengths: parsedStrengths,
              actionItems: parsedActionItems,
              rating: rating || undefined,
              summary,
            }
          : {
              selfReview: "",
              weakPoints: [],
              strengths: [],
              actionItems: [],
            }),
      });
      resetForm();
    }
  }

  return (
    <section className="interview-section">
      <div className="section-title-row">
        <h3>面试记录</h3>
        <span className="muted-count">{interviews.length} 条</span>
      </div>
      <form className="interview-form" onSubmit={handleSubmit}>
        {editingInterview && (
          <div className="edit-banner">
            <span>正在编辑：{interviewRoundLabels[editingInterview.round]}</span>
            <button type="button" className="secondary-action" onClick={cancelEditInterview}>
              取消编辑
            </button>
          </div>
        )}
        <div className="form-grid">
          <label>
            邀约状态
            <select
              value={inviteStatus}
              onChange={(event) =>
                setInviteStatus(event.target.value as InterviewInviteStatus)
              }
            >
              {Object.entries(interviewInviteStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            轮次
            <select
              value={round}
              onChange={(event) => setRound(event.target.value as InterviewRound)}
            >
              {Object.entries(interviewRoundLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            HR 通知时间
            <input
              type="datetime-local"
              value={invitedAt}
              onChange={(event) => setInvitedAt(event.target.value)}
            />
          </label>
          <label>
            面试时间
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
          <label>
            面试地点
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="公司地址 / 腾讯会议链接 / Zoom 链接"
            />
          </label>
          <label>
            确认时间
            <input
              type="datetime-local"
              value={confirmedAt}
              onChange={(event) => setConfirmedAt(event.target.value)}
            />
          </label>
          <label>
            面试官类型
            <input
              value={interviewerType}
              onChange={(event) => setInterviewerType(event.target.value)}
              placeholder="技术负责人 / HR / 业务面"
            />
          </label>
        </div>
        <label>
          邀约备注
          <input
            value={inviteNotes}
            onChange={(event) => setInviteNotes(event.target.value)}
            placeholder="例如：HR 电话通知，下一轮技术负责人面，需提前准备作品集"
          />
        </label>
        <div className="form-grid">
          <label>
            结果
            <select
              value={result}
              onChange={(event) => setResult(event.target.value as InterviewResult)}
            >
              {Object.entries(interviewResultLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="secondary-action"
          onClick={() => setShowReview((v) => !v)}
        >
          {showReview ? "收起复盘" : "展开面试复盘"}
        </button>
        {showReview && (
        <div className="review-template">
          <div className="section-title-row">
            <h3>结构化复盘</h3>
            <span className="muted">面试后填写，帮助持续改进</span>
          </div>
          <div className="form-grid">
            <label>
              整体表现
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              >
                <option value={0}>未评分</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {"★".repeat(n)}{"☆".repeat(5 - n)} {ratingLabels[n]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              总结
              <input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="一句话总结这轮面试"
              />
            </label>
          </div>
          <label>
            面试问题
            <textarea
              value={questionsText}
              onChange={(event) => setQuestionsText(event.target.value)}
              placeholder="每行一个问题，例如：你如何做 Flutter 多语言？"
              rows={4}
            />
          </label>
          <label>
            问题标签
            <textarea
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="每行一个标签"
              rows={2}
            />
          </label>
          <label>
            薄弱点
            <textarea
              value={weakPointsText}
              onChange={(event) => setWeakPointsText(event.target.value)}
              placeholder="每行一个需要补强的点"
              rows={2}
            />
          </label>
          <label>
            表现亮点
            <textarea
              value={strengthsText}
              onChange={(event) => setStrengthsText(event.target.value)}
              placeholder="每行一个亮点，例如：Flutter 混合栈方案讲解清晰"
              rows={2}
            />
          </label>
          <label>
            改进行动项
            <textarea
              value={actionItemsText}
              onChange={(event) => setActionItemsText(event.target.value)}
              placeholder="每行一个具体行动，例如：整理 3 个 Flutter 性能优化案例"
              rows={2}
            />
          </label>
          <label>
            自我复盘
            <textarea
              value={selfReview}
              onChange={(event) => setSelfReview(event.target.value)}
              placeholder="这轮哪里答得好，哪里需要改"
              rows={3}
            />
          </label>
        </div>
        )}
        <div className="form-actions">
          <button className="primary" type="submit">
            {editingInterview ? "更新面试记录" : "保存面试记录"}
          </button>
          {editingInterview && (
            <button type="button" className="secondary-action" onClick={cancelEditInterview}>
              取消
            </button>
          )}
        </div>
      </form>
      <div className="interview-board">
        {interviews.map((interview) => (
          <InterviewRecordCard
            key={interview.id}
            interview={interview}
            application={application}
            resume={resume}
            aiConfig={aiConfig}
            onDelete={onInterviewDelete}
            onUpdate={onInterviewUpdate}
            onStartEdit={startEditInterview}
            onApplicationStatusAutoUpdate={onApplicationStatusAutoUpdate}
          />
        ))}
      </div>
    </section>
  );
}
