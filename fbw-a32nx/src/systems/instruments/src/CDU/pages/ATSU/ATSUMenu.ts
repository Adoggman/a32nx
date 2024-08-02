import { CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';
import { AOCMenu } from 'instruments/src/CDU/pages/ATSU/AOCMenu';

export class ATSUMenu extends DisplayablePage {
  title = 'ATSU DATALINK';

  static readonly pageID: string = 'ATSU_MENU';
  _pageID = ATSUMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement('<ATC MENU')),
    new CDULine(undefined, undefined, new CDUElement('AOC MENU>')),
    undefined,
    undefined,
    new CDULine(undefined, undefined, new CDUElement('STATUS>'), new CDUElement('DATALINK\xa0')),
    new CDULine(undefined, undefined, new CDUElement('COMM MENU>')),
  );

  onRSK2() {
    this.openPage(new AOCMenu(this.display));
  }
}
