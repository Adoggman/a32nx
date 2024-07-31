import { EventBus, FSComponent, HEventPublisher } from '@microsoft/msfs-sdk';

import './style.scss';
import { CDUComponent, Side } from 'instruments/src/CDU/CDU';

const contentElementId = 'CDU_CONTENT';

class A32NX_CDU extends BaseInstrument {
  private bus = new EventBus();
  private readonly hEventPublisher: HEventPublisher;

  // 0 = Error, 1 = Left, 2 = Right
  private side: number;

  constructor() {
    super();

    console.log('[CDU] Created TypeScript CDU instrument');
    this.hEventPublisher = new HEventPublisher(this.bus);
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    console.log('[CDU] Rendering TypeScript CDU instrument');
    this.side = this.getDisplayIndex();
    if (!this.isValidSide(this.side)) {
      console.log('[CDU] Cannot create CDU with side ' + this.side);
      return;
    }

    this.hEventPublisher.startPublish();

    FSComponent.render(
      <CDUComponent bus={this.bus} side={this.side as Side} />,
      document.getElementById(contentElementId),
    );

    // Remove "instrument didn't load" text
    document.getElementById(contentElementId).querySelector(':scope > h1').remove();
    // Hide old JS
    document.getElementById('panel').querySelector('a320-neo-cdu-main-display').setAttribute('style', 'display:none;');
  }

  private getDisplayIndex(): number {
    // TODO very naive handling of url parameter
    try {
      const url = document.querySelector('vcockpit-panel > a32nx-cdu').getAttribute('url');
      return url ? parseInt(url.substring(url.length - 1), 10) : 0;
    } catch (e) {
      console.log('[CDU] Could not get URL to find index');
      return 0;
    }
  }

  private isValidSide(side: number): boolean {
    // Should match CDUIndex in ./model/CDU.ts
    return side === 1 || side === 2;
  }

  get templateID(): string {
    return 'A32NX_CDU';
  }
}

registerInstrument('a32nx-cdu', A32NX_CDU);
