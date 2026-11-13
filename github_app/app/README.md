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

`src/pages/` contains the seven tab pages; `src/components/` contains the shared
header, tab navigation and section heading. Only the active tab is rendered.
Tabs support arrow keys, Home and End, URL hashes and browser Back/Forward.
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

`public/releases.json` is the canonical antivirus report data, migrated unchanged.
The Antivirus tab fetches it at runtime, validates the report structure, and
preserves release/component/filename filtering, full SHA-256 hashes, report links
and the original detection-score thresholds (0 green, 1–3 yellow, 4+ red).
Network or invalid-data errors are visible and retryable; results are not
presented as a safety guarantee. All new interface text supports all 14 locales.
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
