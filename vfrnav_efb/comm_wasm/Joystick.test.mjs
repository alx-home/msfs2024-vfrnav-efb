// SPDX-License-Identifier: GPL-3.0-only
import assert from "node:assert/strict";
import console from "node:console";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { URL } from "node:url";
import { TextDecoder, TextEncoder } from "node:util";
import { WASI } from "node:wasi";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("../node_modules/typescript");

const binary = readFileSync(new URL("../../build/vfrnav_efb/wasm/vfrnav_comm_wasm.wasm", import.meta.url));
const module = new WebAssembly.Module(binary);
const scanGroup = 0x20000;
const joystickGroup = 0x10002;
const scanEvent = 0x10006;
const toggleEvent = 0x10007;

test("Settings messages reach WASM through the real Manager and RecordManager APIs", async () => {
   const transpile = source => ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
   }).outputText;
   const loadClass = name => {
      const source = readFileSync(new URL(`../EFB/src/${name}.tsx`, import.meta.url), "utf8");
      const exports = {};
      runInNewContext(transpile(source), { exports, require: () => ({}) });
      return exports[name];
   };
   const Manager = loadClass("Manager");
   const RecordManager = loadClass("RecordManager");
   const calls = [];
   let failure;
   const records = Object.create(RecordManager.prototype);
   records.wasm_comm = {
      async callWasm(event, action) {
         calls.push({ event, action });
         if (failure && action !== "get") throw failure;
         return action === "clear" ? "" : "Test Joystick - Button 4";
      }
   };
   const manager = Object.create(Manager.prototype);
   manager.recordManager = records;
   const source = ts.createSourceFile("MainPage.tsx",
      readFileSync(new URL("../EFB/src/Components/MainPage.tsx", import.meta.url), "utf8"),
      ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
   const declaration = source.statements.find(node => ts.isClassDeclaration(node)
      && node.name.text === "MainPage");
   const member = declaration.members.find(node => node.name?.getText(source) === "onTabletJoystickMessage");
   assert.ok(member?.initializer);
   const replies = [];
   const handler = runInNewContext(transpile(`(${member.initializer.getText(source)})`), {
      props: { manager },
      messageHandler: { send: message => replies.push(message) },
      Error, console
   });
   for (const [index, action] of ["get", "capture", "cancel", "clear"].entries()) {
      await handler({ action, requestId: index, binding: "" });
      assert.equal(calls.at(-1).event, "VFRNAV_TABLET_JOYSTICK");
      assert.equal(calls.at(-1).action, action);
      assert.equal(replies.at(-1).requestId, index);
      assert.equal(replies.at(-1).error, "");
      assert.equal(replies.at(-1).binding, action === "clear" ? "" : "Test Joystick - Button 4");
   }
   failure = new Error("Capture failed");
   await handler({ action: "capture", requestId: 5, binding: "" });
   assert.equal(replies.at(-1).error, "Capture failed");
   assert.equal(replies.at(-1).binding, "Test Joystick - Button 4");
   assert.equal(calls.at(-1).action, "get");
   const count = replies.length;
   await handler({ action: "response" });
   assert.equal(replies.length, count);
});

