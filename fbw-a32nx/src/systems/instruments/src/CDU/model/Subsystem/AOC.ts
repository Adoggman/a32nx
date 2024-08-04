import { CDU } from 'instruments/src/CDU/model/CDU';
import { AOCTimes } from 'instruments/src/CDU/model/Subsystem/AOCTimes';

export class AOC {
  Times: AOCTimes;
  private cdu: CDU;

  constructor(cdu: CDU) {
    console.log(`[CDU${cdu.Index}] Initializing AOC subsystem`);
    this.cdu = cdu;
    this.Times = new AOCTimes();
  }

  update() {
    this.Times.updateTimes(this.cdu.flightPhaseManager);
  }
}
