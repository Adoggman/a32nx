import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { getISATemp } from '@cdu/model/Util';
import { AtsuStatusCodes } from '@datalink/common';

export class FlightInformation extends CDUSubsystem {
  manuallyEnteredGroundTemp: Celsius | undefined = undefined;
  flightNumber: string | undefined = undefined;
  cruiseFLTemp: Celsius = undefined;
  private tempCurve: Avionics.Curve;

  public get manuallyEnteredTropo() {
    return this.cdu.flightPlanService.active?.performanceData.pilotTropopause;
  }

  setManualTropo(value: number | undefined) {
    this.cdu.flightPlanService.active?.setPerformanceData('pilotTropopause', value);
  }

  public get defaultTropo() {
    return this.cdu.flightPlanService.active?.performanceData?.defaultTropopause;
  }

  public get tropo() {
    return this.manuallyEnteredTropo ?? this.defaultTropo;
  }

  public get costIndex() {
    return this.cdu.flightPlanService.active?.performanceData.costIndex;
  }

  setCostIndex(value: number | undefined) {
    this.cdu.flightPlanService.active?.setPerformanceData('costIndex', value);
  }

  public get defaultCrzFLTemp() {
    return this.tempCurve.evaluate(this.cruiseLevel);
  }

  public get defaultGroundTemp() {
    return getISATemp(this.cdu.flightPlanService.active?.originAirport.location.alt);
  }

  public get cruiseLevel() {
    return this.cdu.flightPlanService.active?.performanceData.cruiseFlightLevel;
  }

  setCruiseLevel(level: number) {
    if (
      SimVar.GetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool') === 1 &&
      SimVar.GetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool') === 1
    ) {
      SimVar.SetSimVarValue('L:A32NX_NEW_CRZ_ALT', 'number', level);
    } else {
      SimVar.SetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool', 1);
    }

    this.cdu.flightPlanService.active?.setPerformanceData('cruiseFlightLevel', level);
    this.cdu.flightPhaseManager.handleNewCruiseAltitudeEntered(level);
  }

  public get origin() {
    return this.cdu.flightPlanService.active?.originAirport;
  }

  public get destination() {
    return this.cdu.flightPlanService.active?.destinationAirport;
  }

  public get alternate() {
    return this.cdu.flightPlanService.active?.alternateDestinationAirport;
  }

  public get flightPlanMatchesSimbrief() {
    return (
      this.origin &&
      this.destination &&
      this.cdu.Simbrief.Data?.origin.icao === this.origin.ident &&
      this.cdu.Simbrief.Data?.destination.icao === this.destination.ident
    );
  }

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Flight Information subsystem`);
    this.initTempCurve();
  }

  clearFlightNumber() {
    this.flightNumber = undefined;
    SimVar.SetSimVarValue('ATC FLIGHT NUMBER', 'string', '', 'FMC');
    SimVar.SetSimVarValue('L:A32NX_MCDU_FLT_NO_SET', 'boolean', 0);
  }

  setFlightNumber(flightNum: string) {
    if (!flightNum || flightNum.length > 7) {
      throw new Error('Flight number must be 1-7 characters long');
    }

    this.flightNumber = flightNum;
    SimVar.SetSimVarValue('ATC FLIGHT NUMBER', 'string', flightNum, 'FMC');
    SimVar.SetSimVarValue('L:A32NX_MCDU_FLT_NO_SET', 'boolean', 1);

    this.cdu.ATSU.fmsClient.connectToNetworks(flightNum).then((errCode) => {
      if (errCode !== AtsuStatusCodes.Ok) {
        this.cdu.ATSU.addNewAtsuMessage(errCode);
      }
    });
  }

  initTempCurve() {
    this.tempCurve = new Avionics.Curve();
    this.tempCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
    this.tempCurve.add(-10 * 3.28084, 21.5);
    this.tempCurve.add(0, 15.0);
    this.tempCurve.add(10 * 3.28084, 8.5);
    this.tempCurve.add(20 * 3.28084, 2.0);
    this.tempCurve.add(30 * 3.28084, -4.49);
    this.tempCurve.add(40 * 3.28084, -10.98);
    this.tempCurve.add(50 * 3.28084, -17.47);
    this.tempCurve.add(60 * 3.28084, -23.96);
    this.tempCurve.add(70 * 3.28084, -30.45);
    this.tempCurve.add(80 * 3.28084, -36.94);
    this.tempCurve.add(90 * 3.28084, -43.42);
    this.tempCurve.add(100 * 3.28084, -49.9);
    this.tempCurve.add(150 * 3.28084, -56.5);
    this.tempCurve.add(200 * 3.28084, -56.5);
    this.tempCurve.add(250 * 3.28084, -51.6);
    this.tempCurve.add(300 * 3.28084, -46.64);
    this.tempCurve.add(400 * 3.28084, -22.8);
    this.tempCurve.add(500 * 3.28084, -2.5);
    this.tempCurve.add(600 * 3.28084, -26.13);
    this.tempCurve.add(700 * 3.28084, -53.57);
    this.tempCurve.add(800 * 3.28084, -74.51);
  }

  onFlightPlanUplinked() {
    this.flightNumber = this.cdu.Simbrief.Data.airline + this.cdu.Simbrief.Data.flightNumber;
  }
}
