import { NXDataStore, NXUnits } from '@flybywiresim/fbw-sdk';
import { CDU, CDUIndex } from 'instruments/src/CDU/model/CDU';
import { NXFictionalMessages } from 'instruments/src/CDU/model/NXMessages';
import { ISimbriefData } from '../../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { CDUSubsystem } from 'instruments/src/CDU/model/Subsystem';

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

export class Simbrief extends CDUSubsystem {
  Data: ISimbriefData;
  Status: SimbriefStatus = SimbriefStatus.Ready;

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Simbrief subsystem`);
  }

  simbriefInit(): void {
    if (this.Status === SimbriefStatus.Requesting) {
      console.log(`[CDU${this.cdu.Index}] Ignoring new simbrief request, request already in progress`);
      return;
    }
    this.Status = SimbriefStatus.Requesting;
    const errCode = Simbrief.getOFP(this.cdu.Index);
    if (errCode) {
      this.Status = SimbriefStatus.Ready;
      if (errCode === SimbriefErrorCode.NoNavigraphUsername) {
        this.cdu.setMessage(NXFictionalMessages.noNavigraphUser);
      } else if (errCode === SimbriefErrorCode.Unknown) {
        this.cdu.setMessage(NXFictionalMessages.internalError);
      }
    }
  }

  static updateSimbrief(index: CDUIndex, data: ISimbriefData, _simbriefObject: {}): void {
    CDU.instances[index].Simbrief.updateSimbriefData(data, _simbriefObject);
  }

  updateSimbriefData(data: ISimbriefData, _simbriefObject: {}): void {
    this.Data = data;
    this.Status = SimbriefStatus.Done;
    this.cdu.setMessage(NXFictionalMessages.emptyMessage);
    this.cdu.Display?.refresh();
  }

  static onSimbriefError(index: CDUIndex): void {
    CDU.instances[index].Simbrief.updateSimbriefError();
  }

  updateSimbriefError(): void {
    this.cdu.setMessage(NXFictionalMessages.internalError);
    this.Status = SimbriefStatus.Ready;
    this.cdu.Display?.refresh();
  }

  static getOFP(cduIndex: CDUIndex): SimbriefErrorCode {
    const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
      return SimbriefErrorCode.NoNavigraphUsername;
    }

    const simbrief = {};

    Fmgc.SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID)
      .then((data) => {
        const useKgs = simbrief['units'] === 'kgs';
        simbrief['units'] = data.units;
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

        Simbrief.updateSimbrief(cduIndex, data, simbrief);

        return SimbriefErrorCode.None;
      })
      .catch((_err) => {
        console.log(_err.message);
        Simbrief.onSimbriefError(cduIndex);
        return SimbriefErrorCode.Unknown;
      });
  }
}
