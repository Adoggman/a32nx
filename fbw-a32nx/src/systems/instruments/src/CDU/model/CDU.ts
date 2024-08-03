import { NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { AOCTimes } from 'instruments/src/CDU/model/AOCTimes';
import { NXFictionalMessages, TypeIMessage } from 'instruments/src/CDU/model/NXMessages';
import { Simbrief } from 'instruments/src/CDU/model/Simbrief';
import { ISimbriefData } from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief/simbriefInterface';

export enum CDUIndex {
  Left = 1,
  Right = 2,
}

export class CDU {
  Index: CDUIndex;
  Powered: boolean;
  AOCTimes = new AOCTimes();
  Display: CDUDisplay;
  SimbriefData: ISimbriefData;
  SimbriefStatus: Simbrief.Status = Simbrief.Status.Ready;

  private timeBetweenUpdates: number = 100;
  private updateTimeout: NodeJS.Timeout;

  static initialized: boolean = false;
  static instances: Array<CDU>;

  static linkDisplay(display: CDUDisplay, side: CDUIndex) {
    CDU.instances[side].Display = display;
  }

  static init() {
    if (CDU.initialized) {
      console.log('[CDU] Already initialized');
      return;
    }
    console.log('[CDU] Initializing all CDU instances');
    CDU.instances = new Array<CDU>();
    CDU.instances[0] = undefined;
    CDU.instances[CDUIndex.Left] = new CDU(CDUIndex.Left);
    CDU.instances[CDUIndex.Right] = new CDU(CDUIndex.Right);
    CDU.initialized = true;
  }

  constructor(index: CDUIndex) {
    this.Index = index;
    this.Powered = this.getIsPowered();

    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.timeBetweenUpdates);
  }

  setScratchpadMessage(message: TypeIMessage, replacement?: string): void {
    this.Display?.setMessage(message, replacement);
  }

  toString(): string {
    return `CDU: ${this.Index.toString()}`;
  }

  private getIsPowered(): boolean {
    if (this.Index === CDUIndex.Left) {
      return SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number');
    } else if (this.Index === CDUIndex.Right) {
      SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Number');
    } else {
      throw new Error('Checking power on invalid index: ' + this.Index);
    }
  }

  Info = {
    engine: 'LEAP-1A26',
    navCycleDates: '11JUL-08AUG',
    navSerial: 'MS24070001',
    idle: 0,
    perf: 0,
  };

  static getTimeUTC(): Seconds {
    return Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
  }

  getTimeUTC() {
    return CDU.getTimeUTC();
  }

  getFOB() {
    return NXUnits.poundsToUser(SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'pound') / 1000);
  }

  simbriefInit(): void {
    if (this.SimbriefStatus === Simbrief.Status.Requesting) {
      console.log(`[CDU${this.Index}] Ignoring new simbrief request, request already in progress`);
      return;
    }
    this.SimbriefStatus = Simbrief.Status.Requesting;
    const errCode = Simbrief.getOFP(this.Index, CDU.updateSimbrief, CDU.updateSimbriefError);
    if (errCode) {
      this.SimbriefStatus = Simbrief.Status.Ready;
      if (errCode === Simbrief.ErrorCode.NoNavigraphUsername) {
        this.setScratchpadMessage(NXFictionalMessages.noNavigraphUser);
      } else if (errCode === Simbrief.ErrorCode.Unknown) {
        this.setScratchpadMessage(NXFictionalMessages.internalError);
      }
    }
  }

  static updateSimbrief(index: CDUIndex, data: ISimbriefData, _simbriefObject: {}): void {
    CDU.instances[index].updateSimbrief(data, _simbriefObject);
  }

  updateSimbrief(data: ISimbriefData, _simbriefObject: {}): void {
    this.SimbriefData = data;
    this.SimbriefStatus = Simbrief.Status.Done;
    this.setScratchpadMessage(NXFictionalMessages.emptyMessage);
  }

  static updateSimbriefError(index: CDUIndex): void {
    CDU.instances[index].updateSimbriefError();
  }

  updateSimbriefError(): void {
    this.setScratchpadMessage(NXFictionalMessages.internalError);
    this.SimbriefStatus = Simbrief.Status.Ready;
  }

  update() {
    this.AOCTimes.updateTimes(Fmgc.getFlightPhaseManager());
    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.timeBetweenUpdates);
  }
}
