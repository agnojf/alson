import { parseArgs } from 'node:util';
import { AlsonError } from './errors.js';
import { runList } from './commands/list.js';
import { runSearch } from './commands/search.js';
import { runInstall } from './commands/install.js';
import { runDelete } from './commands/delete.js';
import { runUpdate } from './commands/update.js';
import { readCliVersion } from './installer/safety.js';

const HELP = `alson - search, install, delete, and update agent skills

Usage:
  alson list                     Show every bundled skill and its status
  alson search [query]           Search bundled skills by name or description
  alson install <skill>          Install a bundled skill
  alson delete <skill>           Remove an installed skill
  alson update [skill]           Update installed skills to the bundled versions
  alson update --all             Update every installed skill
  alson --version                Print the CLI version
  alson --help                   Show this help

Options:
  --force   Bypass safety checks and confirmations
`;

async function main(): Promise<void> {
  let values: { help?: boolean; version?: boolean; force?: boolean; all?: boolean };
  let positionals: string[];
  try {
    const parsed = parseArgs({
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean' },
        force: { type: 'boolean', short: 'f' },
        all: { type: 'boolean' }
      },
      allowPositionals: true,
      strict: true
    });
    values = parsed.values;
    positionals = parsed.positionals;
  } catch {
    throw new AlsonError('Usage', `unknown option. Run alson --help for usage`);
  }

  if (values.version) {
    console.log(await readCliVersion());
    return;
  }
  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  const [command, ...rest] = positionals;
  switch (command) {
    case undefined:
      process.stdout.write(HELP);
      return;
    case 'list':
      await runList();
      return;
    case 'search':
      await runSearch(rest[0]);
      return;
    case 'install': {
      const skill = rest[0];
      if (!skill) {
        throw new AlsonError('Usage', `install requires a skill name. Run alson --help for usage`);
      }
      await runInstall({ skill, force: !!values.force });
      return;
    }
    case 'delete': {
      const skill = rest[0];
      if (!skill) {
        throw new AlsonError('Usage', `delete requires a skill name. Run alson --help for usage`);
      }
      await runDelete({ skill, force: !!values.force });
      return;
    }
    case 'update': {
      await runUpdate({ skill: rest[0], all: !!values.all, force: !!values.force });
      return;
    }
    default:
      throw new AlsonError('UnknownCommand', `unknown command "${command}". Run alson --help for usage`);
  }
}

main().catch((err) => {
  if (err instanceof AlsonError) {
    console.error(`error: ${err.message}`);
  } else {
    console.error(`error: unexpected failure: ${err instanceof Error ? err.message : String(err)}`);
  }
  process.exitCode = 1;
});
