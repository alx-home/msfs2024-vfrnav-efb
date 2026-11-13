const paths = {
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  book: "M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5",
  issue: "M12 8v5m0 3h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  community: "M8 11h8m-8 4h5M4 3h16v15H9l-5 4V3",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18",
  feedback: "M4 3h16v14H9l-5 4V3m4 5h8m-8 4h5",
  launch: "M4 3h16v18H4zM4 7h16M8 5h.01M12 5h.01m-4 6h3v3H8zm5 0h3v3h-3zm-5 5h3v3H8zm5 0h3v3h-3z",
  route: "M4 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0 0V8a4 4 0 0 1 8 0v8a4 4 0 0 0 8 0V6m-4 4 4-4 4 4",
  review: "M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6",
  close: "m6 6 12 12M6 18 18 6",
  shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zm-5 10 3 3 6-6",
  images: "M3 5h18v14H3zm0 10 5-5 5 5 3-3 5 5M16 8h.01",
  previous: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8z",
  panel: "M3 4h18v16H3zm0 4h18M7 6h.01",
  tablet: "M6 2h12v20H6zm5 17h2",
  move: "M12 2v20M2 12h20m-14-6 4-4 4 4m-10 2-4 4 4 4m12-8 4 4-4 4m-10 2 4 4 4-4",
  rotate: "M3 11a9 9 0 1 1 2 7M3 4v7h7",
  resize: "M8 3H3v5m13 13h5v-5M3 3l7 7m4 4 7 7",
  mouse: "M12 2a6 6 0 0 0-6 6v8a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6m0 0v7M6 9h12",
  check: "m5 12 4 4L19 6",
  keyboard: "M2 6h20v12H2zm4 4h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
  down: "m6 9 6 6 6-6",
  weather: "M8 5a4 4 0 1 1 5 5M8 1v1M1 8h1m1-5 1 1m10-1-1 1M7 20h12a4 4 0 0 0 0-8 6 6 0 0 0-11-1 5 5 0 0 0-1 9",
  arrow: "M5 12h14m-6-6 6 6-6 6"
} as const;

export default function SupportIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg className="block size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
