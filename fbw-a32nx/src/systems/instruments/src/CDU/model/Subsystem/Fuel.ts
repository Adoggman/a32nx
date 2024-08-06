import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';

export class Fuel extends CDUSubsystem {
  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Fuel subsystem`);
  }

  // Taxi
  taxiFuelWeight: number | undefined = undefined;
  taxiFuelWeightDefault = 0.2;

  // Trip/time

  // Reserve
  reserveTime: number | undefined = undefined;
  reservePercent: number | undefined = undefined;
  reservePercentDefault = 5.0;

  isValidReserveTime(num: number) {
    return num >= 0 && num <= 10.0;
  }

  isValidReservePercent(num: number) {
    return num >= 0 && num <= 15.0;
  }

  // Alternate

  // Final

  // Minimum destination FOB
}
