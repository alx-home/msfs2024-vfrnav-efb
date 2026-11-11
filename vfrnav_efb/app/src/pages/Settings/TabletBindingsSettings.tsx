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

import { Button } from "@alx-home/Utils";
import { useEffect, useRef, useState } from "react";
import { useEvent } from "react-use-event-hook";
import type { TabletShortcutMessage, TabletJoystickMessage } from "@shared/Settings";
import { messageHandler } from "@Settings/SettingsStore";
import { Item } from "./Item";

const DEFAULT_SHORTCUT = "Ctrl+T";
const SHORTCUT_TIMEOUT_MS = 10000;
const JOYSTICK_TIMEOUT_MS = 22000;
const LEGACY_ESCAPE = 27;
const LEGACY_SHIFT = 16;
const LEGACY_CONTROL = 17;
const LEGACY_ALT = 18;
const LEGACY_LEFT_META = 91;
const LEGACY_RIGHT_META = 92;
const LEGACY_CONTEXT_MENU = 93;
const LEGACY_MODIFIERS = new Set([
   LEGACY_SHIFT, LEGACY_CONTROL, LEGACY_ALT, LEGACY_LEFT_META, LEGACY_RIGHT_META, LEGACY_CONTEXT_MENU
]);
const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);
const LEGACY_LETTER_START = 65;
const LEGACY_LETTER_END = 90;
const LEGACY_DIGIT_START = 48;
const LEGACY_DIGIT_END = 57;

/** @brief Keyboard properties consumed when capturing a shortcut.
 *
 * @details The numeric fallback remains available in older Coherent builds. */
type ShortcutKeyEvent = Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "shiftKey" | "altKey"> & {
   readonly keyCode: number;
};

/**
 * @brief Recognize Escape across modern and legacy Coherent keyboard events.
 *
 * @param event Keyboard event being captured.
 *
 * @returns Whether the event represents Escape.
 */
const isEscape = (event: ShortcutKeyEvent) =>
   event.key === "Escape" || event.key === "Esc" || event.keyCode === LEGACY_ESCAPE;

/**
 * @brief Identify standalone modifier presses while capturing a shortcut.
 *
 * @param event Keyboard event being captured.
 *
 * @returns Whether the event represents a modifier.
 */
const isModifier = (event: ShortcutKeyEvent) =>
   MODIFIER_KEYS.has(event.key) || LEGACY_MODIFIERS.has(event.keyCode);

/**
 * @brief Resolve a letter or digit, preferring physical codes over legacy key codes.
 *
 * @param event Keyboard event being captured.
 *
 * @returns The uppercase letter or digit, or undefined if the key is unsupported.
 */
const shortcutKey = (event: ShortcutKeyEvent) => {
   const code = /^(?:Key([A-Z])|Digit(\d))$/.exec(event.code);
   const physicalKey = code?.[1] ?? code?.[2];

   if (physicalKey) {
      return physicalKey;
   }

   if (/^[a-z0-9]$/i.test(event.key)) {
      return event.key.toUpperCase();
   }

   const letter = event.keyCode >= LEGACY_LETTER_START && event.keyCode <= LEGACY_LETTER_END;
   const digit = event.keyCode >= LEGACY_DIGIT_START && event.keyCode <= LEGACY_DIGIT_END;

   return letter || digit ? String.fromCodePoint(event.keyCode) : undefined;
};

/** @brief Manage shortcut and joystick capture, request lifetimes, and simulator responses.
 *
 * @returns Binding state and actions for the settings controls. */
