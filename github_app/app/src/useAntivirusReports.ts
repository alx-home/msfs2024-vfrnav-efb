import { useEffect, useState } from "react";
import { parseReleases, parseVirusTotalSnapshot } from "./reports";

type DataState<T> = { status: "loading" } | { status: "error" } | { status: "ready"; value: T };

function useReportData<T>(path: string, parse: (value: unknown) => T) {
  const [state, setState] = useState<DataState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    const load = async () => {
      try {
        const response = await fetch(path, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(`Reports request failed: HTTP ${response.status}`);
        const data: unknown = await response.json();
        const value = parse(data);
        if (!controller.signal.aborted) setState({ status: "ready", value });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(`Unable to load VirusTotal reports from ${path}.`, error);
        setState({ status: "error" });
      }
    };
    void load();
    return () => controller.abort();
  }, [attempt, path, parse]);

  return { state, retry: () => setAttempt((value) => value + 1) };
}

export function useAntivirusReports() {
  const { state, retry } = useReportData("./releases.json", parseReleases);
  return { state: state.status === "ready" ? { status: "ready" as const, releases: state.value } : state, retry };
}

export function useVirusTotalResults() {
  return useReportData("./virustotal.json", parseVirusTotalSnapshot);
}
