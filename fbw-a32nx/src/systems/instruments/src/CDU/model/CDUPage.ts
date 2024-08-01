export interface ICDULine {
  labelElements?: [CDUElement?, CDUElement?, CDUElement?, CDUElement?];
  textElements?: [CDUElement?, CDUElement?, CDUElement?, CDUElement?];
}

export type CDULines = [
  CDULine | undefined,
  CDULine | undefined,
  CDULine | undefined,
  CDULine | undefined,
  CDULine | undefined,
  CDULine | undefined,
];

export abstract class DisplayablePage {
  title: string;
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;
  lines: CDULines;
  scratchpad?: string;
  protected abstract _pageID: string;

  public get pageID() {
    return this._pageID;
  }

  public toString(): string {
    return this._pageID;
  }
}

export enum CDUColor {
  Inop = 'inop',
  White = 'white',
  Green = 'green',
  Yellow = 'yellow',
  Cyan = 'cyan',
  Amber = 'amber',
  Red = 'red',
  Magenta = 'magenta',
}

export enum CDUTextSize {
  Small = 's-text',
  Large = 'b-text',
}

export const makeLines = (
  line1?: CDULine,
  line2?: CDULine,
  line3?: CDULine,
  line4?: CDULine,
  line5?: CDULine,
  line6?: CDULine,
): CDULines => {
  return [line1, line2, line3, line4, line5, line6];
};

export class CDUElement {
  color: CDUColor;
  size?: CDUTextSize;
  text: string;

  constructor(text: string, color: CDUColor = CDUColor.White, size?: CDUTextSize) {
    this.text = text;
    this.color = color;
    this.size = size;
  }
}

export class CDULine implements ICDULine {
  labelElements?: [CDUElement?, CDUElement?, CDUElement?, CDUElement?];
  textElements?: [CDUElement?, CDUElement?, CDUElement?, CDUElement?];

  constructor(left?: CDUElement, right?: CDUElement, leftLabel?: CDUElement, rightLabel?: CDUElement) {
    this.labelElements = [leftLabel, rightLabel, undefined, undefined];
    this.textElements = [left, right, undefined, undefined];
  }
}