const useTabletBindings = () => {
   const [tabletShortcut, setTabletShortcut] = useState(DEFAULT_SHORTCUT);
   const [capturingShortcut, setCapturingShortcut] = useState(false);
   const [shortcutBusy, setShortcutBusy] = useState(false);
   const [shortcutError, setShortcutError] = useState<string>();
   const shortcutTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
   const [tabletJoystick, setTabletJoystick] = useState("");
   const [joystickAction, setJoystickAction] = useState<TabletJoystickMessage["action"]>();
   const [joystickError, setJoystickError] = useState<string>();
   const joystickRequestId = useRef(0);
   const joystickCapturing = useRef(false);
   const joystickTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

   const onTabletShortcutResponse = useEvent((response: TabletShortcutMessage) => {
      if (response.action !== "response") {
         return;
      }

      clearTimeout(shortcutTimeout.current);
      setTabletShortcut(response.shortcut);
      setShortcutError(response.error || undefined);
      setShortcutBusy(false);
      setCapturingShortcut(false);
   });

   const requestTabletShortcut = useEvent((shortcut: string) => {
      if (shortcutBusy) {
         return;
      }

      setCapturingShortcut(false);
      setShortcutBusy(true);
      setShortcutError(undefined);
      clearTimeout(shortcutTimeout.current);

      shortcutTimeout.current = setTimeout(() => {
         setShortcutBusy(false);
         setShortcutError("Timed out while applying the shortcut.");
      }, SHORTCUT_TIMEOUT_MS);

      messageHandler.send({ shortcut, __TABLET_SHORTCUT__: true, action: "set", error: "" });
   });

   const captureTabletShortcut = useEvent((event: globalThis.KeyboardEvent) => {
      if (!capturingShortcut || shortcutBusy) {
         return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isEscape(event)) {
         setCapturingShortcut(false);
         return;
      }

      if (isModifier(event)) {
         return;
      }

      const capturedKey = shortcutKey(event);
      if (!capturedKey) {
         setShortcutError("Use a letter or digit with Ctrl, Shift, or Alt.");
         return;
      }

      const modifiers = [
         event.ctrlKey && "Ctrl",
         event.shiftKey && "Shift",
         event.altKey && "Alt"
      ].filter((modifier): modifier is string => !!modifier);

      if (!modifiers.length) {
         setShortcutError("Include Ctrl, Shift, or Alt in the shortcut.");
         return;
      }

      requestTabletShortcut([...modifiers, capturedKey].join("+"));
   });

   const startCapturingShortcut = useEvent(() => {
      if (joystickAction) {
         return;
      }

      setShortcutError(undefined);
      setCapturingShortcut(true);
   });

   const onTabletJoystickResponse = useEvent((response: TabletJoystickMessage) => {
      if (response.action !== "response" || response.requestId !== joystickRequestId.current) {
         return;
      }

      clearTimeout(joystickTimeout.current);

      joystickCapturing.current = false;

      setTabletJoystick(response.binding);
      setJoystickError(response.error || undefined);
      setJoystickAction(undefined);
   });

   const requestTabletJoystick = useEvent((action: Exclude<TabletJoystickMessage["action"], "response">) => {
      if ((joystickAction && action !== "cancel") || shortcutBusy || capturingShortcut) {
         return;
      }

      setJoystickAction(action);
      setJoystickError(undefined);

      joystickCapturing.current = action === "capture";
      joystickRequestId.current += 1;

      const requestId = joystickRequestId.current;
      clearTimeout(joystickTimeout.current);

      joystickTimeout.current = setTimeout(() => {
         // Invalidate the timed-out request before cancelling the simulator capture.
         joystickRequestId.current += 1;
         joystickCapturing.current = false;
         setJoystickAction(undefined);
         setJoystickError("Timed out communicating with the joystick module. Try capturing again.");
         messageHandler.send({
            __TABLET_JOYSTICK__: true, action: "cancel",
            requestId: -1, binding: tabletJoystick, error: ""
         });
      }, JOYSTICK_TIMEOUT_MS);

      messageHandler.send({
         action, requestId, __TABLET_JOYSTICK__: true, binding: tabletJoystick, error: ""
      });
   });

   const cancelJoystickOnUnmount = useEvent(() => {
      if (joystickCapturing.current) {
         joystickRequestId.current += 1;

         messageHandler.send({
            __TABLET_JOYSTICK__: true, action: "cancel",
            requestId: joystickRequestId.current, binding: "", error: ""
         });
      }
   });

   useEffect(() => {
      messageHandler.subscribe("__TABLET_JOYSTICK__", onTabletJoystickResponse);
      joystickRequestId.current += 1;

      messageHandler.send({
         __TABLET_JOYSTICK__: true, action: "get",
         requestId: joystickRequestId.current, binding: "", error: ""
      });

      return () => {
         clearTimeout(joystickTimeout.current);
         messageHandler.unsubscribe("__TABLET_JOYSTICK__", onTabletJoystickResponse);
         cancelJoystickOnUnmount();
      };
   }, [onTabletJoystickResponse, cancelJoystickOnUnmount]);

   useEffect(() => {
      messageHandler.subscribe("__TABLET_SHORTCUT__", onTabletShortcutResponse);
      messageHandler.send({ __TABLET_SHORTCUT__: true, action: "get", shortcut: "", error: "" });

      return () => {
         clearTimeout(shortcutTimeout.current);
         messageHandler.unsubscribe("__TABLET_SHORTCUT__", onTabletShortcutResponse);
      };
   }, [onTabletShortcutResponse]);

   // Capture keys globally while recording: Button blurs itself on click, so the
   // keydown would otherwise never reach the button element.
   useEffect(() => {
      const target = window; // NOSONAR: MSFS Coherent requires its DOM window, not globalThis.
      if (capturingShortcut) {
         target.addEventListener("keydown", captureTabletShortcut, true);
      }

      return () => target.removeEventListener("keydown", captureTabletShortcut, true);
   }, [capturingShortcut, captureTabletShortcut]);

   const resetTabletShortcut = useEvent(() => {
      if (!shortcutBusy && !joystickAction && tabletShortcut !== DEFAULT_SHORTCUT) {
         requestTabletShortcut(DEFAULT_SHORTCUT);
      }
   });

   return {
      tabletShortcut, capturingShortcut, shortcutBusy, shortcutError, resetTabletShortcut, startCapturingShortcut,
      tabletJoystick, joystickAction, joystickError, requestTabletJoystick
   };
};