function harness(t, saved = "", { backup, poses, posesBackup, missingFileIO = false, unreadablePoses = false } = {}) {
   const folder = mkdtempSync(join(tmpdir(), "vfrnav-joystick-"));
   if (saved !== null) writeFileSync(join(folder, "tablet-joystick.txt"), saved);
   if (backup !== undefined) writeFileSync(join(folder, "tablet-joystick.txt.bak"), backup);
   if (poses !== undefined) writeFileSync(join(folder, "tablet-poses.txt"), poses);
   if (posesBackup !== undefined) writeFileSync(join(folder, "tablet-poses.txt.bak"), posesBackup);
   const wasi = new WASI({ version: "preview1", preopens: { "/work": folder }, returnOnExit: true });
   let instance;
   let dispatch;
   let packet = 0;
   let request = 0;
   let clock = 1_000_000_000n;
   let failSave = false;
   let failCommit = false;
   let failRestore = false;
   let failWrite = false;
   const renameCalls = [];
   const registrations = new Map();
   const calls = [];
   const inputGroups = new Set();
   const pendingExceptions = [];
   const responses = [];
   const variables = [];
   const lvarIds = new Map();
   const lvars = new Map();
   const memory = () => new DataView(instance.exports.memory.buffer);
   const text = ptr => {
      const bytes = new Uint8Array(instance.exports.memory.buffer);
      return new TextDecoder().decode(bytes.subarray(ptr, bytes.indexOf(0, ptr)));
   };
   const env = {
      fsCommBusRegister(name, callback, context) {
         registrations.set(text(name), { callback, context });
         return 0;
      },
      fsCommBusCall(name, ptr, length) {
         responses.push({
            event: text(name),
            value: new TextDecoder().decode(new Uint8Array(instance.exports.memory.buffer, ptr, length))
         });
         return 0;
      },
      fsCommBusUnregisterAll() { return 0; },
      fsVarsRegisterLVar(name) {
         const key = text(name);
         if (!lvarIds.has(key)) lvarIds.set(key, lvarIds.size + 1);
         return lvarIds.get(key);
      },
      fsVarsGetUnitId() { return 1; },
      fsVarsLVarSet(...args) { variables.push(args); lvars.set(args[0], args[2]); return 0; },
      fsVarsLVarGet(id, _unit, ptr) {
         memory().setFloat64(ptr, lvars.get(id) ?? 0, true);
         return 0;
      },
      SimConnect_Open(ptr) { memory().setUint32(ptr, 1, true); return 0; },
      SimConnect_CallDispatch(_handle, callback, context) { dispatch = { callback, context }; return 0; },
      SimConnect_GetLastSentPacketID(_handle, ptr) { memory().setUint32(ptr, packet, true); return 0; },
   };
   for (const entry of WebAssembly.Module.imports(module)) {
      if (entry.module !== "env" || entry.name in env) continue;
      assert.match(entry.name, /^(SimConnect_|__wasm_eac_reserved_import_slot)/,
         `Unexpected unresolved project import: ${entry.name}`);
      env[entry.name] = (...args) => {
         calls.push({ name: entry.name, args, packet: ++packet,
            definition: entry.name === "SimConnect_MapInputEventToClientEvent_EX1" ? text(args[2]) : undefined });
         if (entry.name === "SimConnect_MapInputEventToClientEvent_EX1") {
            inputGroups.add(args[1]);
         } else if (entry.name === "SimConnect_ClearInputGroup") {
            if (!inputGroups.delete(args[1])) {
               pendingExceptions.push({ packet, code: 3, parameter: 1 });
            }
         }
         return 0;
      };
   }
   instance = new WebAssembly.Instance(module, {
      env,
      wasi_snapshot_preview1: {
         ...wasi.wasiImport,
         commit_pages() { return 0; },
         path_open(...args) {
            if (failSave && text(args[2]).startsWith("tablet-joystick.txt")) return 2;
            const path = text(args[2]);
            if (unreadablePoses && path === "tablet-poses.txt") return 29;
            if (missingFileIO && !existsSync(join(folder, path)) && !(args[4] & 1)) return 29;
            return wasi.wasiImport.path_open(...args);
         },
         path_unlink_file(...args) {
            if (missingFileIO && !existsSync(join(folder, text(args[1])))) return 29;
            return wasi.wasiImport.path_unlink_file(...args);
         },
         path_rename(...args) {
            const from = text(args[1]);
            const to = text(args[4]);
            renameCalls.push({ from, to });
            if ((failCommit && from.endsWith(".tmp")) || (failRestore && from.endsWith(".bak"))) return 2;
            // MSFS uses a Windows-backed filesystem: rename must not assume replacement.
            if (existsSync(join(folder, to))) return 20;
            return wasi.wasiImport.path_rename(...args);
         },
         fd_write(...args) {
            if (failWrite && args[0] > 2) return 2;
            return wasi.wasiImport.fd_write(...args);
         },
         clock_time_get(_id, _precision, ptr) { memory().setBigUint64(ptr, clock, true); return 0; }
      }
   });
   wasi.initialize(instance);
   instance.exports.__wasm_call_ctors();
   instance.exports.module_init();
   t.after(() => {
      instance.exports.module_deinit();
      for (const file of readdirSync(folder)) unlinkSync(join(folder, file));
      rmdirSync(folder);
   });

   const invoke = (callback, context, bytes) => {
      const ptr = instance.exports.malloc(bytes.length);
      new Uint8Array(instance.exports.memory.buffer, ptr, bytes.length).set(bytes);
      instance.exports.__indirect_function_table.get(callback)(ptr, bytes.length, context);
      instance.exports.free(ptr);
   };
   const receive = (id, fields, size = 32) => {
      const bytes = new Uint8Array(size);
      const view = new DataView(bytes.buffer);
      view.setUint32(0, size, true);
      view.setUint32(8, id, true);
      fields(view, bytes);
      invoke(dispatch.callback, dispatch.context, bytes);
   };
   return {
      calls, responses, variables, folder, renameCalls,
      setLvar(name, value) { assert.ok(lvarIds.has(name)); lvars.set(lvarIds.get(name), value); },
      getLvar(name) { return lvars.get(lvarIds.get(name)) ?? 0; },
      aircraft(path, requestId = calls.findLast(call => call.name === "SimConnect_RequestSystemState")?.args[1]) {
         assert.notEqual(requestId, undefined);
         receive(15, (view, bytes) => {
            view.setUint32(12, requestId, true);
            bytes.set(new TextEncoder().encode(path), 24);
         }, 284);
      },
      aircraftLoaded() { receive(6, view => view.setUint32(16, 0x10008, true), 288); },
      shutdown() { instance.exports.module_deinit(); },
      failSave() { failSave = true; },
      failCommit() { failCommit = true; },
      failRestore() { failRestore = true; },
      failWrite() { failWrite = true; },
      restoreStorage() { failSave = false; failCommit = false; failRestore = false; failWrite = false; },
      send(action, event = "VFRNAV_TABLET_JOYSTICK") {
         const id = ++request;
         const registration = registrations.get(event);
         assert.ok(registration, `Missing CommBus event ${event}`);
         invoke(registration.callback, registration.context, new TextEncoder().encode(`${id}:${action}\0`));
         return id;
      },
      reply(id) {
         return responses.find(response => response.value.startsWith(`${id}:`))?.value.slice(`${id}:`.length);
      },
      controllers(items = [{ id: 7, name: "Test Joystick", product: 123, composite: 1 }], page = 0, pages = 1) {
         receive(32, (view, bytes) => {
            view.setUint32(16, items.length, true);
            view.setUint32(20, page, true);
            view.setUint32(24, pages, true);
            items.forEach((item, index) => {
               const offset = 28 + index * 276;
               bytes.set(new TextEncoder().encode(item.name), offset);
               view.setUint32(offset + 256, item.id, true);
               view.setUint32(offset + 260, item.product, true);
               view.setUint32(offset + 264, item.composite, true);
            });
         }, 28 + 276 * items.length);
      },
      event(event, value = 0) {
         receive(4, view => {
            view.setUint32(16, event, true);
            view.setUint32(20, value, true);
         });
      },
      frame(milliseconds = 600) {
         for (const error of pendingExceptions.splice(0)) {
            receive(1, view => {
               view.setUint32(12, error.code, true);
               view.setUint32(16, error.packet, true);
               view.setUint32(20, error.parameter, true);
            });
         }
         clock += BigInt(milliseconds) * 1_000_000n;
         receive(7, view => view.setUint32(16, 0x10005, true));
      },
      exception(packet, code = 1, parameter = 0) {
         receive(1, view => {
            view.setUint32(12, code, true);
            view.setUint32(16, packet, true);
            view.setUint32(20, parameter, true);
         });
      }
   };
}

