import { CDULine, ICDULine, ICDUPage } from 'instruments/src/CDU/model/CDUPage';

export class MCDUMenu implements ICDUPage {
  title = 'MCDU MENU TS';
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;

  private line1 = new CDULine('<FMGC', 'NAV B/UP>', undefined, 'SELECT\xa0');
  private line2 = new CDULine('<ATSU');
  private line3 = new CDULine('<AIDS');
  private line4 = new CDULine('<CFDS');
  lines = [this.line1, this.line2, this.line3, this.line4, undefined, undefined] as [
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
    ICDULine | undefined,
  ];
  scratchpad = 'SELECT DESIRED SYSTEM';
}
