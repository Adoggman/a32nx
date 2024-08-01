import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';

export class MCDUMenu extends DisplayablePage {
  title = 'MCDU MENU TS';
  pageCurrent?: number;
  pageCount?: number;
  titleLeft?: string;

  static readonly pageID: string = 'MCDU_MENU';
  _pageID = MCDUMenu.pageID;

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
  );
  scratchpad = 'SELECT DESIRED SYSTEM';
}
