import { useState, type FormEvent } from "react";
import type { AIProviderConfig } from "../../features/ai-assist/types";
import type { JobApplication } from "../../features/applications/types";
import {
  interviewResultLabels,
  interviewRoundLabels,
  type InterviewQuestion,
  type InterviewRecord,
  type InterviewRecordInput,
  type InterviewResult,
  type InterviewRound,
} from "../../features/interviews/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { InterviewRecordCard } from "./InterviewRecordCard";

export function InterviewSection({
  application,
  resume,
  aiConfig,
  interviews,
  onInterviewCreate,
  onInterviewDelete,
}: {
  application: JobApplication;
  resume?: ResumeVersion;
  aiConfig: AIProviderConfig;
  interviews: InterviewRecord[];
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
}) {
  const [round, setRound] = useState<InterviewRound>("first");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewerType, setInterviewerType] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [tagsText, setTagsText] = useState("项目经历\n架构设计");
  const [weakPointsText, setWeakPointsText] = useState("");
  const [selfReview, setSelfReview] = useState("");
  const [result, setResult] = useState<InterviewResult>("pending");
  const [summary, setSummary] = useState("");

  function resetForm() {
    setRound("first");
    setScheduledAt("");
    setInterviewerType("");
    setQuestionsText("");
    setTagsText("项目经历\n架构设计");
    setWeakPointsText("");
    setSelfReview("");
    setResult("pending");
    setSummary("");
  }

  function parseLines(text: string): string[] {
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const questions = parseLines(questionsText).map<InterviewQuestion>((question) => ({
      id: `${Date.now()}-${question}`,
      question,
      tags: parseLines(tagsText),
    }));

    onInterviewCreate({
      jobApplicationId: application.id,
      round,
      scheduledAt,
      interviewerType,
      questions,
      selfReview,
      weakPoints: parseLines(weakPointsText),
      result,
      summary,
    });
    resetForm();
  }

  return (
    <section className="interview-section">
      <div className="section-title-row">
        <h3>面试记录</h3>
        <span className="muted-count">{interviews.length} 条</span>
      </div>
      <form className="interview-form" onSubmit={handleSubmit}>
        <div className="form-grid">
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
            面试时间
            <input
              type="date"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
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
          自我复盘
          <textarea
            value={selfReview}
            onChange={(event) => setSelfReview(event.target.value)}
            placeholder="这轮哪里答得好，哪里需要改"
            rows={3}
          />
        </label>
        <label>
          总结
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="一句话总结这轮面试"
          />
        </label>
        <div className="form-actions">
          <button className="primary" type="submit">
            保存面试记录
          </button>
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
          />
        ))}
      </div>
    </section>
  );
}
