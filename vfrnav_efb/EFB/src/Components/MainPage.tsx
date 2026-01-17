/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
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

import { EfbSettingsManager, GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
import { FSComponent } from "@microsoft/msfs-sdk";
import { GetFacilities, GetICAOS as GetIcaos, GetLatLon, GetMetar } from "@shared/Facilities";
import { MessageHandler, MessageType } from "@shared/MessageHandler";
import { EditRecord, GetRecord, RemoveRecord } from "@shared/PlanPos";
import { Manager } from "../Manager";
import { FileExist, GetFile, OpenFile } from "@shared/Files";
import { DefaultFuelPreset, FuelPresets, SetFuelCurve } from "@shared/Fuel";
import { DefaultDeviationPreset, DeviationPresets, SetDeviationCurve } from "@shared/Deviation";
import { SetPanelSize } from "@shared/Settings";

interface MainPageProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;

  manager: Manager;

  settings: EfbSettingsManager;
}

let messageHandler: MessageHandler | undefined = undefined;

export class MainPage extends GamepadUiView<HTMLDivElement, MainPageProps> {
  public readonly tabName = MainPage.name;
  private readonly elementRef = FSComponent.createRef<HTMLIFrameElement>();

  private readonly messageHandle = (message: MessageType) => { messageHandler?.send(message) };
  private reloadCallback: ((_event: MouseEvent) => void) | undefined = undefined;
  private resizeCallback: (() => void) | undefined = undefined;
  private widthRatio = 1;
  private heightRatio = 1;
  private borderScale = 1;
  private dpiScale = 1;
  private menuDpiScale = 1;
  private onHideObserver: MutationObserver | undefined = undefined;
  private setRatioCallback: ((_event: MouseEvent) => void) | undefined = undefined;
  private mouseMoveCallback: ((_event: MouseEvent) => void) | undefined = undefined;
  private mouseDownCallback: ((_event: MouseEvent) => void) | undefined = undefined;
  private resizing: {
    x: number;
    y: number;
    widthRatio: number;
    heightRatio: number;
  } | undefined = undefined;

  constructor(props: MainPageProps) {
    super(props);

    const resizeData = GetStoredData(`efb-resize`);
    if (resizeData) {
      const resize = JSON.parse(resizeData as string);
      this.widthRatio = resize.width;
      this.heightRatio = resize.height;
      this.borderScale = resize.borderScale;
      this.dpiScale = resize.dpiScale;
      this.menuDpiScale = resize.menuDpiScale;
    }
  }

  onGetSettings() {
    this.props.manager.onGetSettings(0);

    messageHandler!.send({
      __SET_PANEL_SIZE__: true,

      width: this.widthRatio,
      height: this.heightRatio,
      borderScale: this.borderScale,
      dpiScale: this.dpiScale,
      menuDpiScale: this.menuDpiScale
    });
  }

  onGetServerState() {
    this.props.manager.onGetServerState(0);
  }

  onGetPlaneRecords() {
    this.props.manager.onGetPlaneRecords(0);
  }

  onGetFacilities(message: GetFacilities) {
    this.props.manager.onGetFacilities(0, message);
  }

  onGetMetar(message: GetMetar) {
    this.props.manager.onGetMetar(0, message);
  }

  onGetLatLon(message: GetLatLon) {
    this.props.manager.onGetLatLon(0, message);
  }

  onGetIcaos(message: GetIcaos) {
    this.props.manager.onGetIcaos(0, message);
  }

  onEditRecord(message: EditRecord) {
    this.props.manager.onEditRecord(message);
  }

  onRemoveRecord(message: RemoveRecord) {
    this.props.manager.onRemoveRecord(message);
  }

  onGetRecord(message: GetRecord) {
    this.props.manager.onGetRecord(0, message);
  }

  onGetFuel() {
    this.props.manager.onGetFuel(0);
  }

  onGetFile(message: GetFile) {
    this.props.manager.onGetFile(message);
  }

  onOpenFile(message: OpenFile) {
    this.props.manager.onOpenFile(message);
  }

  onFileExists(message: FileExist) {
    this.props.manager.onFileExists(message);
  }

  setPanelSize(message: SetPanelSize) {
    this.onSetPanelSize(message);
    messageHandler!.send(message);
  }

  onSetPanelSize({ width, height, dpiScale, menuDpiScale, borderScale }: SetPanelSize) {
    this.widthRatio = width;
    this.heightRatio = height;
    this.borderScale = borderScale;
    this.dpiScale = dpiScale;
    this.menuDpiScale = menuDpiScale;

    SetStoredData(`efb-resize`, JSON.stringify({
      width: this.widthRatio,
      height: this.heightRatio,
      borderScale: this.borderScale,
      dpiScale: this.dpiScale,
      menuDpiScale: this.menuDpiScale
    }))

    this.resizeCallback?.();
  }

