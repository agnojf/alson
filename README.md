# Alson

Alson is a thinking partner. It helps people think clearly, decide well, and produce usable outputs. It supports human judgment. It does not replace it.

Alson works by moving from unclear intent to clear action: clarify the real problem, surface assumptions, constraints, and risks, compare options and trade-offs, and turn decisions into practical outputs.

The `alson` CLI installs Alson's skill sets into your repositories. Skills are focused instruction packages that any compatible agent tool can load. The CLI searches, installs, updates, and deletes those skills.

## Skill Sets

Skills are instruction packages. Each one contains a `SKILL.md` with the skill's behavior and workflow, plus reference files, metadata, and documentation. A skill triggers when a request matches its description.

All Alson skills share the same operating rules:

- Be direct, calm, neutral, and practical.
- Lead with the answer, decision point, or next action.
- Separate facts from assumptions and options from recommendations.
- State uncertainty clearly. Never fabricate evidence.
- Support human judgment. Never take ownership of decisions.

### Available Skills

| Skill | Purpose |
|---|---|
| `project-intake` | Turns vague or new requests into a structured, audited brief. Asks one question at a time and stops when the request is actionable. Runs a Build, Measure, Learn pipeline. Does not authorize work or make decisions for the requester. |
| `closure-report` | Creates or revises a formal Project Closure Report for completed projects or phases. Confirms completion, summarizes results against objectives, documents outstanding items and handoff, and captures lessons learned. Runs an audited Build, Measure, Learn pipeline. Does not authorize closure or produce status reports, lessons-learned registers, or post-implementation reviews. |
| `alson-explain` | Explains a selected item in context with evidence, citations, and plain-English clarity. Reads only the minimum context needed. Does not summarize, rewrite, research, advise, or make decisions. |
| `alson-pm-control` | Operates living project-control registers and tailored PMI process work. Stops after review until the project manager gives explicit direction before reconciliation or other controlled changes. |
| `alson-workspace-template` | Creates and configures reusable AI-assisted workspaces from the Alson skeleton with explicit routing and stage contracts. |

The catalog is refreshed from GitHub when the CLI runs online. Skill versions are released independently from the CLI.

## Curated Catalog

Alson maintains the official skill catalog in GitHub. Skills are reviewed, tested, and released independently from the CLI. The CLI verifies the package hash before installing a skill.

Maintainer release steps are recorded in [`CONTRIBUTING.md`](CONTRIBUTING.md). In short, update a package under `skills/`, run the build and tests, and push the regenerated catalog. A skill-only change does not require a CLI version update.

Tagged releases include the compiled CLI and generated catalog. Installation does not require TypeScript or another development tool.

## Installation

Install [Node.js 20 or later](https://nodejs.org/en/download), which includes npm, before installing Alson.

Install the CLI globally from GitHub. npm 12 and later require an explicit opt-in for remote tarball downloads:

```bash
npm install -g --allow-remote=all https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
```

For a stable release, replace the default branch with its Git tag:

```bash
npm install -g --allow-remote=all https://github.com/agnojf/alson/archive/refs/tags/vX.Y.Z.tar.gz
```

If npm reports an EACCES permission error, the global npm directory is not writable by your user. Use a user-owned Node installation (for example nvm) or set a user-level npm prefix instead of using sudo:

```bash
npm config set prefix "$HOME/.npm-global"
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
npm install -g --allow-remote=all https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
```

Already-installed skills work offline. New skill installs and updates need internet access unless the package is already in the CLI bundle or local cache.

## Update Skills

Update one installed skill without updating the CLI:

```bash
alson update project-intake
```

Update every installed skill:

```bash
alson update --all
```

Use `--offline` to use only the local catalog, package cache, and CLI bundle:

```bash
alson update project-intake --offline
```

### Update Skills Across Repositories

Configure each parent folder once. Alson discovers repositories that are direct children of those folders. A configured path may also be a repository root.

```bash
alson repos add ~/Documents/GitHub
alson repos add ~/Work/Repositories
alson repos list
```

Preview all eligible updates:

```bash
alson update --all-repositories --dry-run
```

Apply them with one confirmation:

```bash
alson update --all-repositories
```

Use `--yes` for a non-interactive run:

```bash
alson update --all-repositories --yes
```

The bulk command updates every installed skill whose catalog version or package hash differs. It reports current repositories, repositories with no Alson-managed skills, blocked local changes, and failures. It continues after a problem in one repository. `--force` is required to replace a locally changed skill.

The configuration stores parent folders or repository roots only. Installed skills and `installed.json` remain inside each repository. After a successful interactive install, Alson may ask whether to add the current repository's direct parent folder automatically.

Update the CLI separately when a CLI fix or feature is released:

```bash
npm install -g --allow-remote=all https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
alson --version
```

## Repository-Local Skills

Skills install into the repository you are working in, not your home directory. From a repository root or any subdirectory:

```bash
cd my-repo
alson list
alson install project-intake
```

This creates:

```text
my-repo/.agents/skills/project-intake/
my-repo/.agents/alson/installed.json
```

- `.agents/skills/` holds the installed skills.
- `.agents/alson/installed.json` is Alson's bookkeeping: installed versions, hashes, and timestamps.
- Each repository has its own install set, isolated from every other repository.
- The CLI resolves the repository by walking up from the current directory to the nearest `.git` directory. Outside a repository it fails with a clear error.

## Using Installed Skills

After installing or updating a skill, start a new session in your agent tool (for example Codex, OpenCode, or Claude Code). Skills are discovered when a session starts. If the skill does not appear, fully restart the agent tool.

## Usage

```text
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
alson --offline <command>      Use only the local catalog, cache, and CLI bundle
alson --version                Print the CLI version
```

Example:

```bash
alson list
alson search intake
alson install project-intake
alson update --all
alson delete project-intake
```

## What the CLI Does Not Do

- It does not execute skills. Skills run inside an agent tool that supports Agent Skills.
- It does not install skills into your home directory. Skills are always repository-local.
- It does not update the CLI when a skill is updated. CLI updates use npm.
- It does not search nested repositories. Bulk discovery checks configured repository roots and direct children of configured folders.

## Safety

- Installs are atomic: files are staged, verified, then moved into place.
- The CLI never overwrites or removes a skill it did not install without explicit approval (`--force`).
- Locally modified skills are detected by hash and protected.
- Failed updates restore the prior installation.

## Status Values

| Status | Meaning |
|---|---|
| not installed | No installation found |
| current | Installed version and package hash match the catalog |
| update available | Installed version or package hash differs from the catalog |
| modified | Installed files differ from the recorded hash |
| unmanaged | The skill exists but was not installed by the CLI |
| incompatible | Skill requires a newer CLI version |

## License

MIT
