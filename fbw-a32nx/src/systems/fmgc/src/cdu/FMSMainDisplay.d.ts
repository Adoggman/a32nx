declare class FMCMainDisplay {
  /**
   * Rounds a number to the nearest multiple
   * @param {number | undefined | null} n the number to round
   * @param {number} r the multiple
   * @returns {number | undefined | null} n rounded to the nereast multiple of r, or null/undefined if n is null/undefined
   */
  static round(n: number | undefined | null, r?: number): number | undefined | null;
  static secondsToUTC(seconds: any): string;
  static secondsTohhmm(seconds: any): string;
  static minuteToSeconds(minutes: any): number;
  static hhmmToSeconds(hhmm: any): number;
  static clrValue: string;
  static ovfyValue: string;
  static _AvailableKeys: string;
  /**
   * Computes hour and minutes when given minutes
   * @param {number} minutes - minutes used to make the conversion
   * @returns {string} A string in the format "HHMM" e.g "0235"
   */
  static minutesTohhmm(minutes: number): string;
  /**
   * computes minutes when given hour and minutes
   * @param {string} hhmm - string used to make the conversion
   * @returns {number} numbers in minutes form
   */
  static hhmmToMinutes(hhmm: string): number;
  constructor(...args: any[]);
  flightPhaseUpdateThrottler: any;
  fmsUpdateThrottler: any;
  _progBrgDistUpdateThrottler: any;
  _apCooldown: number;
  lastFlightPlanVersion: number;
  _messageQueue: any;
  /** Declaration of every variable used (NOT initialization) */
  maxCruiseFL: number;
  recMaxCruiseFL: number;
  routeIndex: number;
  coRoute: {
    routeNumber: any;
    routes: any;
  };
  perfTOTemp: number;
  _overridenFlapApproachSpeed: number;
  _overridenSlatApproachSpeed: number;
  _routeFinalFuelWeight: any;
  _routeFinalFuelTime: any;
  _routeFinalFuelTimeDefault: number;
  _routeReservedWeight: any;
  _routeReservedPercent: number;
  takeOffWeight: number;
  landingWeight: number;
  averageWind: number;
  perfApprQNH: number;
  perfApprTemp: number;
  perfApprWindHeading: number;
  perfApprWindSpeed: any;
  unconfirmedV1Speed: any;
  unconfirmedVRSpeed: any;
  unconfirmedV2Speed: any;
  _toFlexChecked: boolean;
  toRunway: any;
  vApp: number;
  perfApprMDA: number;
  perfApprDH: string | number;
  perfApprFlaps3: any;
  _debug: number;
  _checkFlightPlan: number;
  _windDirections: {
    TAILWIND: string;
    HEADWIND: string;
  };
  _fuelPlanningPhases: {
    PLANNING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
  };
  _zeroFuelWeightZFWCGEntered: boolean;
  _taxiEntered: boolean;
  _windDir: string;
  _DistanceToAlt: any;
  _routeAltFuelWeight: any;
  _routeAltFuelTime: any;
  _routeTripFuelWeight: any;
  _routeTripTime: any;
  _defaultTaxiFuelWeight: number;
  _rteRsvPercentOOR: boolean;
  _rteReservedWeightEntered: boolean;
  _rteReservedPctEntered: boolean;
  _rteFinalCoeffecient: number;
  _rteFinalWeightEntered: boolean;
  _rteFinalTimeEntered: boolean;
  _routeAltFuelEntered: boolean;
  _minDestFob: any;
  _minDestFobEntered: boolean;
  _isBelowMinDestFob: boolean;
  _defaultRouteFinalTime: number;
  _fuelPredDone: boolean;
  _fuelPlanningPhase: any;
  _blockFuelEntered: boolean;
  _initMessageSettable: boolean;
  _checkWeightSettable: boolean;
  _gwInitDisplayed: number;
  _destDataChecked: boolean;
  _towerHeadwind: any;
  _EfobBelowMinClr: boolean;
  simbrief: {
    route: string;
    cruiseAltitude: string;
    originIcao: string;
    destinationIcao: string;
    blockFuel: string;
    paxCount: string;
    cargo: any;
    payload: any;
    estZfw: string;
    sendStatus: string;
    costIndex: string;
    navlog: any[];
    callsign: string;
    alternateIcao: string;
    avgTropopause: string;
    ete: string;
    blockTime: string;
    outTime: string;
    onTime: string;
    inTime: string;
    offTime: string;
    taxiFuel: string;
    tripFuel: string;
  };
  aocWeight: {
    blockFuel: any;
    estZfw: any;
    taxiFuel: any;
    tripFuel: any;
    payload: any;
  };
  aocTimes: {
    doors: number;
    off: number;
    out: number;
    on: number;
    in: number;
  };
  winds: {
    climb: any[];
    cruise: any[];
    des: any[];
    alternate: any;
  };
  computedVgd: any;
  computedVfs: any;
  computedVss: any;
  computedVls: any;
  approachSpeeds: any;
  _cruiseEntered: boolean;
  constraintAlt: any;
  fcuSelAlt: number;
  _forceNextAltitudeUpdate: boolean;
  _lastUpdateAPTime: number;
  updateAutopilotCooldown: number;
  _lastHasReachFlex: any;
  _apMasterStatus: any;
  _lastRequestedFLCModeWaypointIndex: any;
  _progBrgDist: {
    icao: string;
    ident: string;
    coordinates: LatLongAlt;
    bearing: number;
    distance: number;
  };
  preSelectedClbSpeed: number;
  preSelectedCrzSpeed: number;
  managedSpeedTarget: any;
  managedSpeedTargetIsMach: any;
  climbSpeedLimit: number;
  climbSpeedLimitAlt: number;
  climbSpeedLimitPilot: boolean;
  descentSpeedLimit: number;
  descentSpeedLimitAlt: number;
  descentSpeedLimitPilot: boolean;
  managedSpeedClimb: number;
  managedSpeedClimbIsPilotEntered: boolean;
  managedSpeedClimbMach: number;
  managedSpeedCruise: number;
  managedSpeedCruiseIsPilotEntered: boolean;
  managedSpeedCruiseMach: number;
  managedSpeedDescend: number;
  managedSpeedDescendPilot: number;
  managedSpeedDescendMach: number;
  managedSpeedDescendMachPilot: number;
  cruiseFlightLevelTimeOut: number;
  /** @type {0 | 1 | 2 | 3 | null} Takeoff config entered on PERF TO */
  flaps: 0 | 1 | 2 | 3 | null;
  ths: any;
  cruiseTemperature: number;
  taxiFuelWeight: any;
  blockFuel: any;
  zeroFuelWeight: any;
  zeroFuelWeightMassCenter: number;
  activeWpIdx: any;
  efisSymbols: any;
  groundTempAuto: any;
  groundTempPilot: number;
  /**
   * Landing elevation in feet MSL.
   * This is the destination runway threshold elevation, or airport elevation if runway is not selected.
   */
  landingElevation: any;
  destinationLatitude: any;
  destinationLongitude: any;
  /** Speed in KCAS when the first engine failed during takeoff */
  takeoffEngineOutSpeed: any;
  checkSpeedModeMessageActive: boolean;
  perfClbPredToAltitudePilot: number;
  perfDesPredToAltitudePilot: number;
  atsu: any;
  holdSpeedTarget: any;
  holdIndex: any;
  holdDecelReached: any;
  setHoldSpeedMessageActive: boolean;
  managedProfile: Map<any, any>;
  speedLimitExceeded: boolean;
  toSpeedsNotInserted: boolean;
  toSpeedsTooLow: boolean;
  vSpeedDisagree: boolean;
  onAirport: () => void;
  arincDiscreteWord2: FmArinc429OutputWord;
  arincDiscreteWord3: FmArinc429OutputWord;
  arincTakeoffPitchTrim: FmArinc429OutputWord;
  arincLandingElevation: FmArinc429OutputWord;
  arincDestinationLatitude: FmArinc429OutputWord;
  arincDestinationLongitude: FmArinc429OutputWord;
  arincMDA: FmArinc429OutputWord;
  arincDH: FmArinc429OutputWord;
  arincThrustReductionAltitude: FmArinc429OutputWord;
  arincAccelerationAltitude: FmArinc429OutputWord;
  arincEoAccelerationAltitude: FmArinc429OutputWord;
  arincMissedThrustReductionAltitude: FmArinc429OutputWord;
  arincMissedAccelerationAltitude: FmArinc429OutputWord;
  arincMissedEoAccelerationAltitude: FmArinc429OutputWord;
  arincTransitionAltitude: FmArinc429OutputWord;
  arincTransitionLevel: FmArinc429OutputWord;
  /** contains fm messages (not yet implemented) and nodh bit */
  arincEisWord2: FmArinc429OutputWord;
  /** These arinc words will be automatically written to the bus, and automatically set to 0/NCD when the FMS resets */
  arincBusOutputs: FmArinc429OutputWord[];
  navDbIdent: any;
  Init(): void;
  A32NXCore: any;
  dataManager: any;
  efisInterfaces: {
    L: any;
    R: any;
  };
  guidanceController: any;
  navigation: any;
  tempCurve: any;
  casToMachManualCrossoverCurve: any;
  machToCasManualCrossoverCurve: any;
  initVariables(resetTakeoffData?: boolean): void;
  set costIndex(ci: any);
  get costIndex(): any;
  set tropo(tropo: any);
  get tropo(): any;
  _activeCruiseFlightLevelDefaulToFcu: boolean;
  paxStations: any;
  payloadStations: any;
  set flightNumber(flightNumber: any);
  get flightNumber(): any;
  onUpdate(_deltaTime: any): void;
  onFmPowerStateChanged(newState: any): void;
  switchNavDatabase(): Promise<void>;
  /**
   * This method is called by the FlightPhaseManager after a flight phase change
   * This method initializes AP States, initiates CDUPerformancePage changes and other set other required states
   * @param prevPhase {FmgcFlightPhases} Previous FmgcFlightPhase
   * @param nextPhase {FmgcFlightPhases} New FmgcFlightPhase
   */
  onFlightPhaseChanged(prevPhase: FmgcFlightPhases, nextPhase: FmgcFlightPhases): void;
  set cruiseLevel(level: any);
  get cruiseLevel(): any;
  triggerCheckSpeedModeMessage(preselectedSpeed: any): void;
  clearCheckSpeedModeMessage(): void;
  /** FIXME these functions are in the new VNAV but not in this branch, remove when able */
  /**
   *
   * @param {Feet} alt geopotential altitude
   * @returns °C
   */
  getIsaTemp(alt: Feet): number;
  /**
   *
   * @param {Feet} alt geopotential altitude
   * @param {Degrees} isaDev temperature deviation from ISA conditions
   * @returns °C
   */
  getTemp(alt: Feet, isaDev?: Degrees): any;
  /**
   *
   * @param {Feet} alt geopotential altitude
   * @param {Degrees} isaDev temperature deviation from ISA conditions
   * @returns hPa
   */
  getPressure(alt: Feet, isaDev?: Degrees): number;
  getPressureAltAtElevation(elev: any, qnh?: number): any;
  getPressureAlt(): any;
  getBaroCorrection1(): any;
  /**
   * @returns {Degrees} temperature deviation from ISA conditions
   */
  getIsaDeviation(): Degrees;
  /** FIXME ^these functions are in the new VNAV but not in this branch, remove when able */
  calculateDecelDist(fromSpeed: any, toSpeed: any): number;
  getHoldingSpeed(speedConstraint?: any, altitude?: any): number;
  updateHoldingSpeed(): void;
  getManagedTargets(v: any, m: any): any[];
  updateManagedSpeeds(): void;
  updateManagedSpeed(): void;
  activatePreSelSpeedMach(preSel: any): void;
  updatePreSelSpeedMach(preSel: any): void;
  checkSpeedLimit(): void;
  updateAutopilot(): void;
  /**
   * Updates performance speeds such as GD, F, S, Vls and approach speeds
   */
  updatePerfSpeeds(): void;
  updateConstraints(): void;
  getSpeedConstraint(): any;
  getNavModeSpeedConstraint(): any;
  updateManagedProfile(): void;
  updateDestinationData(): Promise<void>;
  updateMinimums(): void;
  shouldTransmitMinimums(): boolean;
  getClbManagedSpeedFromCostIndex(): number;
  getCrzManagedSpeedFromCostIndex(): number;
  getDesManagedSpeedFromCostIndex(): number;
  getAppManagedSpeed(): any;
  onPowerOn(): void;
  onEvent(_event: any): void;
  _onModeSelectedHeading(): void;
  _onModeManagedHeading(): void;
  _onModeSelectedAltitude(): void;
  _onModeManagedAltitude(): void;
  _onStepClimbDescent(): void;
  deleteOutdatedCruiseSteps(oldCruiseLevel: any, newCruiseLevel: any): void;
  /***
   * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
   * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
   * @private
   */
  private _onTrySetCruiseFlightLevel;
  checkDestData(): void;
  checkGWParams(): void;
  setCruiseFlightLevelAndTemperature(input: any): boolean;
  tryUpdateCostIndex(costIndex: any): boolean;
  /**
   * Any tropopause altitude up to 60,000 ft is able to be entered
   * @param {string} tropo Format: NNNN or NNNNN Leading 0’s must be included. Entry is rounded to the nearest 10 ft
   * @return {boolean} Whether tropopause could be set or not
   */
  tryUpdateTropo(tropo: string): boolean;
  resetCoroute(): void;
  /** MCDU Init page method for FROM/TO, NOT for programmatic use */
  tryUpdateFromTo(fromTo: any, callback?: any): any;
  /**
   * Programmatic method to set from/to
   * @param {string} from 4-letter icao code for origin airport
   * @param {string} to 4-letter icao code for destination airport
   * @throws NXSystemMessage on error (you are responsible for pushing to the scratchpad if appropriate)
   */
  setFromTo(from: string, to: string): Promise<any>;
  /**
   * Computes distance between destination and alternate destination
   */
  tryUpdateDistanceToAlt(): void;
  isAltFuelInRange(fuel: any): boolean;
  trySetRouteAlternateFuel(altFuel: any): Promise<boolean>;
  trySetMinDestFob(fuel: any): Promise<boolean>;
  tryUpdateAltDestination(altDestIdent: any): Promise<boolean>;
  /**
   * Updates the Fuel weight cell to tons. Uses a place holder FL120 for 30 min
   */
  tryUpdateRouteFinalFuel(): void;
  /**
   * Updates the alternate fuel and time values using a place holder FL of 330 until that can be set
   */
  tryUpdateRouteAlternate(): void;
  /**
   * Attempts to calculate trip information. Is dynamic in that it will use liveDistanceTo the destination rather than a
   * static distance. Works down to 20NM airDistance and FL100 Up to 3100NM airDistance and FL390, anything out of those ranges and values
   * won't be updated.
   */
  tryUpdateRouteTrip(dynamic?: boolean): void;
  tryUpdateMinDestFob(): void;
  tryUpdateTOW(): void;
  tryUpdateLW(): void;
  /**
   * Computes extra fuel
   * @param {boolean}useFOB - States whether to use the FOB rather than block fuel when computing extra fuel
   * @returns {number}
   */
  tryGetExtraFuel(useFOB?: boolean): number;
  /**getRouteReservedWeight
   * EXPERIMENTAL
   * Attempts to calculate the extra time
   */
  tryGetExtraTime(useFOB?: boolean): number;
  getRouteAltFuelWeight(): any;
  getRouteAltFuelTime(): any;
  updateIlsCourse(): Promise<any>;
  updateFlightNo(flightNo: any, callback?: any): any;
  flightNo: string;
  updateCoRoute(coRouteNum: any, callback?: any): Promise<any>;
  getCoRouteList(): Promise<void>;
  getTotalTripTime(): any;
  getTotalTripFuelCons(): any;
  onUplinkInProgress(): void;
  onUplinkDone(): void;
  /**
     @param items {Array.<import('msfs-navdata').DatabaseItem>}
     */
  deduplicateFacilities(items: Array<any>): any;
  /**
   * Shows a scratchpad message based on the FMS error thrown
   * @param type
   */
  showFmsErrorMessage(type: any): void;
  createNewWaypoint(ident: any): Promise<any>;
  createLatLonWaypoint(coordinates: any, stored: any, ident?: any): any;
  createPlaceBearingPlaceBearingWaypoint(
    place1: any,
    bearing1: any,
    place2: any,
    bearing2: any,
    stored: any,
    ident?: any,
  ): any;
  createPlaceBearingDistWaypoint(place: any, bearing: any, distance: any, stored: any, ident?: any): any;
  getStoredWaypointsByIdent(ident: any): any;
  _getOrSelectWaypoints(getter: any, ident: any, callback: any): void;
  getOrSelectILSsByIdent(ident: any, callback: any): void;
  getOrSelectVORsByIdent(ident: any, callback: any): void;
  getOrSelectNDBsByIdent(ident: any, callback: any): void;
  getOrSelectNavaidsByIdent(ident: any, callback: any): void;
  /**
   * This function only finds waypoints, not navaids. Some fixes may exist as a VOR and a waypoint in the database, this will only return the waypoint.
   * Use @see Fmgc.WaypointEntryUtils.getOrCreateWaypoint instead if you don't want that
   * @param {*} ident
   * @param {*} callback
   */
  getOrSelectWaypointByIdent(ident: any, callback: any): void;
  insertWaypoint(
    newWaypointTo: any,
    fpIndex: any,
    forAlternate: any,
    index: any,
    before: boolean,
    callback: any,
    bypassTmpy: any,
  ): any;
  toggleWaypointOverfly(index: any, fpIndex: any, forAlternate: any, callback?: any): any;
  eraseTemporaryFlightPlan(callback?: any): void;
  insertTemporaryFlightPlan(callback?: any): void;
  checkCostIndex(oldCostIndex: any): void;
  checkDestination(oldDestination: any): void;
  checkCruiseLevel(oldCruiseLevel: any): void;
  waypointType(mcdu: any, waypoint: any): Promise<any>;
  vSpeedsValid(): boolean;
  /**
   * Gets the departure runway elevation in feet, if available.
   * @returns departure runway elevation in feet, or null if not available.
   */
  getDepartureElevation(): any;
  /**
   * Gets the gross weight, if available.
   * Prior to engine start this is based on ZFW + Fuel entries,
   * after engine start ZFW entry + FQI FoB.
   * @returns {number | null} gross weight in tons or null if not available.
   */
  getGrossWeight(): number | null;
  getToSpeedsTooLow(): boolean;
  toSpeedsChecks(): void;
  set v1Speed(speed: any);
  get v1Speed(): any;
  set vRSpeed(speed: any);
  get vRSpeed(): any;
  set v2Speed(speed: any);
  get v2Speed(): any;
  trySetV1Speed(s: any): boolean;
  trySetVRSpeed(s: any): boolean;
  trySetV2Speed(s: any): boolean;
  trySetTakeOffTransAltitude(s: any): boolean;
  trySetThrustReductionAccelerationAltitude(s: any): Promise<boolean>;
  trySetEngineOutAcceleration(s: any): Promise<boolean>;
  trySetThrustReductionAccelerationAltitudeGoaround(s: any): Promise<boolean>;
  trySetEngineOutAccelerationAltitudeGoaround(s: any): Promise<boolean>;
  thrustReductionAccelerationChecks(): void;
  updateThrustReductionAcceleration(): void;
  updateTransitionAltitudeLevel(): void;
  setPerfTOFlexTemp(s: any): boolean;
  /**
   * Attempts to predict required block fuel for trip
   * @returns {boolean}
   */
  tryFuelPlanning(): boolean;
  trySetTaxiFuelWeight(s: any): boolean;
  getRouteFinalFuelWeight(): any;
  getRouteFinalFuelTime(): any;
  /**
   * This method is used to set initial Final Time for when INIT B is making predictions
   * @param {String} s - containing time value
   * @returns {boolean}
   */
  trySetRouteFinalTime(s: string): boolean;
  /**
   *
   * @param {string} s
   * @returns {Promise<boolean>}
   */
  trySetRouteFinalFuel(s: string): Promise<boolean>;
  getRouteReservedWeight(): any;
  getRouteReservedPercent(): number;
  trySetRouteReservedPercent(s: any): boolean;
  /**
   * Checks input and passes to trySetCruiseFl()
   * @param input
   * @returns {boolean} input passed checks
   */
  trySetCruiseFlCheckInput(input: any): boolean;
  /**
   * Sets new Cruise FL if all conditions good
   * @param fl {number} Altitude or FL
   * @returns {boolean} input passed checks
   */
  trySetCruiseFl(fl: number): boolean;
  onUpdateCruiseLevel(newCruiseLevel: any): void;
  trySetRouteReservedFuel(s: any): boolean;
  trySetZeroFuelWeightZFWCG(s: any): boolean;
  /**
   *
   * @returns {number} Returns estimated fuel on board when arriving at the destination
   */
  getDestEFOB(useFOB?: boolean): number;
  /**
   * @returns {number} Returns EFOB when arriving at the alternate dest
   */
  getAltEFOB(useFOB?: boolean): number;
  trySetBlockFuel(s: any): boolean;
  trySetAverageWind(s: any): Promise<boolean>;
  trySetPreSelectedClimbSpeed(s: any): boolean;
  trySetPreSelectedCruiseSpeed(s: any): boolean;
  setPerfApprQNH(s: any): boolean;
  setPerfApprTemp(s: any): boolean;
  setPerfApprWind(s: any): boolean;
  setPerfApprTransAlt(s: any): boolean;
  /**
   * VApp for _selected_ landing config
   */
  getVApp(): any;
  /**
   * VApp for _selected_ landing config with GSMini correction
   */
  getVAppGsMini(): any;
  setPerfApprVApp(s: any): boolean;
  /**
   * Tries to estimate the landing weight at destination
   * NaN on failure
   */
  tryEstimateLandingWeight(): any;
  setPerfApprMDA(s: any): boolean;
  setPerfApprDH(s: any): boolean;
  setPerfApprFlaps3(s: any): void;
  /** @param {string} icao ID of the navaid to de-select */
  deselectNavaid(icao: string): void;
  reselectNavaid(icao: any): void;
  /** @returns {string[]} icaos of deselected navaids */
  get deselectedNavaids(): string[];
  getVorTuningData(index: any): any;
  /**
   * Set a manually tuned VOR
   * @param {1 | 2} index
   * @param {RawVor | number | null} facilityOrFrequency null to clear
   */
  setManualVor(index: 1 | 2, facilityOrFrequency: RawVor | number | null): any;
  /**
   * Set a VOR course
   * @param {1 | 2} index
   * @param {number | null} course null to clear
   */
  setVorCourse(index: 1 | 2, course: number | null): any;
  getMmrTuningData(index: any): any;
  /**
   * Set a manually tuned ILS
   * @param {RawVor | number | null} facilityOrFrequency null to clear
   */
  setManualIls(facilityOrFrequency: RawVor | number | null): Promise<any>;
  /**
   * Set an ILS course
   * @param {number | null} course null to clear
   * @param {boolean} backcourse Whether the course is a backcourse/backbeam.
   */
  setIlsCourse(course: number | null, backcourse?: boolean): any;
  getAdfTuningData(index: any): any;
  /**
   * Set a manually tuned NDB
   * @param {1 | 2} index
   * @param {RawNdb | number | null} facilityOrFrequency null to clear
   */
  setManualAdf(index: 1 | 2, facilityOrFrequency: RawNdb | number | null): any;
  isMmrTuningLocked(): any;
  isFmTuningActive(): any;
  /**
   * Get the currently selected navaids
   * @returns {SelectedNavaid[]}
   */
  getSelectedNavaids(): SelectedNavaid[];
  updateFuelVars(): void;
  /**
   * Set the takeoff flap config
   * @param {0 | 1 | 2 | 3 | null} flaps
   */
  setTakeoffFlaps(flaps: 0 | 1 | 2 | 3 | null): void;
  /**
   * Set the takeoff trim config
   * @param {number | null} ths
   */
  setTakeoffTrim(ths: number | null): void;
  trySetFlapsTHS(s: any): boolean;
  checkEFOBBelowMin(): void;
  updateTowerHeadwind(): void;
  /**
   * Called after Flaps or THS change
   */
  tryCheckToData(): void;
  /**
   * Called after runway change
   * - Sets confirmation prompt state for every entry whether it is defined or not
   * - Adds message when at least one entry needs to be confirmed
   * Additional:
   *   Only prompt the confirmation of FLEX TEMP when the TO runway was changed, not on initial insertion of the runway
   */
  onToRwyChanged(): void;
  /**
   * Switches to the next/new perf page (if new flight phase is in order) or reloads the current page
   * @param _old {FmgcFlightPhases}
   * @param _new {FmgcFlightPhases}
   */
  tryUpdatePerfPage(_old: FmgcFlightPhases, _new: FmgcFlightPhases): void;
  routeReservedEntered(): boolean;
  routeFinalEntered(): boolean;
  /**
   * Set the progress page bearing/dist location
   * @param {string} ident ident of the waypoint or runway, will be replaced by "ENTRY" if brg/dist offset are specified
   * @param {LatLongAlt} coordinates co-ordinates of the waypoint/navaid/runway, without brg/dist offset
   * @param {string?} icao icao database id of the waypoint if applicable
   */
  _setProgLocation(ident: string, coordinates: LatLongAlt, icao: string | null): void;
  /**
   * Try to set the progress page bearing/dist waypoint/location
   * @param {String} s scratchpad entry
   * @param {Function} callback callback taking boolean arg for success/failure
   */
  trySetProgWaypoint(s: string, callback?: Function): any;
  /**
   * Recalculate the bearing and distance for progress page
   */
  updateProgDistance(): void;
  get progBearing(): number;
  get progDistance(): number;
  get progWaypointIdent(): string;
  /**
   * @param wpt {import('msfs-navdata').Waypoint}
   */
  isWaypointInUse(wpt: any): any;
  setGroundTempFromOrigin(): void;
  trySetGroundTemp(scratchpadValue: any): void;
  get groundTemp(): any;
  navModeEngaged(): boolean;
  /**
   * Add type 2 message to fmgc message queue
   * @param _message {TypeIIMessage} MessageObject
   * @param _isResolvedOverride {function(*)} Function that determines if the error is resolved at this moment (type II only).
   * @param _onClearOverride {function(*)} Function that executes when the error is actively cleared by the pilot (type II only).
   */
  addMessageToQueue(
    _message: TypeIIMessage,
    _isResolvedOverride?: (arg0: any) => any,
    _onClearOverride?: (arg0: any) => any,
  ): void;
  /**
   * Removes a message from the queue
   * @param value {String}
   */
  removeMessageFromQueue(value: string): void;
  updateMessageQueue(): void;
  /**
   * Generic function which returns true if engine(index) is ON (N2 > 20)
   * @returns {boolean}
   */
  isEngineOn(index: any): boolean;
  /**
   * Returns true if any one engine is running (N2 > 20)
   * @returns {boolean}
   */
  isAnEngineOn(): boolean;
  /**
   * Returns true only if all engines are running (N2 > 20)
   * @returns {boolean}
   */
  isAllEngineOn(): boolean;
  isOnGround(): boolean;
  isFlying(): boolean;
  /**
   * Returns the maximum cruise FL for ISA temp and GW
   * @param temp {number} ISA in C°
   * @param gw {number} GW in t
   * @returns {number} MAX FL
   */
  getMaxFL(temp?: number, gw?: number): number;
  /**
   * Returns the maximum allowed cruise FL considering max service FL
   * @param fl {number} FL to check
   * @returns {number} maximum allowed cruise FL
   */
  getMaxFlCorrected(fl?: number): number;
  isMinDestFobInRange(fuel: any): boolean;
  isTaxiFuelInRange(taxi: any): boolean;
  isFinalFuelInRange(fuel: any): boolean;
  isFinalTimeInRange(time: any): boolean;
  isRteRsvFuelInRange(fuel: any): boolean;
  isRteRsvPercentInRange(value: any): boolean;
  isZFWInRange(zfw: any): boolean;
  isZFWCGInRange(zfwcg: any): boolean;
  isBlockFuelInRange(fuel: any): boolean;
  /**
   *
   * @returns {*}
   */
  getFOB(): any;
  /**
   * retrieves GW in Tons
   * @returns {number}
   */
  getGW(): number;
  getCG(): number;
  isAirspeedManaged(): boolean;
  isHeadingManaged(): boolean;
  isAltitudeManaged(): boolean;
  /**
   * Check if the given string represents a decimal number.
   * This may be a whole number or a number with one or more decimals.
   * If the leading digit is 0 and one or more decimals are given, the leading digit may be omitted.
   * @param str {string} String to check
   * @returns {bool} True if str represents a decimal value, otherwise false
   */
  representsDecimalNumber(str: string): bool;
  getZeroFuelWeight(): number;
  getV2Speed(): any;
  getTropoPause(): any;
  getManagedClimbSpeed(): number;
  getManagedClimbSpeedMach(): number;
  getManagedCruiseSpeed(): number;
  getManagedCruiseSpeedMach(): number;
  getAccelerationAltitude(): any;
  getThrustReductionAltitude(): any;
  getOriginTransitionAltitude(): any;
  getDestinationTransitionLevel(): any;
  get isCostIndexSet(): boolean;
  get isTropoPilotEntered(): any;
  getFlightPhase(): any;
  getClimbSpeedLimit(): {
    speed: number;
    underAltitude: number;
  };
  getDescentSpeedLimit(): {
    speed: number;
    underAltitude: number;
  };
  getPreSelectedClbSpeed(): number;
  getPreSelectedCruiseSpeed(): number;
  getTakeoffFlapsSetting(): 0 | 1 | 2 | 3;
  getManagedDescentSpeed(): number;
  getManagedDescentSpeedMach(): number;
  getApproachSpeed(): any;
  getFlapRetractionSpeed(): any;
  getSlatRetractionSpeed(): any;
  getCleanSpeed(): any;
  getTripWind(): number;
  getWinds(): {
    climb: any[];
    cruise: any[];
    des: any[];
    alternate: any;
  };
  getApproachWind(): {
    direction: any;
    speed: any;
  };
  getApproachQnh(): number;
  getApproachTemperature(): number;
  getDestinationElevation(): any;
  trySetManagedDescentSpeed(value: any): boolean;
  trySetPerfClbPredToAltitude(value: any): boolean;
  trySetPerfDesPredToAltitude(value: any): boolean;
  updatePerfPageAltPredictions(): void;
  computeManualCrossoverAltitude(mach: any): number;
  getActivePlanLegCount(): any;
  getDistanceToDestination(): any;
  /**
   * Modifies the active flight plan to go direct to a specific waypoint, not necessarily in the flight plan
   * @param {import('msfs-navdata').Waypoint} waypoint
   * @param radial: false | Degrees
   */
  directToWaypoint(waypoint: any, radial?: false | Degrees): Promise<void>;
  /**
   * Modifies the active flight plan to go direct to a specific leg
   * @param {number} legIndex index of leg to go direct to
   */
  directToLeg(legIndex: number): Promise<void>;
  /**
   * Gets the navigation database ident (including cycle info).
   * @returns {import('msfs-navdata').DatabaseIdent | null}.
   */
  getNavDatabaseIdent(): any | null;
}
declare const FlightPlans: Readonly<{
  Active: 0;
  Temporary: 1;
}>;
declare class FmArinc429OutputWord {
  static empty(name: any): FmArinc429OutputWord;
  constructor(name: any, value?: number);
  name: any;
  dirty: boolean;
  _value: number;
  _ssm: number;
  set value(value: number);
  get value(): number;
  set ssm(ssm: number);
  get ssm(): number;
  writeToSimVarIfDirty(): Promise<any>;
  setBnrValue(value: any, ssm: any, bits: any, rangeMax: any, rangeMin?: number): void;
}
