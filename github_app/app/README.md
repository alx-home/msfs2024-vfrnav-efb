# VFRNav GitHub Pages app

The help page is a React and TypeScript app built with Vite. Its source is in
`github_app/app/src/` in the add-on repository. It includes the help guide and
the former standalone antivirus-report page in one application.
The footer includes the project's copyright notice and links to its GNU GPL v3
license in the source repository.

The global CMake build includes the `github_app` target by default; build just
the site with `cmake --build build --target github_app`. Output is
`build/github_app/dist/`. Like the other React projects, this app uses `ts_app`,
`build.ts`, the shared `AppConfig`, separate app/build TypeScript configurations,
and React 19. CMake passes its binary directory to the build, so non-default
build directories work too.

Install the repository's root and `submodules/ts-utils` dependencies as for the
other React apps, then run `npm install` in `github_app/app`. The help app keeps
Tailwind 4 local and disables the shared builder's Tailwind 3 integration to
preserve its existing utility-based design without changing other apps.

Publishing is explicit: from this directory run
`npm run publish -- <absolute-path-to-pages-checkout>` after building. This
copies the site to the Pages checkout root, including `releases.json` and a
legacy `help/index.html` redirect that preserves topic hashes. Ordinary builds
never overwrite another checkout. Source no longer lives in the Pages repository.

Styling uses Tailwind CSS utilities in the React components and HTML shell,
compiled by the Tailwind Vite plugin. `src/styles.css` only imports Tailwind and
declares the shared theme tokens; it contains no custom selectors or styles.

`src/pages/` contains the eight tab pages; `src/components/` contains the shared
header, tab navigation and section heading. Only the active tab is rendered.
Tabs support arrow keys, Home and End, URL hashes and browser Back/Forward.
Each tab has a decorative icon alongside its localized label; Support reuses the
donation SVG from the donation section, while other tabs use the shared icons.
Short localized tab labels live in `src/navigation.ts`, separately from the
full headings displayed on each page.
The search field matches headings and article text in the current language,
ignores case and accents, and opens the matching topic directly. Enter opens
the first result; Tab reaches individual result links and Escape closes the list.
Search runs locally without a service or additional dependencies.
On desktop the search field is integrated into the header beside the branding
and language selector; narrower screens give it a full-width header row.
The header and tabs stay sticky and are transparent at the top of the page.
A viewport-wide glass backdrop fades in after scrolling, with a soft bottom
edge instead of a hard break against the page gradient. Tabs scroll
horizontally on narrow screens to avoid consuming most of the viewport.
The measured navigation height also offsets documentation sidebars and section
scrolling so content is not hidden behind the header.
Legacy section links such as `#features` and `#controls` open the matching tab.
Every overview feature card has a topic-specific link to its related usage
article. Usage and detailed notes use a desktop sidebar or mobile topic selector,
showing one article at a time without accordions. Topic URLs support reload,
language changes and Back/Forward. In Usage and Details, the content box and
desktop topic list share a maximum height based on the available viewport space.
Each scrolls independently, without shrinking the topic buttons;
the surrounding page keeps its normal layout. The limit updates on scrolling,
resizing and heading/navigation size changes. Articles are keyboard-focusable;
switching topics resets their internal scroll without moving the surrounding page.
The height budget reserves the footer and bottom padding. A 160px minimum keeps
articles readable on very short screens. Footer padding and topic-button sizes
remain unchanged between pages; long topic lists scroll inside their own column.
Detailed notes use topic icons and spaced, sentence-sized paragraphs, preserving
the original localized text and its search index.
Feature-card links open the selected guide at the top of its tab, keeping the
header and navigation visible rather than jumping down to an article anchor.
`src/content/` separates translations, screenshot explanations, detailed
workflows, support links and their shared TypeScript types.
The quick-start journey uses localized short headings from `src/content/workflow.ts`
and shared SVG icons, with connected steps on desktop and stacked steps on mobile.
`src/content/installer.ts` describes the installer/server features and connection
requirements in each language. The header and favicon reuse VFRNav's `app-icon.svg`.
`src/content/efbEditing.ts` describes the tablet's right-click editing cycle,
left-drag handles, uniform scaling, Shift acceleration and per-aircraft saving.
Instructions use numbered, illustrated steps with roomier reading spacing.
The 2D and 3D modes share the same card layout. Panel settings, movement,
resizing and reset are separate illustrated steps, with keyboard combinations
shown as keycaps. On small screens step descriptions use the full card width.
The structured instructions remain searchable in all supported languages.
Mouse and PDF commands use the same framed icon style, with a pictogram for
each gesture.
Keyboard shortcuts in help paragraphs use the same shared keycap component as
the illustrated steps, including localized modifier names.

