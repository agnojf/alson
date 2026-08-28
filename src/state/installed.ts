import fs from 'node:fs';
import { AlsonError } from '../errors.js';
import { atomicWriteFile } from '../util/io.js';
import { stateFile } from '../util/paths.js';

export interface InstallRecord {
  name: string;
  version: string;
  hash: string;
  cliVersion: string;
  installedAt: string;
  files: string[];
  source?: string;
}

export interface State {
  version: 1;
  installs: Record<string, InstallRecord>;
}

export const EMPTY_STATE: State = { version: 1, installs: {} };

export async function readState(): Promise<State> {
  const file = stateFile();
  let raw: string;
  try {
    raw = await fs.promises.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return structuredClone(EMPTY_STATE);
    }
    throw err;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as State).version === 1 &&
      (parsed as State).installs &&
      typeof (parsed as State).installs === 'object'
    ) {
      return parsed as State;
    }
    throw new Error('unexpected state shape');
  } catch {
    throw new AlsonError('StateCorrupt', `installed state is corrupt at ${file}. Fix or remove it, then retry`);
  }
}

export async function writeState(state: State): Promise<void> {
  await atomicWriteFile(stateFile(), JSON.stringify(state, null, 2) + '\n');
}
