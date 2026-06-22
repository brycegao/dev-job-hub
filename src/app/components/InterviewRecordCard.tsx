import { useState } from "react";
import { generateAICompletion } from "../../features/ai-assist/services/aiCompletionService";
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
  interviewResultLabels,
  interviewRoundLabels,
  type InterviewRecord,
} from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { copyText } from "../constants";
import { KeywordGroup } from "./KeywordGroup";
import { PromptPackCard } from "./PromptPackCard";
import { TextList } from "./TextList";

export function InterviewRecordCard({
  interview,
  application,
  resume,
  aiConfig,
  onDelete,
}: {
  interview: InterviewRecord;
  application?: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  onDelete: (interview: InterviewRecord) => void;
}) {
  const [answerPack, setAnswerPack] = useState<InterviewAnswerPack | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [aiAnswerResult, setAIAnswerResult] = useState("");
  const [aiAnswerStatus, setAIAnswerStatus] = useState("");

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
      const result = await generateAICompletion({ prompt, config: aiConfig });
      setAIAnswerResult(result);
      setAIAnswerStatus("AI 生成完成。");
    } catch (error) {
      setAIAnswerStatus(
        error instanceof Error ? error.message : "AI 生成失败，请检查配置。",
      );
    }
  }

  return (
    <article className="interview-card">
      <div className="interview-card-header">
        <div>
          <strong>{interviewRoundLabels[interview.round]}</strong>
          <span>{application ? `${application.companyName} · ${application.jobTitle}` : "未知岗位"}</span>
        </div>
        <button className="danger-lite" onClick={() => onDelete(interview)}>
          删除
        </button>
      </div>
      <div className="detail-grid compact">
        <span>时间</span>
        <strong>{interview.scheduledAt || "未填写"}</strong>
        <span>面试官</span>
        <strong>{interview.interviewerType || "未填写"}</strong>
        <span>结果</span>
        <strong>{interviewResultLabels[interview.result]}</strong>
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
