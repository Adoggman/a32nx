import { CDUElement, CDULine, CDULineRight, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';
import { NXFictionalMessages } from 'instruments/src/CDU/model/NXMessages';
import { AOCMenu } from 'instruments/src/CDU/pages/ATSU/AOC/AOCMenu';
import { ATSUDatalinkStatus } from 'instruments/src/CDU/pages/ATSU/ATSUDatalinkStatus';

export class ATSUMenu extends DisplayablePage {
  title = 'ATSU DATALINK';

  static readonly pageID: string = 'ATSU_MENU';
  _pageID = ATSUMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement('<ATC MENU')),
    new CDULineRight(new CDUElement('AOC MENU>')),
    CDULine.EmptyLine,
    CDULine.EmptyLine,
    new CDULineRight(new CDUElement('STATUS>'), new CDUElement('DATALINK\xa0')),
    new CDULineRight(new CDUElement('COMM MENU>')),
  );

  onLSK1() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  onRSK2() {
    this.openPage(new AOCMenu(this.display));
  }

  onRSK5() {
    this.openPage(new ATSUDatalinkStatus(this.display));
  }

  onRSK6() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }
}
