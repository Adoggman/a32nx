import { CDUSubsystem } from '@cdu/model/Subsystem';

export class Fuel extends CDUSubsystem {
  taxiFuelWeight: number | undefined = undefined;
  defaultTaxiFuelWeight = 0.2;
}
