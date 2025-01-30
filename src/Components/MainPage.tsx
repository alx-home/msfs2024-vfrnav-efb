import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
import { FSComponent } from "@microsoft/msfs-sdk";
import { MessageHandler } from "@shared/MessageHandler";
import { SharedSettings } from "@shared/Settings";

interface MainPageProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;

}

export let messageHandler: MessageHandler | undefined = undefined;

export class MainPage extends GamepadUiView<HTMLDivElement, MainPageProps> {
  public readonly tabName = MainPage.name;
  private elementRef = FSComponent.createRef<HTMLIFrameElement>();
  private settings: SharedSettings | undefined;

  constructor(props) {
    super(props);
  }

  onGetSettings() {
    const storedSettings = GetStoredData("settings");
    if (storedSettings) {
      this.settings = JSON.parse(storedSettings as string) as SharedSettings;
    }

    if (this.settings) {
      messageHandler?.send(this.settings);
    }
  }

  onSharedSettings(message) {
    this.settings = message;
    SetStoredData("settings", JSON.stringify(message));
  }

  destroy(): void {
    if (messageHandler !== undefined) {
      messageHandler.unsubscribe("SharedSettings", this.onSharedSettings)
      messageHandler.unsubscribe("GetSettings", this.onGetSettings)
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
      messageHandler.subscribe("SharedSettings", this.onSharedSettings.bind(this));
      messageHandler.subscribe("GetSettings", this.onGetSettings.bind(this));
    }
  }

}
