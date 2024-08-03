import {
  EventBus,
  DisplayComponent,
  ComponentProps,
  NodeReference,
  FSComponent,
  VNode,
  HEvent,
  Subject,
} from '@microsoft/msfs-sdk';
import { CDU } from 'instruments/src/CDU/model/CDU';
import { CDUSimvars } from 'instruments/src/CDU/model/CDUSimvarPublisher';
import { MCDUMenu } from 'instruments/src/CDU/pages/MCDUMenu';
import { DisplayablePage } from 'instruments/src/CDU/model/CDUPage';
import { CDUHeader, CDUPageInfo, Lines, Scratchpad } from 'instruments/src/CDU/PageComponents';

export type Side = 1 | 2;

interface CDUProps extends ComponentProps {
  bus: EventBus;
  side: Side;
}

export namespace CDUScratchpad {
  export const clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  export const ovfyValue = '\u0394';
  export const _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  export const nbSpace = '\xa0';
}

export class CDUDisplay extends DisplayComponent<CDUProps> {
  private containerRef: NodeReference<HTMLElement> = FSComponent.createRef();
  private side: Side;
  private showing: boolean = true;
  private currentPage: DisplayablePage = new MCDUMenu(this);
  private scratchpadDisplayed: Subject<string> = Subject.create<string>(this.currentPage.defaultScratchpad);
  private scratchpadTyped: Subject<string> = Subject.create<string>('');
  private refreshTimeout: NodeJS.Timeout;

  constructor(props: CDUProps) {
    super(props);
    this.scratchpadTyped.sub((newValue) => this.scratchpadDisplayed.set(newValue));
  }

  public get Side() {
    return this.side;
  }

  private get CDU() {
    return CDU.instances[this.side];
  }

  secondsTohhmm(seconds) {
    if (seconds === 0) return '0000';
    if (!seconds) return '----';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
  }

  openPage(page: DisplayablePage) {
    this.currentPage = page;
    this.scratchpadDisplayed.set(page.defaultScratchpad ?? this.scratchpadTyped.get());
    clearTimeout(this.refreshTimeout);
    this.refresh();
  }

  typeCharacter(text: string) {
    const currentContents = this.scratchpadTyped.get();
    // Handle if we're on CLR
    if (currentContents === CDUScratchpad.clrValue) {
      this.scratchpadTyped.set(text === CDUScratchpad.clrValue ? '' : text);
      return;
    }
    // Handle if we're not showing the typed message and hit clr to get rid of it
    if (text === CDUScratchpad.clrValue && this.scratchpadDisplayed.get() !== this.scratchpadTyped.get()) {
      this.scratchpadDisplayed.set(this.scratchpadTyped.get());
      return;
    }
    // Handle if we hit CLR and there is text to erase
    if (text === CDUScratchpad.clrValue && !(currentContents.length === 0)) {
      this.scratchpadTyped.set(currentContents.substring(0, currentContents.length - 1));
      return;
    }
    this.scratchpadTyped.set(currentContents + text);
  }

  // #region Rendering

  render(): VNode {
    this.side = this.props.side;
    CDU.init();
    const result = (
      <>
        <div id="BackglowCDU" />
        <div id="Mainframe" ref={this.containerRef}>
          {this.screen()}
        </div>
      </>
    );
    return result;
  }

  refresh(): void {
    if (this.containerRef?.instance) {
      this.containerRef.instance.innerHTML = '';
      FSComponent.render(this.screen(), this.containerRef.instance);
    }

    if (this.currentPage.refreshRate) {
      this.refreshTimeout = setTimeout(() => {
        this.currentPage.onRefresh();
        this.refresh();
      }, this.currentPage.refreshRate);
    }
  }

