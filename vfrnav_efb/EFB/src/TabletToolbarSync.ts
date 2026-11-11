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

/** @brief Simulator toolbar panel whose active state mirrors cockpit tablet visibility. */
export const COCKPIT_TABLET_PANEL_ID = "PANEL_COCKPIT_TABLET";

/**
 * Returns a tick that reports cockpit tablet visibility changes to `setActive`.
 * `readVisible` returns undefined when no tablet rig is loaded.
 *
 * @param readVisible Reads the current cockpit tablet visibility.
 * @param setActive Updates the toolbar button's active state.
 *
 * @returns A tick function that synchronizes changes.
 */
export const createTabletToolbarSync = (
   readVisible: () => boolean | undefined,
   setActive: (_active: boolean) => void
) => {
   let selected: boolean | undefined;

   return () => {
      const visible = readVisible() ?? false;
      if (visible === selected) {
         return;
      }

      selected = visible;
      setActive(visible);
   };
};

/**
 * The toolbar panel view only exists while its button is active, so the always-loaded EFB view
 * mirrors keyboard visibility changes onto the toolbar button.
 */
export const startTabletToolbarSync = () => {
   RegisterViewListener("JS_LISTENER_TOOLBAR_PANELS", () => {
      const tick = createTabletToolbarSync(
         () => SimVar.GetSimVarValue("L:VFRNAV_EFB_READY", "number")
            ? !SimVar.GetSimVarValue("L:VFRNAV_EFB_HIDDEN", "number")
            : undefined,
         active => Coherent.call("TOOLBAR_BUTTON_TOGGLE", COCKPIT_TABLET_PANEL_ID, active)
      );

      setInterval(tick, 100);
   });
};
