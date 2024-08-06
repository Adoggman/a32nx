import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { getISATemp } from '@cdu/model/Util';

export class FlightInformation extends CDUSubsystem {
  originGroundTemp: number | undefined = undefined;
  flightNumber: string | undefined = undefined;
  tempCurve: Avionics.Curve;

  public get tropo() {
    return this.cdu.flightPlanService.active?.performanceData?.tropopause;
  }

  public get crzFL() {
    return this.cdu.flightPlanService.active?.performanceData?.cruiseFlightLevel;
  }

  public get crzFLTemp() {
    return this.tempCurve.evaluate(this.crzFL);
  }

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Flight Information subsystem`);
    this.initTempCurve();
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

  onFlightPlanUpdated() {
    this.flightNumber = this.cdu.flightPlanService.active?.flightNumber;
    this.originGroundTemp = getISATemp(this.cdu.flightPlanService.active?.originAirport.location.alt);
  }
}
