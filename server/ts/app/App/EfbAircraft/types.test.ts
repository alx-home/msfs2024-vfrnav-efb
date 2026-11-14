// SPDX-License-Identifier: GPL-3.0-only
import assert from "node:assert/strict";
import { test } from "node:test";
import { blocksCareerMode, matchesAircraft, pendingAircraftChanges, selectedCareerRisks, type Aircraft } from "./types";

test("identifies the two aircraft known to block Career mode", () => {
   const aircraft: Aircraft = {
      id: "test", name: "", container: "",
      presetCount: 1, presetNames: [], status: "available", efb: "none", reason: "", warnings: []
   };
   for (const identity of [
      { name: "C172sp G1000", container: "" },
      { name: "", container: "Community/asobo_c172sp_g1000" },
      { name: "A320neo", container: "microsoft-aircraft-a320neo" }
   ]) {
      assert.equal(blocksCareerMode({ ...aircraft, ...identity }), true);
   }
   for (const identity of [
      { name: "C172sp", container: "asobo_c172sp" },
      { name: "A320neo", container: "community/other-a320neo" }
   ]) {
      assert.equal(blocksCareerMode({ ...aircraft, ...identity }), false);
   }

   const risks = [
      { ...aircraft, id: "c172", name: "C172sp G1000" },
      { ...aircraft, id: "a320", container: "microsoft-aircraft-a320neo" },
      { ...aircraft, id: "patched", name: "C172sp G1000", status: "patched" as const },
      { ...aircraft, id: "installed", name: "C172sp G1000", installedOnly: true }
   ];
   const pendingRisks = pendingAircraftChanges(risks, new Set(risks.map(item => item.id))).toPatch.filter(blocksCareerMode);
   assert.deepEqual(pendingRisks.map(item => item.id), ["c172", "a320"]);
});

test("warns only when a selectable affected aircraft is selected", () => {
   const aircraft: Aircraft = {
      id: "c172", name: "C172sp G1000", container: "asobo_c172sp_g1000",
      presetCount: 1, presetNames: [], status: "available", efb: "none", reason: "", warnings: []
   };
   const fleet = [
      aircraft,
      { ...aircraft, id: "a320", name: "Microsoft A320neo", container: "microsoft-a320neo" },
      { ...aircraft, id: "patched", status: "patched" as const },
      { ...aircraft, id: "installed", installedOnly: true },
      { ...aircraft, id: "unsupported", status: "unsupported" as const },
      { ...aircraft, id: "other", name: "C172sp", container: "asobo_c172sp" }
   ];
   assert.deepEqual(selectedCareerRisks(fleet, new Set()), []);
   assert.deepEqual(selectedCareerRisks(fleet, new Set(["c172", "a320", "patched", "installed", "unsupported", "other"]))
      .map(item => item.id), ["c172", "a320", "patched"]);
   assert.deepEqual(selectedCareerRisks(fleet, new Set(["a320"])).map(item => item.id), ["a320"]);
});

test("protected aircraft can be found by preset names even when the container name differs", () => {
   const aircraft: Aircraft = {
      id: "h500", name: "Oh6a", container: "SimObjects/Airplanes/oh6a",
      presetCount: 3, presetNames: ["500c", "500c_cargo", "oh6a"],
      status: "patched", efb: "none", reason: "", warnings: []
   };
   for (const search of ["500", "500C", " 500c_cargo ", "OH6A", "SimObjects/Airplanes", ""]) {
      assert.equal(matchesAircraft(aircraft, search), true);
   }
   assert.equal(matchesAircraft(aircraft, "Praetor"), false);
   assert.equal(matchesAircraft({ ...aircraft, presetNames: [] }, "500"), false);
   assert.equal(matchesAircraft({ ...aircraft, reason: "Requires Deep scan" }, "deep"), true);
});

test("pending changes are empty for unchanged installed and scanned aircraft", () => {
   const aircraft: Aircraft = {
      id: "installed", name: "Installed", container: "SimObjects/Airplanes/Installed",
      presetCount: 1, presetNames: [], status: "patched", efb: "none", reason: "", warnings: []
   };
   for (const installedOnly of [false, true]) {
      assert.deepEqual(pendingAircraftChanges([{ ...aircraft, installedOnly }], new Set([aircraft.id])),
         { toPatch: [], toRemove: [] });
      assert.deepEqual(pendingAircraftChanges([{ ...aircraft, installedOnly }], new Set()),
         { toPatch: [], toRemove: [{ ...aircraft, installedOnly }] });
   }
   assert.deepEqual(pendingAircraftChanges([], new Set()), { toPatch: [], toRemove: [] });
});

test("pending changes include only actionable installs, updates, and removals", () => {
   const aircraft: Aircraft = {
      id: "plane", name: "Plane", container: "SimObjects/Airplanes/Plane",
      presetCount: 1, presetNames: [], status: "available", efb: "none", reason: "", warnings: []
   };
   for (const status of ["available", "outdated"] as const) {
      const item = { ...aircraft, status };
      assert.deepEqual(pendingAircraftChanges([item], new Set([item.id])), { toPatch: [item], toRemove: [] });
   }
   for (const status of ["unsupported", "foreign", "available"] as const) {
      const item = { ...aircraft, status };
      assert.deepEqual(pendingAircraftChanges([item], new Set()), { toPatch: [], toRemove: [] });
   }
   for (const status of ["unsupported", "foreign"] as const) {
      assert.deepEqual(pendingAircraftChanges([{ ...aircraft, status }], new Set([aircraft.id])),
         { toPatch: [], toRemove: [] });
   }
   const installed = { ...aircraft, status: "outdated" as const, installedOnly: true };
   assert.deepEqual(pendingAircraftChanges([installed], new Set([installed.id])), { toPatch: [], toRemove: [] });
   assert.deepEqual(pendingAircraftChanges([installed], new Set()), { toPatch: [], toRemove: [installed] });
});
