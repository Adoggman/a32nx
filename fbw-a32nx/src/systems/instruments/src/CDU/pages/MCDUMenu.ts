import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';
import { TestPage } from 'instruments/src/CDU/pages/TestPage';

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
    new CDULine(undefined, new CDUElement('CDU TEST>')),
  );
  scratchpad = 'SELECT DESIRED SYSTEM';

  onRSK5() {
    this.openPage(new TestPage(this.display));
  }
}
