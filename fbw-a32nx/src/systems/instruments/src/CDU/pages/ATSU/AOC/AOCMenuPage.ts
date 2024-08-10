import { CDUColor, CDUElement, CDULine, CDULineRight, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { AOCInflightMenuPage } from '@cdu/pages/ATSU/AOC/AOCInflightMenuPage';
import { AOCInitPage } from '@cdu/pages/ATSU/AOC/AOCInitPage';
import { ATSUMenuPage } from '@cdu/pages/ATSU/ATSUMenuPage';
import { CDUDisplay } from '@cdu/CDUDisplay';

export class AOCMenuPage extends DisplayablePage {
  static readonly pageID: string = 'AOC_MENU';
  _pageID = AOCMenuPage.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.title = 'AOC MENU';
    this.lines = makeLines(
      new CDULine('<INIT/PRES', undefined, 'FREE TEXT>'),
      new CDULine('<WX REQUEST'),
      new CDULine('<ATIS', undefined, 'MESSAGES>', 'RECEIVED\xa0'),
      new CDULineRight('MESSAGES>', 'SENT\xa0'),
      new CDULineRight(new CDUElement('DIVERSION>', CDUColor.Inop)),
      new CDULine('<RETURN', '\xa0ATSU DLK', new CDUElement('MISC>', CDUColor.Inop)),
    );
  }

  onLSK1() {
    this.openPage(new AOCInitPage(this.display));
  }

  onLSK2() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK3() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK6() {
    this.openPage(new ATSUMenuPage(this.display));
  }

  onRSK1() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK3() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK4() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK6() {
    this.openPage(new AOCInflightMenuPage(this.display));
  }
}
