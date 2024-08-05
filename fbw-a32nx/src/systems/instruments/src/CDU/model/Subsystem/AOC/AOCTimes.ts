import { FlightPhaseManager } from '@fmgc/flightphase';
import { FmgcFlightPhase, isOnGround } from '@shared/flightphase';
import { CDU } from '@cdu/model/CDU';

export class AOCTimes {
  // Doors last closed during preflight
  doors?: Seconds;

  // Parking brake first off
  out?: Seconds;

  // Wheels off ground
  off?: Seconds;

  // Wheels on ground
  on?: Seconds;

  // Wheel on ground, parking brake on, door open
  in?: Seconds;

  // Time between "off" and "on" (or current time if not yet on ground)
  inflight(): Seconds | undefined {
    if (!this.off) return undefined;
    return this.on ? this.on - this.off : CDU.getTimeUTC() - this.off;
  }

  // Time between "out" and "in" (or current time if not yet in)
  block() {
    if (!this.out) return undefined;
    return this.in ? this.in - this.out : CDU.getTimeUTC() - this.out;
  }

  updateTimes(flightPhaseManager: FlightPhaseManager) {
    const flightPhase = flightPhaseManager.phase;

    if (flightPhase === FmgcFlightPhase.Preflight) {
      const cabinDoorPctOpen = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');
      if (!this.doors && cabinDoorPctOpen < 20) {
        this.doors = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      } else {
        if (cabinDoorPctOpen > 20) {
          this.doors = undefined;
        }
      }
    }

    if (!this.off) {
      if (flightPhase === FmgcFlightPhase.Takeoff && !isOnGround()) {
        // Wheels off
        // Off: remains blank until Take off time
        this.off = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.out) {
      const currentPKGBrakeState = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
      if (flightPhase === FmgcFlightPhase.Preflight && !currentPKGBrakeState) {
        // Out: is when you set the brakes to off
        this.out = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.on) {
      if (this.off && isOnGround()) {
        // On: remains blank until Landing time
        this.on = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }

    if (!this.in) {
      const currentPKGBrakeState = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
      const cabinDoorPctOpen = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent');
      if (this.on && currentPKGBrakeState && cabinDoorPctOpen > 20) {
        // In: remains blank until brakes set to park AND the first door opens
        this.in = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));
      }
    }
  }
}
