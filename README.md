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
| `status-report` | Turns project evidence into an audited project status report. Leads with overall health (RAG) and key metrics. Runs a Build, Measure, Learn pipeline. Every health claim requires evidence; missing evidence means Gray, not Green. Does not reconcile project updates or fabricate evidence. |
| `closure-report` | Creates or revises a formal Project Closure Report for completed projects or phases. Confirms completion, summarizes results against objectives, documents outstanding items and handoff, and captures lessons learned. Runs an audited Build, Measure, Learn pipeline. Does not authorize closure or produce status reports, lessons-learned registers, or post-implementation reviews. |
| `alson-explain` | Explains a selected item in context with evidence, citations, and plain-English clarity. Reads only the minimum context needed. Does not summarize, rewrite, research, advise, or make decisions. |
| `alson-pm-control` | Operates living project-control registers and tailored PMI process work. Stops after review until the project manager gives explicit direction before reconciliation or other controlled changes. |

More skills ship with each release.

## Curated Catalog

Alson maintains the official skill catalog. Skills are reviewed, tested, and bundled into tagged GitHub releases. Users install only the skills included in the version of the CLI they have installed.

Tagged releases include the compiled CLI and generated catalog. Installation does not require TypeScript or another development tool.

## Installation

Install the CLI globally from GitHub:

```bash
npm install -g https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
```

For a stable release, replace the default branch with its Git tag:

```bash
npm install -g https://github.com/agnojf/alson/archive/refs/tags/vX.Y.Z.tar.gz
```

If npm reports an EACCES permission error, the global npm directory is not writable by your user. Use a user-owned Node installation (for example nvm) or set a user-level npm prefix instead of using sudo:

```bash
npm config set prefix "$HOME/.npm-global"
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
npm install -g https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
```

The CLI works fully offline after installation.

## Update the CLI

New skills and fixes ship with new CLI tags. Update from the default branch:

```bash
npm install -g https://github.com/agnojf/alson/archive/refs/heads/main.tar.gz
alson --version
```

To pin a release, install its tag, for example `npm install -g https://github.com/agnojf/alson/archive/refs/tags/vX.Y.Z.tar.gz`.

Then update your installed skills:

```bash
alson update --all
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
alson list                     Show every bundled skill and its status
alson search [query]           Search bundled skills by name or description
alson install <skill>          Install a bundled skill
alson delete <skill>           Remove an installed skill
alson update [skill]           Update installed skills to the bundled versions
alson update --all             Update every installed skill
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
- It does not fetch skills from the network. Skills ship bundled inside the CLI package.
- It does not install skills into your home directory. Skills are always repository-local.

## Safety

- Installs are atomic: files are staged, verified, then moved into place.
- The CLI never overwrites or removes a skill it did not install without explicit approval (`--force`).
- Locally modified skills are detected by hash and protected.
- Failed updates restore the prior installation.

## Status Values

| Status | Meaning |
|---|---|
| not installed | No installation found |
| current | Installed version matches the bundle |
| update available | Installed version is older than the bundle |
| modified | Installed files differ from the recorded hash |
| unmanaged | The skill exists but was not installed by the CLI |
| incompatible | Skill requires a newer CLI version |

## License

MIT
