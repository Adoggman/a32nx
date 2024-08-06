import { secondsTohhmm } from '@cdu/Format';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULines,
  CDUTextSize,
  DisplayablePage,
  EmptyLine,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { SimbriefStatus } from '@cdu/model/Subsystem/Simbrief';
import { AOCMenu } from '@cdu/pages/ATSU/AOC/AOCMenu';

export class AOCInit extends DisplayablePage {
  title = 'INIT/REVIEW';
  titleLeft = 'AOC';
  pageCount = 2;
  pageCurrent = 1;
  refreshRate = RefreshRate.None;

  static readonly pageID: string = 'AOC_INIT_MENU';
  _pageID = AOCInit.pageID;

  lines = this.getLines();

  getLines(): CDULines {
    if (this.pageCurrent === 1) {
      const simbriefData = this.CDU.Simbrief.Data;
      return makeLines(
        new CDULine(
          new CDUElement(
            simbriefData?.flightNumber ?? '_______',
            simbriefData?.flightNumber ? CDUColor.Green : CDUColor.Amber,
          ),
          new CDUElement('\xa0FMC FLT NO'),
          new CDUElement(secondsTohhmm(this.CDU.getTimeUTC()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('GMT\xa0'),
        ),
        new CDULine(
          new CDUElement(
            simbriefData?.origin?.icao ?? '____',
            simbriefData?.origin?.icao ? CDUColor.Cyan : CDUColor.Amber,
          ),
          new CDUElement('\xa0DEP'),
        ),
        new CDULine(
          new CDUElement(
            simbriefData?.destination?.icao ?? '____',
            simbriefData?.destination?.icao ? CDUColor.Cyan : CDUColor.Amber,
          ),
          new CDUElement('\xa0DEST'),
          new CDUElement('CREW DETAILS>', CDUColor.Inop),
        ),
        new CDULine(
          new CDUElement(formatFOB(this.CDU.getFOB()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('\xa0FOB'),
        ),
        new CDULine(
          new CDUElement(
            simbriefData?.times?.estTimeEnroute ? secondsTohhmm(simbriefData.times.estTimeEnroute) : '____',
            simbriefData?.times?.estTimeEnroute ? CDUColor.Cyan : CDUColor.Amber,
          ),
          new CDUElement('\xa0ETE'),
          new CDUElement(
            `INIT DATA REQ${this.CDU.Simbrief.Status === SimbriefStatus.Requesting ? '\xa0' : '*'}`,
            CDUColor.Cyan,
          ),
        ),
        new CDULine(new CDUElement('<AOC MENU'), undefined, undefined, new CDUElement('ADVISORY\xa0')),
      );
    } else if (this.pageCurrent === 2) {
      const currentTime = this.CDU.getTimeUTC();
      const AOCTimes = this.CDU.AOC.Times;
      const blockTime = AOCTimes.block();
      const flightTime = AOCTimes.inflight();
      return makeLines(
        new CDULine(
          new CDUElement(secondsTohhmm(AOCTimes.out), AOCTimes.out ? CDUColor.Green : CDUColor.White),
          new CDUElement('\xa0OUT'),
          new CDUElement(secondsTohhmm(AOCTimes.off), AOCTimes.off ? CDUColor.Green : CDUColor.White),
          new CDUElement('OFF\xa0'),
          new CDUElement(secondsTohhmm(AOCTimes.doors), AOCTimes.doors ? CDUColor.Green : CDUColor.White),
          new CDUElement('DOORS'),
        ),
        new CDULine(
          new CDUElement(secondsTohhmm(AOCTimes.on), AOCTimes.on ? CDUColor.Green : CDUColor.White),
          new CDUElement('\xa0ON'),
          new CDUElement(secondsTohhmm(AOCTimes.in), AOCTimes.in ? CDUColor.Green : CDUColor.White),
          new CDUElement('IN\xa0'),
          new CDUElement(secondsTohhmm(currentTime), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('GMT'),
        ),
        new CDULine(
          new CDUElement(secondsTohhmm(blockTime), blockTime ? CDUColor.Green : CDUColor.White),
          new CDUElement('\xa0BLK TIME'),
          new CDUElement(secondsTohhmm(flightTime), flightTime ? CDUColor.Green : CDUColor.White),
          new CDUElement('FLT TIME\xa0'),
        ),
        new CDULine(
          new CDUElement(formatFOB(this.CDU.getFOB()), CDUColor.Green, CDUTextSize.Small),
          new CDUElement('\xa0FUEL REM'),
          new CDUElement('-------'),
          new CDUElement('LDG PILOT\xa0'),
        ),
        EmptyLine,
        new CDULine(new CDUElement('<AOC MENU')),
      );
    }
  }

  onRSK5() {
    if (this.pageCurrent === 1) {
      this.CDU.Simbrief.loadOFP();
      this.lines[4].textElements[1] = new CDUElement('INIT DATA REQ\xa0', CDUColor.Cyan);
      this.refreshRate = RefreshRate.Slow;
      this.refresh();
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
