import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  makeLines,
  PageTimeout,
} from 'instruments/src/CDU/model/CDUPage';
import { AOCMenu } from 'instruments/src/CDU/pages/ATSU/AOCMenu';

export class AOCInit extends DisplayablePage {
  title = 'INIT/REVIEW';
  titleLeft = 'AOC';
  pageCount = 2;
  pageCurrent = 1;
  refreshRate = PageTimeout.Slow;

  static readonly pageID: string = 'AOC_INIT_MENU';
  _pageID = AOCInit.pageID;

  lines = makeLines(
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

  onLSK6() {
    this.openPage(new AOCMenu(this.display));
  }

  onRefresh() {
    this.openPage(new AOCInit(this.display));
  }
}

const formatFOB = (fob: number) => {
  return fob.toFixed(1).padStart(6, '\xa0');
};
