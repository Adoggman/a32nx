import { CDULine, CDULineRight, DisplayablePage, EmptyLine, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { AOCMenuPage } from '@cdu/pages/ATSU/AOC/AOCMenuPage';
import { ATSUDatalinkStatusPage } from '@cdu/pages/ATSU/ATSUDatalinkStatusPage';
import { CDUDisplay } from '@cdu/CDUDisplay';

export class ATSUMenuPage extends DisplayablePage {
  static readonly pageID: string = 'ATSU_MENU';
  _pageID = ATSUMenuPage.pageID;

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
    this.openPage(new AOCMenuPage(this.display));
  }

  onRSK5() {
    this.openPage(new ATSUDatalinkStatusPage(this.display));
  }

  onRSK6() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }
}
