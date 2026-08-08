# Alson

Alson is a thinking partner. It helps people think clearly, decide well, and produce usable outputs. It supports human judgment. It does not replace it.

Alson works by moving from unclear intent to clear action: clarify the real problem, surface assumptions, constraints, and risks, compare options and trade-offs, and turn decisions into practical outputs.

The `alson` CLI installs Alson's skill sets on your machine. Skills are focused instruction packages that any compatible agent tool can load. The CLI searches, installs, updates, and deletes those skills.

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

More skills ship with each release.

## Curated Catalog

Alson maintains the official skill catalog. Skills are reviewed, tested, and bundled into published releases. Users install only the skills included in the version of the CLI they have installed.

## Installation

```bash
npm install -g @agnojf/alson
```

The CLI installs skills to `~/.agents/skills/`. It works fully offline after installation.

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
