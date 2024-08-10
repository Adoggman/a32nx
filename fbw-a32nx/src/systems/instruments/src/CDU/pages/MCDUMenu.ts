import { CDUColor, CDUElement, CDULine, CDULineRight, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { TestPage } from '@cdu/pages/TestPage';
import { FMGCMenu } from '@cdu/pages/FMGCMenu';
import { ATSUMenu } from '@cdu/pages/ATSU/ATSUMenu';
import { NXFictionalMessages, NXSystemMessages } from '@cdu/data/NXMessages';
import { CDUDisplay } from '@cdu/CDUDisplay';

export class MCDUMenu extends DisplayablePage {
  static readonly pageID: string = 'MCDU_MENU';
  _pageID = MCDUMenu.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.title = 'MCDU MENU';
    this.lines = makeLines(
      new CDULine(
        new CDUElement('<FMGC', CDUColor.Green),
        undefined,
        new CDUElement('NAV B/UP>', CDUColor.Inop),
        new CDUElement('SELECT\xa0', CDUColor.Inop),
      ),
      new CDULine('<ATSU'),
      new CDULine('<AIDS'),
      new CDULine('<CFDS'),
      new CDULineRight('CDU TEST>'),
    );
    this.defaultMessage = NXSystemMessages.selectDesiredSystem;
  }

  onLSK1() {
    this.openPage(new FMGCMenu(this.display));
  }

  onLSK2() {
    this.openPage(new ATSUMenu(this.display));
  }

  onLSK3() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK4() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK5() {
    this.openPage(new TestPage(this.display));
  }
}