test("captures a full press/release, preserves keyboard, and persists the controller identity", t => {
   const h = harness(t);
   assert.equal(h.reply(h.send("get")), "data:");
   const keyboard = h.send("Ctrl+Alt+K", "VFRNAV_SET_TABLET_SHORTCUT");
   h.frame();
   assert.equal(h.reply(keyboard), "data:Ctrl+Alt+K");
   const id = h.send("capture");
   h.controllers();
   h.frame();
   const mappings = h.calls.filter(call => call.name === "SimConnect_MapInputEventToClientEvent_EX1"
      && call.args[1] === scanGroup);
   assert.equal(mappings.length, 128);
   assert.equal(mappings[0].definition, "joystick:7:button:0");
   assert.equal(mappings[127].definition, "joystick:7:button:127");
   assert.ok(mappings.every(call => call.args[7] === 0), "capture must not mask aircraft controls");
   h.event(scanEvent, 7);
   assert.equal(h.reply(id), undefined, "a release without a captured press is ignored");
   h.event(scanEvent, 6);
   h.event(scanEvent, 7);
   assert.equal(h.reply(id), undefined, "mapping must be acknowledged before success");
   h.frame();
   assert.equal(h.reply(id), "data:Test Joystick - Button 4");
   const firstMapping = h.calls.findIndex(call => call.args[1] === joystickGroup
      && call.name === "SimConnect_MapInputEventToClientEvent_EX1");
   assert.ok(firstMapping >= 0);
   assert.ok(!h.calls.slice(0, firstMapping).some(call => call.args[1] === joystickGroup
      && call.name === "SimConnect_ClearInputGroup"), "never clear an uncreated joystick group");
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "123 1 3\nTest Joystick\n");
   assert.equal(h.reply(h.send("", "VFRNAV_GET_TABLET_SHORTCUT")), "data:Ctrl+Alt+K");
   const before = h.variables.length;
   h.event(toggleEvent);
   assert.equal(h.variables.length, before + 1);
   assert.ok(h.calls.some(call => call.name === "SimConnect_ClearInputGroup" && call.args[1] === scanGroup));
   const clear = h.send("clear");
   h.frame();
   assert.equal(h.reply(clear), "data:");
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "");
   assert.equal(h.reply(h.send("", "VFRNAV_GET_TABLET_SHORTCUT")), "data:Ctrl+Alt+K");
});

