export function MetricCard({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <section className={`metric-card${onClick ? " metric-card--clickable" : ""}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
