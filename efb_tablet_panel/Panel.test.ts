/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import assert from "node:assert/strict";

function createPanel(ready = 1, failure?: Error, acknowledged = true) {
  const listeners = new Map<string, () => Promise<void>>();
  const output = { textContent: "" };
  let hidden = 1;
  const active: boolean[] = [];
  const local: boolean[] = [];
  let tick: (() => void) | undefined;
  const frame = {
    visible: true,
    addEventListener: (name: string, callback: () => Promise<void>) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  const classes = new Set<string>();
  const button = {
    addEventListener: (name: string, callback: () => Promise<void>) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  };
  let constructor: new () => { connectedCallback(): void; disconnectedCallback(): void };
  const writes: [string, string, number][] = [];
  runInNewContext(readFileSync(new URL("../build/efb_tablet_panel/html_ui/InGamePanels/EfbTablet/Panel.js",
    import.meta.url), "utf8"), {
    TemplateElement: class {
      classList = {
        toggle: (name: string, force: boolean) => { if (force) classes.add(name); else classes.delete(name); },
      };
      connectedCallback() { }
      disconnectedCallback() { }
      querySelector(selector: string) {
        return selector === "ingame-ui" ? frame : selector === "button" ? button : output;
      }
    },
    SimVar: {
      GetSimVarValue: (name: string) => name === "L:VFRNAV_EFB_READY" ? ready
        : name === "L:VFRNAV_EFB_HIDDEN" ? hidden : acknowledged ? 0 : 1,
      SetSimVarValue: async (name: string, unit: string, value: number) => {
        if (failure) throw failure;
        writes.push([name, unit, value]);
        if (acknowledged) hidden = 1 - hidden;
      },
    },
    customElements: { define: (_name: string, value: typeof constructor) => { constructor = value; } },
    checkAutoload() { },
    RegisterToolBarListener: () => ({
      setButtonChildActive: (_id: string, value: boolean) => { active.push(value); },
      pushLocalPanelVisibility: (_id: string, value: boolean) => { local.push(value); },
    }),
    setInterval: (callback: () => void) => { tick = callback; return 1; },
    clearInterval: () => { tick = undefined; },
    setTimeout: (callback: () => void) => callback(),
    console: { info() { } },
  });
  const panel = new constructor!();
  panel.connectedCallback();
  return {
    panel, listeners, output, writes, active, local, frame, classes,
    keyboard: (value: number) => { hidden = value; tick?.(); }
  };
}

test("activated toolbar keeps the floating window hidden unless an error occurs", async () => {
  const state = createPanel();
  assert.equal(state.frame.visible, false);
  state.frame.visible = true;
  await state.listeners.get("panelActive")!();
  assert.equal(state.frame.visible, false);
  assert.equal(state.classes.has("failed"), false);
});

test("deactivating an error panel hides it without writing", async () => {
  const state = createPanel(0);
  await state.listeners.get("panelActive")!();
  assert.equal(state.frame.visible, true);
  assert.equal(state.classes.has("failed"), true);
  await state.listeners.get("panelInactive")!();
  assert.equal(state.frame.visible, false);
  assert.equal(state.classes.has("failed"), false);
  assert.equal(state.writes.length, 0);
});

test("toolbar stays selected while visible and suppresses synchronization feedback", async () => {
  const state = createPanel();
  const activate = state.listeners.get("panelActive")!;
  await Promise.all([activate(), activate()]);
  assert.deepEqual(state.writes, [["L:VFRNAV_EFB_TOGGLE_REQUEST", "number", 1]]);
  assert.deepEqual(state.active, [false, true]);
  assert.equal(state.local.at(-1), false);
  await activate();
  assert.equal(state.writes.length, 1);
  await state.listeners.get("click")!();
  assert.equal(state.writes.length, 2);
  assert.equal(state.active.at(-1), false);
  state.panel.disconnectedCallback();
  assert.equal(state.listeners.size, 0);
});

test("missing rig reports error instead of closing or writing", async () => {
  const state = createPanel(0);
  await state.listeners.get("panelActive")!();
  assert.match(state.output.textContent, /does not have an active cockpit tablet rig/);
  assert.equal(state.writes.length, 0);
  assert.equal(state.local.at(-1), true);
});

test("write rejection is visible and permits another attempt", async () => {
  const state = createPanel(1, new Error("Write failed"));
  await state.listeners.get("panelActive")!();
  assert.match(state.output.textContent, /Write failed/);
  await state.listeners.get("click")!();
  assert.equal(state.local.at(-1), true);
  assert.equal(state.writes.length, 0);
});

test("unconsumed request reports a simulator acknowledgement error", async () => {
  const state = createPanel(1, undefined, false);
  await state.listeners.get("panelActive")!();
  assert.match(state.output.textContent, /did not acknowledge/);
  assert.equal(state.writes.length, 1);
  assert.equal(state.local.at(-1), true);
});

test("keyboard visibility synchronizes selection and toolbar deactivation hides tablet", async () => {
  const state = createPanel();
  state.keyboard(0);
  assert.equal(state.active.at(-1), true);
  await state.listeners.get("panelActive")!();
  assert.equal(state.writes.length, 0);
  await state.listeners.get("panelInactive")!();
  assert.equal(state.writes.length, 1);
  assert.equal(state.active.at(-1), false);
  await state.listeners.get("panelInactive")!();
  assert.equal(state.writes.length, 1);
});
