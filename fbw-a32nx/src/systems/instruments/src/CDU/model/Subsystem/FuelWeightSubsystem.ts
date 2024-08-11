import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';

export class FuelWeightSubsystem extends CDUSubsystem {
  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing Fuel subsystem`);
  }

  // Zero Fuel Weight
  zeroFuelWeight: Tonnes;
  zeroFuelWeightCG: Tonnes;

  // Block
  block: Tonnes;

  // Taxi
  taxiFuelWeight: Tonnes | undefined = undefined;
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

  isValidTaxiFuel(taxi: number) {
    return 0 <= taxi && taxi <= 9.9;
  }

  isValidZFW(zfw: number) {
    return 35.0 <= zfw && zfw <= 80.0;
  }

  isValidZFWCG(zfwcg: number) {
    return 8.0 <= zfwcg && zfwcg <= 50.0;
  }

  isValidBlockFuel(fuel: number) {
    return 0 <= fuel && fuel <= 80;
  }

  // Alternate

  // Final

  // Minimum destination FOB
}
