// Excel: CSV con BOM (Excel lo abre directo). PDF: ventana de impresión -> "Guardar como PDF".
export function downloadCSV(name, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
export const tableHTML = (head, rows) =>
  `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export function printHTML(title, body) {
  const w = window.open('', '_blank');
  if (!w) return alert('Permite las ventanas emergentes para generar el PDF.');
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:system-ui;padding:24px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #ccc;padding:6px;text-align:left}</style></head><body><h2>${title}</h2>${body}</body></html>`);
  w.document.close(); w.focus(); w.print();
}
