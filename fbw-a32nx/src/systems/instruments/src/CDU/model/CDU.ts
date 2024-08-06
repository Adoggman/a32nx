import { DatabaseIdent, NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from '@cdu/CDUDisplay';
import { Simbrief } from '@cdu/model/Subsystem/Simbrief';
import { EventBus } from '@microsoft/msfs-sdk';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { DataManager, FlightPlanService, NavigationDatabase, NavigationDatabaseService } from '@fmgc/index';
import { AOC } from '@cdu/model/Subsystem/AOC';
import { ATSU } from '@cdu/model/Subsystem/ATSU';
import { TypeIMessage, TypeIIMessage } from '@cdu/data/NXMessages';
import { Fuel } from '@cdu/model/Subsystem/Fuel';
import { FlightInformation } from '@cdu/model/Subsystem/FlightInformation';

export enum CDUIndex {
  Left = 1,
  Right = 2,
}

export class CDU {
  // Properties
  Index: CDUIndex;
  Powered: boolean;
  Display: CDUDisplay;
  // Subsystems
  AOC: AOC;
  Simbrief: Simbrief;
  ATSU: ATSU;
  Fuel: Fuel;
  FlightInformation: FlightInformation;
  // Services, Managers, Databases
  flightPhaseManager: FlightPhaseManager;
  flightPlanService: FlightPlanService;
  navigationDatabaseService: NavigationDatabaseService;
  navigationDatabase: NavigationDatabase;
  dataManager: DataManager;

  navDbIdent: DatabaseIdent;

  private timeBetweenUpdates: number = 100;
  private updateTimeout: NodeJS.Timeout;

  public get scratchpad() {
    return this.Display.scratchpad;
  }

  // #region Static Properties & Methods

  static initialized: boolean = false;
  static instances: Array<CDU>;

  static linkDisplay(display: CDUDisplay, side: CDUIndex) {
    CDU.instances[side].Display = display;
  }

  static init() {
    if (CDU.initialized) {
      console.log('[CDU MASTER] Already initialized');
      return;
    }
    console.log('[CDU MASTER] Initializing all CDU instances');
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

  isWaypointInUse(wpt) {
    return this.flightPlanService.isWaypointInUse(wpt);
  }

  initializeSystems() {
    this.flightPhaseManager = Fmgc.getFlightPhaseManager();
    const bus = new EventBus();
    this.flightPlanService = new Fmgc.FlightPlanService(bus, new Fmgc.A320FlightPlanPerformanceData());
    this.flightPlanService.createFlightPlans();

    this.navigationDatabaseService = Fmgc.NavigationDatabaseService;
    this.navigationDatabase = new Fmgc.NavigationDatabase(Fmgc.NavigationDatabaseBackend.Msfs);
    this.navigationDatabase.getDatabaseIdent().then((dbIdent) => (this.navDbIdent = dbIdent));

    this.dataManager = new DataManager(this);
  }

  initializeSubsystems() {
    this.Simbrief = new Simbrief(this);
    this.AOC = new AOC(this);
    this.ATSU = new ATSU(this);
    this.Fuel = new Fuel(this);
    this.FlightInformation = new FlightInformation(this);
  }

  setMessage(message: TypeIMessage, replacement?: string): void {
    if (message.isTypeTwo) {
      throw new Error(`[CDU${this.Index}] Tried to pass type 2 message to setMessage: ${message.getText(replacement)}`);
    }
    this.scratchpad.setMessage(message, replacement);
  }

  addMessageToQueue(message: TypeIIMessage, replacement?: string): void {
    if (!message.isTypeTwo) {
      throw new Error(
        `[CDU${this.Index}] Tried to pass type 1 message to addMessageToQueue: ${message.getText(replacement)}`,
      );
    }
    console.log(`[CDU${this.Index}] Adding message to queue: ${message.getText(replacement)}`);
    this.scratchpad.addMessageToQueue(message.getModifiedMessage(replacement));
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
