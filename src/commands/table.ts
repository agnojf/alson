export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );
  const format = (cells: string[]): string =>
    cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  console.log(format(headers));
  for (const row of rows) {
    console.log(format(row));
  }
}
