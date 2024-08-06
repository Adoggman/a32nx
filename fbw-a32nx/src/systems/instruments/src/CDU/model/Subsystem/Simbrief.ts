import { NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { CDU, CDUIndex } from '@cdu/model/CDU';
import { NXFictionalMessages, NXSystemMessages } from '@cdu/data/NXMessages';
import { ISimbriefData } from '../../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { SimbriefUplinkHandler } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { PilotWaypoint } from '@fmgc/flightplanning/DataManager';
import { FmsErrorType } from '@fmgc/FmsError';
import { Coordinates } from 'msfs-geo';
import { getISATemp } from '@cdu/model/Util';

export enum SimbriefErrorCode {
  None = 0,
  NoNavigraphUsername = 1,
  Unknown = 2,
}

export enum SimbriefStatus {
  Ready,
  Requesting,
  Done,
}

export type OFPCallback = (cduIndex: CDUIndex, data: ISimbriefData, simbriefObject: {}) => void;

export class Simbrief extends CDUSubsystem implements SimbriefUplinkHandler {
  Data: ISimbriefData;
  Status: SimbriefStatus = SimbriefStatus.Ready;

  originGroundTemp: number | undefined = undefined;
  flightNumber: string | undefined = undefined;

  uplinkDone: boolean = false;

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
    console.log(`[CDU${cdu.Index}] Initializing Simbrief subsystem`);
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

  onUplinkInProgress() {
    this.Status = SimbriefStatus.Requesting;
    this.cdu.Display.refresh();
  }

  createLatLonWaypoint(coordinates: Coordinates, stored: boolean, ident?: string): PilotWaypoint {
    return this.cdu.dataManager.createLatLonWaypoint(coordinates, stored, ident);
  }

  showFmsErrorMessage(errorType: FmsErrorType): void {
    console.log(`[CDU${this.cdu.Index}] FMS Error: ${errorType}`);
    throw new Error('Method not implemented.');
  }

  onUplinkDone() {
    this.Status = SimbriefStatus.Done;
    this.uplinkDone = true;
  }

  loadOFP(uplink = false): void {
    if (this.Status === SimbriefStatus.Requesting) {
      console.log(`[CDU${this.cdu.Index}] Ignoring new simbrief request, request already in progress`);
      return;
    }
    this.Status = SimbriefStatus.Requesting;
    const errCode = Simbrief.getOFP(this.cdu.Index, uplink);
    if (errCode) {
      this.Status = SimbriefStatus.Ready;
      if (errCode === SimbriefErrorCode.NoNavigraphUsername) {
        this.cdu.setMessage(NXFictionalMessages.noNavigraphUser);
      } else if (errCode === SimbriefErrorCode.Unknown) {
        this.cdu.setMessage(NXFictionalMessages.internalError);
      }
    }
  }

  static updateSimbrief(index: CDUIndex, data: ISimbriefData, _simbriefObject: {}, uplink: boolean): void {
    CDU.instances[index].Simbrief.updateSimbriefData(data, _simbriefObject, uplink);
  }

  updateSimbriefData(data: ISimbriefData, _simbriefObject: {}, uplink: boolean): void {
    this.Data = data;
    this.Status = SimbriefStatus.Done;
    this.cdu.setMessage(NXFictionalMessages.emptyMessage);
    this.cdu.Display?.refresh();
    if (uplink) {
      this.uplinkFlightPlan();
    }
  }

  static onSimbriefError(index: CDUIndex): void {
    CDU.instances[index].Simbrief.updateSimbriefError();
  }

  updateSimbriefError(): void {
    this.cdu.setMessage(NXFictionalMessages.internalError);
    this.Status = SimbriefStatus.Ready;
    this.cdu.Display?.refresh();
  }

  tryUplinkFlightPlan() {
    if (!this.Data) {
      this.loadOFP(true);
    } else {
      this.uplinkFlightPlan();
    }
  }

  uplinkFlightPlan() {
    const flightPlanService = this.cdu.flightPlanService;
    Fmgc.SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(this, flightPlanService, this.Data, {
      doUplinkProcedures: false,
    }).then(() => {
      console.log(`[CDU${this.cdu.Index}] SimBrief data uplinked.`);
      this.cdu.addMessageToQueue(NXSystemMessages.aocActFplnUplink);
      flightPlanService.uplinkInsert();
      this.flightNumber = flightPlanService.active?.flightNumber;
      this.originGroundTemp = getISATemp(flightPlanService.active?.originAirport.location.alt);
    });
  }

  static getOFP(cduIndex: CDUIndex, uplink): SimbriefErrorCode {
    const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
      return SimbriefErrorCode.NoNavigraphUsername;
    }

    const simbrief = {};

    Fmgc.SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID)
      .then((data) => {
        simbrief['units'] = data.units;
        const useKgs = simbrief['units'] === 'kgs';
        simbrief['route'] = data.route;
        simbrief['cruiseAltitude'] = data.cruiseAltitude;
        simbrief['originIcao'] = data.origin.icao;
        simbrief['originTransAlt'] = data.origin.transAlt;
        simbrief['originTransLevel'] = data.origin.transLevel;
        simbrief['destinationIcao'] = data.destination.icao;
        simbrief['destinationTransAlt'] = data.destination.transAlt;
        simbrief['destinationTransLevel'] = data.destination.transLevel;
        simbrief['blockFuel'] = useKgs ? data.fuel.planRamp : NXUnits.lbsToKg(data.fuel.planRamp);
        simbrief['payload'] = useKgs ? data.weights.payload : NXUnits.lbsToKg(data.weights.payload);
        simbrief['estZfw'] = useKgs ? data.weights.estZeroFuelWeight : NXUnits.lbsToKg(data.weights.estZeroFuelWeight);
        simbrief['paxCount'] = data.weights.passengerCount;
        simbrief['bagCount'] = data.weights.bagCount;
        simbrief['paxWeight'] = data.weights.passengerWeight;
        simbrief['bagWeight'] = data.weights.bagWeight;
        simbrief['freight'] = data.weights.freight;
        simbrief['cargo'] = data.weights.cargo;
        simbrief['costIndex'] = data.costIndex;
        simbrief['navlog'] = data.navlog;
        simbrief['callsign'] = data.flightNumber;
        let alternate = data.alternate;
        if (Array.isArray(data.alternate)) {
          alternate = data.alternate[0];
        }
        simbrief['alternateIcao'] = alternate.icao;
        simbrief['alternateTransAlt'] = alternate.transAlt;
        simbrief['alternateTransLevel'] = alternate.transLevel;
        simbrief['alternateAvgWindDir'] = alternate.averageWindDirection;
        simbrief['alternateAvgWindSpd'] = alternate.averageWindSpeed;
        simbrief['avgTropopause'] = data.averageTropopause;
        simbrief['ete'] = data.times.estTimeEnroute;
        simbrief['blockTime'] = data.times.estBlock;
        simbrief['outTime'] = data.times.estOut;
        simbrief['onTime'] = data.times.estOn;
        simbrief['inTime'] = data.times.estIn;
        simbrief['offTime'] = data.times.estOff;
        simbrief['taxiFuel'] = useKgs ? data.fuel.taxi : NXUnits.lbsToKg(data.fuel.taxi);
        simbrief['tripFuel'] = useKgs ? data.fuel.enrouteBurn : NXUnits.lbsToKg(data.fuel.enrouteBurn);

        Simbrief.updateSimbrief(cduIndex, data, simbrief, uplink);

        return SimbriefErrorCode.None;
      })
      .catch((_err) => {
        console.log(_err.message);
        Simbrief.onSimbriefError(cduIndex);
        return SimbriefErrorCode.Unknown;
      });
  }
}
