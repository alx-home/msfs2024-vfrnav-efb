// SPDX-License-Identifier: GPL-3.0-only
import assert from "node:assert/strict";
import { test } from "node:test";
import { matchesAircraft, pendingAircraftChanges, type Aircraft } from "./types";

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