test("cancel and timeout remove temporary groups without saving a binding", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   assert.equal(h.reply(h.send("cancel")), "data:");
   assert.match(h.reply(capture), /^error:.*cancelled/);
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   h.frame();
   assert.equal(h.reply(h.send("get")), "data:");
   const timeout = h.send("capture");
   h.controllers();
   h.frame(8100);
   assert.match(h.reply(timeout), /^error:No button captured/);
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "");
});

test("startup resolves a changed device ID and mapping exceptions preserve the saved binding", t => {
   const h = harness(t, "123 1 3\nTest Joystick\n");
   h.controllers([{ id: 42, name: "Test Joystick", product: 123, composite: 1 }]);
   assert.ok(h.calls.some(call => call.args[1] === joystickGroup && call.definition === "joystick:42:button:3"));
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   const mapping = h.calls.findLast(call => call.args[1] === joystickGroup
      && call.name === "SimConnect_MapInputEventToClientEvent_EX1");
   h.exception(mapping.packet);
   assert.match(h.reply(capture), /^error:.*joystick packet/);
   h.frame();
   assert.equal(h.reply(h.send("get")), "data:Test Joystick - Button 4");
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "123 1 3\nTest Joystick\n");
});

test("enumeration errors, no devices, and ambiguous controllers fail explicitly", t => {
   const h = harness(t);
   const first = h.send("capture");
   const enumeration = h.calls.findLast(call => call.name === "SimConnect_EnumerateControllers");
   h.exception(enumeration.packet);
   assert.match(h.reply(first), /^error:/);
   const empty = h.send("capture");
   h.controllers([]);
   assert.match(h.reply(empty), /^error:No joystick/);
   const duplicate = h.send("capture");
   h.controllers([
      { id: 1, name: "Same", product: 123, composite: 1 },
      { id: 2, name: "Same", product: 123, composite: 1 }
   ]);
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   assert.match(h.reply(duplicate), /^error:Identical controllers/);
   const stalled = h.send("capture");
   h.frame(3100);
   assert.match(h.reply(stalled), /^error:Timed out enumerating/);
});

