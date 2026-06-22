import { useState, useEffect } from "react";
import {
  isAIConfigured,
} from "../../features/ai-assist/services/aiConfigService";
import {
  buildInterviewPrepPack,
} from "../../features/ai-assist/services/promptPackService";
import { buildPreInterviewBrief } from "../../features/ai-assist/services/preInterviewBriefService";
import type {
  AIProviderConfig,
  InterviewPrepPack,
  PreInterviewBrief,
} from "../../features/ai-assist/types";
import {
  remoteTypeLabels,
  statusLabels,
  statusTransitions,
  type JobApplication,
  type JobStatus,
} from "../../features/applications/types";
import { confirmDelete } from "../constants";
import {
  type InterviewRecord,
  type InterviewRecordInput,
} from "../../features/interviews/types";
import { analyzeJD } from "../../features/jd-analysis/services/jdAnalysisService";
import type { JDAnalysisResult } from "../../features/jd-analysis/types";
import { matchResumeToJD } from "../../features/resume-match/services/resumeMatchService";
import type { ResumeMatchResult } from "../../features/resume-match/types";
import type { ResumeVersion } from "../../features/resumes/types";
import { useAiGenerate } from "../hooks/useAiGenerate";
import { InterviewSection } from "./InterviewSection";
import { JDAnalysisCard } from "./JDAnalysisCard";
import { PromptPackCard } from "./PromptPackCard";
import { ResumeMatchCard } from "./ResumeMatchCard";
import { TextList } from "./TextList";

