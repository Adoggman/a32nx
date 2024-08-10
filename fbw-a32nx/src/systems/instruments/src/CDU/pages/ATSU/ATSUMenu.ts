import { CDULine, CDULineRight, DisplayablePage, EmptyLine, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { AOCMenu } from '@cdu/pages/ATSU/AOC/AOCMenu';
import { ATSUDatalinkStatus } from '@cdu/pages/ATSU/ATSUDatalinkStatus';
import { CDUDisplay } from '@cdu/CDUDisplay';

export class ATSUMenu extends DisplayablePage {
  static readonly pageID: string = 'ATSU_MENU';
  _pageID = ATSUMenu.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.title = 'ATSU DATALINK';

    this.lines = makeLines(
      new CDULine('<ATC MENU'),
      new CDULineRight('AOC MENU>'),
      EmptyLine,
      EmptyLine,
      new CDULineRight('STATUS>', 'DATALINK\xa0'),
      new CDULineRight('COMM MENU>'),
    );
  }

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