type TabletBindings = ReturnType<typeof useTabletBindings>;

/** @brief Render keyboard shortcut capture and reset controls.
 *
 * @param props Binding state and actions.
 *
 * @returns The keyboard shortcut settings controls. */
const TabletShortcutSettings = ({ bindings }: Readonly<{ bindings: TabletBindings }>) => {
   const { tabletShortcut, capturingShortcut, shortcutBusy, shortcutError, resetTabletShortcut,
      startCapturingShortcut, joystickAction } = bindings;
   const disabled = shortcutBusy || Boolean(joystickAction);
   const resetDisabled = disabled || tabletShortcut === DEFAULT_SHORTCUT;

   return <Item name="Tablet shortcut" category="Tablet" onReset={resetTabletShortcut}>
      <div>Capture a new combination to change the global 3d EFB tablet toggle (hide/unhide) for every aircraft.</div>
      <div>Current shortcut: <span className="font-semibold text-slate-200">{tabletShortcut}</span></div>
      <div className="flex flex-row gap-2">
         <Button active={true} onClick={startCapturingShortcut} disabled={disabled}>
            {capturingShortcut ? "Press shortcut (Esc to cancel)" : "Capture shortcut"}
         </Button>
         <Button active={true} onClick={resetTabletShortcut} disabled={resetDisabled}>Reset to Ctrl+T</Button>
      </div>
      {shortcutBusy && <output>Applying shortcut...</output>}
      {shortcutError && <div role="alert" className="text-red-400">{shortcutError}</div>}
   </Item>;
};

/** @brief Render joystick capture, cancellation, and removal controls.
 *
 * @param props Binding state and actions.
 *
 * @returns The joystick settings controls. */
const TabletJoystickSettings = ({ bindings }: Readonly<{ bindings: TabletBindings }>) => {
   const { tabletJoystick, joystickAction, joystickError, requestTabletJoystick, shortcutBusy, capturingShortcut } = bindings;
   const disabled = Boolean(joystickAction) || shortcutBusy || capturingShortcut;
   const clearDisabled = !tabletJoystick || disabled;
   const updating = Boolean(joystickAction) && joystickAction !== "capture";

   const resetJoystick = useEvent(() => {
      if (tabletJoystick) {
         requestTabletJoystick("clear");
      }
   });
   const captureJoystick = useEvent(() => requestTabletJoystick("capture"));
   const cancelJoystick = useEvent(() => requestTabletJoystick("cancel"));
   const clearJoystick = useEvent(() => requestTabletJoystick("clear"));

   return <Item name="Tablet joystick button" category="Tablet" onReset={resetJoystick}>
      <div>Capture a joystick button during a flight to change the global 3d EFB tablet toggle (hide/unhide) for every aircraft.</div>
      <div>Current button: <span className="font-semibold text-slate-200">{tabletJoystick || "Not assigned"}</span></div>
      <div className="flex flex-row gap-2">
         <Button active={true} onClick={captureJoystick}
            disabled={disabled}>
            Capture joystick button
         </Button>
         {joystickAction === "capture" &&
            <Button active={true} onClick={cancelJoystick}>Cancel capture</Button>}
         <Button active={true} onClick={clearJoystick}
            disabled={clearDisabled}>
            Remove joystick button
         </Button>
      </div>
      {joystickAction === "capture" && <output>Press and release a joystick button within 8 seconds...</output>}
      {updating && <output>Updating joystick binding...</output>}
      {joystickError && <div role="alert" className="text-red-400">{joystickError}</div>}
   </Item>;
};

/** @brief Expose the shared cockpit tablet bindings in the settings page.
 *
 * @returns The cockpit tablet binding settings. */
export const TabletBindingsSettings = () => {
   const bindings = useTabletBindings();

   return <>
      <TabletShortcutSettings bindings={bindings} />
      <TabletJoystickSettings bindings={bindings} />
   </>;
};
