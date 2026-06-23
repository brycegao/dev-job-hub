import type { MatchAction, ResumeMatchResult } from "../../features/resume-match/types";

const ACTION_GROUP_CONFIG: Array<{
  type: MatchAction["type"];
  label: string;
  icon: string;
  emptyText: string;
}> = [
  { type: "strength", label: "可直接讲", icon: "✅", emptyText: "暂无强匹配项" },
  { type: "gap", label: "缺口需补", icon: "⚠️", emptyText: "暂无缺口" },
  { type: "differentiator", label: "差异化卖点", icon: "💡", emptyText: "暂无差异化卖点" },
];

export function ResumeMatchCard({ result }: { result: ResumeMatchResult }) {
  const strengths = result.actions.filter((a) => a.type === "strength").length;
  const gaps = result.actions.filter((a) => a.type === "gap").length;
  const total = strengths + gaps;
  const score = total > 0 ? Math.round((strengths / total) * 100) : 0;

  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>简历匹配建议</span>
        <div>
          <strong>{result.greetingMessage}</strong>
        </div>
        {total > 0 && (
          <div className="match-score" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{
              fontSize: 28,
              fontWeight: 700,
              color: score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626",
            }}>
              {score}分
            </span>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              匹配度（{strengths} 项命中 / {gaps} 项缺口）
            </span>
          </div>
        )}
      </div>
      {ACTION_GROUP_CONFIG.map((group) => {
        const items = result.actions.filter((a) => a.type === group.type);
        if (items.length === 0) return null;
        return (
          <div key={group.type} className={`match-group match-group-${group.type}`}>
            <span className="match-group-label">{group.icon} {group.label}（{items.length}）</span>
            <ul className="match-action-list">
              {items.map((item, index) => (
                <li key={`${group.type}-${index}`}>
                  <strong>{item.keyword}</strong>
                  {item.resumeHighlight ? (
                    <span className="match-highlight">（{item.resumeHighlight}）</span>
                  ) : null}
                  <p>{item.advice}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
