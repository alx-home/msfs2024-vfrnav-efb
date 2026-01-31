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
  private resizeCallback: (() => void) | undefined = undefined;
  private widthRatio = 1;
  private heightRatio = 1;
  private captionBar = true;
  private xRatio = 0;
  private yRatio = 0;
  private borderScale = 1;
  private dpiScale = 1;
  private menuDpiScale = 1;
  private onHideObserver: MutationObserver | undefined = undefined;
  private setRatioCallback: ((_event: MouseEvent) => void) | undefined = undefined;
  private resizeOutline: HTMLDivElement | null = null;
  private resizing: {
    type: 'move' | 'resize';
    x: number | undefined;
    y: number | undefined;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  } | undefined = undefined;

  constructor(props: MainPageProps) {
    super(props);

    const resizeData = GetStoredData(`efb-resize`);
    if (resizeData) {
      const resize = JSON.parse(resizeData as string);
      this.captionBar = resize.captionBar ?? true;
      this.xRatio = resize.x ?? 0;
      this.yRatio = resize.y ?? 0;
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

      captionBar: this.captionBar,
      x: this.xRatio,
      y: this.yRatio,
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

  onSetPanelSize({ width, height, x, y, dpiScale, menuDpiScale, borderScale, captionBar }: SetPanelSize) {
    this.captionBar = captionBar;
    this.xRatio = x;
    this.yRatio = y;
    this.widthRatio = width;
    this.heightRatio = height;
    this.borderScale = borderScale;
    this.dpiScale = dpiScale;
    this.menuDpiScale = menuDpiScale;

    SetStoredData(`efb-resize`, JSON.stringify({
      width: this.widthRatio,
      height: this.heightRatio,
      x: this.xRatio,
      y: this.yRatio,
      borderScale: this.borderScale,
      dpiScale: this.dpiScale,
      menuDpiScale: this.menuDpiScale,
      captionBar: this.captionBar
    }));
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
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');

    if (this.resizeCallback) {
      window.removeEventListener('resize', this.resizeCallback as () => void);
      this.onHideObserver?.disconnect();
      this.onHideObserver = undefined;
      this.resizeCallback = undefined;
    }

    this.stopListenMouseMove();
    this.stopListenMouseUp();
    this.stopListenMouseDown();

    if (this.setRatioCallback) {
      lastChild?.removeEventListener('mousedown', this.setRatioCallback);
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

  public addRatioCallback = () => {
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');

    if (!this.setRatioCallback && lastChild) {
      this.setRatioCallback = (event: MouseEvent) => {
        if (event.altKey) {
          const element = (document.body.querySelector('.panel-ui') as HTMLElement);
          const child = element.firstChild;

          const rect = (child as HTMLElement).getBoundingClientRect();
          const { clientX: x, clientY: y } = event;

          const xResize = x < rect.left || x > rect.right;
          const yResize = y < rect.top || y > rect.bottom;

          if (xResize && yResize) {
            // Diagonal resize

            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              captionBar: this.captionBar,
              x: Math.max(0, Math.min(1.0, this.xRatio)),
              y: Math.max(0, Math.min(1.0, this.yRatio)),
              width: Math.max(0.1, Math.min(1.0, this.widthRatio * (event.button == 0 ? 1.1 : 0.9))),
              height: Math.max(0.1, Math.min(1.0, this.heightRatio * (event.button == 0 ? 1.1 : 0.9))),
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          } else if (xResize) {
            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              captionBar: this.captionBar,
              x: Math.max(0, Math.min(1.0, this.xRatio)),
              y: Math.max(0, Math.min(1.0, this.yRatio)),
              width: Math.max(0.1, Math.min(1.0, this.widthRatio * (event.button == 0 ? 1.1 : 0.9))),
              height: this.heightRatio,
              borderScale: this.borderScale,
              dpiScale: this.dpiScale,
              menuDpiScale: this.menuDpiScale
            });
          } else if (yResize) {
            this.setPanelSize({
              __SET_PANEL_SIZE__: true,
              captionBar: this.captionBar,
              x: Math.max(0, Math.min(1.0, this.xRatio)),
              y: Math.max(0, Math.min(1.0, this.yRatio)),
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
      lastChild?.addEventListener('mousedown', this.setRatioCallback);
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
          const panelWidth = Math.floor(viewportWidth * (mode == '2D' ? this.widthRatio : 1));
          const panelHeight = Math.floor(viewportHeight * (mode == '2D' ? this.heightRatio : 1));
          const panelOffsetX = Math.floor((viewportWidth - panelWidth)) * (mode == '2D' ? this.xRatio : 0);
          const panelOffsetY = Math.floor((viewportHeight - panelHeight)) * (mode == '2D' ? this.yRatio : 0);

          for (const element of document.body.children) {
            (element as HTMLElement).style.setProperty('--panel-width', panelWidth.toFixed(0));
            (element as HTMLElement).style.setProperty('--panel-height', panelHeight.toFixed(0));
            (element as HTMLElement).style.setProperty('--orientation', orientation);
            (element as HTMLElement).style.setProperty('--mode', mode);
          }

          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--dpi-scale', mode == '2D' ? (this.menuDpiScale / (this.dpiScale * this.widthRatio)).toString() : '1');
          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--resize-ratio', mode == '2D' ? this.widthRatio.toFixed(2) : '1');
          this.elementRef.getOrDefault()?.contentWindow?.document.documentElement.style.setProperty('--font-size', mode == '2D' ? (this.dpiScale * 100).toFixed(0) + '%' : '100%');

          const firstChild: HTMLElement | null = document.body.querySelector('.panel-ui-actions');
          const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
          console.assert(firstChild !== null);
          console.assert(lastChild !== null);


          if (firstChild && lastChild) {
            const borderWidth = document.body.style.getPropertyValue('--border-width');

            if (this.captionBar) {
              firstChild.style.display = '';
            } else {
              firstChild.style.display = 'none';
            }

            firstChild.style.marginRight = (viewportWidth - panelWidth).toFixed(0) + "px";
            firstChild.style.transform = `translate(${panelOffsetX.toFixed(0)}px, ${panelOffsetY.toFixed(0)}px)`;

            lastChild.style.setProperty('--border-width', (this.borderScale * parseInt(borderWidth)).toFixed(2));
            lastChild.style.borderWidth = `calc(1px * ${this.borderScale} * var(--border-height)) calc(1px * var(--border-width))`;
            lastChild.style.borderRadius = `calc(var(--tablet-border-radius) * ${this.borderScale})`;
            lastChild.style.borderImageWidth = `calc(22px * ${this.borderScale})`;
            lastChild.style.transform = `translate(${panelOffsetX.toFixed(0)}px, ${panelOffsetY.toFixed(0)}px)`;

            if ((mode == '2D') && this.resizing) {
              if (!this.resizeOutline) {
                this.resizeOutline = document.createElement('div');

                this.resizeOutline.style.userSelect = 'none';
                this.resizeOutline.style.pointerEvents = 'none';
                this.resizeOutline.inert = true;
                this.resizeOutline.style.boxSizing = 'border-box';
                this.resizeOutline.style.boxShadow = '0 0 0 10px #00b4ff inset';
                this.resizeOutline.style.position = 'absolute';
                this.resizeOutline.style.top = '0px';
                this.resizeOutline.style.left = '0px';
                this.resizeOutline.style.height = viewportHeight.toFixed(0) + "px";
                this.resizeOutline.style.width = viewportWidth.toFixed(0) + "px";
                this.resizeOutline.className = 'efb-resize-outline';

                this.resizeOutline.style.top = lastChild.offsetTop + window.scrollY + "px";
                this.resizeOutline.style.left = lastChild.offsetLeft + window.scrollX + "px";

                document.body.appendChild(this.resizeOutline);
              }
            } else if (this.resizeOutline) {
              document.body.removeChild(this.resizeOutline);
              this.resizeOutline = null;
            }
          }
        }, 100);
      };

      window.addEventListener('resize', this.resizeCallback as () => void);
    }
  };

  private mouseMoveCallback(event: MouseEvent) {
    if (this.resizing) {
      event.stopPropagation();

      if ((this.resizing.x === undefined) || (this.resizing.y === undefined)) {
        this.resizing.x = event.pageX;
        this.resizing.y = event.pageY;
      }

      const deltaX = event.pageX - this.resizing.x;
      const deltaY = event.pageY - this.resizing.y;
      const panelWidth = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-width'));
      const panelHeight = parseInt(window.getComputedStyle(document.body).getPropertyValue('--panel-height'));

      if (this.resizing.type === 'move') {
        this.setPanelSize({
          __SET_PANEL_SIZE__: true,
          captionBar: this.captionBar,
          x: Math.max(0, Math.min(1.0, this.resizing.xRatio + deltaX / (panelWidth - this.resizing.widthRatio * panelWidth))),
          y: Math.max(0, Math.min(1.0, this.resizing.yRatio + deltaY / (panelHeight - this.resizing.heightRatio * panelHeight))),
          width: this.widthRatio,
          height: this.heightRatio,
          borderScale: this.borderScale,
          dpiScale: this.dpiScale,
          menuDpiScale: this.menuDpiScale
        });
      } else {
        const width = Math.max(0.1, Math.min(1.0, this.resizing.widthRatio + deltaX / panelWidth));
        const height = Math.max(0.1, Math.min(1.0, this.resizing.heightRatio + deltaY / panelHeight));

        const blankWidth = (panelWidth - width * panelWidth);
        const oldBlankWidth = (panelWidth - this.resizing.widthRatio * panelWidth);
        const x = blankWidth === 0 ? 0 : this.resizing.xRatio * oldBlankWidth / blankWidth;

        const blankHeight = (panelHeight - height * panelHeight);
        const oldBlankHeight = (panelHeight - this.resizing.heightRatio * panelHeight);
        const y = blankHeight === 0 ? 0 : this.resizing.yRatio * oldBlankHeight / blankHeight;

        this.setPanelSize({
          __SET_PANEL_SIZE__: true,
          captionBar: this.captionBar,
          x: Math.max(0, Math.min(1.0, x)),
          y: Math.max(0, Math.min(1.0, y)),
          width,
          height,
          borderScale: this.borderScale,
          dpiScale: this.dpiScale,
          menuDpiScale: this.menuDpiScale
        });
      }
    }
  }

  private listenMouseMove(): void {
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
    lastChild?.addEventListener('mousemove', this.mouseMoveCallback.bind(this), { capture: true });
  }

  private stopListenMouseMove(): void {
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
    lastChild?.removeEventListener('mousemove', this.mouseMoveCallback);
  }


  private mouseUpCallback(event: MouseEvent) {
    const efb = document.body.querySelector('.panel-ui')!.firstChild as HTMLElement;
    efb.style.display = "";

    this.resizing = undefined;

    if (event.ctrlKey) {
      if (event.shiftKey) {
        event.stopPropagation();

        this.setPanelSize({
          __SET_PANEL_SIZE__: true,
          captionBar: true,
          x: 0,
          y: 0,
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
  }

  public listenMouseUp = () => {
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
    lastChild?.addEventListener('mouseup', this.mouseUpCallback.bind(this), { capture: true });
    this.elementRef.getOrDefault()?.contentWindow?.document.body.addEventListener('mouseup', this.mouseUpCallback.bind(this), { capture: true });
  };

  private stopListenMouseUp(): void {
    if (this.mouseUpCallback) {
      const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
      lastChild?.removeEventListener('mouseup', this.mouseUpCallback);
      this.elementRef.getOrDefault()?.contentWindow?.document.body.removeEventListener('mouseup', this.mouseUpCallback);
    }
  }

  private mouseDownCallback(event: MouseEvent) {
    const resizing = event.ctrlKey && !event.altKey && !event.shiftKey && (event.button === 1);
    const moving = event.altKey && !event.ctrlKey && !event.shiftKey && (event.button === 1);

    if (resizing || moving) {
      event.stopPropagation();

      // Disable efb to avoid iframe capturing mouse events
      const efb = document.body.querySelector('.panel-ui')!.firstChild as HTMLElement;
      efb.style.display = "none";

      this.resizing = {
        x: undefined,
        y: undefined,
        xRatio: this.xRatio,
        yRatio: this.yRatio,
        widthRatio: this.widthRatio,
        heightRatio: this.heightRatio,
        type: resizing ? 'resize' : 'move'
      };
    }
  }

  private listenMouseDown(): void {
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');

    this.elementRef.getOrDefault()?.contentWindow?.document.body.addEventListener('mousedown', this.mouseDownCallback.bind(this), { capture: true });
    lastChild?.addEventListener('mousedown', this.mouseDownCallback.bind(this), { capture: true });
  }

  private stopListenMouseDown(): void {
    if (this.mouseDownCallback) {
      const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');

      this.elementRef.getOrDefault()?.contentWindow?.document.body.removeEventListener('mousedown', this.mouseDownCallback);
      lastChild?.removeEventListener('mousedown', this.mouseDownCallback);
    }
  }

  public onAfterRender(): void {
    this.addResizeCallback();

    // Delay to ensure EFB is fully loaded
    setTimeout(() => {
      this.listenMouseUp();
      this.listenMouseDown();
      this.listenMouseMove();
    }, 1000);

    const firstChild: HTMLElement | null = document.body.querySelector('.panel-ui-actions');
    const lastChild: HTMLElement | null = document.body.querySelector('.panel-ui');
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
