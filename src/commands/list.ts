import { loadCatalog } from '../catalog/catalog.js';
import { computeStatuses } from '../installer/install.js';
import { printTable } from './table.js';

export async function runList(): Promise<void> {
  const catalog = await loadCatalog();
  const rows = await computeStatuses(catalog);
  printTable(
    ['Name', 'Bundled', 'Installed', 'Status'],
    rows.map((r) => [r.name, r.bundledVersion, r.installedVersion ?? '-', r.status])
  );
}
