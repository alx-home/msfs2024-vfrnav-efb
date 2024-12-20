import { App } from "@efb/msfs2024-vfrnav";
import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@efb/efb-api";
import { FSComponent } from "@microsoft/msfs-sdk";

interface AppProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;
}

export class AppPage extends GamepadUiView<HTMLDivElement, AppProps> {
  public readonly tabName = AppPage.name;

  public render(): TVNode<HTMLDivElement> {
    return <div ref={this.gamepadUiViewRef}>
      <App />
    </div>;
  }
}
