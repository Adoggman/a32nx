import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { getISATemp } from '@cdu/model/Util';
import { AtsuStatusCodes } from '@datalink/common';

export class FlightInformation extends CDUSubsystem {
  manuallyEnteredGroundTemp: number | undefined = undefined;
  flightNumber: string | undefined = undefined;
  tempCurve: Avionics.Curve;

  manuallyEnteredTropo: Feet = undefined;
  crzFlTemp: Celsius = undefined;
  costIndex: string = undefined;

  public get tropo() {
    return this.cdu.flightPlanService.active?.performanceData?.tropopause;
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

  public get origin() {
    return this.cdu.flightPlanService.active?.originAirport;
  }

  public get destination() {
    return this.cdu.flightPlanService.active?.destinationAirport;
  }

  public get alternate() {
    return this.cdu.flightPlanService.active?.alternateDestinationAirport;
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
    this.costIndex = this.cdu.Simbrief.Data.costIndex;
    this.flightNumber = this.cdu.Simbrief.Data.airline + this.cdu.Simbrief.Data.flightNumber;
  }
}
