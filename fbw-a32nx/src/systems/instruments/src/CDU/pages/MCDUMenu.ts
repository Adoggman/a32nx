import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULineRight,
  DisplayablePage,
  makeLines,
} from 'instruments/src/CDU/model/CDUPage';
import { TestPage } from 'instruments/src/CDU/pages/TestPage';
import { FMGCMenu } from 'instruments/src/CDU/pages/FMGCMenu';
import { ATSUMenu } from 'instruments/src/CDU/pages/ATSU/ATSUMenu';
import { NXFictionalMessages, NXSystemMessages } from 'instruments/src/CDU/model/NXMessages';

export class MCDUMenu extends DisplayablePage {
  title = 'MCDU MENU';

  static readonly pageID: string = 'MCDU_MENU';
  _pageID = MCDUMenu.pageID;

  lines = makeLines(
    new CDULine(
      new CDUElement('<FMGC', CDUColor.Green),
      undefined,
      new CDUElement('NAV B/UP>', CDUColor.Inop),
      new CDUElement('SELECT\xa0', CDUColor.Inop),
    ),
    new CDULine(new CDUElement('<ATSU')),
    new CDULine(new CDUElement('<AIDS')),
    new CDULine(new CDUElement('<CFDS')),
    new CDULineRight(new CDUElement('CDU TEST>')),
  );
  defaultMessage = NXSystemMessages.selectDesiredSystem;

  onLSK1() {
    this.openPage(new FMGCMenu(this.display));
  }

  onLSK2() {
    this.openPage(new ATSUMenu(this.display));
  }

  onLSK3() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  onLSK4() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  onRSK5() {
    this.openPage(new TestPage(this.display));
  }
}
