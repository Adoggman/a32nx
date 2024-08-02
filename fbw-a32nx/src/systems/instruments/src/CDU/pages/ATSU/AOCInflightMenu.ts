import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';
import { AOCMenu } from 'instruments/src/CDU/pages/ATSU/AOCMenu';

export class AOCInflightMenu extends DisplayablePage {
  title = 'AOC INFLT MENU';

  static readonly pageID: string = 'AOC_INFLT_MENU';
  _pageID = AOCInflightMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement('<DELAY'), undefined, new CDUElement('MESSAGES>'), new CDUElement('RECEIVED\xa0')),
    new CDULine(
      new CDUElement('<REQUEST'),
      new CDUElement('\xa0WX'),
      new CDUElement('MESSAGES>'),
      new CDUElement('SENT\xa0'),
    ),
    new CDULine(new CDUElement('<FREE TEXT'), undefined, new CDUElement('DIVERSION>', CDUColor.Inop)),
    new CDULine(new CDUElement('<ETA', CDUColor.Inop)),
    new CDULine(new CDUElement('<REPORT'), new CDUElement('\xa0POSITION'), new CDUElement('MISC>', CDUColor.Inop)),
  );

  onRSK5() {
    this.openPage(new AOCMenu(this.display));
  }
}
