import type { JDAnalysisResult } from "../../features/jd-analysis/types";
import { KeywordGroup } from "./KeywordGroup";

export function JDAnalysisCard({ analysis }: { analysis: JDAnalysisResult }) {
  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>JD 技术画像</span>
        <strong>{analysis.summary}</strong>
      </div>
      <KeywordGroup title="技术栈" values={analysis.techKeywords} />
      <KeywordGroup title="业务方向" values={analysis.domainKeywords} />
      <KeywordGroup title="能力要求" values={analysis.capabilityKeywords} />
      <KeywordGroup title="加分项" values={analysis.bonusKeywords} />
      <KeywordGroup title="风险提示" values={analysis.risks} tone="risk" />
    </div>
  );
}
