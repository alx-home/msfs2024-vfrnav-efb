import { useEffect, useState } from "react";
import { parseReleases, type Release } from "./reports";

type ReportsState = { status: "loading" } | { status: "error" } | { status: "ready"; releases: Release[] };

export function useAntivirusReports() {
  const [state, setState] = useState<ReportsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    const load = async () => {
      try {
        const response = await fetch("./releases.json", { signal: controller.signal });
        if (!response.ok) throw new Error(`Reports request failed: HTTP ${response.status}`);
        const data: unknown = await response.json();
        const releases = parseReleases(data);
        if (!controller.signal.aborted) setState({ status: "ready", releases });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load VirusTotal reports.", error);
        setState({ status: "error" });
      }
    };
    void load();
    return () => controller.abort();
  }, [attempt]);

  return { state, retry: () => setAttempt((value) => value + 1) };
}
