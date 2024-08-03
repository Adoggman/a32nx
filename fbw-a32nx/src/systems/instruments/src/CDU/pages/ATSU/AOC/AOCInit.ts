import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULines,
  CDUTextSize,
  DisplayablePage,
  makeLines,
  PageTimeout,
} from 'instruments/src/CDU/model/CDUPage';
import { AOCMenu } from 'instruments/src/CDU/pages/ATSU/AOC/AOCMenu';

export class AOCInit extends DisplayablePage {
  title = 'INIT/REVIEW';
  titleLeft = 'AOC';
  pageCount = 2;
  pageCurrent = 1;
  refreshRate = PageTimeout.Slow;

  static readonly pageID: string = 'AOC_INIT_MENU';
  _pageID = AOCInit.pageID;

  lines = this.getLines();

  getLines(): CDULines {
    if (this.pageCurrent === 1) {
      return makeLines(
        new CDULine(
          new CDUElement('_______', CDUColor.Amber),
          new CDUElement('\xa0FMC FLT NO'),
          new CDUElement(this.display.secondsTohhmm(this.CDU.getTimeUTC()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('GMT\xa0'),
        ),
        new CDULine(new CDUElement('____', CDUColor.Amber), new CDUElement('\xa0DEP')),
        new CDULine(
          new CDUElement('____', CDUColor.Amber),
          new CDUElement('\xa0DEST'),
          new CDUElement('CREW DETAILS>', CDUColor.Inop),
        ),
        new CDULine(
          new CDUElement(formatFOB(this.CDU.getFOB()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('\xa0FOB'),
        ),
        new CDULine(
          new CDUElement('____', CDUColor.Amber),
          new CDUElement('\xa0ETE'),
          new CDUElement('INIT DATA REQ*', CDUColor.Cyan),
        ),
        new CDULine(new CDUElement('<AOC MENU'), undefined, undefined, new CDUElement('ADVISORY\xa0')),
      );
    } else if (this.pageCurrent === 2) {
      return makeLines(
        new CDULine(
          new CDUElement('----'),
          new CDUElement('\xa0OUT'),
          new CDUElement('----'),
          new CDUElement('OFF\xa0'),
          new CDUElement(this.display.secondsTohhmm(this.CDU.getDoors()), CDUColor.Green),
          new CDUElement('DOORS'),
        ),
        new CDULine(
          new CDUElement('----'),
          new CDUElement('\xa0ON'),
          new CDUElement('----'),
          new CDUElement('IN\xa0'),
          new CDUElement(this.display.secondsTohhmm(this.CDU.getTimeUTC()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('GMT'),
        ),
        new CDULine(
          new CDUElement('----'),
          new CDUElement('\xa0BLK TIME'),
          new CDUElement('----'),
          new CDUElement('FLT TIME\xa0'),
        ),
        new CDULine(
          new CDUElement(formatFOB(this.CDU.getFOB()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('\xa0FUEL REM'),
          new CDUElement('-------'),
          new CDUElement('LDG PILOT\xa0'),
        ),
        new CDULine(new CDUElement('*AUTOLAND <_>', CDUColor.Cyan)),
        new CDULine(new CDUElement('<AOC MENU'), undefined, undefined, new CDUElement('ADVISORY\xa0')),
      );
    }
  }

  onLSK6() {
    this.openPage(new AOCMenu(this.display));
  }

  onRefresh() {
    this.lines = this.getLines();
  }

  onRight() {
    if (this.pageCurrent === this.pageCount) {
      return;
    }
    this.pageCurrent = 2;
    this.lines = this.getLines();
    this.refresh();
  }

  onLeft() {
    if (this.pageCurrent === 1) {
      return;
    }
    this.pageCurrent = 1;
    this.lines = this.getLines();
    this.refresh();
  }
}

const formatFOB = (fob: number) => {
  return fob.toFixed(1).padStart(6, '\xa0');
};
