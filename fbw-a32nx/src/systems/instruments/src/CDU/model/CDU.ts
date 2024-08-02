export enum CDUIndex {
  Left = 1,
  Right = 2,
}

export class CDU {
  Index: CDUIndex;
  powered: boolean;

  static initialized: boolean = false;
  static instances: Array<CDU>;

  static init() {
    if (CDU.initialized) {
      console.log('[CDU] Already initialized');
      return;
    }
    console.log('[CDU] Initializing all CDU instances');
    CDU.instances = new Array<CDU>();
    CDU.instances[0] = undefined;
    CDU.instances[CDUIndex.Left] = new CDU(CDUIndex.Left);
    CDU.instances[CDUIndex.Right] = new CDU(CDUIndex.Right);
    CDU.initialized = true;
  }

  constructor(index: CDUIndex) {
    this.Index = index;
    this.powered = this.getIsPowered();
  }

  toString(): string {
    return `CDU: ${this.Index.toString()}`;
  }

  private getIsPowered(): boolean {
    if (this.Index === CDUIndex.Left) {
      return SimVar.GetSimVarValue('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Number');
    } else if (this.Index === CDUIndex.Right) {
      SimVar.GetSimVarValue('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Number');
    } else {
      throw new Error('Checking power on invalid index: ' + this.Index);
    }
  }

  Info = {
    engine: 'LEAP-1A26',
    navCycleDates: '11JUL-08AUG',
    navSerial: 'MS24070001',
    idle: 0,
    perf: 0,
  };
}
