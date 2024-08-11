import { CDU } from '@cdu/model/CDU';
import { NXSpeeds } from '@cdu/model/Speeds';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { FmgcFlightPhase } from '@shared/flightphase';

export class SpeedSubsystem extends CDUSubsystem {
  lastGrossWeight: number;
  lastFlapsPosition: number;
  currentFlapsPosition: number;
  landingGearPosition: number;
  altitude: number;
  //cgw: number;
  isTakeoff: boolean;
  speeds: NXSpeeds;

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Speed subsystem`);
    this.init();
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
    this.currentFlapsPosition = -1;
    this.landingGearPosition = -1;
    this.altitude = -1;
    //this.cgw = 0;
    this.isTakeoff = false;
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
