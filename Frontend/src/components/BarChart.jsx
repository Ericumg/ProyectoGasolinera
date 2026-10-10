export default function BarChart({ data, format = (v) => v }) {
  if (!data.length) return <p className="muted">Sin ventas todavía. Cobra un despacho para ver datos.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart">
      {data.map((d) => (
        <div key={d.label} className="crow">
          <span className="clabel">{d.label}</span>
          <div className="ctrack"><div className="cfill" style={{ width: `${(d.value / max) * 100}%` }} /></div>
          <span className="cval">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
