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

declare class TemplateElement extends HTMLElement {
  connectedCallback(): void;
  disconnectedCallback(): void;
}

declare const SimVar: {
  GetSimVarValue(_name: string, _unit: string): number;
  SetSimVarValue(_name: string, _unit: string, _value: number): Promise<void>;
};

declare function checkAutoload(): void;
declare function RegisterToolBarListener(): {
  setButtonChildActive(_id: string, _active: boolean): void;
  pushLocalPanelVisibility(_id: string, _visible: boolean): void;
};

type IngameUiFrame = HTMLElement & { visible: boolean };
const TABLET_READY = "L:VFRNAV_EFB_READY";
const TOGGLE_ACKNOWLEDGEMENT_ATTEMPTS = 40;
const TOGGLE_ACKNOWLEDGEMENT_INTERVAL_MS = 50;

/** @brief Synchronize the simulator toolbar with cockpit tablet visibility and report toggle errors. */
class EfbTabletPanel extends TemplateElement {
  private frame: IngameUiFrame | null = null;
  private pending = false;
  private toolbar: ReturnType<typeof RegisterToolBarListener> | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private selected: boolean | undefined;
  private failed = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.frame = this.querySelector<IngameUiFrame>("ingame-ui");
    this.toolbar = RegisterToolBarListener();

    this.frame?.addEventListener("panelActive", this.showTablet);
    this.frame?.addEventListener("panelInactive", this.hideTablet);

    this.querySelector("button")?.addEventListener("click", this.toggleTablet);

    this.timer = setInterval(this.syncToolbar, 100);

    this.syncToolbar();
  }

  disconnectedCallback(): void {
    this.frame?.removeEventListener("panelActive", this.showTablet);
    this.frame?.removeEventListener("panelInactive", this.hideTablet);

    this.querySelector("button")?.removeEventListener("click", this.toggleTablet);

    clearInterval(this.timer);

    super.disconnectedCallback();
  }

  private readonly showTablet = (): Promise<void> => this.setTabletVisible(true);
  private readonly hideTablet = (): Promise<void> => this.setTabletVisible(false);

  // The toolbar button only mirrors the tablet; the floating window is shown for errors only.
  private showFrame(visible: boolean): void {
    this.classList.toggle("failed", visible);

    if (!this.frame || this.frame.visible === visible) {
      return;
    }

    this.frame.visible = visible;
    this.toolbar?.pushLocalPanelVisibility("PANEL_COCKPIT_TABLET", visible);
  }

  /** @brief Mirror the loaded tablet state without overriding an in-flight toggle. */
  private readonly syncToolbar = (): void => {
    this.showFrame(this.failed);

    if (this.pending || this.failed || !SimVar.GetSimVarValue(TABLET_READY, "number")) {
      return;
    }

    const visible = !SimVar.GetSimVarValue("L:VFRNAV_EFB_HIDDEN", "number");
    if (this.selected !== visible) {
      this.selected = visible;
      this.toolbar?.setButtonChildActive("PANEL_COCKPIT_TABLET", visible);
    }
  };

  /** @brief Reconcile a toolbar activation with the current tablet state.
   *
   * @param visible Desired tablet visibility.
   *
   * @returns A promise that resolves after any required toggle. */
  private async setTabletVisible(visible: boolean): Promise<void> {
    this.showFrame(this.failed);

    const ready = SimVar.GetSimVarValue(TABLET_READY, "number");
    if (!visible && (this.failed || !ready)) {
      this.failed = false;
      this.showFrame(false);
      return;
    }

    if (ready && Boolean(SimVar.GetSimVarValue("L:VFRNAV_EFB_HIDDEN", "number")) !== visible) {
      this.syncToolbar();
      return;
    }

    await this.toggleTablet();
  }

  /** @brief Request a toggle and wait for the rig to acknowledge it before resynchronizing.
   *
   * @returns A promise that resolves after the toggle is handled. */
  private readonly toggleTablet = async (): Promise<void> => {
    if (this.pending) {
      return;
    }

    this.pending = true;
    this.failed = false;

    const status = this.querySelector("output");
    try {
      if (!SimVar.GetSimVarValue(TABLET_READY, "number")) {
        throw new Error("This aircraft does not have an active cockpit tablet rig.");
      }

      await SimVar.SetSimVarValue("L:VFRNAV_EFB_TOGGLE_REQUEST", "number", 1);
      let acknowledged = false;
      for (let attempt = 0; attempt < TOGGLE_ACKNOWLEDGEMENT_ATTEMPTS; attempt++) {
        await new Promise<void>(resolve => setTimeout(resolve, TOGGLE_ACKNOWLEDGEMENT_INTERVAL_MS));

        if (SimVar.GetSimVarValue("L:VFRNAV_EFB_TOGGLE_REQUEST", "number") === 0) {
          acknowledged = true;
          break;
        }
      }

      if (!acknowledged) {
        throw new Error("The simulator did not acknowledge the tablet toggle. Check that the rig is loaded.");
      }
    } catch (error) {
      this.failed = true;

      console.info("Cockpit tablet visibility failed:", error);
      if (status) {
        status.textContent = error instanceof Error ? error.message : String(error);
      }

      this.showFrame(true);
    } finally {
      this.pending = false;
    }

    this.syncToolbar();
  };
}

customElements.define("efb-tablet-panel", EfbTabletPanel);
checkAutoload();