test("cancelling during mapping acknowledgement restores the previous binding", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   assert.equal(h.reply(h.send("cancel")), "data:");
   assert.match(h.reply(capture), /^error:.*cancelled/);
   h.frame();
   assert.equal(h.reply(h.send("get")), "data:");
});

test("a save failure restores the old mapping and preserves the previous settings file", t => {
   const h = harness(t, "123 1 3\nTest Joystick\n");
   h.controllers();
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   h.failSave();
   h.frame();
   assert.match(h.reply(capture), /^error:Unable to save/);
   assert.equal(h.reply(h.send("get")), "data:Test Joystick - Button 4");
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "123 1 3\nTest Joystick\n");
});

test("enumerates all controller pages and cleans every temporary input group", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers([{ id: 2, name: "Stick", product: 1, composite: 1 }], 0, 2);
   assert.equal(h.calls.filter(call => call.args[1] === scanGroup).length, 0);
   h.controllers([{ id: 9, name: "Throttle", product: 2, composite: 1 }], 1, 2);
   h.frame();
   h.event(scanEvent, 128 * 2);
   h.event(scanEvent, 128 * 2 + 1);
   h.frame();
   assert.equal(h.reply(capture), "data:Throttle - Button 1");
   for (const group of [scanGroup, scanGroup + 1]) {
      assert.ok(h.calls.some(call => call.name === "SimConnect_ClearInputGroup" && call.args[1] === group));
      assert.ok(h.calls.some(call => call.name === "SimConnect_SetInputGroupState"
         && call.args[1] === group && call.args[2] === 0));
   }
});

test("a missing saved device is never remapped onto controller zero after a failure", t => {
   const h = harness(t, "123 1 3\nMissing Joystick\n");
   h.controllers([]);
   const clear = h.send("clear");
   h.failSave();
   h.frame();
   assert.match(h.reply(clear), /^error:/);
   assert.ok(!h.calls.some(call => call.args[1] === joystickGroup && call.definition));
   assert.equal(h.reply(h.send("get")), "data:Missing Joystick - Button 4");
});

test("scan skips keyboard, mouse and nonexistent buttons rejected by the real simulator", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers([
      { id: 1, name: "Mouse", product: 1, composite: 0 },
      { id: 0, name: "Keyboard", product: 2, composite: 0 },
      { id: 6, name: "Rotor", product: 3, composite: 0 }
   ]);
   const mappings = h.calls.filter(call => call.name === "SimConnect_MapInputEventToClientEvent_EX1"
      && call.args[1] >= scanGroup);
   assert.equal(mappings.length, 384);
   assert.ok(!h.calls.some(call => call.name === "SimConnect_SetInputGroupState"
      && call.args[1] >= scanGroup), "wait for mapping exceptions before enabling capture");
   for (const mapping of mappings) {
      const [, device, button] = /joystick:(\d+):button:(\d+)/.exec(mapping.definition);
      if (device !== "6" || Number(button) >= 64) {
         h.exception(mapping.packet, 1, 0xffffffff);
      }
   }
   assert.equal(h.reply(capture), undefined);
   h.frame();
   const enabled = h.calls.filter(call => call.name === "SimConnect_SetInputGroupState"
      && call.args[1] >= scanGroup && call.args[2] === 1);
   assert.deepEqual(enabled.map(call => call.args[1]), [scanGroup + 2]);
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   assert.equal(h.reply(capture), undefined, "rejected definitions must never capture");
   h.event(scanEvent, 256 * 2);
   h.event(scanEvent, 256 * 2 + 1);
   h.frame();
   assert.equal(h.reply(capture), "data:Rotor - Button 1");
   assert.ok(h.calls.some(call => call.args[1] === joystickGroup
      && call.definition === "joystick:6:button:0"));
   for (const group of [scanGroup, scanGroup + 1]) {
      assert.ok(!h.calls.some(call => call.args[1] === group
         && ["SimConnect_ClearInputGroup", "SimConnect_SetInputGroupState"].includes(call.name)),
      "do not operate on groups that were never created");
   }
});

