import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { FSComponent } from "@microsoft/msfs-sdk";

interface MainPageProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;
}

export class MainPage extends GamepadUiView<HTMLDivElement, MainPageProps> {
  public readonly tabName = MainPage.name;

  public render(): TVNode<HTMLDivElement> {
    return (
      <div ref={this.gamepadUiViewRef} className="sample-page" style={`height: 100%; --color: ${this.props.color}`}>
        <iframe title="msfs2024-vfrnav" height="100%" width="100%" src={`${BASE_URL}/efb/index.html`}>
        </iframe>
      </div>
    );
  }
}
