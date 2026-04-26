---
name: release-note-since-previous-release
description: "Update vfrnav_efb/EFB/release_notes.json from git changes since the previous release entry. Use when preparing the next release note block."
argument-hint: "Optional: target version and date (defaults to inferred next version and today)."
disable-model-invocation: true
---

Related skill: `release-note`.

Create and apply the next release note entry in `vfrnav_efb/EFB/release_notes.json` using repository changes since the previous release.

## Required Workflow

1. Read `vfrnav_efb/EFB/release_notes.json` and identify the last release object in `release_notes`.
2. Find the boundary commit that introduced/updated that last release entry.
3. Collect commits from boundary commit (exclusive) to `HEAD`.
4. Derive user-facing changes only, grouped by project areas when applicable:
   - `### EFB ###`
   - `### Installer/Server (new) ###`
   - `### ALL ###`
5. Build notes with existing style headers:
   - `***🔧 Improvements / Améliorations:***`
   - `***🐞 Fixes / Corrections:***`
6. For each note item, output EN then FR line, matching indentation/style already used.
7. Append exactly one new release object at the end of `release_notes`.
8. Keep existing entries untouched and preserve valid JSON.

## Rules

- Do not invent changes; only use evidence from git history.
- Exclude non-user-facing refactors/chore changes unless they have visible impact.
- If no user-facing changes exist, create a minimal maintenance note.
- Keep wording concise and factual.

## Output

- Apply file edits directly.
- Provide a short summary listing:
   - release version/date used
   - number of commits analyzed
   - major improvements/fixes included
