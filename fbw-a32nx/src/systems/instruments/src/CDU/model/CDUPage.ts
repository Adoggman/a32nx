import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { CDU } from 'instruments/src/CDU/model/CDU';

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

export type Arrows = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};

export abstract class DisplayablePage {
  title: string;
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;
  lines: CDULines;
  scratchpad?: string;
  arrows: Arrows = { up: false, down: false, left: false, right: false };
  display: CDUDisplay;
  protected abstract _pageID: string;

  onUp(): void {}
  onDown(): void {}
  onLeft(): void {}
  onRight(): void {}
  onLSK1(): void {}
  onLSK2(): void {}
  onLSK3(): void {}
  onLSK4(): void {}
  onLSK5(): void {}
  onLSK6(): void {}
  onRSK1(): void {}
  onRSK2(): void {}
  onRSK3(): void {}
  onRSK4(): void {}
  onRSK5(): void {}
  onRSK6(): void {}

  refresh(): void {
    this.display.refresh();
  }

  openPage(page: DisplayablePage) {
    this.display.openPage(page);
  }

  constructor(display: CDUDisplay) {
    this.display = display;
  }

  public get pageID() {
    return this._pageID;
  }

  public get CDU() {
    return CDU.instances[this.display.Side];
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

  constructor(left?: CDUElement, leftLabel?: CDUElement, right?: CDUElement, rightLabel?: CDUElement) {
    this.labelElements = [leftLabel, rightLabel, undefined, undefined];
    this.textElements = [left, right, undefined, undefined];
  }
}
