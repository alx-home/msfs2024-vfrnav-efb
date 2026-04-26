---
name: release-note-since-previous-release
description: "Update vfrnav_efb/EFB/release_notes.json from git changes since the previous release entry. Use when preparing the next release note block."
argument-hint: "Optional: target version and date (defaults to inferred next version and today)."
disable-model-invocation: true
---

Related skill: `release-note`.

Create and apply the next release note entry in `vfrnav_efb/EFB/release_notes.json` using repository changes since the previous release.

## Tooling Requirements

- Agent tools are allowed for this prompt.
- Git and history operations shall be performed with GitKraken/MCP git tooling (for example: git status/log/diff/tag lookup/blame via the available GitKraken git tool groups).
- For commit collection and baseline resolution, prefer GitKraken git tooling over any terminal command.
- File content inspection and edits shall use workspace tools (`read_file`, `apply_patch`, search tools).

## Tooling Prohibitions

- Do not execute external shell/runtime commands (for example: `node`, `python`, `cmd`, `powershell`, `bash`, `sh`).
- Do not use terminal-based git commands; use GitKraken/MCP git tooling instead.
- Do not use helper scripts for parsing/validation; rely on workspace file reads/edits and agent-native tooling only.

## Required Workflow

1. Read `vfrnav_efb/EFB/release_notes.json` and identify the last object in `release_notes`.
2. Extract from that object:
   - `lastVersion`
   - `lastDate`
   - previous notes text (for duplicate filtering)
3. Fast baseline path:
   - check whether tag `lastVersion` exists
   - if it exists, use `lastVersion..HEAD`
4. Fallback baseline path (only if tag is missing):
   - find the commit that introduced/updated the previous release entry in `release_notes.json`
   - use `boundaryCommit..HEAD`
5. Collect commits once from the selected baseline to `HEAD`.
6. Classify candidates using this gate:
   - include only user-facing behavior/UI/stability changes
   - exclude by default: release tooling, prompt/instruction updates, Sonar config, license-only changes, pure refactors, dependency/submodule bumps without visible impact
7. Map included items to areas:
   - `### EFB ###`
   - `### Installer/Server (new) ###`
   - `### ALL ###`
8. Build notes with existing style headers only:
   - `***🔧 Improvements / Améliorations:***`
   - `***🐞 Fixes / Corrections:***`
9. Write each item as EN line then FR line, preserving indentation/style already used in the file.
10.   Append exactly one new release object at the end of `release_notes`.
11.   Keep all existing entries untouched and preserve valid JSON.
12.   Create `Release.md` at the workspace root (overwrite if it already exists) containing a GitHub release note for the new version (see **Release.md Format** below).

## Efficiency Constraints

- Stop early on clearly non-user-facing commits based on commit subject and changed file paths.
- Edit target JSON directly in-place; avoid temporary helper scripts for file editing.

## Rules

- Do not invent changes; only use evidence from git history.
- Exclude non-user-facing refactors/chore changes unless they have visible impact.
- If no user-facing changes exist, create a minimal maintenance note.
- Keep wording concise and factual.
- Prefer tag baseline (`<lastVersion>..HEAD`) over blame/boundary baseline.
- If both improvement and fix are possible, choose the category that best reflects user impact.

## Release.md Format

`Release.md` must contain four sections in order and follow the markdown style exactly:

### 0 — Title

The first line must be a generated H1 title:

```
# <generated title>
```

The title must be short, release-oriented, and based on the most impactful user-facing changes in this release.

### 1 — Brief

Use heading `## Brief`.

Write a short paragraph (2–5 sentences) in English summarising the highlights at a high level, followed by a `<hr>` tag on its own line, then the same paragraph translated into French.

### 2 — Detailed changes

Use heading `## Detailed changes`.

Reproduce the full notes added to `release_notes.json`, using the following layout (omit a section/header when it has no items):

```
### <Area>

**🔧 Improvements / Améliorations:**

- <EN sentence>\
  <FR sentence>

**🐞 Fixes / Corrections:**

- <EN sentence>\
  <FR sentence>
```

Areas must appear in this order when present: `### ALL`, `### Installer/Server (new)`, `### EFB`.
Each item is exactly two lines: English on the first line, French immediately below.
Use a markdown line break (`\`) at the end of the English line and two-space indentation before the French line.

### 3 — What's Changed

Use heading `## What's Changed`.

List every PR that contributed a user-facing change included in the notes, one bullet per PR, in the format:

```
* <PR title>  #<issue> by @<author> in https://github.com/alx-home/msfs2024-vfrnav-efb/pull/<PR number>
```

Derive PR numbers and authors from the commit messages / git log metadata. Only include PRs that map to at least one item in the detailed changes section. If no PR number is available for a commit, omit the bullet.

End the file with:

```
**Full Changelog**: https://github.com/alx-home/msfs2024-vfrnav-efb/compare/<lastVersion>...<newVersion>
```

## Output

- Apply file edits directly (both `release_notes.json` and `Release.md`).
- Provide a short summary listing:
   - baseline used (`<tag>..HEAD` or fallback boundary)
   - release version/date used
   - number of commits analyzed
   - major improvements/fixes included
