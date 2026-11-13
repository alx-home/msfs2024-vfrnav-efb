import type { ComponentProps } from "react";
import { efbModes } from "../content/efbModes";
import type { Language } from "../content";
import { efbEditing } from "../content/efbEditing";
import SupportIcon from "./SupportIcon";
import KeyboardShortcut, { KeyboardText } from "./KeyboardShortcut";

const editingIcons = ["mouse", "move", "rotate", "resize", "check"] as const;
const panelIcons = ["panel", "move", "resize", "rotate"] as const;

function GuideSteps({ steps, icons, color, heading: Heading }: {
  steps: readonly (readonly [title: string, body: string, shortcut?: string])[];
  icons: readonly ComponentProps<typeof SupportIcon>["name"][];
  color: "sky" | "accent";
  heading: "h5" | "h6";
}) {
  return (
    <ol className="space-y-8">
      {steps.map(([title, body, shortcut], index) => <li key={title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-x-4">
        <span className={`relative grid size-10 place-items-center rounded-xl border sm:size-12 ${color === "sky" ? "border-sky/20 bg-sky/10 text-sky" : "border-accent/20 bg-accent/10 text-accent"}`} aria-hidden="true">
          <SupportIcon name={icons[index]} />
          <span className={`absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-[11px] leading-none font-bold tabular-nums text-page ${color === "sky" ? "bg-sky" : "bg-accent"}`}>{index + 1}</span>
        </span>
        <Heading className="self-center text-base font-semibold leading-7 text-ink">{title}</Heading>
        <div className="col-span-2 min-w-0 space-y-3 sm:col-span-1 sm:col-start-2">
          {shortcut && <div><KeyboardShortcut shortcut={shortcut} /></div>}
          <p className="max-w-prose leading-8"><KeyboardText>{body}</KeyboardText></p>
        </div>
      </li>)}
    </ol>
  );
}

export default function EfbModesGuide({ language }: { language: Language }) {
  const modes = efbModes[language];
  const editing = efbEditing[language];
  return (
    <div className="space-y-10">
      <div className="max-w-[760px]">
        <h3>{modes.title}</h3>
        <p className="max-w-prose leading-8">{modes.summary}</p>
      </div>
      <section className="space-y-8 rounded-2xl border border-line bg-page/30 p-[clamp(1.25rem,3vw,2rem)]">
        <div>
          <h4 className="mb-5 flex items-center gap-3 text-xl font-bold text-ink">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky/10 text-sky"><SupportIcon name="panel" /></span>
            <span className="min-w-0 wrap-anywhere">{modes.twoD[0]}</span>
          </h4>
          <p className="max-w-prose leading-8">{modes.twoD[1]}</p>
        </div>
        <div className="border-t border-line pt-8">
          <GuideSteps steps={modes.panelSteps} icons={panelIcons} color="sky" heading="h5" />
        </div>
      </section>
      <section className="space-y-8 rounded-2xl border border-line bg-page/30 p-[clamp(1.25rem,3vw,2rem)]">
        <div>
          <h4 className="mb-5 flex items-center gap-3 text-xl font-bold text-ink">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><SupportIcon name="tablet" /></span>
            <span className="min-w-0 wrap-anywhere">{modes.threeD[0]}</span>
          </h4>
          <p className="max-w-prose leading-8">{modes.threeD[1]}</p>
        </div>
        <div className="border-t border-line pt-8">
          <h5 className="mb-6 text-lg font-bold text-ink">{editing.title}</h5>
          <GuideSteps steps={editing.steps} icons={editingIcons} color="accent" heading="h6" />
          <p className="mt-8 flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm leading-7">
            <span className="mt-1 shrink-0 text-accent"><SupportIcon name="keyboard" /></span>
            <span className="min-w-0"><KeyboardText>{editing.tip}</KeyboardText></span>
          </p>
        </div>
        <div className="space-y-4 border-t border-line pt-8">
          <h5 className="flex items-center gap-3 text-lg font-bold text-ink"><SupportIcon name="download" />{editing.setup}</h5>
          <p className="max-w-prose leading-8">{modes.setup}</p>
        </div>
        <div className="space-y-4 border-t border-line pt-8">
          <h5 className="flex items-center gap-3 text-lg font-bold text-ink"><SupportIcon name="keyboard" />{editing.controls}</h5>
          <p className="max-w-prose leading-8"><KeyboardText>{modes.controls}</KeyboardText></p>
        </div>
      </section>
    </div>
  );
}
