import { parseArgs } from 'node:util';
import { AlsonError } from './errors.js';
import { runList } from './commands/list.js';
import { runSearch } from './commands/search.js';
import { runInstall } from './commands/install.js';
import { runDelete } from './commands/delete.js';
import { runUpdate } from './commands/update.js';
import { runRepos } from './commands/repos.js';
import { readCliVersion } from './installer/safety.js';

const HELP = `alson - search, install, delete, and update agent skills

Usage:
  alson list                     Show every available skill and its status
  alson search [query]           Search available skills by name or description
  alson install <skill>          Install an available skill
  alson delete <skill>           Remove an installed skill
  alson update [skill]           Update installed skills to available versions
  alson update --all             Update every installed skill
  alson update --all-repositories Update eligible skills in all configured repositories
  alson repos add <folder>       Add a parent folder for bulk updates
  alson repos remove <folder>    Remove a bulk update parent folder
  alson repos list               List bulk update parent folders
  alson --offline <command>      Use only the local catalog and cache
  alson --version                Print the CLI version
  alson --help                   Show this help

Options:
  --force   Bypass safety checks and confirmations
  --offline Do not access the network
  --dry-run Preview bulk updates without changing files
  --yes     Skip bulk update confirmation
`;

async function main(): Promise<void> {
  let values: {
    help?: boolean;
    version?: boolean;
    force?: boolean;
    all?: boolean;
    offline?: boolean;
    'all-repositories'?: boolean;
    'dry-run'?: boolean;
    yes?: boolean;
  };
  let positionals: string[];
  try {
    const parsed = parseArgs({
      options: {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean' },
        force: { type: 'boolean', short: 'f' },
        all: { type: 'boolean' },
        offline: { type: 'boolean' },
        'all-repositories': { type: 'boolean' },
        'dry-run': { type: 'boolean' },
        yes: { type: 'boolean' }
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
  const hasBulkOption = !!values['all-repositories'] || !!values['dry-run'] || !!values.yes;
  if (hasBulkOption && command !== 'update') {
    throw new AlsonError('Usage', 'bulk update options require the update command. Run alson --help for usage');
  }
  if ((values['dry-run'] || values.yes) && !values['all-repositories']) {
    throw new AlsonError('Usage', 'bulk update options require --all-repositories. Run alson --help for usage');
  }
  switch (command) {
    case undefined:
      process.stdout.write(HELP);
      return;
    case 'list':
      await runList({ offline: !!values.offline });
      return;
    case 'search':
      await runSearch(rest[0], { offline: !!values.offline });
      return;
    case 'install': {
      const skill = rest[0];
      if (!skill) {
        throw new AlsonError('Usage', `install requires a skill name. Run alson --help for usage`);
      }
      await runInstall({ skill, force: !!values.force, offline: !!values.offline });
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
      await runUpdate({
        skill: rest[0],
        all: !!values.all,
        force: !!values.force,
        offline: !!values.offline,
        allRepositories: !!values['all-repositories'],
        dryRun: !!values['dry-run'],
        yes: !!values.yes
      });
      return;
    }
    case 'repos':
      await runRepos(rest[0], rest[1]);
      return;
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
