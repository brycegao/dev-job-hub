import { useState } from "react";
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
  ratingLabels,
  type InterviewRecord,
} from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { confirmDelete } from "../constants";
import { useAiGenerate } from "../hooks/useAiGenerate";
import { InviteUpdatePanel } from "./InviteUpdatePanel";
import { KeywordGroup } from "./KeywordGroup";
import { PromptPackCard } from "./PromptPackCard";
import { TextList } from "./TextList";
import { exportInterviewToCalendar } from "../../features/interviews/services/calendarExportService";

export function InterviewRecordCard({
  interview,
  application,
  resume,
  aiConfig,
  onDelete,
  onUpdate,
  onStartEdit,
}: {
  interview: InterviewRecord;
  application?: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  onDelete: (interview: InterviewRecord) => void;
  onUpdate: (interview: InterviewRecord) => void;
  onStartEdit?: (interview: InterviewRecord) => void;
}) {
  const [answerPack, setAnswerPack] = useState<InterviewAnswerPack | null>(null);
  const { copyMessage, aiResult, aiStatus, handleCopy, handleGenerate } = useAiGenerate();

  return (
    <article className="interview-card">
      <div className="interview-card-header">
        <div>
          <strong>{interviewRoundLabels[interview.round]}</strong>
          <span>{application ? `${application.companyName} · ${application.jobTitle}` : "未知岗位"}</span>
        </div>
        <div className="inline-actions">
          {interview.scheduledAt && (
            <button
              className="secondary-action"
              onClick={() => exportInterviewToCalendar(interview, application)}
            >
              导出日程
            </button>
          )}
          {onStartEdit && (
            <button
              className="secondary-action"
              onClick={() => onStartEdit(interview)}
            >
              编辑
            </button>
          )}
          <button className="danger-lite" onClick={() => {
            if (confirmDelete("面试记录")) onDelete(interview);
          }}>
            删除
          </button>
        </div>
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
      <InviteUpdatePanel interview={interview} onUpdate={onUpdate} />
      {interview.summary && <p className="interview-summary">{interview.summary}</p>}
      <div className="review-template">
        <div className="review-grid">
          {interview.rating && interview.rating > 0 && (
            <div className="review-item">
              <span>整体表现</span>
              <strong className="review-rating">
                {"★".repeat(interview.rating)}{"☆".repeat(5 - interview.rating)} {ratingLabels[interview.rating]}
              </strong>
            </div>
          )}
          {interview.strengths.length > 0 && (
            <div className="review-item">
              <span>表现亮点</span>
              <TextList title="表现亮点" values={interview.strengths} />
            </div>
          )}
          {interview.weakPoints.length > 0 && (
            <div className="review-item">
              <span>薄弱点</span>
              <TextList title="薄弱点" values={interview.weakPoints} />
            </div>
          )}
          {interview.actionItems.length > 0 && (
            <div className="review-item">
              <span>改进行动项</span>
              <TextList title="改进行动项" values={interview.actionItems} />
            </div>
          )}
        </div>
        {interview.questions.length > 0 && (
          <>
            <div className="section-title-row">
              <h3>面试问题</h3>
              <span className="muted-count">{interview.questions.length} 题</span>
            </div>
            <KeywordGroup
              title="标签"
              values={Array.from(new Set(interview.questions.flatMap((question) => question.tags)))}
            />
          </>
        )}
        {interview.selfReview && (
          <div className="detail-section">
            <h3>自我复盘</h3>
            <p>{interview.selfReview}</p>
          </div>
        )}
      </div>
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
            onCopy={() => handleCopy(answerPack.prompt, "已复制参考答案 Prompt。")}
            onGenerateAI={() => handleGenerate(answerPack.prompt, aiConfig)}
            aiEnabled={isAIConfigured(aiConfig)}
            aiStatus={aiStatus}
            aiText={aiResult}
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
