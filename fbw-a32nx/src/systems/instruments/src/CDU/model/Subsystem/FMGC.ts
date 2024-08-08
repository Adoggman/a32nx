import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { Airport, GenericDataListenerSync, NdSymbol, NdSymbolTypeFlags } from '@flybywiresim/fbw-sdk';

export class FMGCSubsystem extends CDUSubsystem {
  private syncer: GenericDataListenerSync = new GenericDataListenerSync();

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing FMGC subsystem`);
  }

  update() {
    super.update();
    const symbols: NdSymbol[] = [];
    if (this.cdu.FlightInformation.origin) {
      symbols.push(this.newAirportSymbol(this.cdu.FlightInformation.origin));
    }
    if (this.cdu.FlightInformation.destination) {
      symbols.push(this.newAirportSymbol(this.cdu.FlightInformation.destination));
    }
    if (this.cdu.FlightInformation.alternate) {
      symbols.push(this.newAirportSymbol(this.cdu.FlightInformation.alternate));
    }
    this.syncer.sendEvent(`A32NX_EFIS_${this.cdu.sideLetter}_SYMBOLS`, symbols);
  }

  newAirportSymbol(airport: Airport): NdSymbol {
    const planAltnStr = ' ';
    const planIndexStr = this.cdu.flightPlanService.active.index.toString();
    const runwayIdentStr = '        ';
    const databaseId = `A${airport.ident}${planAltnStr}${planIndexStr}${runwayIdentStr}`;
    return {
      databaseId,
      ident: airport.ident,
      location: airport.location,
      type: NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.FlightPlan,
    };
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
}
