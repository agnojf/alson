# Alson Repository Instructions

This repository is the public distribution repository for the `alson` CLI and its skill packages.

## Meaning of "Update Repo"

When the user says `update repo`, `sync skill`, or `publish skill update` in this repository, treat it as a skill-release request:

1. Identify the changed skill package. If the user supplied the update from a workspace, sync the complete package into `skills/<name>/`.
2. Confirm that the folder name, `SKILL.md` frontmatter name, and `skill.json` name match.
3. Use the version supplied in `skill.json`. Do not invent a version when one is missing.
4. Run `npm run build`. This validates the packages and regenerates `catalog.json` with each package's source URL, file list, and hash.
5. Run `npm test`, `npm run lint`, and `npm run pack`.
6. Confirm that the skill source and generated `catalog.json` are included. Generated CLI files change only when the CLI source changes.
7. Do not bump the CLI version for a skill-only change.
8. Do not commit or push unless the user explicitly requests it.

Use `CONTRIBUTING.md` for the full human release procedure.

## Repository Boundaries

- `skills/<name>/` contains distributable skill packages.
- `src/` contains the CLI source.
- `catalog.json` is generated and committed.
- `dist/src/` and `dist/scripts/` are generated and committed.
- `workspaces/skill-manager-cli/` is maintained in the separate `alson-workspace` repository. Do not copy that workspace into this repository.

## User Commands After Publication

- Existing skill: `alson update <name>`.
- New skill: `alson install <name>`.
- CLI change: install a new GitHub CLI tag with npm.
