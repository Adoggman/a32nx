import { CDU } from '@cdu/model/CDU';
import { CDUSubsystem } from '@cdu/model/Subsystem';
import { AOCTimes } from '@cdu/model/Subsystem/AOC/AOCTimes';

export class AOC extends CDUSubsystem {
  Times: AOCTimes;

  constructor(cdu: CDU) {
    super(cdu);
    console.log(`[CDU${cdu.Index}] Initializing AOC subsystem`);
    this.Times = new AOCTimes();
  }

  update() {
    this.Times.updateTimes(this.cdu.flightPhaseManager);
  }
}
