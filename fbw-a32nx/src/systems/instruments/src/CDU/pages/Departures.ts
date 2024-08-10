import { CDUDisplay } from '@cdu/CDUDisplay';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, ICDULine, makeLines } from '@cdu/model/CDUPage';
import { Airport, Runway } from '../../../../../../../fbw-common/src/systems/navdata/shared';
import { RunwayUtils } from '../../../../../../../fbw-common/src/systems/shared/src';

export class Departures extends DisplayablePage {
  static readonly pageID: string = 'DEPARTURES';
  _pageID = Departures.pageID;
  index: number;
  airport: Airport;

  constructor(display: CDUDisplay, airport: Airport) {
    super(display);
    this.index = 0;
    this.airport = airport;

    this.arrows = { up: true, down: false, left: true, right: true };

    this.title = new CDUElement(
      'DEPARTURES ',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement(
        'FROM ',
        CDUColor.White,
        CDUTextSize.Small,
        new CDUElement(this.airport.ident + '\xa0\xa0', CDUColor.Green, CDUTextSize.Large),
      ),
    );

    this.makeDepartureLines();
  }

  refresh() {
    this.makeDepartureLines();
    this.updateArrows();
    super.refresh();
  }

  updateArrows() {
    this.arrows.down = this.index > 0;
    this.arrows.up = this.index + this.runwaysShown < this.numRunways();
  }

  makeDepartureLines() {
    const runways = this.getRunways();
    const runwayLines: ICDULine[] = [];
    let lastRunway: Runway;
    for (let row = 0; row < 4; row++) {
      const runwayIndex = this.index + row;
      if (runwayIndex >= runways.length) {
        runwayLines.push(
          new CDULine(
            undefined,
            lastRunway
              ? new CDUElement('\xa0\xa0\xa0' + lastRunway.magneticBearing.toFixed(0).padStart(3, '0'), CDUColor.Cyan)
              : undefined,
          ),
        );
        lastRunway = undefined;
        continue;
      }
      const runway = runways[runwayIndex];
      runwayLines.push(
        new CDULine(
          new CDUElement(
            '{' + RunwayUtils.runwayString(runway.ident).padEnd(3, '\xa0'),
            CDUColor.Cyan,
            CDUTextSize.Large,
            new CDUElement(
              runway.lsIdent ? '-ILS\xa0\xa0' : '\xa0\xa0\xa0\xa0\xa0\xa0',
              CDUColor.Cyan,
              CDUTextSize.Small,
            ),
          ),
          lastRunway
            ? new CDUElement('\xa0\xa0\xa0' + lastRunway.magneticBearing.toFixed(0).padStart(3, '0'), CDUColor.Cyan)
            : undefined,
        ),
      );
      lastRunway = runway;
    }
    runwayLines[0].leftLabel = new CDUElement('\xa0\xa0\xa0AVAILABLE RUNWAYS');
    const lastLine = new CDULine(
      '<RETURN',
      lastRunway
        ? new CDUElement('\xa0\xa0\xa0' + lastRunway.magneticBearing.toFixed(0).padStart(3, '0'), CDUColor.Cyan)
        : undefined,
    );
    this.lines = makeLines(this.topLine(), runwayLines[0], runwayLines[1], runwayLines[2], runwayLines[3], lastLine);
  }

  topLine(): ICDULine {
    return new CDULine('---', ' RWY', '------', 'TRANS\xa0', '------', 'SID');
  }

  getRunways() {
    return this.CDU.flightPlanService.active.availableOriginRunways;
  }

  private runwaysShown = 4;
  numRunways() {
    return this.CDU.flightPlanService.active.availableOriginRunways.length;
  }

  onLSK6() {
    this.display.openLastPage();
  }

  onUp() {
    if (this.index + this.runwaysShown > this.numRunways()) {
      return;
    }
    this.index = this.index + this.runwaysShown;
    this.refresh();
  }

  onDown() {
    if (this.index <= 0) {
      return;
    }
    this.index = this.index - this.runwaysShown;
    this.refresh();
  }
}
