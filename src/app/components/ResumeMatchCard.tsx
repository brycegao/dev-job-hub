import type { ResumeMatchResult } from "../../features/resume-match/types";
import { KeywordGroup } from "./KeywordGroup";
import { TextList } from "./TextList";

export function ResumeMatchCard({ result }: { result: ResumeMatchResult }) {
  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>简历匹配建议</span>
        <strong>{result.greetingMessage}</strong>
      </div>
      <KeywordGroup title="已匹配" values={result.matchedPoints} />
      <KeywordGroup title="建议补充" values={result.missingPoints} tone="risk" />
      <TextList title="建议突出项目" values={result.suggestedProjects} />
      <TextList title="面试准备方向" values={result.interviewPrep} />
    </div>
  );
}
