export const featureIllustrations = ["map", "charts", "planning", "review", "weather", "vr"] as const;
type Feature = typeof featureIllustrations[number];

export default function FeatureIllustration({ feature }: { feature: Feature }) {
  const drawings = {
    map: (
      <>
        <path className="fill-sky/10 stroke-sky" d="m18 82 32-48 38 25 36-39 42 46 30-28 26 44" />
        <path d="m80 18 5 64m73-64-4 64" opacity=".3" />
        <path d="m34 73 47-29 46 22 73-40" strokeDasharray="5 6" />
        <circle cx="34" cy="73" r="5" />
        <circle cx="127" cy="66" r="5" />
        <circle cx="200" cy="26" r="5" />
      </>
    ),
    charts: (
      <>
        <path className="fill-sky/10 stroke-sky" d="M66 14h72l28 28v44H66z" />
        <path d="M138 14v28h28M80 61l18-14 16 24 30-17M80 77h28" />
        <circle cx="111" cy="48" r="14" opacity=".5" />
        <path d="M111 27v42m-21-21h42" opacity=".5" />
        <path d="M53 28H40v58h13m126-44h14v44h-14" opacity=".4" />
      </>
    ),
    planning: (
      <>
        <path d="m24 75 29-46 38 25 32-31" strokeDasharray="5 6" />
        <circle cx="24" cy="75" r="4" />
        <circle cx="53" cy="29" r="4" />
        <circle cx="91" cy="54" r="4" />
        <path className="fill-sky/10 stroke-sky" d="M143 17h75v68h-75z" />
        <path d="M153 32h55m-55 16h55m-55 16h55m-37-32v43" opacity=".6" />
        <path d="m113 69 16 0m-6-6 6 6-6 6" />
      </>
    ),
    review: (
      <>
        <path d="M26 73c13-45 36-48 53-23s43 36 61 6 49-36 73-19" />
        <circle cx="26" cy="73" r="5" />
        <path className="fill-sky/10 stroke-sky" d="m146 14 27 15-27 15z" />
        <path d="M146 14v40M29 88h181" opacity=".4" />
        <circle cx="86" cy="88" r="4" />
        <path d="m202 25 11 12-15 4" />
      </>
    ),
    weather: (
      <>
        <circle cx="90" cy="35" r="17" className="fill-sky/10 stroke-sky" />
        <path d="M90 9V4m0 62v-5M64 35h-5m62 0h-5M71 16l-4-4m46 46-4-4m0-38 4-4" />
        <path className="fill-sky/10 stroke-sky" d="M87 73a17 17 0 0 1 0-34 25 25 0 0 1 47-8 20 20 0 1 1 13 42z" />
        <path d="m102 84-3 7m22-7-3 7m22-7-3 7M181 27v53m0-47 29 9-29 10m0 28h-9 18" />
      </>
    ),
    vr: (
      <>
        <rect className="fill-sky/10 stroke-sky" x="23" y="25" width="74" height="52" rx="5" />
        <path d="M23 37h74m-65-5h1m6 0h1M34 65l15-14 15 9 20-13" />
        <path d="m18 18-7 0 0 7m91 59h7v-7" />
        <path className="fill-sky/10 stroke-sky" d="m140 27 60-10 13 59-60 10z" />
        <path d="m150 37 41-7 8 37-41 7zM177 89V12m-5 7 5-7 5 7m39 60-44 10-42-13" />
        <circle cx="177" cy="89" r="3" />
      </>
    )
  };

  return (
    <svg
      className="mb-4 block h-auto max-h-[120px] w-full rounded-lg bg-accent/4 text-accent"
      viewBox="0 0 240 100"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawings[feature]}
    </svg>
  );
}
