export interface ICDUPage {
  title: string;
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;
  lines: [
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
  ];
  scratchpad: string;
}

export interface ICDULine {
  labels?: [string?, string?, string?, string?];
  text?: [string?, string?, string?, string?];
}

export class CDULine implements ICDULine {
  labels?: [string?, string?, string?, string?];
  text?: [string?, string?, string?, string?];

  constructor(leftText?: string, rightText?: string, leftLabel?: string, rightLabel?: string) {
    this.labels = [leftLabel, rightLabel, undefined, undefined];
    this.text = [leftText, rightText, undefined, undefined];
  }
}
