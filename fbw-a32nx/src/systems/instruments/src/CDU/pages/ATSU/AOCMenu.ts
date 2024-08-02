import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';
import { AOCInflightMenu } from 'instruments/src/CDU/pages/ATSU/AOCInflightMenu';
import { AOCInit } from 'instruments/src/CDU/pages/ATSU/AOCInit';
import { ATSUMenu } from 'instruments/src/CDU/pages/ATSU/ATSUMenu';

export class AOCMenu extends DisplayablePage {
  title = 'AOC MENU';

  static readonly pageID: string = 'AOC_MENU';
  _pageID = AOCMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement('<INIT/PRES'), undefined, new CDUElement('FREE TEXT>')),
    new CDULine(new CDUElement('<WX REQUEST')),
    new CDULine(new CDUElement('<ATIS'), undefined, new CDUElement('MESSAGES>'), new CDUElement('RECEIVED\xa0')),
    new CDULine(undefined, undefined, new CDUElement('MESSAGES>'), new CDUElement('SENT\xa0')),
    new CDULine(undefined, undefined, new CDUElement('DIVERSION>', CDUColor.Inop)),
    new CDULine(new CDUElement('<RETURN'), new CDUElement('\xa0ATSU DLK'), new CDUElement('MISC>', CDUColor.Inop)),
  );

  onLSK1() {
    this.openPage(new AOCInit(this.display));
  }

  onLSK6() {
    this.openPage(new ATSUMenu(this.display));
  }

  onRSK6() {
    this.openPage(new AOCInflightMenu(this.display));
  }
}
