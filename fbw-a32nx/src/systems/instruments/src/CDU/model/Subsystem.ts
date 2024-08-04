import { CDU } from 'instruments/src/CDU/model/CDU';

export abstract class CDUSubsystem {
  protected cdu: CDU;

  constructor(cdu: CDU) {
    this.cdu = cdu;
  }

  update() {}
}
