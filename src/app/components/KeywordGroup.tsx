export function KeywordGroup({
  title,
  values,
  tone = "default",
}: {
  title: string;
  values: string[];
  tone?: "default" | "risk";
}) {
  return (
    <div className="keyword-group">
      <span>{title}</span>
      {values.length ? (
        <div className="keyword-list">
          {values.map((value) => (
            <i key={value} className={tone === "risk" ? "risk" : ""}>
              {value}
            </i>
          ))}
        </div>
      ) : (
        <p>未识别</p>
      )}
    </div>
  );
}
