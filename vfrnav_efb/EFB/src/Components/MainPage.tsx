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
  private resizeTimer: NodeJS.Timeout | undefined = undefined;
  private widthRatio = 1;
  private heightRatio = 1;
  private borderScale = 1;
  private dpiScale = 1;
  private menuDpiScale = 1;

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
      window.removeEventListener('mouseup', this.reloadCallback);
      this.reloadCallback = undefined;
    }
    if (this.resizeCallback) {
      window.removeEventListener('resize', this.resizeCallback);
      this.resizeCallback = undefined;
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
        <iframe ref={this.elementRef} title="msfs2024-vfrnav" height="100%" width="100%" src={`${BASE_URL}/efb/index.html`}>
        </iframe>
      </div>
    );
  }

  public onAfterRender(): void {
    if (!this.reloadCallback) {
      this.reloadCallback = (event: MouseEvent) => {
        if (event.altKey) {
          this.onSetPanelSize({
            __SET_PANEL_SIZE__: true,
            width: 1,
            height: 1,
            borderScale: this.borderScale,
            dpiScale: 1,
            menuDpiScale: 1
          });
          location.reload();
        }
      };

      window.addEventListener('mouseup', this.reloadCallback);
    }

    if (!this.resizeCallback) {
      this.resizeCallback = () => {
        if (this.resizeTimer) {
          clearTimeout(this.resizeTimer);
        }
        this.resizeTimer = setTimeout(() => {
          this.resizeTimer = undefined;
          const orientation = this.props.settings.getSetting('orientationMode').value === 0 ? 'vertical' : 'horizontal';
          const mode = this.props.settings.getSetting('mode').value === 0 ? '2D' : '3D';
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
          (document.body.firstElementChild as HTMLElement).style.marginRight = (viewportWidth - panelWidth).toFixed(0) + "px";
          (document.body.lastElementChild as HTMLElement).style.borderWidth = `calc(1px * ${this.borderScale} * var(--border-height)) calc(1px * ${this.borderScale} * var(--border-width))`;
          (document.body.lastElementChild as HTMLElement).style.borderRadius = `calc(var(--tablet-border-radius) * ${this.borderScale})`;
          (document.body.lastElementChild as HTMLElement).style.borderImageWidth = `calc(22px * ${this.borderScale})`;


          messageHandler!.send({
            __SET_EFB_MODE__: true,
            mode2D: mode === '2D'
          });
        }, 100);
      }

      window.addEventListener('resize', this.resizeCallback);
      this.resizeCallback()
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