The overview gallery bundles 21 screenshots from
https://flightsim.to/addon/86883/efb-msfs2024-vfrnav in `src/assets/gallery/`.
Files retain their original basename and the CDN's WebP encoding. Two image
layers crossfade without cropping or layout shifts; only current/previous images
are loaded, rather than downloading the whole gallery on page load. Playback
pauses on hover, keyboard focus, hidden pages and off-screen galleries; reduced
motion starts paused and disables transitions. Previous/next and pause/play
controls remain available.
The hero benefit card cycles through the six localized feature descriptions
every 6.5 seconds, with a stable height and manual controls. Both slideshows use
the shared `useAutoplay` hook for visibility, focus and reduced-motion behavior.
Next-section buttons stay sticky near the bottom of the viewport within the
introduction, gallery and quick-start sections. Each has a fixed destination and
an inviting localized label describing it, and scrolls there without changing
tabs or hiding the heading under the navigation. Button backgrounds remain opaque
on hover to keep their labels readable over gallery images.

A bell beside the header search opens the important-message box without adding
height to the page. It contains the standalone-version survey and a link to the
1.5.0 notes in the Releases tab, rather than duplicated release details. The survey reuses
the Support tab's Microsoft Forms link; downloads still go to Flightsim.to.
All messages support the 14 site languages. The native non-modal popover closes
with Escape, an outside click or its close button; its content scrolls within the
viewport. Edit `src/content/notifications.ts`
to update the localized messages.

The Releases tab has independently authored website copy for all 46 historical
versions in all 14 supported languages. `src/content/releases/manifest.ts`
defines version dates, components, categories and change IDs; the locale files
beside it contain the rewritten notes. They preserve the original changes,
limitations, historical shortcuts and issue references without repeating
English/French source paragraphs. Dates and category/component headings follow
the selected language. The project JSON is an authoring reference, not a runtime
import or build dependency; tests check that its historical versions remain
covered. This is separate from the antivirus `public/releases.json`.
All versions are available newest first through the scrolling desktop sidebar
or mobile selector. Category headings use shared SVG icons rather than emojis.
Project-wide, installer/server and EFB changes have separate bordered cards
with header bands; improvement categories use teal badges and fixes use amber
badges, with explicit text and icons so color is not the only distinction.
Each category and its bullet points sit in their own bordered subframe within
the component card.
Search includes every version and its rewritten notes in the selected language.
Links such as `#release-1.5.0` select a specific version and support reload and
Back/Forward. Notes scroll inside the existing viewport-bounded documentation
layout. When adding a release, update the site manifest and all 14 locale files;
missing translations fail the typecheck instead of silently falling back to
another language. Shortcut descriptions reuse the guide's keycap formatting.
Versions with available scans show an Antivirus link to their filtered reports
(`#antivirus-1.5.0`, for example). Report labels may include a `v` prefix and
status suffix; alpha and stable versions remain distinct. Both tabs use the same
validated report loader with visible loading, error and retry states. Older
versions without reports do not show an Antivirus link.

