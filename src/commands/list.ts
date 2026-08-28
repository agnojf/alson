import { loadCatalog } from '../catalog/catalog.js';
import { computeStatuses } from '../installer/install.js';
import { printTable } from './table.js';

export async function runList(options: { offline?: boolean } = {}): Promise<void> {
  const catalog = await loadCatalog({ offline: options.offline });
  const rows = await computeStatuses(catalog);
  printTable(
    ['Name', 'Available', 'Installed', 'Status'],
    rows.map((r) => [r.name, r.bundledVersion, r.installedVersion ?? '-', r.status])
  );
}
