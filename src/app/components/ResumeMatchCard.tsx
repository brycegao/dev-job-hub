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
  return (
    <div className="analysis-card">
      <div className="analysis-summary">
        <span>简历匹配建议</span>
        <strong>{result.greetingMessage}</strong>
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
