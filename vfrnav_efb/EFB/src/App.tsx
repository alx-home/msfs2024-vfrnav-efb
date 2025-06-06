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

import {
  App,
  AppBootMode,
  AppInstallProps,
  AppSuspendMode,
  AppView,
  AppViewProps,
  RequiredProps,
  TVNode,
} from "@alx-home/efb-api";

import { FSComponent, VNode } from "@microsoft/msfs-sdk";
import { MainPage } from "./Components/MainPage";
import { Manager } from './Manager';

class VfrNavAppView extends AppView<RequiredProps<AppViewProps, "bus">> {
  /**
   * Optional property
   * Default view key to show if using AppViewService
   */
  protected defaultView = "main";

  /**
   * Optional method
   * Views (page or popup) to register if using AppViewService
   * Default behavior : nothing
   */
  protected registerViews(): void {
    this.appViewService.registerPage("main", () => (
      <MainPage manager={this.props.manager} appViewService={this.appViewService} color="#7f8fa6" title="main" />
    ));
  }

  /**
   * Optional method
   * Method called when AppView is open after it's creation
   * Default behavior : nothing
   */
  public onOpen(): void {
    //
  }

  /**
   * Optional method
   * Method called when AppView is closed
   * Default behavior : nothing
   */
  public onClose(): void {
    //
  }

  /**
   * Optional method
   * Method called when AppView is resumed (equivalent of onOpen but happen every time we go back to this app)
   * Default behavior : nothing
   */
  public onResume(): void {
    //
  }

  /**
   * Optional method
   * Method called when AppView is paused (equivalent of onClose but happen every time we switch to another app)
   * Default behavior : nothing
   */
  public onPause(): void {
    //
  }

  /**
   * Optional method
   * Default behavior is rendering AppContainer which works with AppViewService
   * We usually surround it with <div className="template-app">{super.render}</div>
   * Can render anything (JSX, Component) so it doesn't require to use AppViewService and/or AppContainer
   * @returns VNode
   */
  public render(): VNode {
    return <div className="app" style="height: 100%">{super.render()}</div>;
  }
}

export class VfrNavApp extends App {
  private manager: Manager | undefined;

  /**
   * Required getter for friendly app-name.
   * Used by the EFB as App's name shown to the user.
   * @returns string
   */
  public get name(): string {
    return "Vfr Nav";
  }

  /**
   * Required getter for app's icon url.
   * Used by the EFB as App's icon shown to the user.
   * @returns string
   */
  public get icon(): string {
    return `${BASE_URL}/assets/app-icon.svg`;
  }

  /**
   * Optional attribute
   * Allow to choose BootMode between COLD / WARM / HOT
   * Default behavior : AppBootMode.COLD
   *
   * COLD : No dom preloaded in memory
   * WARM : App -> AppView are loaded but not rendered into DOM
   * HOT : App -> AppView -> Pages are rendered and injected into DOM
   */
  public BootMode = AppBootMode.COLD;

  /**
   * Optional attribute
   * Allow to choose SuspendMode between SLEEP / TERMINATE
   * Default behavior : AppSuspendMode.SLEEP
   *
   * SLEEP : Default behavior, does nothing, only hiding and sleeping the app if switching to another one
   * TERMINATE : Hiding the app, then killing it by removing it from DOM (BootMode is checked on next frame to reload it and/or to inject it, see BootMode)
   */
  public SuspendMode = AppSuspendMode.SLEEP;

  /**
   * Optional method
   * Allow to resolve some dependencies, install external data, check an api key, etc...
   * @param _props props used when app has been setted up.
   * @returns Promise<void>
   */
  public async install(props: AppInstallProps): Promise<void> {
    this.efbSettingsManager.addAppToFavorites(this);
    this.manager = new Manager(this.bus);

    console.assert(props.bus);
    return Promise.resolve();
  }

  /**
   * Optional method
   * Allows to specify an array of compatible ATC MODELS.
   * Your app will be visible but greyed out if the aircraft is not compatible.
   * if undefined or method not implemented, the app will be visible for all aircrafts.
   * @returns string[] | undefined
   */
  public get compatibleAircraftModels(): string[] | undefined {
    return undefined;
  }

  /*
   * @returns {AppView} created above
   */
  public render(): TVNode<VfrNavAppView> {
    return <VfrNavAppView manager={this.manager!} bus={this.bus} />;
  }
}
