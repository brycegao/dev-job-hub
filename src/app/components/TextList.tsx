export function TextList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="text-list">
      <span>{title}</span>
      <ul>
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}
