import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { A320EfisNdRangeValue, a320EfisRangeSettings, GenericDataListenerSync, NXUnits } from '@flybywiresim/fbw-sdk';
import { GuidanceControllerInfoProvider } from '@fmgc/guidance/GuidanceController';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmcWinds, FmcWindVector } from '@fmgc/guidance/vnav/wind/types';
import { EfisInterface, GuidanceController, A320AircraftConfig, Navigation, EfisSymbols } from '@fmgc/index';
import { FmgcFlightPhase } from '@shared/flightphase';

export class FMGCSubsystem extends CDUSubsystem implements GuidanceControllerInfoProvider {
  private syncer: GenericDataListenerSync = new GenericDataListenerSync();
  efisInterfaces: Record<string, EfisInterface>;
  guidanceController: GuidanceController;
  navigation: Navigation;
  efisSymbols: EfisSymbols<A320EfisNdRangeValue>;

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing FMGC subsystem`);
    this.init();
  }

  init() {
    this.efisInterfaces = {
      L: new EfisInterface('L', this.cdu.flightPlanService),
      R: new EfisInterface('R', this.cdu.flightPlanService),
    };
    this.guidanceController = new GuidanceController(
      this,
      this.cdu.flightPlanService,
      this.efisInterfaces,
      a320EfisRangeSettings,
      A320AircraftConfig,
      this.cdu.Index === 1,
      this.cdu.Index === 2,
    );
    this.navigation = new Navigation(this.cdu.flightPlanService);
    this.efisSymbols = new EfisSymbols(
      this.guidanceController,
      this.cdu.flightPlanService,
      this.navigation.getNavaidTuner(),
      this.efisInterfaces,
      a320EfisRangeSettings,
    );

    this.guidanceController.init();
    this.navigation.init();
    this.efisSymbols.init();
  }

  update(deltaTime: number) {
    super.update(deltaTime);

    this.guidanceController.update(deltaTime);
    this.navigation.update(deltaTime);
    this.efisSymbols.update(deltaTime, [this.cdu.sideLetter]);
  }

  getManagedClimbSpeed(): Knots {
    const costIndex = this.cdu.FlightInformation.costIndex ?? 0;
    const dCI = (costIndex / 999) ** 2;
    return 290 * (1 - dCI) + 330 * dCI;
  }

  getManagedClimbSpeedMach(): Mach {
    return 0.78;
  }

  getCruiseAltitude(): Feet {
    return this.cdu.FlightInformation.cruiseLevel * 100;
  }

  getManagedCruiseSpeed(): Knots {
    const costIndex = this.cdu.FlightInformation.costIndex ?? 0;
    const dCI = (costIndex / 999) ** 2;
    return 290 * (1 - dCI) + 310 * dCI;
  }

  getManagedCruiseSpeedMach(): Mach {
    return 0.78;
  }

  getManagedDescentSpeed(): Knots {
    const costIndex = this.cdu.FlightInformation.costIndex ?? 0;
    const dCI = costIndex / 999;
    return 288 * (1 - dCI) + 300 * dCI;
  }

  getManagedDescentSpeedMach(): Mach {
    return 0.78;
  }

  getZeroFuelWeight(): Kilograms {
    return NXUnits.tonnesToLbs(this.cdu.FuelWeight.zeroFuelWeight);
  }

  getFOB(): Tonnes {
    return NXUnits.lbsToKg(SimVar.GetSimVarValue('FUEL TOTAL QUANTITY WEIGHT', 'pound') / 1000);
  }

  getV2Speed(): Knots {
    return this.cdu.Performance?.v2Speed;
  }

  getTropoPause(): Feet {
    return this.cdu.FlightInformation.tropo;
  }

  getAccelerationAltitude(): Feet {
    return this.cdu.flightPlanService.active?.performanceData.accelerationAltitude;
  }

  getThrustReductionAltitude(): Feet {
    return this.cdu.flightPlanService.active?.performanceData.thrustReductionAltitude;
  }

  getOriginTransitionAltitude(): Feet | undefined {
    return this.cdu.flightPlanService.active?.performanceData.transitionAltitude;
  }

  getFlightPhase(): FmgcFlightPhase {
    return this.cdu.flightPhaseManager.phase;
  }

  getClimbSpeedLimit(): SpeedLimit {
    return { speed: 250, underAltitude: 10000 };
  }

  getDescentSpeedLimit(): SpeedLimit {
    return { speed: 250, underAltitude: 10000 };
  }

  getPreSelectedClbSpeed(): Knots {
    return undefined;
  }

  getPreSelectedCruiseSpeed(): Knots {
    return undefined;
  }

  getTakeoffFlapsSetting(): FlapConf | undefined {
    return this.cdu.Performance?.takeoffFlaps;
  }

  getApproachSpeed(): Knots {
    return this.cdu.Performance?.speeds?.vapp;
  }

  getFlapRetractionSpeed(): Knots {
    return this.cdu.Performance?.flapRetractSpeed;
  }

  getSlatRetractionSpeed(): Knots {
    return this.cdu.Performance?.slatRetractSpeed;
  }

  getCleanSpeed(): Knots {
    return this.cdu.Performance?.cleanSpeed;
  }

  getTripWind(): Knots {
    return undefined; // TODO
  }

  getWinds(): FmcWinds {
    return { climb: [], cruise: [], des: [], alternate: null }; // TODO
  }

  getApproachWind(): FmcWindVector {
    return { direction: undefined, speed: undefined }; // TODO
  }

  getApproachQnh(): number {
    return undefined; // TODO
  }

  getApproachTemperature(): Celsius {
    return undefined; // TODO
  }

  getDestEFOB(_useFob: boolean): number {
    return undefined; // TODO
  }

  getDepartureElevation(): Feet | null {
    const activePlan = this.cdu.flightPlanService.active;

    let departureElevation = null;
    if (activePlan.originRunway) {
      departureElevation = activePlan.originRunway.thresholdLocation.alt;
    } else if (activePlan.originAirport) {
      departureElevation = activePlan.originAirport.location.alt;
    }
    return departureElevation;
  }

  getDestinationElevation(): Feet {
    const activePlan = this.cdu.flightPlanService.active;

    let destinationElevation = null;
    if (activePlan.destinationRunway) {
      destinationElevation = activePlan.destinationRunway.thresholdLocation.alt;
    } else if (activePlan.destinationAirport) {
      destinationElevation = activePlan.destinationAirport.location.alt;
    }
    return destinationElevation;
  }
}
