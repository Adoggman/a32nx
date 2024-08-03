import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ISimbriefData } from '../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { CDUIndex } from 'instruments/src/CDU/model/CDU';

export namespace Simbrief {
  export enum ErrorCode {
    None = 0,
    NoNavigraphUsername = 1,
    Unknown = 2,
  }

  export enum Status {
    Ready,
    Requesting,
    Done,
  }

  /**
   *  Converts lbs to kg
   * @param {string | number} value
   */
  const lbsToKg = (value) => {
    return (+value * 0.4535934).toString();
  };

  export type OFPCallback = (cduIndex: CDUIndex, data: ISimbriefData, simbriefObject: {}) => void;

  /**
   * Fetch SimBrief OFP data and store on FMCMainDisplay object
   * @param {FMCMainDisplay} mcdu FMCMainDisplay
   * @param {() => void} updateView
   * @return {Promise<ISimbriefData>}
   */
  export const getOFP = (
    cduIndex: CDUIndex,
    callback: OFPCallback,
    onError: (cduIndex: CDUIndex) => void,
  ): ErrorCode => {
    const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
      return ErrorCode.NoNavigraphUsername;
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
        simbrief['blockFuel'] = useKgs ? data.fuel.planRamp : lbsToKg(data.fuel.planRamp);
        simbrief['payload'] = useKgs ? data.weights.payload : lbsToKg(data.weights.payload);
        simbrief['estZfw'] = useKgs ? data.weights.estZeroFuelWeight : lbsToKg(data.weights.estZeroFuelWeight);
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
        simbrief['taxiFuel'] = useKgs ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
        simbrief['tripFuel'] = useKgs ? data.fuel.enrouteBurn : lbsToKg(data.fuel.enrouteBurn);

        callback(cduIndex, data, simbrief);

        return ErrorCode.None;
      })
      .catch((_err) => {
        console.log(_err.message);
        onError(cduIndex);
        return ErrorCode.Unknown;
      });
  };
}
