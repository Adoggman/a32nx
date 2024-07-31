import { EventBus, FSComponent } from '@microsoft/msfs-sdk';
//import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';

import './style.scss';
import { CDUComponent } from 'instruments/src/CDU/CDU';

const contentElementId = 'CDU_CONTENT';

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
    if (this.side === 1 || this.side === 2) {
      FSComponent.render(<CDUComponent bus={this.bus} side={this.side} />, document.getElementById(contentElementId));
    } else {
      console.log('[CDU] Cannot create CDU with side ' + this.side);
      return;
    }

    // Remove "instrument didn't load" text
    document.getElementById(contentElementId).querySelector(':scope > h1').remove();
    // Hide old JS
    document.getElementById('panel').querySelector('a320-neo-cdu-main-display').setAttribute('style', 'display:none;');
  }

  private getDisplayIndex(): number {
    try {
      const url = document.querySelector('vcockpit-panel > a32nx-cdu').getAttribute('url');
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
