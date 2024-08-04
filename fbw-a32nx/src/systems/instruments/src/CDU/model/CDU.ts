import { DatabaseIdent, NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDUDisplay';
import { AOCTimes } from 'instruments/src/CDU/model/AOCTimes';
import { NXFictionalMessages, NXSystemMessages, TypeIMessage } from 'instruments/src/CDU/model/NXMessages';
import { Simbrief } from 'instruments/src/CDU/model/Simbrief';
import { ISimbriefData } from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief/simbriefInterface';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanService, NavigationDatabase, NavigationDatabaseService } from '@fmgc/index';
import { FmsClient } from '../../../../atsu/fmsclient/src/index';
import { AtsuStatusCodes } from '@datalink/common';

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
  flightPhaseManager: FlightPhaseManager;
  flightPlanService: FlightPlanService;
  navigationDatabaseService: NavigationDatabaseService;
  navigationDatabase: NavigationDatabase;
  ATSU: FmsClient;

  navDbIdent: DatabaseIdent;

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

    this.initializeSystems();
  }

  initializeSystems() {
    this.flightPhaseManager = Fmgc.getFlightPhaseManager();
    const bus = new EventBus();
    this.flightPlanService = new Fmgc.FlightPlanService(bus, new Fmgc.A320FlightPlanPerformanceData());
    this.flightPlanService.createFlightPlans();

    this.navigationDatabaseService = Fmgc.NavigationDatabaseService;
    this.navigationDatabase = new Fmgc.NavigationDatabase(Fmgc.NavigationDatabaseBackend.Msfs);

    this.ATSU = new FmsClient(this, this.flightPlanService);

    this.navigationDatabase.getDatabaseIdent().then((dbIdent) => (this.navDbIdent = dbIdent));
  }

  printPage(_page: string[]) {
    this.setScratchpadMessage(NXFictionalMessages.notYetImplementedTS);
  }

  /**
   * General ATSU message handler which converts ATSU status codes to new MCDU messages
   * @param code ATSU status code
   */
  addNewAtsuMessage(code: AtsuStatusCodes) {
    switch (code) {
      case AtsuStatusCodes.CallsignInUse:
        this.setScratchpadMessage(NXFictionalMessages.fltNbrInUse);
        break;
      case AtsuStatusCodes.NoHoppieConnection:
        this.setScratchpadMessage(NXFictionalMessages.noHoppieConnection);
        break;
      case AtsuStatusCodes.ComFailed:
        this.setScratchpadMessage(NXSystemMessages.comUnavailable);
        break;
      case AtsuStatusCodes.NoAtc:
        this.setScratchpadMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.MailboxFull:
        this.setScratchpadMessage(NXSystemMessages.dcduFileFull);
        break;
      case AtsuStatusCodes.UnknownMessage:
        this.setScratchpadMessage(NXFictionalMessages.unknownAtsuMessage);
        break;
      case AtsuStatusCodes.ProxyError:
        this.setScratchpadMessage(NXFictionalMessages.reverseProxy);
        break;
      case AtsuStatusCodes.NoTelexConnection:
        this.setScratchpadMessage(NXFictionalMessages.telexNotEnabled);
        break;
      case AtsuStatusCodes.OwnCallsign:
        this.setScratchpadMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.SystemBusy:
        this.setScratchpadMessage(NXSystemMessages.systemBusy);
        break;
      case AtsuStatusCodes.NewAtisReceived:
        this.setScratchpadMessage(NXSystemMessages.newAtisReceived);
        break;
      case AtsuStatusCodes.NoAtisReceived:
        this.setScratchpadMessage(NXSystemMessages.noAtisReceived);
        break;
      case AtsuStatusCodes.EntryOutOfRange:
        this.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        break;
      case AtsuStatusCodes.FormatError:
        this.setScratchpadMessage(NXSystemMessages.formatError);
        break;
      case AtsuStatusCodes.NotInDatabase:
        this.setScratchpadMessage(NXSystemMessages.notInDatabase);
        break;
      default:
        break;
    }
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
    this.Display?.refresh();
  }

  static updateSimbriefError(index: CDUIndex): void {
    CDU.instances[index].updateSimbriefError();
  }

  updateSimbriefError(): void {
    this.setScratchpadMessage(NXFictionalMessages.internalError);
    this.SimbriefStatus = Simbrief.Status.Ready;
    this.Display?.refresh();
  }

  update() {
    this.AOCTimes.updateTimes(this.flightPhaseManager);
    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.timeBetweenUpdates);
  }
}
