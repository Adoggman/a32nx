import { DatabaseIdent, NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDUDisplay';
import { NXFictionalMessages, NXSystemMessages, TypeIMessage } from 'instruments/src/CDU/model/NXMessages';
import { Simbrief } from 'instruments/src/CDU/model/Subsystem/Simbrief';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanService, NavigationDatabase, NavigationDatabaseService } from '@fmgc/index';
import { FmsClient } from '../../../../atsu/fmsclient/src/index';
import { AtsuStatusCodes } from '@datalink/common';
import { AOC } from 'instruments/src/CDU/model/Subsystem/AOC';

export enum CDUIndex {
  Left = 1,
  Right = 2,
}

export class CDU {
  Index: CDUIndex;
  Powered: boolean;
  AOC: AOC;
  Display: CDUDisplay;
  Simbrief: Simbrief;
  flightPhaseManager: FlightPhaseManager;
  flightPlanService: FlightPlanService;
  navigationDatabaseService: NavigationDatabaseService;
  navigationDatabase: NavigationDatabase;
  ATSU: FmsClient;

  navDbIdent: DatabaseIdent;

  private timeBetweenUpdates: number = 100;
  private updateTimeout: NodeJS.Timeout;

  // #region Static Properties & Methods

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

  // #endregion

  constructor(index: CDUIndex) {
    this.Index = index;
    this.Powered = this.getIsPowered();

    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.timeBetweenUpdates);

    this.initializeSystems();
    this.initializeSubsystems();
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

  initializeSubsystems() {
    this.Simbrief = new Simbrief(this);
    this.AOC = new AOC(this);
  }

  printPage(_page: string[]) {
    this.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  /**
   * General ATSU message handler which converts ATSU status codes to new MCDU messages
   * @param code ATSU status code
   */
  addNewAtsuMessage(code: AtsuStatusCodes) {
    switch (code) {
      case AtsuStatusCodes.CallsignInUse:
        this.setMessage(NXFictionalMessages.fltNbrInUse);
        break;
      case AtsuStatusCodes.NoHoppieConnection:
        this.setMessage(NXFictionalMessages.noHoppieConnection);
        break;
      case AtsuStatusCodes.ComFailed:
        this.setMessage(NXSystemMessages.comUnavailable);
        break;
      case AtsuStatusCodes.NoAtc:
        this.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.MailboxFull:
        this.setMessage(NXSystemMessages.dcduFileFull);
        break;
      case AtsuStatusCodes.UnknownMessage:
        this.setMessage(NXFictionalMessages.unknownAtsuMessage);
        break;
      case AtsuStatusCodes.ProxyError:
        this.setMessage(NXFictionalMessages.reverseProxy);
        break;
      case AtsuStatusCodes.NoTelexConnection:
        this.setMessage(NXFictionalMessages.telexNotEnabled);
        break;
      case AtsuStatusCodes.OwnCallsign:
        this.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.SystemBusy:
        this.setMessage(NXSystemMessages.systemBusy);
        break;
      case AtsuStatusCodes.NewAtisReceived:
        this.setMessage(NXSystemMessages.newAtisReceived);
        break;
      case AtsuStatusCodes.NoAtisReceived:
        this.setMessage(NXSystemMessages.noAtisReceived);
        break;
      case AtsuStatusCodes.EntryOutOfRange:
        this.setMessage(NXSystemMessages.entryOutOfRange);
        break;
      case AtsuStatusCodes.FormatError:
        this.setMessage(NXSystemMessages.formatError);
        break;
      case AtsuStatusCodes.NotInDatabase:
        this.setMessage(NXSystemMessages.notInDatabase);
        break;
      default:
        break;
    }
  }

  setMessage(message: TypeIMessage, replacement?: string): void {
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

  update() {
    this.AOC.update();
    this.updateTimeout = setTimeout(() => {
      this.update();
    }, this.timeBetweenUpdates);
  }
}
