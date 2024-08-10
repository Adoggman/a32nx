import { CDUDisplay } from '@cdu/CDUDisplay';
import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { AOCMenuPage } from '@cdu/pages/ATSU/AOC/AOCMenuPage';

export class AOCInflightMenuPage extends DisplayablePage {
  static readonly pageID: string = 'AOC_INFLT_MENU';
  _pageID = AOCInflightMenuPage.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.title = 'AOC INFLT MENU';
    this.lines = makeLines(
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
  }

  onRSK5() {
    this.openPage(new AOCMenuPage(this.display));
  }
}
