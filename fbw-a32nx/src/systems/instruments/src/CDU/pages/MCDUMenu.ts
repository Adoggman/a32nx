import { CDUColor, CDUElement, CDULine, ICDUPage, makeLines } from 'instruments/src/CDU/model/CDUPage';

export class MCDUMenu implements ICDUPage {
  title = 'MCDU MENU TS';
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;

  lines = makeLines(
    new CDULine(
      new CDUElement('<FMGC', CDUColor.Green),
      new CDUElement('NAV B/UP>', CDUColor.Inop),
      undefined,
      new CDUElement('SELECT\xa0', CDUColor.Inop),
    ),
    new CDULine(new CDUElement('<ATSU')),
    new CDULine(new CDUElement('<AIDS')),
    new CDULine(new CDUElement('<CFDS')),
    new CDULine(
      new CDUElement('TEST1', CDUColor.Inop),
      new CDUElement('TEST2', CDUColor.White),
      new CDUElement('TEST3', CDUColor.Green),
      new CDUElement('TEST4', CDUColor.Yellow),
    ),
    new CDULine(
      new CDUElement('TEST5', CDUColor.Cyan),
      new CDUElement('TEST6', CDUColor.Amber),
      new CDUElement('TEST7', CDUColor.Red),
      new CDUElement('TEST8', CDUColor.Magenta),
    ),
  );
  scratchpad = 'SELECT DESIRED SYSTEM';
}
