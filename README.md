# alson

CLI to search, install, delete, and update agent skills on your machine.

Skills are instruction packages (a `SKILL.md` directory) consumed by agent tools that support Agent Skills. The CLI ships with a bundled catalog of skills, works fully offline, and installs skills to `~/.agents/skills/`.

## Installation

```bash
npm install -g @agnojf/alson
```

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

## Development

```bash
npm install
npm run build     # compile and generate catalog.json
npm test          # unit, integration, and package tests
npm run lint      # type-check
npm pack          # verify the publishable tarball
```

## Adding a Skill

1. Add the skill package under `skills/<name>/` with `SKILL.md` and `skill.json`.
2. Run `npm run build` to validate the package and regenerate the catalog.
3. Bump the CLI version and publish.

## Repository Layout

```text
alson/
├── bin/alson              CLI entry point
├── src/                   TypeScript source
├── scripts/               Catalog generation
├── skills/                Bundled skill packages
├── tests/                 Unit, integration, and package tests
├── catalog.json           Generated skill catalog
└── package.json
```

## License

MIT