test("all rejected candidates report no usable buttons without enabling nonexistent groups", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers([{ id: 0, name: "Keyboard", product: 1, composite: 0 }]);
   for (const mapping of h.calls.filter(call =>
      call.name === "SimConnect_MapInputEventToClientEvent_EX1" && call.args[1] === scanGroup)) {
      h.exception(mapping.packet, 1, 0xffffffff);
   }
   h.frame();
   assert.match(h.reply(capture), /^error:SimConnect found no usable joystick buttons/);
   assert.ok(!h.calls.some(call => call.name === "SimConnect_SetInputGroupState"
      && call.args[1] === scanGroup));
});

test("scan setup exceptions remain fatal rather than being mistaken for unavailable buttons", t => {
   const h = harness(t);
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   const enable = h.calls.findLast(call => call.name === "SimConnect_SetInputGroupState"
      && call.args[1] === scanGroup);
   h.exception(enable.packet, 1, 0xffffffff);
   assert.match(h.reply(capture), /^error:SimConnect exception/);
});

test("the permanent group is reused safely across replacement, clear and recapture", t => {
   const h = harness(t);
   for (const button of [0, 3]) {
      const capture = h.send("capture");
      h.controllers();
      h.frame();
      h.event(scanEvent, button * 2);
      h.event(scanEvent, button * 2 + 1);
      h.frame();
      assert.equal(h.reply(capture), `data:Test Joystick - Button ${button + 1}`);
   }
   const clear = h.send("clear");
   h.frame();
   assert.equal(h.reply(clear), "data:");
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 2);
   h.event(scanEvent, 3);
   h.frame();
   assert.equal(h.reply(capture), "data:Test Joystick - Button 2");
});

test("repeated cancellation after removal never clears the already deleted group", t => {
   const h = harness(t, "123 1 3\nTest Joystick\n");
   h.controllers();
   const clear = h.send("clear");
   h.frame();
   assert.equal(h.reply(clear), "data:");
   for (let attempt = 0; attempt < 2; ++attempt) {
      const capture = h.send("capture");
      h.controllers();
      h.frame();
      assert.equal(h.reply(h.send("cancel")), "data:");
      h.frame();
      assert.match(h.reply(capture), /^error:Joystick capture cancelled/);
   }
   assert.equal(h.calls.filter(call => call.name === "SimConnect_ClearInputGroup"
      && call.args[1] === joystickGroup).length, 1);
});

test("a failed file promotion restores the previous file and binding", t => {
   const previous = "123 1 3\nTest Joystick\n";
   const h = harness(t, previous);
   h.controllers();
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   h.failCommit();
   h.frame();
   assert.match(h.reply(capture), /^error:Unable to save.*commit new settings \(errno \d+\)/);
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), previous);
   assert.equal(h.reply(h.send("get")), "data:Test Joystick - Button 4");
   assert.ok(h.renameCalls.some(call => call.from.endsWith(".bak")));
   assert.ok(!existsSync(join(h.folder, "tablet-joystick.txt.tmp")));
});

test("a write failure never moves or truncates the previous committed settings", t => {
   const previous = "123 1 3\nTest Joystick\n";
   const h = harness(t, previous);
   h.controllers();
   const capture = h.send("capture");
   h.controllers();
   h.frame();
   h.event(scanEvent, 0);
   h.event(scanEvent, 1);
   h.failWrite();
   h.frame();
   assert.match(h.reply(capture), /^error:Unable to save.*write temporary settings/);
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), previous);
   assert.equal(h.renameCalls.length, 0);
});

test("startup recovers the backup if a save was interrupted before file promotion", t => {
   const h = harness(t, null, { backup: "123 1 3\nTest Joystick\n" });
   assert.equal(h.reply(h.send("get")), "data:Test Joystick - Button 4");
   h.controllers();
   const clear = h.send("clear");
   h.frame();
   assert.equal(h.reply(clear), "data:");
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt"), "utf8"), "");
   assert.ok(!existsSync(join(h.folder, "tablet-joystick.txt.bak")));
});

test("a failed rollback retains a recoverable backup and reports both filesystem errors", t => {
   const previous = "123 1 3\nTest Joystick\n";
   const h = harness(t, previous);
   h.controllers();
   const clear = h.send("clear");
   h.failCommit();
   h.failRestore();
   h.frame();
   assert.match(h.reply(clear), /commit new settings.*unable to restore previous settings/);
   assert.equal(readFileSync(join(h.folder, "tablet-joystick.txt.bak"), "utf8"), previous);
   assert.ok(!existsSync(join(h.folder, "tablet-joystick.txt")));
});

