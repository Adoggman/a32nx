import { ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';

import './style.scss';

const contentElementId = 'CDU_CONTENT';

interface CDUProps extends ComponentProps {
  bus: EventBus;
  side: number;
}

class CDUComponent extends DisplayComponent<CDUProps> {
  render(): VNode {
    console.log('Rendering TypeScript CDU');
    return (
      <DisplayUnit bus={this.props.bus} normDmc={this.props.side}>
        <svg className="startup-text">
          <text x="1968" y="1360">
            SELF TEST IN PROGRESS (SIDE {this.props.side})
          </text>
          <text x="1968" y="1680">
            (MAX 10 SECONDS)
          </text>
        </svg>
      </DisplayUnit>
    );
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }
}

class A32NX_CDU extends BaseInstrument {
  private bus: EventBus;

  // 0 = Error, 1 = Left, 2 = Right
  private side: number;

  constructor() {
    super();
    this.bus = new EventBus();

    console.log('[CDU] Created TypeScript CDU instrument');
  }

  public connectedCallback(): void {
    super.connectedCallback();
    console.log('[CDU] Rendering TypeScript CDU instrument');
    this.side = this.getDisplayIndex();
    FSComponent.render(<CDUComponent bus={this.bus} side={this.side} />, document.getElementById(contentElementId));

    // Remove "instrument didn't load" text
    document.getElementById(contentElementId).querySelector(':scope > h1').remove();
  }

  private getDisplayIndex(): number {
    try {
      const url = document.querySelector('vcockpit-panel > *').getAttribute('url');
      return url ? parseInt(url.substring(url.length - 1), 10) : 0;
    } catch (e) {
      console.log('[CDU] Could not get URL to find index');
      return 0;
    }
  }

  get templateID(): string {
    return 'A32NX_CDU';
  }
}

registerInstrument('a32nx-cdu', A32NX_CDU);
