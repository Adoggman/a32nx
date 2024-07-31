export enum CDUIndex {
  Error = 0,
  Left = 1,
  Right = 2,
}

export class CDU {
  Index: CDUIndex;

  static initialized: boolean = false;
  static instances: Array<CDU>;

  static init() {
    console.log('[CDU] Initializing TS CDU');
    CDU.instances = new Array<CDU>();
    CDU.instances[CDUIndex.Error] = undefined;
    CDU.instances[CDUIndex.Left] = new CDU(CDUIndex.Left);
    CDU.instances[CDUIndex.Right] = new CDU(CDUIndex.Right);
    CDU.initialized = true;
  }

  constructor(index: CDUIndex) {
    this.Index = index;
  }

  toString(): string {
    return `CDU: ${this.Index.toString()}`;
  }
}
