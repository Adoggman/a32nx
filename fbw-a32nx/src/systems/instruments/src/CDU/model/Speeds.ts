import {
  Vmo,
  Mmo,
  vsTable,
  vlsTakeoffTable,
  vlsTable,
  fTable,
  sTable,
  vfeFlapsSlatsTable,
  vmcaTable,
  vmcgTable,
} from '@cdu/data/SpeedTables';
import { HectoPascal } from '@flybywiresim/fbw-sdk';

/**
 * Ensure gross weight (mass: Tonnes) is withing valid range
 * @param mass {number} mass: gross weight
 * @returns {number} mass: gross weight
 * @private
 */
function _correctMass(mass: Tonnes) {
  return Math.ceil(((mass > 80 ? 80 : mass) - 40) / 5);
}

/**
 * Calculate green dot speed
 * Calculation:
 * Gross weight (t) * 2 + 85 when below FL200
 * @returns {number}
 */
function _computeGD(mass: Tonnes) {
  return mass * 2 + 85;
}

/**
 * Corrects velocity for mach effect by adding 1kt for every 1000ft above FL200
 * @param v {number} velocity in kt (CAS)
 * @param alt {number} altitude in feet (baro)
 * @returns {number} Mach corrected velocity in kt (CAS)
 */
function _compensateForMachEffect(v: number, alt: number) {
  return Math.ceil(alt > 20000 ? v + (alt - 20000) / 1000 : v);
}

/**
 * Calculates wind component for ground speed mini
 * @param vw {number} velocity wind (headwind)
 * @returns {number} velocity wind [5, 15]
 */
function _addWindComponent(vw: number) {
  return Math.max(Math.min(15, vw), 5);
}

/**
 * Get difference between angles
 * @param a {number} angle a
 * @param b {number} angle b
 * @returns {number} angle diff
 * @private
 */
function _getdiffAngle(a: number, b: number) {
  return 180 - Math.abs(Math.abs(a - b) - 180);
}

/**
 * Get next flaps index for vfeFS table
 * @param fi {number} current flaps index
 * @returns {number} vfeFS table index
 * @private
 */
function _getVfeNIdx(fi: number) {
  switch (fi) {
    case 0:
      return 4;
    case 5:
      return 1;
    default:
      return fi;
  }
}

/**
 * Convert degrees Celsius into Kelvin
 * @param T {number} degrees Celsius
 * @returns {number} degrees Kelvin
 */
function _convertCtoK(T: Celsius) {
  return T + 273.15;
}

/**
 * Convert Mach to True Air Speed
 * @param mach {number} Mach
 * @param temp {number} Kelvin
 * @returns {number} True Air Speed
 */
function _convertMachToKTas(mach: number, temp: number) {
  return mach * 661.4786 * Math.sqrt(temp / 288.15);
}

/**
 * Convert TAS to Mach
 * @param Vt {number} TAS
 * @param T {number} Kelvin
 * @returns {number} True Air Speed
 */
function _convertKTASToMach(Vt: Mach, T: number) {
  return Vt / 661.4786 / Math.sqrt(T / 288.15);
}

/**
 * Convert TAS to Calibrated Air Speed
 * @param Vt {number} velocity true air speed
 * @param T {number} current temperature Kelvin
 * @param p {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertTasToKCas(Vt: Knots, T: number, p: HectoPascal) {
  return (
    1479.1 * Math.sqrt(((p / 1013) * ((1 + (1 / (T / 288.15)) * (Vt / 1479.1) ** 2) ** 3.5 - 1) + 1) ** (1 / 3.5) - 1)
  );
}

/**
 * Convert KCAS to KTAS
 * @param Vc {number} velocity true air speed
 * @param T {number} current temperature Kelvin
 * @param p {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertKCasToKTAS(Vc: number, T: number, p: HectoPascal) {
  return (
    1479.1 *
    Math.sqrt((T / 288.15) * (((1 / (p / 1013)) * ((1 + 0.2 * (Vc / 661.4786) ** 2) ** 3.5 - 1) + 1) ** (1 / 3.5) - 1))
  );
}

/**
 * Convert Mach to Calibrated Air Speed
 * @param mach {number} Mach
 * @param temp {number} Kelvin
 * @param pressure {number} current pressure hpa
 * @returns {number} Calibrated Air Speed
 */
function _convertMachToKCas(mach: Mach, temp: number, pressure: HectoPascal) {
  return _convertTasToKCas(_convertMachToKTas(mach, temp), temp, pressure);
}

/**
 * Get correct Vmax for Vmo and Mmo in knots
 * @returns {number} Min(Vmo, Mmo)
 * @private
 */
function _getVmo() {
  return Math.min(
    Vmo,
    _convertMachToKCas(
      Mmo,
      _convertCtoK(Simplane.getAmbientTemperature()),
      SimVar.GetSimVarValue('AMBIENT PRESSURE', 'millibar'),
    ),
  );
}

export class NXSpeeds {
  vs: number;
  vls: number;
  vapp: number;
  f: number;
  s: number;
  gd: number;
  vmax: number;
  vfeN: number;