const poseFields = ["X", "Y", "Z", "PITCH", "BANK", "HEADING", "WIDTH", "HEIGHT"];
const defaultPose = [0, .35, 1.2, 0, 0, 0, 1, 1];
const aircraftA = "SimObjects\\Airplanes\\Test\\presets\\Vendor\\A\\config\\aircraft.cfg";
const aircraftB = aircraftA.replace("\\A\\", "\\B\\");
const poseFile = (path, values) => `VFRNAV_TABLET_POSES 1\n${JSON.stringify(path.toLowerCase())} ${values.join(" ")}\n`;
const readPose = h => poseFields.map(field => h.getLvar(`VFRNAV_EFB_${field}`));
const setPose = (h, pose) => poseFields.forEach((field, index) => h.setLvar(`VFRNAV_EFB_${field}`, pose[index]));
function loadAircraft(h, path = aircraftA, instance = 1) {
   h.setLvar("VFRNAV_EFB_INSTANCE", instance);
   h.setLvar("VFRNAV_EFB_READY", 1);
   h.frame(0);
   h.aircraft(path);
   h.frame(0);
}

test("tablet pose waits for rig initialization, debounces writes, and survives a new WASM session", t => {
   const initial = [1.25, .6, -2.3, 35, -72, 140, 1.5, 1.5];
   const h = harness(t, "", { poses: poseFile(aircraftA, initial) });
   h.setLvar("VFRNAV_EFB_READY", 1);
   h.frame(0);
   assert.ok(!h.calls.some(call => call.name === "SimConnect_RequestSystemState"));
   h.setLvar("VFRNAV_EFB_INSTANCE", 1);
   h.setLvar("VFRNAV_EFB_READY", 0);
   h.frame(0);
   assert.ok(!h.calls.some(call => call.name === "SimConnect_RequestSystemState"));
   loadAircraft(h);
   assert.deepEqual(readPose(h), initial);
   assert.equal(h.getLvar("VFRNAV_EFB_MODE"), 0);
   const updated = [1.4, .75, -1.2, -15, 20, -60, .8, .8];
   setPose(h, updated);
   h.frame(0);
   h.frame(499);
   assert.equal(readFileSync(join(h.folder, "tablet-poses.txt"), "utf8"), poseFile(aircraftA, initial));
   h.frame(1);
   const saved = readFileSync(join(h.folder, "tablet-poses.txt"), "utf8");
   const next = harness(t, "", { poses: saved });
   loadAircraft(next);
   assert.deepEqual(readPose(next), updated);
   assert.ok(!existsSync(join(h.folder, "tablet-poses.txt.tmp")));
});

test("MSFS missing-file EIO permits the first pose save and subsequent restart", t => {
   const h = harness(t, "", { missingFileIO: true });
   loadAircraft(h);
   const updated = [1.4, .75, -1.2, -15, 20, -60, .8, .8];
   setPose(h, updated);
   h.frame(0);
   h.frame(500);
   const saved = readFileSync(join(h.folder, "tablet-poses.txt"), "utf8");
   const next = harness(t, "", { poses: saved, missingFileIO: true });
   loadAircraft(next);
   assert.deepEqual(readPose(next), updated);
   setPose(next, defaultPose);
   next.frame(0);
   next.frame(500);
   assert.ok(!existsSync(join(next.folder, "tablet-poses.txt.bak")));
});

test("MSFS EIO on an existing pose file still protects unreadable settings", t => {
   const original = poseFile(aircraftA, defaultPose);
   const h = harness(t, "", { poses: original, missingFileIO: true, unreadablePoses: true });
   loadAircraft(h);
   setPose(h, [1, 2, 3, 10, 20, 30, 1, 1]);
   h.frame(0);
   h.frame(500);
   assert.equal(readFileSync(join(h.folder, "tablet-poses.txt"), "utf8"), original);
});

