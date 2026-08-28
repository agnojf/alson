import { loadCatalog, searchSkills } from '../catalog/catalog.js';
import { AlsonError } from '../errors.js';
import { computeStatuses, type SkillStatus } from '../installer/install.js';
import { printTable } from './table.js';
import { runList } from './list.js';

export async function runSearch(query: string | undefined, options: { offline?: boolean } = {}): Promise<void> {
  const catalog = await loadCatalog({ offline: options.offline });
  if (query === undefined || query.trim() === '') {
    await runList(options);
    return;
  }
  const matches = searchSkills(catalog, query);
  if (matches.length === 0) {
    throw new AlsonError('Usage', `no skills match "${query}"`);
  }
  const statuses: SkillStatus[] = await computeStatuses({ version: catalog.version, skills: matches });
  printTable(
    ['Name', 'Version', 'Description', 'Status'],
    statuses.map((r) => [r.name, r.bundledVersion, r.description ?? '', r.status])
  );
}