export function ApplicationDetail({
  application,
  resumes,
  interviews,
  aiConfig,
  onEdit,
  onDelete,
  onStatusChange,
  onResumeLink,
  onInterviewCreate,
  onInterviewDelete,
  onInterviewUpdate,
}: {
  application: JobApplication;
  resumes: ResumeVersion[];
  interviews: InterviewRecord[];
  aiConfig: AIProviderConfig;
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onStatusChange: (application: JobApplication, status: JobStatus) => void;
  onResumeLink: (application: JobApplication, resumeVersionId: string) => void;
  onInterviewCreate: (input: InterviewRecordInput) => void;
  onInterviewDelete: (interview: InterviewRecord) => void;
  onInterviewUpdate: (interview: InterviewRecord) => void;
}) {
  const [analysis, setAnalysis] = useState<JDAnalysisResult | null>(null);
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null);
  const [prepPack, setPrepPack] = useState<InterviewPrepPack | null>(null);
  const [brief, setBrief] = useState<PreInterviewBrief | null>(null);
  const prepAi = useAiGenerate();
  const briefAi = useAiGenerate();
  const linkedResume = resumes.find((resume) => resume.id === application.resumeVersionId);

  useEffect(() => {
    setAnalysis(null);
    setMatchResult(null);
    setPrepPack(null);
    setBrief(null);
    prepAi.reset();
    briefAi.reset();
  }, [application.id, application.jdText]);

  return (
    <section className="panel detail-card">
      <div className="panel-header">
        <div>
          <h2>{application.companyName}</h2>
          <p>{application.jobTitle}</p>
        </div>
        <div className="inline-actions">
          <button onClick={() => onEdit(application)}>编辑</button>
          <button className="danger" onClick={() => {
            if (confirmDelete("岗位")) onDelete(application);
          }}>
            删除
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <span>渠道</span>
        <strong>{application.channel || "未填写"}</strong>
        <span>城市</span>
        <strong>{application.city || "未填写"}</strong>
        <span>薪资</span>
        <strong>{application.salaryRange || "未填写"}</strong>
        <span>投递日期</span>
        <strong>{application.appliedAt || "未填写"}</strong>
        <span>工作方式</span>
        <strong>{application.remoteType ? remoteTypeLabels[application.remoteType] : "未填写"}</strong>
        {application.jobUrl && (
          <>
            <span>岗位链接</span>
            <strong>
              <a href={application.jobUrl} target="_blank" rel="noreferrer">{application.jobUrl}</a>
            </strong>
          </>
        )}
      </div>
      <label>
        快速更新状态
        <select
          value={application.status}
          onChange={(event) =>
            onStatusChange(application, event.target.value as JobStatus)
          }
        >
          {[application.status, ...statusTransitions[application.status]].map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        关联简历版本
        <select
          value={application.resumeVersionId ?? ""}
          onChange={(event) => {
            setMatchResult(null);
            onResumeLink(application, event.target.value);
          }}
        >
          <option value="">暂不关联</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name} · {resume.targetRole}
            </option>
          ))}
        </select>
      </label>
      <div className="detail-section">
        <div className="section-title-row">
          <h3>JD 原文</h3>
          <button
            type="button"
            className="secondary-action"
            disabled={!application.jdText.trim()}
            onClick={() => setAnalysis(analyzeJD(application.jdText))}
          >
            分析 JD
          </button>
        </div>
        <p>{application.jdText || "暂未填写 JD。"}</p>
      </div>
      {analysis && <JDAnalysisCard analysis={analysis} />}
      {linkedResume && (
        <div className="match-actions">
          <button
            className="secondary-action"
            type="button"
            disabled={!application.jdText.trim()}
            onClick={() => setMatchResult(matchResumeToJD(application, linkedResume))}
          >
            生成简历匹配建议
          </button>
          <span>当前关联：{linkedResume.name}</span>
        </div>
      )}
      {matchResult && <ResumeMatchCard result={matchResult} />}
      <div className="ai-panel">
        <div className="section-title-row">
          <div>
            <h3>AI 面试准备</h3>
            <p>零配置生成基础准备建议，也可复制完整 Prompt 到常用 AI。</p>
          </div>
          <button
            type="button"
            className="secondary-action"
            disabled={!application.jdText.trim()}
            onClick={() => setPrepPack(buildInterviewPrepPack(application, linkedResume, interviews))}
          >
            生成准备包
          </button>
        </div>
        {prepPack ? (
          <PromptPackCard
            title="面试准备包"
            prompt={prepPack.prompt}
            copyLabel="复制 Prompt"
            onCopy={() => prepAi.handleCopy(prepPack.prompt, "已复制面试准备 Prompt，可粘贴到 ChatGPT / DeepSeek / 豆包。")}
            onGenerateAI={() => prepAi.handleGenerate(prepPack.prompt, aiConfig)}
            aiEnabled={isAIConfigured(aiConfig)}
            aiStatus={prepAi.aiStatus}
            aiLoading={prepAi.aiLoading}
            aiText={prepAi.aiResult}
            message={prepAi.copyMessage}
          >
            <TextList title="重点准备" values={prepPack.focusAreas} />
            <TextList title="可能被问" values={prepPack.likelyQuestions} />
            <TextList title="项目素材" values={prepPack.projectStories} />
            <TextList title="复习清单" values={prepPack.reviewChecklist} />
          </PromptPackCard>
        ) : (
          <p className="empty">粘贴 JD 后可生成面试准备建议。关联简历后，Prompt 会自动带上简历卖点。</p>
        )}
      </div>
      <div className="ai-panel">
        <div className="section-title-row">
          <div>
            <h3>面试前简报</h3>
            <p>综合 JD + 简历 + 历史面试数据，一键生成可执行准备方案。</p>
          </div>
          <button
            type="button"
            className="secondary-action"
            disabled={!application.jdText.trim()}
            onClick={() => setBrief(buildPreInterviewBrief({ application, resume: linkedResume, interviews }))}
          >
            生成简报
          </button>
        </div>
        {brief ? (
          <div className="interview-brief">
            <div className="brief-grid">
              <div className="brief-item">
                <span>岗位画像</span>
                <strong>{brief.profileSummary}</strong>
              </div>
              <div className="brief-item">
                <span>匹配度</span>
                <strong>{brief.matchOverview}</strong>
              </div>
            </div>
            {brief.weakPointOverlaps.length > 0 && (
              <TextList title="⚠️ 历史薄弱点 × 本轮 JD 重合" values={brief.weakPointOverlaps} />
            )}
            <TextList title="优先复习清单" values={brief.priorityChecklist} />
            <PromptPackCard
              title="综合 AI Prompt"
              prompt={brief.prompt}
              copyLabel="复制 Prompt"
              onCopy={() => briefAi.handleCopy(brief.prompt, "已复制面试简报 Prompt。")}
              onGenerateAI={() => briefAi.handleGenerate(brief.prompt, aiConfig)}
              aiEnabled={isAIConfigured(aiConfig)}
              aiStatus={briefAi.aiStatus}
              aiLoading={briefAi.aiLoading}
              aiText={briefAi.aiResult}
              message={briefAi.copyMessage}
            >
              <></>
            </PromptPackCard>
          </div>
        ) : (
          <p className="empty">粘贴 JD 后可生成面试简报。有历史面试记录和关联简历时，建议更精准。</p>
        )}
      </div>
      <div className="detail-section">
        <h3>备注</h3>
        <p>{application.notes || "暂未填写备注。"}</p>
      </div>
      <InterviewSection
        application={application}
        resume={linkedResume}
        aiConfig={aiConfig}
        interviews={interviews}
        onInterviewCreate={onInterviewCreate}
        onInterviewDelete={onInterviewDelete}
        onInterviewUpdate={onInterviewUpdate}
      />
    </section>
  );
}
