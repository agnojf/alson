"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printTable = printTable;
function printTable(headers, rows) {
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
    const format = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
    console.log(format(headers));
    for (const row of rows) {
        console.log(format(row));
    }
}