`public/releases.json` is the canonical antivirus file manifest: release metadata,
filenames, hashes and report links, without manually maintained detection counts.
The Antivirus tab fetches it and `virustotal.json` at runtime, validates both, and
preserves release/component/filename filtering, full SHA-256 hashes and report links.
The generated snapshot contains the last successful check time, each file's
VirusTotal analysis time, and malicious/suspicious vendors with their verbatim
detection labels and categories. Counts are flagged verdicts divided by completed
engine results (malicious, suspicious, harmless and undetected); timeouts, failures
and unsupported engines are excluded. Badge thresholds remain 0 green,
1–3 yellow and 4+ red. The page explains this definition in every language.
Before the first check, or for a newly added hash, it shows a pending state,
never a fabricated zero. Timestamps distinguish cached results from live data.
Network or invalid-data errors are visible and retryable; results are not
presented as a safety guarantee. All new interface text supports all 14 locales.
The Antivirus notice explains that UPX compression and the installer's
self-extraction can trigger heuristic or machine-learning-based false positives.
This explanation is included in localized help search.
It distinguishes installer alerts from the Community package's detection-free
published reports and the server executable's generally low or zero detections, directing readers
to the separate component/version reports rather than hardcoding scan counts.

### Automatic VirusTotal updates

Publishing also copies `.github/workflows/virustotal.yml` and the small standalone
updater/test scripts into `.github/scripts/` on `github-pages`. The workflow
always checks out only `github-pages`, reads its root `releases.json`, and uses the supported
VirusTotal v3 file API. It retrieves existing analyses only: it does not upload
files or request rescans. It does not need `github_app`, app source, dependencies
or build tools on the published branch. Changes to the published manifest or
updater trigger a check, and manual runs can select `github-pages`.
Before enabling it:

1. Add a repository **Actions secret** named `VIRUSTOTAL_API_KEY`. Never add the
   key to source, public JSON, browser code or a `VITE_` environment variable.
   Ensure your VirusTotal API plan permits this use.
2. Set **Settings > Pages > Build and deployment > Source** to **GitHub Actions**.
   Install a dedicated GitHub App on this repository with **Contents: Read and
   write**. Add Actions secrets `VT_APP_ID` (App ID) and `VT_APP_PRIVATE_KEY`
   (the complete generated PEM private key). Grant that App **Always allow**
   bypass for the PR requirement on `github-pages` (or its classic branch
   protection equivalent); overlapping branch protections still apply.
   The signed-commit requirement can remain enabled: the workflow uses GitHub's
   `createCommitOnBranch` API, which automatically signs commits, and checks
   the returned signature. Its expected-head check rejects concurrent branch
   changes rather than overwriting them. The workflow creates
   a short-lived, current-repository-only App token for checkout and push, so
   only that App identity needs the exception. Its private key never reaches the
   published site. The normal `GITHUB_TOKEN` retains read-only contents access.
   Permit the
   `github-pages` branch to deploy to the `github-pages` environment.
3. Publish the site changes, including the copied `.github` files, to
   `github-pages`, then run **Actions > Update VirusTotal reports > Run workflow**
   on that branch. Check its update and deployment jobs.

GitHub runs cron schedules and discovers manually dispatchable workflows only
when the workflow also exists on the repository's default branch. The canonical
workflow in the source checkout provides this definition (every six hours);
even a scheduled run checks out only `github-pages` and never writes to the
default branch. If you publish the workflow only on `github-pages` while another
branch remains the default, its push trigger works, but GitHub will not run its
cron schedule.

No npm install or build is needed for scheduled updates. The updater deduplicates
hashes, spaces requests by 16 seconds (four requests/minute), and fails explicitly
on missing secrets, API/HTTP errors, missing files or inconsistent results.
Only a completely successful fetch replaces the snapshot. The workflow commits
`virustotal.json` to `github-pages` and deploys a Pages artifact explicitly:
commits made with `GITHUB_TOKEN` alone do not trigger a branch-based Pages build.
If a check fails, the previous published snapshot and its timestamps remain.
The API's daily quota still applies; avoid overlapping manual runs or sharing
the key with other high-volume tasks.

Local builds contain an empty initial snapshot. The explicit publish script
preserves an existing Pages `virustotal.json` instead of overwriting scheduled
results with that empty file. To add files, update the source manifest, build
and publish the site, then run the workflow. No API key is needed for local
builds, tests or normal site visitors.

The support page uses icon cards and the donation SVGs from the VFRNav project's
`images/` directory, copied into `src/assets/` for self-contained builds.
Donation cards also mirror its Preferred/Convenient badges and platform-fee
notes, localized for all supported languages.

```sh
npm install
npm run dev
npm test
npm run build
```