  onFuelPresets(message: FuelPresets) {
    this.props.manager.onFuelPresets(0, message);
  }

  onFuelCurve(message: SetFuelCurve) {
    this.props.manager.onFuelCurve(0, message);
  }

  onDefaultFuelPreset(message: DefaultFuelPreset) {
    this.props.manager.onDefaultFuelPreset(0, message);
  }

  onDeviationPresets(message: DeviationPresets) {
    this.props.manager.onDeviationPresets(0, message);
  }

  onDeviationCurve(message: SetDeviationCurve) {
    this.props.manager.onDeviationCurve(0, message);
  }

  onDefaultDeviationPreset(message: DefaultDeviationPreset) {
    this.props.manager.onDefaultDeviationPreset(0, message);
  }

  destroy(): void {
    if (this.reloadCallback) {
      this.removeReloadCallback();
    }

    if (this.resizeCallback) {
      window.removeEventListener('resize', this.resizeCallback as () => void);
      this.onHideObserver?.disconnect();
      this.onHideObserver = undefined;
      this.resizeCallback = undefined;
    }

    if (this.mouseDownCallback) {
      this.elementRef.getOrDefault()?.contentWindow?.document.body.removeEventListener('mousedown', this.mouseDownCallback);
      (document.body.lastElementChild as HTMLElement | null)?.removeEventListener('mousedown', this.mouseDownCallback);
      this.mouseDownCallback = undefined;
    }

    if (this.mouseMoveCallback) {
      this.elementRef.getOrDefault()?.contentWindow?.document.body.removeEventListener('mousemove', this.mouseMoveCallback);
      (document.body.lastElementChild as HTMLElement | null)?.removeEventListener('mousemove', this.mouseMoveCallback);
      this.mouseMoveCallback = undefined;
    }

    if (this.setRatioCallback) {
      (document.body.lastElementChild as HTMLElement).removeEventListener('mouseup', this.setRatioCallback);
      this.setRatioCallback = undefined;
    }

    if (messageHandler !== undefined) {
      this.props.manager.closeEFB();

      messageHandler.unsubscribe("__SETTINGS__", this.props.manager.onSharedSettings)
      messageHandler.unsubscribe("__GET_SETTINGS__", this.onGetSettings)
      messageHandler.unsubscribe("__GET_SERVER_STATE__", this.onGetServerState)
      messageHandler.unsubscribe("__GET_RECORDS__", this.onGetPlaneRecords)
      messageHandler.unsubscribe("__GET_FACILITIES__", this.onGetFacilities)
      messageHandler.unsubscribe("__GET_METAR__", this.onGetMetar)
      messageHandler.unsubscribe("__GET_LAT_LON__", this.onGetLatLon)
      messageHandler.unsubscribe("__GET_ICAOS__", this.onGetIcaos)
      messageHandler.unsubscribe("__REMOVE_RECORD__", this.onRemoveRecord)
      messageHandler.unsubscribe("__EDIT_RECORD__", this.onEditRecord)
      messageHandler.unsubscribe("__GET_RECORD__", this.onGetRecord)
      messageHandler.unsubscribe("__GET_FUEL__", this.onGetFuel)
      messageHandler.unsubscribe("__GET_FILE__", this.onGetFile)
      messageHandler.unsubscribe("__OPEN_FILE__", this.onOpenFile)
      messageHandler.unsubscribe("__FILE_EXISTS__", this.onFileExists)

      messageHandler.unsubscribe("__FUEL_PRESETS__", this.onFuelPresets)
      messageHandler.unsubscribe("__FUEL_CURVE__", this.onFuelCurve)
      messageHandler.unsubscribe("__DEFAULT_FUEL_PRESET__", this.onDefaultFuelPreset)

      messageHandler.unsubscribe("__DEVIATION_PRESETS__", this.onDeviationPresets)
      messageHandler.unsubscribe("__DEVIATION_CURVE__", this.onDeviationCurve)
      messageHandler.unsubscribe("__DEFAULT_DEVIATION_PRESET__", this.onDefaultDeviationPreset)
    }

    super.destroy();
  }

  public render(): TVNode<HTMLDivElement> {
    return (
      <div ref={this.gamepadUiViewRef} className="sample-page" style={`height: 100%; --color: ${this.props.color}`}>
        <iframe ref={this.elementRef} title="msfs2024-vfrnav" height="100%" width="100%"
          src={`${BASE_URL}/efb/index.html`}>
        </iframe>
      </div>
    );
  }

  public removeReloadCallback = () => {
    if (this.reloadCallback) {
      this.elementRef.getOrDefault()?.contentWindow?.document.body.removeEventListener('mouseup', this.reloadCallback);
      (document.body.lastElementChild as HTMLElement | null)?.removeEventListener('mouseup', this.reloadCallback);
      this.reloadCallback = undefined;
    }
  };

