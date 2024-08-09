import { CDUDisplay } from '@cdu/CDUDisplay';
import { CDU } from '@cdu/model/CDU';
import { TypeIMessage } from '@cdu/data/NXMessages';

export interface ICDULine {
  left?: ICDUElement;
  leftLabel?: ICDUElement;
  right?: ICDUElement;
  rightLabel?: ICDUElement;
  center?: ICDUElement;
  centerLabel?: ICDUElement;
}

export type CDULines = [
  ICDULine | undefined,
  ICDULine | undefined,
  ICDULine | undefined,
  ICDULine | undefined,
  ICDULine | undefined,
  ICDULine | undefined,
];

export type Arrows = {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
};

export enum RefreshRate {
  None = 0,
  Fast = 500,
  Medium = 1000,
  Dyn = 1500,
  Default = 2000,
  Slow = 3000,
}

export abstract class DisplayablePage {
  title: string;
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;
  lines: CDULines;
  defaultMessage?: TypeIMessage;
  arrows: Arrows = { up: false, down: false, left: false, right: false };
  display: CDUDisplay;
  allowsTyping: boolean = false;
  protected abstract _pageID: string;
  refreshRate: RefreshRate = RefreshRate.None;

  protected get scratchpad() {
    return this.display.scratchpad;
  }

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

  // Easy refresh: just reopen the page in this function. Better performance: change individual parts of page
  onRefresh(): void {}

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
  line1?: ICDULine,
  line2?: ICDULine,
  line3?: ICDULine,
  line4?: ICDULine,
  line5?: ICDULine,
  line6?: ICDULine,
): CDULines => {
  return [line1, line2, line3, line4, line5, line6];
};

export interface ICDUElement {
  color?: CDUColor;
  size?: CDUTextSize;
  text: string;
  secondElement?: ICDUElement;
}

export class CDUElement implements ICDUElement {
  color: CDUColor;
  size?: CDUTextSize;
  text: string;
  secondElement?: CDUElement;

  constructor(text: string, color: CDUColor = CDUColor.White, size?: CDUTextSize, secondPart?: CDUElement) {
    this.text = text;
    this.color = color;
    this.size = size;
    this.secondElement = secondPart;
  }
}

export class CDULine implements ICDULine {
  left?: ICDUElement;
  leftLabel?: ICDUElement;
  right?: ICDUElement;
  rightLabel?: ICDUElement;
  center?: ICDUElement;
  centerLabel?: ICDUElement;

  constructor(
    left?: ICDUElement | string,
    leftLabel?: ICDUElement | string,
    right?: ICDUElement | string,
    rightLabel?: ICDUElement | string,
    center?: ICDUElement | string,
    centerLabel?: ICDUElement | string,
  ) {
    this.left = typeof left === 'string' ? { text: left } : left;
    this.leftLabel = typeof leftLabel === 'string' ? { text: leftLabel } : leftLabel;
    this.right = typeof right === 'string' ? { text: right } : right;
    this.rightLabel = typeof rightLabel === 'string' ? { text: rightLabel } : rightLabel;
    this.center = typeof center === 'string' ? { text: center } : center;
    this.centerLabel = typeof centerLabel === 'string' ? { text: centerLabel } : centerLabel;
  }
}

export const EmptyLine = undefined;

export class CDULineRight extends CDULine {
  constructor(right?: ICDUElement | string, rightLabel?: ICDUElement | string) {
    super(undefined, undefined, right, rightLabel);
  }
}
