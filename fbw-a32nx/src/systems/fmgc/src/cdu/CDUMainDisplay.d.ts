import { FlightPlanService } from '../flightplanning/FlightPlanService';

type ButtonCallback = (value?: string, callback?: VoidCallback) => void;

declare class A320_Neo_CDU_MainDisplay {
  constructor(...args: any[]);

  // Manually entered
  returnPageCallback: () => void;
  flightPlanService?: FlightPlanService;

  MIN_BRIGHTNESS: number;
  MAX_BRIGHTNESS: number;
  minPageUpdateThrottler: any;
  mcduServerConnectUpdateThrottler: any;
  powerCheckUpdateThrottler: any;
  _registered: boolean;
  _title: any;
  _titleLeft: string;
  _pageCurrent: number;
  _pageCount: number;
  _labels: any[];
  _lines: any[];
  _keypad: any;
  scratchpadDisplay: any;
  _scratchpad: any;
  /** @type {Record<'MCDU' | 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS', ScratchpadDataLink>} */
  scratchpads: Record<'MCDU' | 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS', ScratchpadDataLink>;
  _arrows: boolean[];
  annunciators: {
    left: {
      fmgc: boolean;
      fail: boolean;
      mcdu_menu: boolean;
      fm1: boolean;
      ind: boolean;
      rdy: boolean;
      blank: boolean;
      fm2: boolean;
    };
    right: {
      fmgc: boolean;
      fail: boolean;
      mcdu_menu: boolean;
      fm1: boolean;
      ind: boolean;
      rdy: boolean;
      blank: boolean;
      fm2: boolean;
    };
  };
  /** MCDU request flags from subsystems */
  requests: {
    AIDS: boolean;
    ATSU: boolean;
    CFDS: boolean;
    FMGC: boolean;
  };
  _lastAtsuMessageCount: number;
  leftBrightness: number;
  rightBrightness: number;
  onLeftInput: [ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback];
  onRightInput: [ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback, ButtonCallback];
  leftInputDelay: any[];
  rightInputDelay: any[];
  /** @type {'FMGC' | 'ATSU' | 'AIDS' | 'CFDS'} */
  _activeSystem: 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS';
  inFocus: boolean;
  lastInput: number;
  clrStop: boolean;
  allSelected: boolean;
  updateRequest: boolean;
  initB: boolean;
  lastPowerState: any;
  PageTimeout: {
    Fast: number;
    Medium: number;
    Dyn: number;
    Default: number;
    Slow: number;
  };
  fmgcMesssagesListener: any;
  page: {
    SelfPtr: boolean | NodeJS.Timeout;
    Current: number;
    Clear: number;
    AirportsMonitor: number;
    AirwaysFromWaypointPage: number;
    AvailableArrivalsPage: number;
    AvailableArrivalsPageVias: number;
    AvailableDeparturesPage: number;
    AvailableFlightPlanPage: number;
    DataIndexPage1: number;
    DataIndexPage2: number;
    DirectToPage: number;
    FlightPlanPage: number;
    FuelPredPage: number;
    GPSMonitor: number;
    HoldAtPage: number;
    IdentPage: number;
    InitPageA: number;
    InitPageB: number;
    IRSInit: number;
    IRSMonitor: number;
    IRSStatus: number;
    IRSStatusFrozen: number;
    LateralRevisionPage: number;
    MenuPage: number;
    NavaidPage: number;
    NavRadioPage: number;
    NewWaypoint: number;
    PerformancePageTakeoff: number;
    PerformancePageClb: number;
    PerformancePageCrz: number;
    PerformancePageDes: number;
    PerformancePageAppr: number;
    PerformancePageGoAround: number;
    PilotsWaypoint: number;
    PosFrozen: number;
    PositionMonitorPage: number;
    ProgressPage: number;
    ProgressPageReport: number;
    ProgressPagePredictiveGPS: number;
    SelectedNavaids: number;
    SelectWptPage: number;
    VerticalRevisionPage: number;
    WaypointPage: number;
    AOCInit: number;
    AOCInit2: number;
    AOCOfpData: number;
    AOCOfpData2: number;
    AOCMenu: number;
    AOCRequestWeather: number;
    AOCRequestAtis: number;
    AOCDepartRequest: number;
    ATCMenu: number;
    ATCModify: number;
    ATCAtis: number;
    ATCMessageRecord: number;
    ATCMessageMonitoring: number;
    ATCConnection: number;
    ATCNotification: number;
    ATCConnectionStatus: number;
    ATCPositionReport1: number;
    ATCPositionReport2: number;
    ATCPositionReport3: number;
    ATCFlightRequest: number;
    ATCUsualRequest: number;
    ATCGroundRequest: number;
    ATCReports: number;
    ATCEmergency: number;
    ATCComLastId: number;
    ATSUMenu: number;
    ATSUDatalinkStatus: number;
    ClimbWind: number;
    CruiseWind: number;
    DescentWind: number;
    FixInfoPage: number;
    AOCRcvdMsgs: number;
    AOCSentMsgs: number;
    AOCFreeText: number;
    StepAltsPage: number;
    ATCDepartReq: number;
  };
  mcduServerClient: any;
  emptyLines: {
    lines: string[][];
    scratchpad: string;
    title: string;
    titleLeft: string;
    page: string;
    arrows: boolean[];
    annunciators: {
      fmgc: boolean;
      fail: boolean;
      mcdu_menu: boolean;
      fm1: boolean;
      ind: boolean;
      rdy: boolean;
      blank: boolean;
      fm2: boolean;
    };
    displayBrightness: number;
    integralBrightness: number;
  };
  setupFmgcTriggers(): void;
  get templateID(): string;
  get isInteractive(): boolean;
  connectedCallback(): void;
  mcduServerClientEventHandler(event: any): void;
  Init(): void;
  _titleLeftElement: any;
  _titleElement: any;
  _pageCurrentElement: any;
  _pageCountElement: any;
  _labelElements: any[];
  _lineElements: any[];
  setTimeout: (func: any) => void;
  /** The following events remain due to shared use by the keypad and keyboard type entry */
  onLetterInput: (l: any) => any;
  onSp: () => any;
  onDiv: () => any;
  onDot: () => any;
  onClr: () => any;
  onClrHeld: () => any;
  onPlusMinus: (defaultKey?: string) => any;
  onLeftFunction: (f: any) => void;
  onRightFunction: (f: any) => void;
  onOvfy: () => any;
  onUnload: (() => void) | (() => void);
  requestUpdate(): void;
  onUpdate(_deltaTime: any): void;
  /**
   * Updates the MCDU state.
   */
  updateMCDU(): void;
  /**
   * Checks whether INIT page B is open and an engine is being started, if so:
   * The INIT page B reverts to the FUEL PRED page 15 seconds after the first engine start and cannot be accessed after engine start.
   */
  updateInitBFuelPred(): void;
  updateAnnunciators(forceWrite?: boolean): void;
  updateBrightness(): void;
  updateAtsuRequest(): void;
  /**
   * Updates the annunciator light states for one MCDU.
   * @param {'left' | 'right'} side Which MCDU to update.
   * @param {boolean} lightTest Whether ANN LT TEST is active.
   * @param {boolean} powerOn Whether annunciator LED power is available.
   */
  updateAnnunciatorsForSide(side: 'left' | 'right', lightTest: boolean, powerOn: boolean, forceWrite?: boolean): void;
  checkAocTimes(): void;
  _formatCell(str: any): any;
  getTitle(): any;
  setTitle(content: any): void;
  setTitleLeft(content: any): void;
  setPageCurrent(value: any): void;
  setPageCount(value: any): void;
  setLabel(label: any, row: any, col?: number, websocketDraw?: boolean): void;
  /**
   * @param {string|CDU_Field} content
   * @param {number} row
   * @param {number} col
   * @param {boolean} websocketDraw
   */
  setLine(content: string | CDU_Field, row: number, col?: number, websocketDraw?: boolean): void;
  setTemplate(template: any, large?: boolean): void;
  /**
   * Sets what arrows will be displayed in the corner of the screen. Arrows are removed when clearDisplay() is called.
   * @param {boolean} up - whether the up arrow will be displayed
   * @param {boolean} down - whether the down arrow will be displayed
   * @param {boolean} left - whether the left arrow will be displayed
   * @param {boolean} right - whether the right arrow will be displayed
   */
  setArrows(up: boolean, down: boolean, left: boolean, right: boolean): void;
  clearDisplay(webSocketDraw?: boolean): void;
  onPrevPage: () => void;
  onNextPage: () => void;
  pageUpdate: () => void;
  pageRedrawCallback: any;
  onUp: () => void;
  onDown: () => void;
  /**
   * Set the active subsystem
   * @param {'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'} subsystem
   */
  set activeSystem(subsystem: 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS');
  get activeSystem(): 'FMGC' | 'ATSU' | 'AIDS' | 'CFDS';
  set scratchpad(sp: any);
  get scratchpad(): any;
  get mcduScratchpad(): ScratchpadDataLink;
  get fmgcScratchpad(): ScratchpadDataLink;
  get atsuScratchpad(): ScratchpadDataLink;
  get aidsScratchpad(): ScratchpadDataLink;
  get cfdsScratchpad(): ScratchpadDataLink;
  activateMcduScratchpad(): void;
  /**
   * Check if there is an active request from a subsystem to the MCDU
   * @param {'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'} subsystem
   * @returns true if an active request exists
   */
  isSubsystemRequesting(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'): boolean;
  /**
   * Set a request from a subsystem to the MCDU
   * @param {'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'} subsystem
   */
  setRequest(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'): void;
  /**
   * Clear a request from a subsystem to the MCDU
   * @param {'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'} subsystem
   */
  _clearRequest(subsystem: 'AIDS' | 'ATSU' | 'CFDS' | 'FMGC'): void;
  generateHTMLLayout(parent: any): void;
  arrowHorizontal: HTMLSpanElement;
  arrowVertical: HTMLSpanElement;
  setScratchpadUserData(value: any): void;
  clearFocus(): void;
  initKeyboardScratchpad(): void;
  check_focus: number;
  check_clr: number;
  /**
   * Display a type I message on the active subsystem's scratch pad
   * @param message {TypeIMessage}
   */
  setScratchpadMessage(message: TypeIMessage): void;
  setScratchpadText(value: any): void;
  /**
   * Tries to show the MODIFY page if the MCDU is in the ATC COM system
   */
  tryToShowAtcModifyPage(): void;
  /**
   * General ATSU message handler which converts ATSU status codes to new MCDU messages
   * @param code ATSU status code
   */
  addNewAtsuMessage(code: any): void;
  onPowerOn(): void;
  onEvent(_event: any): void;
  onLsk(fncAction: any, fncActionDelay?: () => number): void;
  /**
   * Handle brightness key events
   * @param {'L' | 'R'} side
   * @param {-1 | 1} sign
   */
  onBrightnessKey(side: 'L' | 'R', sign: -1 | 1): void;
  /**
   * Used for switching pages
   * @returns {number} delay in ms between 150 and 200
   */
  getDelaySwitchPage(): number;
  /**
   * Used for basic inputs e.g. alternate airport, ci, fl, temp, constraints, ...
   * @returns {number} delay in ms between 300 and 400
   */
  getDelayBasic(): number;
  /**
   * Used for e.g. loading time fore pages
   * @returns {number} delay in ms between 600 and 800
   */
  getDelayMedium(): number;
  /**
   * Used for intense calculation
   * @returns {number} delay in ms between 900 and 12000
   */
  getDelayHigh(): number;
  /**
   * Used for calculation time for fuel pred page
   * @returns {number} dynamic delay in ms between 2000ms and 4000ms
   */
  getDelayFuelPred(): number;
  /**
   * Used to load wind data into sfms
   * @returns {number} dynamic delay in ms dependent on amount of waypoints
   */
  getDelayWindLoad(): number;
  /**
   * Tries to delete a pages timeout
   */
  tryDeleteTimeout(): void;
  printPage(lines: any): void;
  printing: boolean;
  /**
   * Sends a message to the websocket server (if connected)
   * @param {string} message
   */
  sendToMcduServerClient(message: string): void;
  /**
   * Sends an update to the websocket server (if connected) with the current state of the MCDU
   */
  sendUpdate(): void;
  /**
   * Clears the remote MCDU clients' screens
   */
  sendClearScreen(): void;
  goToFuelPredPage(): void;
}
