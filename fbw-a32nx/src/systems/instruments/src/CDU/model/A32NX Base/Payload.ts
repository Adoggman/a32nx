import { NXUnits } from '@flybywiresim/fbw-sdk';

export const paxStations = {
  rows1_6: {
    name: 'ROWS [1-6]',
    seats: 36,
    weight: Math.round(NXUnits.kgToUser(3024)),
    stationIndex: 0 + 1,
    position: 20.5,
    simVar: 'A32NX_PAX_A',
  },
  rows7_13: {
    name: 'ROWS [7-13]',
    seats: 42,
    weight: Math.round(NXUnits.kgToUser(3530)),
    stationIndex: 1 + 1,
    position: 1.5,
    simVar: 'A32NX_PAX_B',
  },
  rows14_21: {
    name: 'ROWS [14-21]',
    seats: 48,
    weight: Math.round(NXUnits.kgToUser(4032)),
    stationIndex: 2 + 1,
    position: -16.6,
    simVar: 'A32NX_PAX_C',
  },
  rows22_29: {
    name: 'ROWS [22-29]',
    seats: 48,
    weight: Math.round(NXUnits.kgToUser(4032)),
    stationIndex: 3 + 1,
    position: -35.6,
    simVar: 'A32NX_PAX_D',
  },
};

export const cargoStations = {
  fwdBag: {
    name: 'FWD BAGGAGE/CONTAINER',
    weight: Math.round(NXUnits.kgToUser(3402)),
    load: 0,
    stationIndex: 4 + 1,
    position: 17.3,
    visible: true,
    simVar: 'A32NX_CARGO_FWD_BAGGAGE_CONTAINER',
  },
  aftCont: {
    name: 'AFT CONTAINER',
    weight: Math.round(NXUnits.kgToUser(2426)),
    load: 0,
    stationIndex: 5 + 1,
    position: -24.1,
    visible: true,
    simVar: 'A32NX_CARGO_AFT_CONTAINER',
  },
  aftBag: {
    name: 'AFT BAGGAGE',
    weight: Math.round(NXUnits.kgToUser(2110)),
    load: 0,
    stationIndex: 6 + 1,
    position: -34.1,
    visible: true,
    simVar: 'A32NX_CARGO_AFT_BAGGAGE',
  },
  aftBulk: {
    name: 'AFT BULK/LOOSE',
    weight: Math.round(NXUnits.kgToUser(1497)),
    load: 0,
    stationIndex: 7 + 1,
    position: -42.4,
    visible: true,
    simVar: 'A32NX_CARGO_AFT_BULK_LOOSE',
  },
};

const MAX_SEAT_AVAILABLE = 174;

/**
 * Calculate %MAC ZWFCG of all stations
 */
export function getZfwcg() {
  const leMacZ = -5.383; // Accurate to 3 decimals, replaces debug weight values
  const macSize = 13.464; // Accurate to 3 decimals, replaces debug weight values

  const emptyWeight = SimVar.GetSimVarValue('EMPTY WEIGHT', getUserUnit());
  const emptyPosition = -9.42; // Value from flight_model.cfg
  const emptyMoment = emptyPosition * emptyWeight;
  const PAX_WEIGHT = SimVar.GetSimVarValue('L:A32NX_WB_PER_PAX_WEIGHT', 'Number');

  const paxTotalMass = Object.values(paxStations)
    .map((station) => new BitFlags(SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).getTotalBits() * PAX_WEIGHT)
    .reduce((acc, cur) => acc + cur, 0);
  const paxTotalMoment = Object.values(paxStations)
    .map(
      (station) =>
        new BitFlags(SimVar.GetSimVarValue(`L:${station.simVar}`, 'Number')).getTotalBits() *
        PAX_WEIGHT *
        station.position,
    )
    .reduce((acc, cur) => acc + cur, 0);

  const cargoTotalMass = Object.values(cargoStations)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  const cargoTotalMoment = Object.values(cargoStations)
    .map(
      (station) =>
        SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()) * station.position,
    )
    .reduce((acc, cur) => acc + cur, 0);

  const totalMass = emptyWeight + paxTotalMass + cargoTotalMass;
  const totalMoment = emptyMoment + paxTotalMoment + cargoTotalMoment;

  const cgPosition = totalMoment / totalMass;
  const cgPositionToLemac = cgPosition - leMacZ;
  const cgPercentMac = -100 * (cgPositionToLemac / macSize);

  return cgPercentMac;
}

function getTotalCargo() {
  const cargoTotalMass = Object.values(cargoStations)
    .filter((station) => station.visible)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  return cargoTotalMass;
}

function getTotalPayload() {
  const paxTotalMass = Object.values(paxStations)
    .map((station) => SimVar.GetSimVarValue(`PAYLOAD STATION WEIGHT:${station.stationIndex}`, getUserUnit()))
    .reduce((acc, cur) => acc + cur, 0);
  const cargoTotalMass = getTotalCargo();
  return paxTotalMass + cargoTotalMass;
}

export function getZfw() {
  const emptyWeight = SimVar.GetSimVarValue('EMPTY WEIGHT', getUserUnit());
  return emptyWeight + getTotalPayload();
}

function getUserUnit() {
  const defaultUnit = NXUnits.userWeightUnit() == 'KG' ? 'Kilograms' : 'Pounds';
  return defaultUnit;
}

class BitFlags {
  f64View: Float64Array;
  u32View: Uint32Array;
  flags: number[];

  constructor(number) {
    this.f64View = new Float64Array(1);
    this.u32View = new Uint32Array(this.f64View.buffer);
    this.setFlags(number);
  }

  setFlags(number) {
    this.flags = Array.from(this.u32View);
    const bigNumberAsBinaryStr = number.toString(2);

    let bigNumberAsBinaryStr2 = '';
    for (let i = 0; i < 64 - bigNumberAsBinaryStr.length; i++) {
      bigNumberAsBinaryStr2 += '0';
    }

    bigNumberAsBinaryStr2 += bigNumberAsBinaryStr;

    this.flags[1] = parseInt(bigNumberAsBinaryStr2.substring(0, 32), 2);
    this.flags[0] = parseInt(bigNumberAsBinaryStr2.substring(32), 2);
  }

  getBitIndex(bit) {
    if (bit > 63) {
      return false;
    }
    const f = Math.floor(bit / 31);
    const b = bit % 31;

    return ((this.flags[f] >> b) & 1) !== 0;
  }

  toggleBitIndex(bit) {
    if (bit > 63) {
      return;
    }
    const f = Math.floor(bit / 31);
    const b = bit % 31;

    this.flags[f] ^= 1 << b;
  }

  toDouble() {
    return new Float64Array(Uint32Array.from(this.flags).buffer)[0];
  }

  toDebug() {
    const debug = [];
    this.flags.forEach((flag, index) => {
      debug.push(flag.toString(2));
      const fL = 32 - flag.toString(2).length;
      for (let i = 0; i < fL; i++) {
        debug[index] = '0'.concat(debug[index]);
      }
    });
    return `HIGH [ ${debug[1]} | ${debug[0]} ] LOW`;
  }

  toNumber() {
    return this.flags[1] * 2 ** 32 + this.flags[0];
  }

  toString() {
    return this.toNumber().toString();
  }

  getTotalBits() {
    let total = 0;
    this.flags.forEach((flag) => {
      const n = 32;
      let i = 0;
      while (i++ < n) {
        if (((1 << i) & flag) === 1 << i) {
          total++;
        }
      }
    });
    return total;
  }
}