  screen(): VNode {
    return (
      <>
        <div class="s-text" id="cdu-title-left">
          {this.currentPage.titleLeft}
        </div>
        <CDUHeader
          page={this.currentPage}
          arrowLeft={this.currentPage.arrows.left}
          arrowRight={this.currentPage.arrows.right}
        />
        <CDUPageInfo page={this.currentPage} />
        <Lines page={this.currentPage} />
        <Scratchpad
          message={this.scratchpadDisplayed}
          arrowUp={this.currentPage.arrows.up}
          arrowDown={this.currentPage.arrows.down}
        />
      </>
    );
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.initializeBus();
    this.initializeKeyHandlers();
  }

  // For during development only. Should be removed once old CDU is no longer necessary.
  debugSwitchCDUVersion(): void {
    // Hide old JS
    this.showing = !this.showing;
    if (this.side === 1) {
      if (this.showing) {
        document.getElementById('panel').querySelector('a320-neo-cdu-main-display')?.classList.add('hidden');
        document.getElementById('panel').querySelector('a32nx-cdu')?.classList.remove('hidden');
      } else {
        document.getElementById('panel').querySelector('a320-neo-cdu-main-display')?.classList.remove('hidden');
        document.getElementById('panel').querySelector('a32nx-cdu')?.classList.add('hidden');
      }
    }
  }

  // #endregion

  // #region Initialization (onAfterRender calls these)
  initializeBus(): void {
    this.initializeSimvarSubscribers();
  }

  initializeSimvarSubscribers(): void {
    const sub = this.props.bus.getSubscriber<CDUSimvars>();
    if (this.side === 1) {
      sub
        .on('acEssIsPowered')
        .whenChanged()
        .handle((acEssIsPowered) => {
          console.log(`[CDU${this.side}] powered: ${acEssIsPowered}`);
          this.CDU.powered = acEssIsPowered;
        });
    } else if (this.side === 2) {
      sub
        .on('ac2IsPowered')
        .whenChanged()
        .handle((ac2IsPowered) => {
          console.log(`[CDU${this.side}] powered: ${ac2IsPowered}`);
          this.CDU.powered = ac2IsPowered;
        });
    }
  }

  initializeKeyHandlers(): void {
    const hEventsSub = this.props.bus.getSubscriber<HEvent>();
    hEventsSub.on('hEvent').handle((eventName) => {
      this.handleKey(eventName);
    });
  }

  // #endregion

  // #region Event handlers
  handleKey(eventName: string): void {
    // Debugging only, remove
    if (eventName === `A32NX_CHRONO_RST`) {
      this.debugSwitchCDUVersion();
      return;
    }

    if (!this.CDU.powered || !this.showing) {
      return;
    }

    switch (eventName) {
      case `A320_Neo_CDU_${this.side}_BTN_OVFY`:
        this.typeCharacter(CDUScratchpad.ovfyValue);
        break;
      case `A320_Neo_CDU_${this.side}_BTN_CLR`:
        this.typeCharacter(CDUScratchpad.clrValue);
        break;
      case `A320_Neo_CDU_${this.side}_BTN_MENU`:
        this.openPage(new MCDUMenu(this));
        break;
      case `A320_Neo_CDU_${this.side}_BTN_UP`:
        this.currentPage.onUp();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_DOWN`:
        this.currentPage.onDown();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_NEXTPAGE`:
        this.currentPage.onRight();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_PREVPAGE`:
        this.currentPage.onLeft();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L1`:
        this.currentPage.onLSK1();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L2`:
        this.currentPage.onLSK2();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L3`:
        this.currentPage.onLSK3();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L4`:
        this.currentPage.onLSK4();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L5`:
        this.currentPage.onLSK5();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_L6`:
        this.currentPage.onLSK6();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R1`:
        this.currentPage.onRSK1();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R2`:
        this.currentPage.onRSK2();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R3`:
        this.currentPage.onRSK3();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R4`:
        this.currentPage.onRSK4();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R5`:
        this.currentPage.onRSK5();
        break;
      case `A320_Neo_CDU_${this.side}_BTN_R6`:
        this.currentPage.onRSK6();
        break;
      default:
        break;
    }
  }
  //#endregion
}
