import { Arinc429Word, Arinc429SignStatusMatrix } from '@flybywiresim/fbw-sdk';

export class FmArinc429OutputWord extends Arinc429Word {
  name: string;
  dirty: boolean;
  ssm: Arinc429SignStatusMatrix;
  value: number;

  constructor(name, value = 0) {
    super(0);

    this.name = name;
    this.dirty = true;
    this.value = value;
    this.ssm = 0;
  }

  setValue(value: number) {
    if (this.value !== value) {
      this.dirty = true;
    }
    this.value = value;
  }

  setSsm(ssm: Arinc429SignStatusMatrix) {
    if (this.ssm !== ssm) {
      this.dirty = true;
    }
    this.ssm = ssm;
  }

  static empty(name?: string) {
    return new FmArinc429OutputWord(name ?? 'EMPTY', 0);
  }

  async writeToSimVarIfDirty() {
    if (this.dirty) {
      this.dirty = false;
      return Promise.all([
        Arinc429Word.toSimVarValue(`L:A32NX_FM1_${this.name}`, this.value, this.ssm),
        Arinc429Word.toSimVarValue(`L:A32NX_FM2_${this.name}`, this.value, this.ssm),
      ]);
    }
    return Promise.resolve();
  }

  setBnrValue(value: number, ssm: Arinc429SignStatusMatrix, bits: number, rangeMax: number, rangeMin = 0) {
    const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
    const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

    this.value = data;
    this.ssm = ssm;
  }
}