  /**
   * Computes Vs, Vls, Vapp, F, S and GD
   * @param mass {number} mass: gross weight in t
   * @param flapPosition {number} flaps position
   * @param gearPosition {number} landing gear position
   * @param isTakeoff {boolean} whether in takeoff config or not
   * @param wind {number} wind speed
   */
  constructor(mass: Tonnes, flapPosition: number, gearPosition: number, isTakeoff: boolean, wind: number = 0) {
    const cm = _correctMass(mass);
    this.vs = vsTable[flapPosition][cm](mass, gearPosition);
    this.vls = (isTakeoff ? vlsTakeoffTable : vlsTable)[flapPosition][cm](mass, gearPosition);
    this.vapp = this.vls + _addWindComponent(wind);
    this.f = fTable[cm](mass);
    this.s = sTable[cm](mass);
    this.gd = _computeGD(mass);
    this.vmax = flapPosition === 0 ? _getVmo() : vfeFlapsSlatsTable[flapPosition - 1];
    this.vfeN = flapPosition === 4 ? 0 : vfeFlapsSlatsTable[_getVfeNIdx(flapPosition)];
  }

  compensateForMachEffect(alt: number) {
    this.vs = _compensateForMachEffect(this.vs, alt);
    this.vls = _compensateForMachEffect(this.vls, alt);
    this.gd = _compensateForMachEffect(this.gd, alt);
  }
}

export class NXSpeedsApp {
  valid: boolean;
  vls: number;
  vapp: number;
  f: number;
  s: number;
  gd: number;

  /**
   * Calculates VLS and Vapp for selected landing configuration
   * @param {number} mass Projected landing mass in t
   * @param {boolean} isConf3 CONF3 if true, else FULL
   * @param {number} [headwind=0] tower headwind component
   */
  constructor(mass: Tonnes, isConf3: boolean, headwind: number = 0) {
    const cm = _correctMass(mass);
    this.vls = vlsTable[isConf3 ? 3 : 4][cm](mass, 1);
    this.vapp = this.vls + NXSpeedsUtils.addWindComponent(headwind / 3);
    this.f = fTable[cm](mass);
    this.s = sTable[cm](mass);
    this.gd = _computeGD(mass);
    this.valid = true;
  }
}

class NXSpeedsUtils {
  /**
   * Calculates wind component for ground speed mini
   * @param vw {number} velocity wind (1/3 steady headwind)
   * @returns {number} velocity wind [5, 15]
   */
  static addWindComponent(vw: number = (SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1) / 3) {
    return _addWindComponent(vw);
  }

  /**
   * Calculates headwind component
   * @param v {number} velocity wind
   * @param a {number} angle: a
   * @param b {number} angle: b
   * @returns {number} velocity headwind
   */
  static getHeadwind(v: number, a: number, b: number): number {
    return v * Math.cos(_getdiffAngle(a, b) * (Math.PI / 180));
  }

  /**
   * 1/3 * (current headwind - tower headwind)
   * @param vTwr {number} velocity tower headwind
   * @param vCur {number} velocity current headwind
   * @returns {number} head wind diff
   */
  static getHeadWindDiff(vTwr: number, vCur: number = SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1): number {
    return Math.round((1 / 3) * (vCur - vTwr));
  }

  /**
   * Returns Vtarget limited by Vapp and VFE next
   * @param vapp {number} Vapp
   * @param windDiff {number} ground speed mini
   * @returns {number}
   */
  static getVtargetGSMini(vapp: number, windDiff: number): number {
    return Math.max(
      vapp,
      Math.min(
        Math.round(vapp + windDiff),
        Math.round(
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 4
            ? SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'Number') - 5
            : SimVar.GetSimVarValue('L:A32NX_SPEEDS_VFEN', 'Number'),
        ),
      ),
    );
  }

  static convertKCasToMach(
    Vc: number,
    T: number = _convertCtoK(Simplane.getAmbientTemperature()),
    p: number = SimVar.GetSimVarValue('AMBIENT PRESSURE', 'millibar'),
  ) {
    return _convertKTASToMach(_convertKCasToKTAS(Vc, T, p), T);
  }

  /** @private */
  static interpolateTable(table: number[][], alt: number) {
    if (alt <= table[0][0]) {
      return vmcaTable[0][1];
    }
    if (alt >= table[table.length - 1][0]) {
      table[table.length - 1][1];
    }
    for (let i = 0; i < table.length - 1; i++) {
      if (alt >= table[i][0] && alt <= table[i + 1][0]) {
        const d = (alt - table[i][0]) / (table[i + 1][0] - table[i][0]);
        return Avionics.Utils.lerpAngle(table[i][1], table[i + 1][1], d);
      }
    }
  }

  /**
   * Get VMCA (minimum airborne control speed) for a given altitude
   * @param {number} altitude Altitude in feet
   * @returns VMCA in knots
   */
  static getVmca(altitude: Feet): Knots {
    return this.interpolateTable(vmcaTable, altitude);
  }

  /**
   * Get VMCG (minimum ground control speed) for a given altitude
   * @param {number} altitude Altitude in feet
   * @returns VMCG in knots
   */
  static getVmcg(altitude: Feet): Knots {
    return this.interpolateTable(vmcgTable, altitude);
  }

  /**
   * Get Vs1g for the given config
   *
   * @param {number} mass mass of the aircraft in tons
   * @param {number} conf 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
   * @param {boolean} gearDown true if the gear is down
   */
  static getVs1g(mass: Tonnes, conf: number, gearDown: boolean) {
    return vsTable[conf][_correctMass(mass)](mass, gearDown ? 1 : 0);
  }
}
