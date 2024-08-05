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
import { CDU } from '@cdu/model/CDU';
import { CDUSimvars } from '@cdu/model/CDUSimvarPublisher';
import { MCDUMenu } from '@cdu/pages/MCDUMenu';
import { CDUColor, DisplayablePage } from '@cdu/model/CDUPage';
import { CDUHeader, CDUPageInfo, Lines, Scratchpad } from '@cdu/PageComponents';
import { TypeIMessage } from '@cdu/data/NXMessages';
import { CDUEvents } from '@cdu/data/CDUEvent';
import { Init } from '@cdu/pages/Init';

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
  private scratchpadDisplayed: Subject<string> = Subject.create<string>(this.currentPage.defaultMessage.getText());
  private scratchpadColor: Subject<string> = Subject.create<string>(CDUColor.White);
  private scratchpadTyped: Subject<string> = Subject.create<string>('');
  private refreshTimeout: NodeJS.Timeout;

  constructor(props: CDUProps) {
    super(props);
    this.scratchpadTyped.sub((newValue) => {
      this.scratchpadDisplayed.set(newValue);
      this.scratchpadColor.set(CDUColor.White);
    });
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
    if (page.defaultMessage) {
      this.setMessage(page.defaultMessage);
    } else {
      this.scratchpadDisplayed.set(this.scratchpadTyped.get());
      this.scratchpadColor.set(CDUColor.White);
    }
    clearTimeout(this.refreshTimeout);
    this.refresh();
  }

  setMessage(message: TypeIMessage, replacement?: string) {
    this.scratchpadDisplayed.set(message.getText(replacement));
    this.scratchpadColor.set(message.isAmber ? CDUColor.Amber : CDUColor.White);
  }

  typeCharacter(text: string) {
    const currentContents = this.scratchpadTyped.get();
    // Handle if we're on CLR
    if (currentContents === CDUScratchpad.clrValue) {
      this.scratchpadTyped.set(text === CDUScratchpad.clrValue ? '' : text);
      return;
    }
    // Handle if we're not showing the typed message and hit clr to get rid of it
    if (text === CDUScratchpad.clrValue && this.scratchpadDisplayed.get() !== currentContents) {
      this.scratchpadDisplayed.set(currentContents);
      return;
    }
    // Handle if we hit CLR and there is text to erase
    if (text === CDUScratchpad.clrValue && !(currentContents.length === 0)) {
      this.scratchpadTyped.set(currentContents.substring(0, currentContents.length - 1));
      return;
    }

    // Handle plus/minus
    if (text === '-' && currentContents.endsWith('-')) {
      this.scratchpadTyped.set(currentContents.substring(0, currentContents.length - 1) + '+');
      return;
    }
    if (text === '-' && currentContents.endsWith('+')) {
      this.scratchpadTyped.set(currentContents.substring(0, currentContents.length - 1) + '-');
      return;
    }

    this.scratchpadTyped.set(currentContents + text);
  }

  // #region Rendering

  render(): VNode {
    this.side = this.props.side;
    CDU.init();
    CDU.linkDisplay(this, this.side);
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
          color={this.scratchpadColor}
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
          this.CDU.Powered = acEssIsPowered;
        });
    } else if (this.side === 2) {
      sub
        .on('ac2IsPowered')
        .whenChanged()
        .handle((ac2IsPowered) => {
          console.log(`[CDU${this.side}] powered: ${ac2IsPowered}`);
          this.CDU.Powered = ac2IsPowered;
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

    if (!this.CDU.Powered || !this.showing) {
      return;
    }

    const events = CDUEvents.Side[this.side];
    switch (eventName) {
      case events.CLR:
        this.typeCharacter(CDUScratchpad.clrValue);
        return;
      case events.DOT:
        this.typeCharacter('.');
        return;
      case events.PLUSMINUS:
        this.typeCharacter('-');
        return;
      case events.SP:
        this.typeCharacter(' ');
        return;
      case events.SLASH:
        this.typeCharacter('/');
        return;
      case events.OVFY:
        this.typeCharacter(CDUScratchpad.ovfyValue);
        return;
      case events.PageMenu:
        this.openPage(new MCDUMenu(this));
        return;
      case events.PageInit:
        this.openPage(new Init(this));
        return;
      case events.PageUp:
        this.currentPage.onUp();
        return;
      case events.PageDown:
        this.currentPage.onDown();
        return;
      case events.PageNext:
        this.currentPage.onRight();
        return;
      case events.PagePrev:
        this.currentPage.onLeft();
        return;
      case events.L1:
        this.currentPage.onLSK1();
        return;
      case events.L2:
        this.currentPage.onLSK2();
        return;
      case events.L3:
        this.currentPage.onLSK3();
        return;
      case events.L4:
        this.currentPage.onLSK4();
        return;
      case events.L5:
        this.currentPage.onLSK5();
        return;
      case events.L6:
        this.currentPage.onLSK6();
        return;
      case events.R1:
        this.currentPage.onRSK1();
        return;
      case events.R2:
        this.currentPage.onRSK2();
        return;
      case events.R3:
        this.currentPage.onRSK3();
        return;
      case events.R4:
        this.currentPage.onRSK4();
        return;
      case events.R5:
        this.currentPage.onRSK5();
        return;
      case events.R6:
        this.currentPage.onRSK6();
        return;
      default:
        break;
    }

    if (eventName.startsWith(events.LettersStartWith)) {
      const letter = eventName.substring(events.LettersStartWith.length);
      if (letter in events.Letters) {
        this.typeCharacter(letter);
      }
    }
  }
  //#endregion
}
