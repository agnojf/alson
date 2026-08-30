import fs from 'node:fs';
import path from 'node:path';

export interface DiscoveredRepository {
  root: string;
  parent: string;
}

export interface DiscoveryIssue {
  parent: string;
  message: string;
}

export interface DiscoveryResult {
  repositories: DiscoveredRepository[];
  issues: DiscoveryIssue[];
}

async function isRepository(directory: string): Promise<boolean> {
  try {
    await fs.promises.access(path.join(directory, '.git'));
    return true;
  } catch {
    return false;
  }
}

export async function discoverRepositories(parents: string[]): Promise<DiscoveryResult> {
  const repositories: DiscoveredRepository[] = [];
  const issues: DiscoveryIssue[] = [];
  const seen = new Set<string>();

  for (const parent of parents) {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(parent, { withFileTypes: true });
    } catch (err) {
      const reason = err instanceof Error ? `: ${err.message}` : '';
      issues.push({ parent, message: `unable to read repository parent ${parent}${reason}` });
      continue;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const candidate = path.join(parent, entry.name);
      if (!(await isRepository(candidate))) {
        continue;
      }
      try {
        const root = await fs.promises.realpath(candidate);
        if (seen.has(root)) {
          continue;
        }
        seen.add(root);
        repositories.push({ root, parent });
      } catch (err) {
        const reason = err instanceof Error ? `: ${err.message}` : '';
        issues.push({ parent: candidate, message: `unable to resolve repository ${candidate}${reason}` });
      }
    }
  }

  repositories.sort((a, b) => a.root.localeCompare(b.root));
  return { repositories, issues };
}
