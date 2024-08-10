import { CDUDisplay } from '@cdu/CDUDisplay';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, ICDULine, makeLines } from '@cdu/model/CDUPage';
import { Airport, Runway } from '../../../../../../../fbw-common/src/systems/navdata/shared';
import { RunwayUtils } from '../../../../../../../fbw-common/src/systems/shared/src';
import { FlightPlanPage } from '@cdu/pages/FlightPlanPage';
import { NXSystemMessages } from '@cdu/data/NXMessages';

enum PageMode {
  Runways,
  Sid,
  Trans,
}

export class Departures extends DisplayablePage {
  static readonly pageID: string = 'DEPARTURES';
  _pageID = Departures.pageID;
  index: number;
  airport: Airport;
  mode: PageMode;

  constructor(display: CDUDisplay) {
    super(display);
    this.index = 0;
    this.airport = this.CDU.flightPlanService.activeOrTemporary.originAirport;

    this.arrows = { up: true, down: false, left: true, right: true };
    this.mode = PageMode.Runways;

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
    if (this.isRunwaysMode) {
      this.arrows.down = this.index > 0;
      this.arrows.up = this.index + this.runwaysShown < this.numRunways();
    }
  }

  private get isRunwaysMode() {
    return this.mode === PageMode.Runways;
  }

  private get isSidMode() {
    return this.mode === PageMode.Sid;
  }

  private get isTransMode() {
    return this.mode === PageMode.Trans;
  }

  private get hasTemporary() {
    return this.CDU.flightPlanService.hasTemporary;
  }

  private get currentColor() {
    return this.hasTemporary ? CDUColor.Yellow : CDUColor.Green;
  }

  makeDepartureLines() {
    if (this.mode === PageMode.Runways) {
      this.makeRunwayLines();
    }
  }

  makeRunwayLines() {
    const runways = this.getRunways();
    const runwayLines: ICDULine[] = [];
    let lastRunway: Runway;
    let lastColor: CDUColor;
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
      const isCurrentRunway = this.isCurrentRunway(runway);
      const color = isCurrentRunway ? this.currentColor : CDUColor.Cyan;
      runwayLines.push(
        new CDULine(
          new CDUElement(
            (isCurrentRunway ? '\xa0' : '{') + RunwayUtils.runwayString(runway.ident).padEnd(3, '\xa0'),
            color,
            CDUTextSize.Large,
            new CDUElement(runway.lsIdent ? '-ILS\xa0\xa0' : '\xa0\xa0\xa0\xa0\xa0\xa0', color, CDUTextSize.Small),
          ),
          lastRunway
            ? new CDUElement('\xa0\xa0\xa0' + lastRunway.magneticBearing.toFixed(0).padStart(3, '0'), lastColor)
            : undefined,
        ),
      );
      lastRunway = runway;
      lastColor = color;
    }
    runwayLines[0].leftLabel = new CDUElement('\xa0\xa0\xa0AVAILABLE RUNWAYS');
    const lastLine = this.bottomLine();
    if (lastRunway) {
      lastLine.leftLabel = new CDUElement(
        '\xa0\xa0\xa0' + lastRunway.magneticBearing.toFixed(0).padStart(3, '0'),
        CDUColor.Cyan,
      );
    }

    this.lines = makeLines(this.topLine(), runwayLines[0], runwayLines[1], runwayLines[2], runwayLines[3], lastLine);
  }

  private isCurrentRunway(runway: Runway) {
    return (
      this.CDU.flightPlanService.activeOrTemporary.originRunway &&
      this.CDU.flightPlanService.activeOrTemporary.originRunway.ident === runway.ident
    );
  }

  topLine(): ICDULine {
    const runway = this.CDU.flightPlanService.activeOrTemporary.originRunway;
    return new CDULine(
      runway
        ? new CDUElement(
            RunwayUtils.runwayString(runway.ident),
            this.currentColor,
            CDUTextSize.Large,
            runway.lsIdent ? new CDUElement('-ILS', this.currentColor, CDUTextSize.Small) : undefined,
          )
        : '---',
      ' RWY',
      '------',
      'TRANS\xa0',
      '------',
      'SID',
    );
  }

  bottomLine(): ICDULine {
    return this.hasTemporary
      ? new CDULine(new CDUElement('{ERASE', CDUColor.Amber), undefined, new CDUElement('INSERT*', CDUColor.Amber))
      : new CDULine('<RETURN');
  }

  getRunways() {
    return this.CDU.flightPlanService.activeOrTemporary.availableOriginRunways;
  }

  private runwaysShown = 4;
  numRunways() {
    return this.CDU.flightPlanService.activeOrTemporary.availableOriginRunways.length;
  }

  onLSK2() {
    if (this.isRunwaysMode && this.numRunways() > 0) {
      const runway = this.getRunways()[this.index];
      if (this.isCurrentRunway(runway)) {
        this.scratchpad.setMessage(NXSystemMessages.notAllowed);
        return;
      }

      this.CDU.flightPlanService.setOriginRunway(runway.ident).then(() => {
        this.refresh();
      });
    }
  }

  onLSK3() {
    if (this.isRunwaysMode) {
      if (this.index + 1 > this.getRunways().length) {
        return;
      }
      const runway = this.getRunways()[this.index + 1];
      if (this.isCurrentRunway(runway)) {
        this.scratchpad.setMessage(NXSystemMessages.notAllowed);
        return;
      }
      this.CDU.flightPlanService.setOriginRunway(runway.ident).then(() => {
        this.refresh();
      });
    }
  }
  onLSK4() {
    if (this.isRunwaysMode) {
      if (this.index + 2 > this.getRunways().length) {
        return;
      }
      const runway = this.getRunways()[this.index + 2];
      if (this.isCurrentRunway(runway)) {
        this.scratchpad.setMessage(NXSystemMessages.notAllowed);
        return;
      }
      this.CDU.flightPlanService.setOriginRunway(runway.ident).then(() => {
        this.refresh();
      });
    }
  }
  onLSK5() {
    if (this.isRunwaysMode) {
      if (this.index + 3 > this.getRunways().length) {
        return;
      }
      const runway = this.getRunways()[this.index + 3];
      if (this.isCurrentRunway(runway)) {
        this.scratchpad.setMessage(NXSystemMessages.notAllowed);
        return;
      }
      this.CDU.flightPlanService.setOriginRunway(runway.ident).then(() => {
        this.refresh();
      });
    }
  }

  onLSK6() {
    if (this.hasTemporary) {
      this.CDU.flightPlanService.temporaryDelete().then(() => {
        this.display.openPage(new FlightPlanPage(this.display));
      });
    } else {
      // <RETURN
      this.display.openPage(new FlightPlanPage(this.display));
    }
  }

  onRSK6() {
    if (this.hasTemporary) {
      this.CDU.flightPlanService.temporaryInsert().then(() => {
        this.openPage(new FlightPlanPage(this.display));
      });
    }
  }

  onUp() {
    if (this.isRunwaysMode) {
      if (this.index + this.runwaysShown > this.numRunways()) {
        return;
      }
      this.index = this.index + this.runwaysShown;
      this.refresh();
    }
  }

  onDown() {
    if (this.isRunwaysMode) {
      if (this.index <= 0) {
        return;
      }
      this.index = this.index - this.runwaysShown;
      this.refresh();
    }
  }
}
