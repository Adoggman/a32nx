import { CDUElement, CDULine, CDULineRight, DisplayablePage, EmptyLine, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { AOCMenu } from '@cdu/pages/ATSU/AOC/AOCMenu';
import { ATSUDatalinkStatus } from '@cdu/pages/ATSU/ATSUDatalinkStatus';

export class ATSUMenu extends DisplayablePage {
  title = 'ATSU DATALINK';

  static readonly pageID: string = 'ATSU_MENU';
  _pageID = ATSUMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement('<ATC MENU')),
    new CDULineRight(new CDUElement('AOC MENU>')),
    EmptyLine,
    EmptyLine,
    new CDULineRight(new CDUElement('STATUS>'), new CDUElement('DATALINK\xa0')),
    new CDULineRight(new CDUElement('COMM MENU>')),
  );

  onLSK1() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK2() {
    this.openPage(new AOCMenu(this.display));
  }

  onRSK5() {
    this.openPage(new ATSUDatalinkStatus(this.display));
  }

  onRSK6() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }
}