  public addReloadCallback = () => {
    if (!this.reloadCallback) {
      this.reloadCallback = (event: MouseEvent) => {
        this.resizing = undefined;

        if (event.ctrlKey) {
          if (event.shiftKey) {
            event.stopPropagation();

            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              width: 1,
              height: 1,
              borderScale: 1,
              dpiScale: 1,
              menuDpiScale: 1
            });
          }

          if (event.altKey) {
            event.stopPropagation();

            location.reload();
          }
        }
      };

      this.elementRef.getOrDefault()?.contentWindow?.document.body.addEventListener('mouseup', this.reloadCallback, { capture: true });
      (document.body.lastElementChild as HTMLElement | null)?.addEventListener('mouseup', this.reloadCallback, { capture: true });
    }
  };

  public resetReloadCallback = () => {
    this.removeReloadCallback();
    this.addReloadCallback();
  };

  public addRatioCallback = () => {
    const lastChild = document.body.lastElementChild as HTMLElement | null;

    if (!this.setRatioCallback && lastChild) {
      this.setRatioCallback = (event: MouseEvent) => {
        if (event.altKey) {
          const element = (document.body.lastElementChild as HTMLElement);
          const child = element.firstChild;

          const rect = (child as HTMLElement).getBoundingClientRect();
          const { clientX: x, clientY: y } = event;

          const xResize = x < rect.left || x > rect.right;
          const yResize = y < rect.top || y > rect.bottom;

          if (xResize && yResize) {
            // Diagonal resize

            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              width: Math.max(0.1, Math.min(1.0, this.widthRatio * (event.button == 0 ? 1.1 : 0.9))),
              height: Math.max(0.1, Math.min(1.0, this.heightRatio * (event.button == 0 ? 1.1 : 0.9))),
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          } else if (xResize) {
            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              width: Math.max(0.1, Math.min(1.0, this.widthRatio * (event.button == 0 ? 1.1 : 0.9))),
              height: this.heightRatio,
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          } else if (yResize) {
            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              width: this.widthRatio,
              height: Math.max(0.1, Math.min(1.0, this.heightRatio * (event.button == 0 ? 1.1 : 0.9))),
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          }
        }
      };

      // Add onClick callback to set widthRatio based on mouse X position
      lastChild?.addEventListener('mouseup', this.setRatioCallback);
    }
  };

  public addResizeCallback = () => {
    if (!this.resizeCallback) {
      this.resizeCallback = () => {
        // Delay to ensure EFB is fully loaded
        setTimeout(() => {
          const hidden = (document.body.firstElementChild as HTMLElement || null)?.classList.contains('panel-ui-actions--hidden') ?? true;
          const mode = this.props.settings.getSetting('mode').value === 0 ? '2D' : '3D';

          if (mode == '2D' && hidden) {
            return;
          }

          const orientation = this.props.settings.getSetting('orientationMode').value === 0 ? 'vertical' : 'horizontal';
          const viewportWidth = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-width'));
          const viewportHeight = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-height'));
          const panelWidth = viewportWidth * (mode == '2D' ? this.widthRatio : 1);
          const panelHeight = viewportHeight * (mode == '2D' ? this.heightRatio : 1);

          for (const element of document.body.children) {
            (element as HTMLElement).style.setProperty('--panel-width', panelWidth.toFixed(0));
            (element as HTMLElement).style.setProperty('--panel-height', panelHeight.toFixed(0));
            (element as HTMLElement).style.setProperty('--orientation', orientation);
            (element as HTMLElement).style.setProperty('--mode', mode);
          }

          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--dpi-scale', mode == '2D' ? (this.menuDpiScale / (this.dpiScale * this.widthRatio)).toString() : '1');
          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--resize-ratio', mode == '2D' ? this.widthRatio.toFixed(2) : '1');
          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--font-size', mode == '2D' ? (this.dpiScale * 100).toFixed(0) + '%' : '100%');

          const firstChild = document.body.firstElementChild as HTMLElement | null;
          const lastChild = document.body.lastElementChild as HTMLElement | null;
          console.assert(firstChild !== null);
          console.assert(lastChild !== null);

          if (firstChild) {
            firstChild.style.marginRight = (viewportWidth - panelWidth).toFixed(0) + "px";
          }
          if (lastChild) {
            const borderWidth = document.body.style.getPropertyValue('--border-width');
            lastChild.style.setProperty('--border-width', (this.borderScale * parseInt(borderWidth)).toFixed(2));
            lastChild.style.borderWidth = `calc(1px * ${this.borderScale} * var(--border-height)) calc(1px * var(--border-width))`;
            lastChild.style.borderRadius = `calc(var(--tablet-border-radius) * ${this.borderScale})`;
            lastChild.style.borderImageWidth = `calc(22px * ${this.borderScale})`;
          }
        }, 100);
      };

      window.addEventListener('resize', this.resizeCallback as () => void);
    }
  };

  public onAfterRender(): void {
    this.addResizeCallback();

    // Delay to ensure EFB is fully loaded
    setTimeout(() => {
      this.addReloadCallback();

      if (!this.mouseDownCallback) {
        this.mouseDownCallback = (event: MouseEvent) => {
          if (event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.stopPropagation();
            this.resizing = { x: event.clientX, y: event.clientY, widthRatio: this.widthRatio, heightRatio: this.heightRatio };
          } else {
            this.resizing = undefined;
          }
        };

        this.elementRef.getOrDefault()?.contentWindow?.document.body.addEventListener('mousedown', this.mouseDownCallback, { capture: true });
        (document.body.lastElementChild as HTMLElement | null)?.addEventListener('mousedown', this.mouseDownCallback, { capture: true });
      }

      if (!this.mouseMoveCallback) {
        this.mouseMoveCallback = (event: MouseEvent) => {
          if (this.resizing) {
            event.stopPropagation();

            const deltaX = event.clientX - this.resizing.x;
            const deltaY = event.clientY - this.resizing.y;
            const panelWidth = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-width'));
            const panelHeight = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-height'));

            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              width: Math.max(0.1, Math.min(1.0, this.resizing.widthRatio + deltaX / panelWidth)),
              height: Math.max(0.1, Math.min(1.0, this.resizing.heightRatio + deltaY / panelHeight)),
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          }
        };

        this.elementRef.getOrDefault()?.contentWindow?.document.body.addEventListener('mousemove', this.mouseMoveCallback, { capture: true });
        (document.body.lastElementChild as HTMLElement | null)?.addEventListener('mousemove', this.mouseMoveCallback, { capture: true });
      }
    }, 1000);

    const firstChild = document.body.firstElementChild as HTMLElement | null;
    const lastChild = document.body.lastElementChild as HTMLElement | null;
    console.assert(firstChild !== null);
    console.assert(lastChild !== null);

    this.addRatioCallback();

    if (firstChild && !this.onHideObserver) {
      this.onHideObserver = new MutationObserver(() => {
        this.resizeCallback?.();
      });
      this.onHideObserver.observe(firstChild, { attributes: true, attributeFilter: ['class'] });
    }

    if (messageHandler === undefined) {
      messageHandler = new MessageHandler(this.elementRef.instance);

      this.props.manager.openEFB(this.messageHandle);

      messageHandler.subscribe("__SETTINGS__", this.props.manager.onSharedSettings.bind(this.props.manager))
      messageHandler.subscribe("__GET_SETTINGS__", this.onGetSettings.bind(this))
      messageHandler.subscribe("__GET_SERVER_STATE__", this.onGetServerState.bind(this))
      messageHandler.subscribe("__GET_RECORDS__", this.onGetPlaneRecords.bind(this))
      messageHandler.subscribe("__GET_FACILITIES__", this.onGetFacilities.bind(this))
      messageHandler.subscribe("__GET_METAR__", this.onGetMetar.bind(this))
      messageHandler.subscribe("__GET_LAT_LON__", this.onGetLatLon.bind(this))
      messageHandler.subscribe("__GET_ICAOS__", this.onGetIcaos.bind(this))
      messageHandler.subscribe("__EDIT_RECORD__", this.onEditRecord.bind(this))
      messageHandler.subscribe("__REMOVE_RECORD__", this.onRemoveRecord.bind(this))
      messageHandler.subscribe("__GET_RECORD__", this.onGetRecord.bind(this))
      messageHandler.subscribe("__GET_FUEL__", this.onGetFuel.bind(this))
      messageHandler.subscribe("__GET_FILE__", this.onGetFile.bind(this))
      messageHandler.subscribe("__OPEN_FILE__", this.onOpenFile.bind(this))
      messageHandler.subscribe("__FILE_EXISTS__", this.onFileExists.bind(this))
      messageHandler.subscribe("__SET_PANEL_SIZE__", this.onSetPanelSize.bind(this))

      messageHandler.subscribe("__FUEL_PRESETS__", this.onFuelPresets.bind(this))
      messageHandler.subscribe("__FUEL_CURVE__", this.onFuelCurve.bind(this))
      messageHandler.subscribe("__DEFAULT_FUEL_PRESET__", this.onDefaultFuelPreset.bind(this))

      messageHandler.subscribe("__DEVIATION_PRESETS__", this.onDeviationPresets.bind(this))
      messageHandler.subscribe("__DEVIATION_CURVE__", this.onDeviationCurve.bind(this))
      messageHandler.subscribe("__DEFAULT_DEVIATION_PRESET__", this.onDefaultDeviationPreset.bind(this))
    }
  }

}
