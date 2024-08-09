import { CDUColor, CDUElement, CDULine, CDULineRight, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { AOCInflightMenu } from '@cdu/pages/ATSU/AOC/AOCInflightMenu';
import { AOCInit } from '@cdu/pages/ATSU/AOC/AOCInit';
import { ATSUMenu } from '@cdu/pages/ATSU/ATSUMenu';

export class AOCMenu extends DisplayablePage {
  title = 'AOC MENU';

  static readonly pageID: string = 'AOC_MENU';
  _pageID = AOCMenu.pageID;

  lines = makeLines(
    new CDULine('<INIT/PRES', undefined, 'FREE TEXT>'),
    new CDULine('<WX REQUEST'),
    new CDULine('<ATIS', undefined, 'MESSAGES>', 'RECEIVED\xa0'),
    new CDULineRight('MESSAGES>', 'SENT\xa0'),
    new CDULineRight(new CDUElement('DIVERSION>', CDUColor.Inop)),
    new CDULine('<RETURN', '\xa0ATSU DLK', new CDUElement('MISC>', CDUColor.Inop)),
  );

  onLSK1() {
    this.openPage(new AOCInit(this.display));
  }

  onLSK2() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK3() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK6() {
    this.openPage(new ATSUMenu(this.display));
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
    this.openPage(new AOCInflightMenu(this.display));
  }
}
