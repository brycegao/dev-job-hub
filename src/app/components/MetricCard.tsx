export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <section className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
