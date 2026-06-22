import { useEffect, useState } from "react";
import { createTimeoutSignal, generateAICompletion } from "../../features/ai-assist/services/aiCompletionService";
import {
  isAIConfigured,
} from "../../features/ai-assist/services/aiConfigService";
import {
  buildInterviewAnswerPack,
} from "../../features/ai-assist/services/promptPackService";
import type {
  AIProviderConfig,
  InterviewAnswerPack,
} from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import {
  interviewInviteStatusLabels,
  interviewResultLabels,
  interviewRoundLabels,
  type InterviewInviteStatus,
  type InterviewRecord,
  type InterviewRound,
} from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { confirmDelete, copyText } from "../constants";
import { KeywordGroup } from "./KeywordGroup";
import { PromptPackCard } from "./PromptPackCard";
import { TextList } from "./TextList";

export function InterviewRecordCard({
  interview,
  application,
  resume,
  aiConfig,
  onDelete,
  onUpdate,
}: {
  interview: InterviewRecord;
  application?: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  onDelete: (interview: InterviewRecord) => void;
  onUpdate: (interview: InterviewRecord) => void;
}) {
  const [answerPack, setAnswerPack] = useState<InterviewAnswerPack | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [aiAnswerResult, setAIAnswerResult] = useState("");
  const [aiAnswerStatus, setAIAnswerStatus] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InterviewInviteStatus>(
    interview.inviteStatus ?? "not_scheduled",
  );
  const [scheduledAt, setScheduledAt] = useState(interview.scheduledAt ?? "");
  const [confirmedAt, setConfirmedAt] = useState(interview.confirmedAt ?? "");
  const [nextRound, setNextRound] = useState<InterviewRound>(
    interview.nextRound ?? "second",
  );
  const [nextScheduledAt, setNextScheduledAt] = useState(interview.nextScheduledAt ?? "");
  const [inviteNotes, setInviteNotes] = useState(interview.inviteNotes ?? "");

  useEffect(() => {
    setInviteStatus(interview.inviteStatus ?? "not_scheduled");
    setScheduledAt(interview.scheduledAt ?? "");
    setConfirmedAt(interview.confirmedAt ?? "");
    setNextRound(interview.nextRound ?? "second");
    setNextScheduledAt(interview.nextScheduledAt ?? "");
    setInviteNotes(interview.inviteNotes ?? "");
  }, [interview.id]);

  async function handleCopyAnswerPrompt(prompt: string) {
    await copyText(prompt);
    setCopyMessage("已复制参考答案 Prompt。");
  }

  async function handleGenerateAnswerWithAI(prompt: string) {
    if (!isAIConfigured(aiConfig)) {
      setAIAnswerStatus("请先在设置页配置 AI Provider，或继续使用复制 Prompt。");
      return;
    }

    try {
      setAIAnswerStatus("AI 生成中...");
      const { signal, clear } = createTimeoutSignal();
      const result = await generateAICompletion({ prompt, config: aiConfig }, signal);
      clear();
      setAIAnswerResult(result);
      setAIAnswerStatus("AI 生成完成。");
    } catch (error) {
      setAIAnswerStatus(
        error instanceof Error ? error.message : "AI 生成失败，请检查配置。",
      );
    }
  }

  function handleInviteUpdate() {
    onUpdate({
      ...interview,
      inviteStatus,
      scheduledAt,
      confirmedAt,
      nextRound,
      nextScheduledAt,
      inviteNotes,
    });
  }

  return (
    <article className="interview-card">
      <div className="interview-card-header">
        <div>
          <strong>{interviewRoundLabels[interview.round]}</strong>
          <span>{application ? `${application.companyName} · ${application.jobTitle}` : "未知岗位"}</span>
        </div>
        <button className="danger-lite" onClick={() => {
          if (confirmDelete("面试记录")) onDelete(interview);
        }}>
          删除
        </button>
      </div>
      <div className="detail-grid compact">
        <span>时间</span>
        <strong>{interview.scheduledAt || "未填写"}</strong>
        <span>邀约</span>
        <strong>{interviewInviteStatusLabels[interview.inviteStatus ?? "not_scheduled"]}</strong>
        <span>面试官</span>
        <strong>{interview.interviewerType || "未填写"}</strong>
        <span>结果</span>
        <strong>{interviewResultLabels[interview.result]}</strong>
        <span>下一轮</span>
        <strong>
          {interview.nextRound
            ? `${interviewRoundLabels[interview.nextRound]} · ${interview.nextScheduledAt || "时间未定"}`
            : "未安排"}
        </strong>
      </div>
      <div className="invite-update-panel">
        <div className="section-title-row">
          <h3>面试邀约</h3>
          <button className="secondary-action" type="button" onClick={handleInviteUpdate}>
            更新邀约
          </button>
        </div>
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
            本轮面试时间
            <input
              type="date"
              value={scheduledAt}
              onInput={(event) => setScheduledAt(event.currentTarget.value)}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
          <label>
            确认时间
            <input
              type="date"
              value={confirmedAt}
              onInput={(event) => setConfirmedAt(event.currentTarget.value)}
              onChange={(event) => setConfirmedAt(event.target.value)}
            />
          </label>
          <label>
            下一轮
            <select
              value={nextRound}
              onChange={(event) => setNextRound(event.target.value as InterviewRound)}
            >
              {Object.entries(interviewRoundLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            下一轮时间
            <input
              type="date"
              value={nextScheduledAt}
              onInput={(event) => setNextScheduledAt(event.currentTarget.value)}
              onChange={(event) => setNextScheduledAt(event.target.value)}
            />
          </label>
        </div>
        <label>
          邀约备注
          <input
            value={inviteNotes}
            onChange={(event) => setInviteNotes(event.target.value)}
            placeholder="例如：HR 通知二面，需准备 Google Play 合规案例"
          />
        </label>
      </div>
      {interview.summary && <p className="interview-summary">{interview.summary}</p>}
      <TextList
        title="问题"
        values={interview.questions.map((question) => question.question)}
      />
      <KeywordGroup
        title="标签"
        values={Array.from(new Set(interview.questions.flatMap((question) => question.tags)))}
      />
      <TextList title="薄弱点" values={interview.weakPoints} />
      {interview.selfReview && (
        <div className="detail-section">
          <h3>自我复盘</h3>
          <p>{interview.selfReview}</p>
        </div>
      )}
      <div className="ai-panel compact">
        <div className="section-title-row">
          <h3>AI 参考答案</h3>
          <button
            className="secondary-action"
            type="button"
            onClick={() =>
              setAnswerPack(
                buildInterviewAnswerPack({
                  interview,
                  application,
                  resume,
                }),
              )
            }
          >
            生成 Prompt
          </button>
        </div>
        {answerPack && (
          <PromptPackCard
            title="参考答案 Prompt"
            prompt={answerPack.prompt}
            copyLabel="复制 Prompt"
            onCopy={() => handleCopyAnswerPrompt(answerPack.prompt)}
            onGenerateAI={() => handleGenerateAnswerWithAI(answerPack.prompt)}
            aiEnabled={isAIConfigured(aiConfig)}
            aiStatus={aiAnswerStatus}
            aiText={aiAnswerResult}
            message={copyMessage}
          >
            <TextList title="回答角度" values={answerPack.answerAngles} />
            <TextList title="STAR 结构" values={answerPack.starTemplate} />
            <TextList title="可能追问" values={answerPack.followUpQuestions} />
          </PromptPackCard>
        )}
      </div>
    </article>
  );
}
