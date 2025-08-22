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

import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
import { FSComponent } from "@microsoft/msfs-sdk";
import { GetFacilities, GetICAOS as GetIcaos, GetLatLon, GetMetar } from "@shared/Facilities";
import { MessageHandler, MessageType } from "@shared/MessageHandler";
import { EditRecord, GetRecord, RemoveRecord } from "@shared/PlanPos";
import { Manager } from "../Manager";
import { FileExist, GetFile, OpenFile } from "@shared/Files";
import { DefaultFuelPreset, FuelPresets, SetFuelCurve } from "@shared/Fuel";

interface MainPageProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;

  manager: Manager;
}

let messageHandler: MessageHandler | undefined = undefined;

export class MainPage extends GamepadUiView<HTMLDivElement, MainPageProps> {
  public readonly tabName = MainPage.name;
  private readonly elementRef = FSComponent.createRef<HTMLIFrameElement>();

  private readonly messageHandle = (message: MessageType) => { messageHandler?.send(message) };

  constructor(props: MainPageProps) {
    super(props);
  }

  onGetSettings() {
    this.props.manager.onGetSettings(0);
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

  onFuelPresets(message: FuelPresets) {
    this.props.manager.onFuelPresets(0, message);
  }

  onFuelCurve(message: SetFuelCurve) {
    this.props.manager.onFuelCurve(0, message);
  }

  onDefaultFuelPreset(message: DefaultFuelPreset) {
    this.props.manager.onDefaultFuelPreset(0, message);
  }

  destroy(): void {
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

      messageHandler.subscribe("__FUEL_PRESETS__", this.onFuelPresets.bind(this))
      messageHandler.subscribe("__FUEL_CURVE__", this.onFuelCurve.bind(this))

      messageHandler.subscribe("__DEFAULT_FUEL_PRESET__", this.onDefaultFuelPreset.bind(this))
    }
  }

}
