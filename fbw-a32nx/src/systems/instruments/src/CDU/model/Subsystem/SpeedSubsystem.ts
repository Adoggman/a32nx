import { NXSystemMessages } from '@cdu/data/NXMessages';
import { CDU } from '@cdu/model/CDU';
import { NXSpeeds } from '@cdu/model/Speeds';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { Arinc429SignStatusMatrix, Arinc429Word } from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';

export class SpeedSubsystem extends CDUSubsystem {
  lastGrossWeight: number;
  lastFlapsPosition: number;
  landingGearPosition: number;
  altitude: number;
  //cgw: number;
  isTakeoff: boolean;
  speeds: NXSpeeds;
  takeoffFlaps: number;
  takeoffTrim: number;
  arincDiscreteWord2: FmArinc429OutputWord;
  arincTakeoffPitchTrim: FmArinc429OutputWord;

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Speed subsystem`);
    this.init();
  }

  isValidFlaps(flaps: number): boolean {
    return !(flaps < 0 || flaps > 3);
  }

  isValidTakeoffTrim(ths: number) {
    return !(ths < -5 || ths > 7);
  }

  init() {
    console.log('A32NX_VSPEEDS init');
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VS', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VLS', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_S', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_GD', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'boolean', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC', 'number', 0);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC', 'number', 0);
    this.lastGrossWeight = 50;
    this.lastFlapsPosition = -1;
    this.landingGearPosition = -1;
    this.altitude = -1;
    this.isTakeoff = false;
    this.arincDiscreteWord2 = FmArinc429OutputWord.empty('DISCRETE_WORD_2');
    this.arincDiscreteWord2.value = 0;
    this.arincDiscreteWord2.ssm = Arinc429SignStatusMatrix.NoComputedData;
    this.arincTakeoffPitchTrim = FmArinc429OutputWord.empty('TO_PITCH_TRIM');
    this.arincTakeoffPitchTrim.value = 0;
    this.arincTakeoffPitchTrim.ssm = Arinc429SignStatusMatrix.NoComputedData;
  }

  setTakeoffFlaps(flaps: number) {
    if (flaps !== this.takeoffFlaps) {
      this.takeoffFlaps = flaps;
      this.arincDiscreteWord2.setBitValue(13, this.takeoffFlaps === 0);
      this.arincDiscreteWord2.setBitValue(14, this.takeoffFlaps === 1);
      this.arincDiscreteWord2.setBitValue(15, this.takeoffFlaps === 2);
      this.arincDiscreteWord2.setBitValue(16, this.takeoffFlaps === 3);
      this.arincDiscreteWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_FLAPS', 'number', this.takeoffFlaps !== null ? this.takeoffFlaps : -1);
      this.tryCheckToData();
    }
  }

  setTakeoffTrim(ths: number) {
    if (ths !== this.takeoffTrim) {
      this.takeoffTrim = ths;
      // legacy vars
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS', 'degree', this.takeoffTrim ? this.takeoffTrim : 0);
      SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS_ENTERED', 'bool', this.takeoffTrim !== null);

      const ssm =
        this.takeoffTrim !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincTakeoffPitchTrim.setBnrValue(this.takeoffTrim ? -this.takeoffTrim : 0, ssm, 12, 180, -180);
    }
  }

  update(_deltaTime: number) {
    const flightPhase = this.cdu.flightPhaseManager.phase; //const fp = SimVar.GetSimVarValue("L:A32NX_FMGC_FLIGHT_PHASE", "Enum");
    let flapsPosition = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum');
    // Check if flaps in takeoff position
    const isTakeoff = flapsPosition === SimVar.GetSimVarValue('L:A32NX_TO_CONFIG_FLAPS', 'number');

    // Differentiate between 1 and 1 + F */
    if (flapsPosition === 1 && SimVar.GetSimVarValue('L:A32NX_FLAPS_CONF_INDEX', 'Enum') === 1) {
      flapsPosition = 5;
    }

    const fmGrossWeight = parseFloat(SimVar.GetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number').toFixed(1));
    const grossWeight = fmGrossWeight === 0 ? 64.3 : fmGrossWeight; // MZFW = 64300KG
    const landingGearPos = Math.round(SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum'));
    const altitude = this.round(Simplane.getAltitude());

    if (
      flapsPosition === this.lastFlapsPosition &&
      grossWeight === this.lastGrossWeight &&
      landingGearPos === this.landingGearPosition &&
      altitude === this.altitude &&
      isTakeoff === this.isTakeoff
    ) {
      return;
    }

    /** During Take Off allow to change this.isTo
     * Otherwise if we are in take off config and change the fhi, we no longer are in take off config */
    if (flightPhase === FmgcFlightPhase.Takeoff && Simplane.getAltitudeAboveGround() < 1.5) {
      this.isTakeoff = isTakeoff;
    } else if (this.isTakeoff && this.lastFlapsPosition !== flapsPosition) {
      this.isTakeoff = false;
    }

    this.lastFlapsPosition = flapsPosition;
    this.lastGrossWeight = grossWeight;
    //this.cgw = Math.ceil(((grossWeight > 80 ? 80 : grossWeight) - 40) / 5);
    this.landingGearPosition = landingGearPos;
    this.altitude = altitude;

    const speeds = new NXSpeeds(grossWeight, this.lastFlapsPosition, landingGearPos, this.isTakeoff);
    speeds.compensateForMachEffect(altitude);

    this.speeds = speeds;

    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VS', 'number', speeds.vs);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VLS', 'number', speeds.vls);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', speeds.f);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_S', 'number', speeds.s);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_GD', 'number', speeds.gd);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number', speeds.vmax);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number', speeds.vfeN);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC', 'number', speeds.vs * 1.1);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC', 'number', speeds.vs * 1.03);
  }

  public get flapRetractSpeed() {
    return this.zeroFuelWeight ? this.speeds?.f : undefined;
  }

  public get slatRetractSpeed() {
    return this.zeroFuelWeight ? this.speeds?.s : undefined;
  }

  public get cleanSpeed() {
    return this.zeroFuelWeight ? this.speeds?.gd : undefined;
  }

  private get zeroFuelWeight() {
    return this.cdu.FuelWeight.zeroFuelWeight;
  }

  get v1Speed() {
    return this.cdu.flightPlanService.active.performanceData.v1;
  }

  isValidVSpeed(speed: Knots) {
    return !(speed < 90 || speed > 350);
  }

  setV1Speed(speed: Knots) {
    this.cdu.flightPlanService.setPerformanceData('v1', speed);
    SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'knots', speed ? speed : NaN);
  }

  get vRSpeed() {
    return this.cdu.flightPlanService.active.performanceData.vr;
  }

  setVRSpeed(speed: Knots) {
    this.cdu.flightPlanService.setPerformanceData('vr', speed);
    SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'knots', speed ? speed : NaN);
  }

  get v2Speed() {
    return this.cdu.flightPlanService.active.performanceData.v2;
  }

  setV2Speed(speed: Knots) {
    this.cdu.flightPlanService.setPerformanceData('v2', speed);
    SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'knots', speed ? speed : NaN);
  }

  tryCheckToData() {
    if (isFinite(this.v1Speed) || isFinite(this.vRSpeed) || isFinite(this.v2Speed)) {
      this.cdu.addMessageToQueue(NXSystemMessages.checkToData);
    }
  }

  /**
   * Math.round(x / r) * r
   * @param x {number} number to be rounded
   * @param r {number} precision
   * @returns {number} rounded number
   */
  round(x: number, r: number = 100): number {
    return Math.round(x / r) * r;
  }
}

class FmArinc429OutputWord extends Arinc429Word {
  name: string;
  dirty: boolean;
  ssm: Arinc429SignStatusMatrix;
  value: number;

  constructor(name, value = 0) {
    super(0);

    this.name = name;
    this.dirty = true;
    this.value = value;
    this.ssm = 0;
  }

  setValue(value: number) {
    if (this.value !== value) {
      this.dirty = true;
    }
    this.value = value;
  }

  setSsm(ssm: Arinc429SignStatusMatrix) {
    if (this.ssm !== ssm) {
      this.dirty = true;
    }
    this.ssm = ssm;
  }

  static empty(name?: string) {
    return new FmArinc429OutputWord(name ?? 'EMPTY', 0);
  }

  async writeToSimVarIfDirty() {
    if (this.dirty) {
      this.dirty = false;
      return Promise.all([
        Arinc429Word.toSimVarValue(`L:A32NX_FM1_${this.name}`, this.value, this.ssm),
        Arinc429Word.toSimVarValue(`L:A32NX_FM2_${this.name}`, this.value, this.ssm),
      ]);
    }
    return Promise.resolve();
  }

  setBnrValue(value: number, ssm: Arinc429SignStatusMatrix, bits: number, rangeMax: number, rangeMin = 0) {
    const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
    const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

    this.value = data;
    this.ssm = ssm;
  }
}