test("tablet poses are isolated by aircraft preset, flush on switch, and restore on flight reload", t => {
   const h = harness(t);
   loadAircraft(h);
   const a = [2, .4, 1, 35, 60, 75, 1.25, 1.25];
   setPose(h, a);
   h.frame(0);
   h.aircraftLoaded();
   loadAircraft(h, aircraftB, 2);
   assert.deepEqual(readPose(h), defaultPose, "new aircraft must not inherit the previous pose");
   const b = [-2, 1, 1.5, -20, -45, 50, 2, 2];
   setPose(h, b);
   h.frame(0);
   loadAircraft(h, aircraftA, 3);
   assert.deepEqual(readPose(h), a);
   loadAircraft(h, aircraftB, 4);
   assert.deepEqual(readPose(h), b);
   setPose(h, defaultPose);
   h.frame(0);
   loadAircraft(h, aircraftB, 5);
   assert.deepEqual(readPose(h), defaultPose, "reset pose must be persisted too");
   const persisted = readFileSync(join(h.folder, "tablet-poses.txt"), "utf8");
   const next = harness(t, "", { poses: persisted });
   loadAircraft(next, aircraftA);
   assert.deepEqual(readPose(next), a);
});

test("stale aircraft responses cannot restore a previous aircraft pose; identity timeout retries", t => {
   const h = harness(t, "", { poses: poseFile(aircraftA, [1, 1, 1, 0, 0, 0, 1, 1]) });
   h.setLvar("VFRNAV_EFB_INSTANCE", 1);
   h.setLvar("VFRNAV_EFB_READY", 1);
   h.frame(0);
   const old = h.calls.findLast(call => call.name === "SimConnect_RequestSystemState").args[1];
   h.setLvar("VFRNAV_EFB_INSTANCE", 2);
   h.frame(0);
   h.aircraft(aircraftA, old);
   h.frame(3001);
   const newest = h.calls.findLast(call => call.name === "SimConnect_RequestSystemState").args[1];
   assert.notEqual(newest, old);
   h.aircraft(aircraftB);
   h.frame(0);
   assert.deepEqual(readPose(h), defaultPose);
});

test("pose backup recovery and invalid saved data never overwrite a corrupt primary silently", t => {
   const saved = [1, 2, 3, 30, -40, 50, 1, 1];
   const recovered = harness(t, "", { posesBackup: poseFile(aircraftA, saved) });
   loadAircraft(recovered);
   assert.deepEqual(readPose(recovered), saved);
   for (const invalid of ["bad header\n", poseFile(aircraftA, [21, 0, 1, 0, 0, 0, 1, 1]),
      poseFile(aircraftA, [0, 0, 1, 0, 0, 0, 1, 2]), poseFile(aircraftA, [0, 0, 1, NaN, 0, 0, 1, 1])]) {
      const h = harness(t, "", { poses: invalid });
      loadAircraft(h);
      setPose(h, saved);
      h.frame(0);
      h.frame(600);
      assert.equal(readFileSync(join(h.folder, "tablet-poses.txt"), "utf8"), invalid);
   }
});

test("failed pose save retains committed data and retries; shutdown flushes pending movement", t => {
   const initial = poseFile(aircraftA, defaultPose);
   const h = harness(t, "", { poses: initial });
   loadAircraft(h);
   const updated = [.125, 1.3, 2.45, 15, 30, 60, .5, .5];
   h.failCommit();
   setPose(h, updated);
   h.frame(0);
   h.frame(500);
   assert.equal(readFileSync(join(h.folder, "tablet-poses.txt"), "utf8"), initial);
   h.restoreStorage();
   h.frame(5000);
   const saved = readFileSync(join(h.folder, "tablet-poses.txt"), "utf8");
   const next = harness(t, "", { poses: saved });
   loadAircraft(next);
   assert.deepEqual(readPose(next), updated);
   setPose(h, defaultPose);
   h.frame(0);
   h.shutdown();
   const stopped = harness(t, "", { poses: readFileSync(join(h.folder, "tablet-poses.txt"), "utf8") });
   loadAircraft(stopped);
   assert.deepEqual(readPose(stopped), defaultPose);
});
