import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, ICDULine, makeLines } from '@cdu/model/CDUPage';
import {
  Airport,
  Departure,
  ProcedureTransition,
  Runway,
} from '../../../../../../../fbw-common/src/systems/navdata/shared';
import { RunwayUtils } from '../../../../../../../fbw-common/src/systems/shared/src';
import { FlightPlanPage } from '@cdu/pages/FlightPlanPage';
import { NXSystemMessages } from '@cdu/data/NXMessages';
import { NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from '@cdu/CDUDisplay';

enum PageMode {
  Runways,
  Departure,
}

export class Departures extends DisplayablePage {
  static readonly pageID: string = 'DEPARTURES';
  _pageID = Departures.pageID;
  index: number;
  airport: Airport;
  mode: PageMode;
  noneDeparture: boolean;
  noneTransition: boolean;

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
    this.arrows.down = this.index > 0;
    this.arrows.up = this.index + this.rowsShown < this.maxIndex;
  }

  private get currentDeparture() {
    return this.CDU.flightPlanService.activeOrTemporary.originDeparture;
  }

  private get currentRunway() {
    return this.CDU.flightPlanService.activeOrTemporary.originRunway;
  }

  private get hasTransitions() {
    return this.currentDeparture?.enrouteTransitions.length > 0;
  }

  private get currentTransition() {
    return this.CDU.flightPlanService.activeOrTemporary.departureEnrouteTransition;
  }

  private get maxIndex() {
    return this.isRunwaysMode ? this.numRunways() : Math.max(this.numDepartures() + 1, this.numTransitions() + 1);
  }

  private get isRunwaysMode() {
    return this.mode === PageMode.Runways;
  }

  private get isDepartureMode() {
    return this.mode === PageMode.Departure;
  }

  private get hasTemporary() {
    return this.CDU.flightPlanService.hasTemporary;
  }

  private get currentColor() {
    return this.hasTemporary ? CDUColor.Yellow : CDUColor.Green;
  }

  makeDepartureLines() {
    if (this.isRunwaysMode) {
      this.makeRunwayLines();
    } else {
      this.makeSidLines();
    }
  }

  makeSidLines() {
    const departures = this.getDepartures();
    const transitions = this.currentDeparture ? this.currentDeparture.enrouteTransitions : [];
    const departureLines: ICDULine[] = [];
    for (let row = 0; row < 4; row++) {
      const sharedIndex = this.index + row;
      const departure = sharedIndex < departures.length ? departures[sharedIndex] : undefined;
      const isNoSid = sharedIndex === departures.length;
      const transition = sharedIndex < transitions.length ? transitions[sharedIndex] : undefined;
      const isNoTransition = sharedIndex === transitions.length && transitions.length !== 0;
      const isCurrentDeparture = this.isCurrentDeparture(departure);
      const isCurrentTransition = this.isCurrentTransition(transition);
      departureLines.push(
        new CDULine(
          departure
            ? new CDUElement(
                (isCurrentDeparture ? '\xa0' : '{') + departure.ident,
                isCurrentDeparture ? this.currentColor : CDUColor.Cyan,
              )
            : new CDUElement(
                isNoSid ? (this.noneDeparture ? ' ' : '{') + 'NO SID' : '',
                this.noneDeparture ? this.currentColor : CDUColor.Cyan,
              ),
          undefined,
          transition
            ? new CDUElement(
                transition.ident + (isCurrentTransition ? '\xa0' : '}'),
                isCurrentTransition ? this.currentColor : CDUColor.Cyan,
              )
            : new CDUElement(
                isNoTransition ? 'NO TRANS' + (this.noneTransition ? ' ' : '}') : '',
                this.noneTransition ? this.currentColor : CDUColor.Cyan,
              ),
        ),
      );
    }

    const lastLine = this.bottomLine();
    lastLine.center = new CDUElement('NONE', this.currentColor);
    lastLine.centerLabel = new CDUElement('EOSID');

    departureLines[0].leftLabel = new CDUElement('SIDS');
    departureLines[0].centerLabel = new CDUElement('AVAILABLE');
    departureLines[0].rightLabel = new CDUElement('TRANS');

    this.lines = makeLines(
      this.topLine(),
      departureLines[0],
      departureLines[1],
      departureLines[2],
      departureLines[3],
      lastLine,
    );
  }

  makeRunwayLines() {
    const runways = this.getRunways();
    const runwayLines: ICDULine[] = [];
    let lastRunway: Runway;
    let lastColor: CDUColor;
    for (let row = 0; row < 4; row++) {
      const runwayIndex = this.index + row;
      if (runwayIndex >= runways.length) {
        runwayLines.push({ leftLabel: lastRunway ? this.runwayLabel(lastRunway, lastColor) : undefined });
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
            new CDUElement(
              runway.lsIdent ? '-ILS' : '\xa0\xa0\xa0\xa0',
              color,
              CDUTextSize.Small,
              new CDUElement(
                NXUnits.mToUser(runway.length).toFixed(0).padStart(6, '\xa0'),
                color,
                CDUTextSize.Large,
                new CDUElement(NXUnits.userDistanceUnit().padEnd(2), color, CDUTextSize.Small),
              ),
            ),
          ),
          lastRunway ? this.runwayLabel(lastRunway, lastColor) : undefined,
        ),
      );
      lastRunway = runway;
      lastColor = color;
    }
    runwayLines[0].leftLabel = new CDUElement('\xa0\xa0\xa0AVAILABLE RUNWAYS');
    const lastLine = this.bottomLine();
    if (lastRunway) {
      lastLine.leftLabel = this.runwayLabel(lastRunway, lastColor);
    }

    this.lines = makeLines(this.topLine(), runwayLines[0], runwayLines[1], runwayLines[2], runwayLines[3], lastLine);
  }

  runwayLabel(runway: Runway, color: CDUColor) {
    return new CDUElement(
      '\xa0\xa0\xa0' + runway.magneticBearing.toFixed(0).padStart(3, '0'),
      color,
      CDUTextSize.Small,
      runway.lsIdent
        ? new CDUElement(
            `\xa0\xa0${runway.lsIdent.padStart(6)}/${runway.lsFrequencyChannel.toFixed(2)}`,
            color,
            CDUTextSize.Small,
          )
        : undefined,
    );
  }

  private isCurrentRunway(runway: Runway) {
    return this.currentRunway && this.currentRunway.ident === runway.ident;
  }

  private isCurrentDeparture(departure: Departure) {
    return this.currentDeparture && departure && this.currentDeparture.databaseId === departure.databaseId;
  }

  private isCurrentTransition(transition: ProcedureTransition) {
    return this.currentTransition && transition && this.currentTransition.databaseId === transition.databaseId;
  }

  topLine(): ICDULine {
    return new CDULine(
      this.currentRunway
        ? new CDUElement(
            RunwayUtils.runwayString(this.currentRunway.ident.padEnd(3, '\xa0')),
            this.currentColor,
            CDUTextSize.Large,
            this.currentRunway.lsIdent ? new CDUElement('-ILS', this.currentColor, CDUTextSize.Small) : undefined,
          )
        : '---',
      ' RWY',
      this.currentTransition
        ? new CDUElement(this.currentTransition.ident, this.currentColor)
        : this.noneDeparture || this.noneTransition || (this.currentDeparture && !this.hasTransitions)
          ? new CDUElement('NONE', this.currentColor)
          : '------',
      'TRANS\xa0',
      this.currentDeparture || this.noneDeparture
        ? new CDUElement(this.noneDeparture ? 'NONE' : this.currentDeparture.ident, this.currentColor)
        : '------',
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

  getDepartures() {
    return this.CDU.flightPlanService.activeOrTemporary.availableDepartures;
  }

  private rowsShown = 4;
  numRunways() {
    return this.getRunways().length;
  }

  numDepartures() {
    return this.getDepartures().length;
  }

  numTransitions() {
    return this.currentDeparture ? this.currentDeparture.enrouteTransitions.length : 0;
  }

  trySetRunway(runway: Runway) {
    if (this.isCurrentRunway(runway)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.CDU.flightPlanService.setOriginRunway(runway.ident).then(() => {
      this.setMode(PageMode.Departure);
    });
  }

  trySetDeparture(departure: Departure) {
    if (this.isCurrentDeparture(departure)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.noneDeparture = !departure;
    this.CDU.flightPlanService.setDepartureProcedure(departure?.databaseId).then(() => {
      this.refresh();
    });
  }

  trySetTransition(transition: ProcedureTransition) {
    if (transition && this.isCurrentTransition(transition)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.noneTransition = !transition;
    this.CDU.flightPlanService.setDepartureEnrouteTransition(transition?.databaseId).then(() => {
      this.refresh();
    });
  }

  onLSK2() {
    const index = this.index + 0;
    if (this.isRunwaysMode) {
      this.trySetRunwayAtIndex(index);
    } else if (this.isDepartureMode) {
      this.trySetDepartureAtIndex(index);
    }
  }

  onLSK3() {
    const index = this.index + 1;
    if (this.isRunwaysMode) {
      this.trySetRunwayAtIndex(index);
    } else if (this.isDepartureMode) {
      this.trySetDepartureAtIndex(index);
    }
  }

  onLSK4() {
    const index = this.index + 2;
    if (this.isRunwaysMode) {
      this.trySetRunwayAtIndex(index);
    } else if (this.isDepartureMode) {
      this.trySetDepartureAtIndex(index);
    }
  }

  onLSK5() {
    const index = this.index + 3;
    if (this.isRunwaysMode) {
      this.trySetRunwayAtIndex(index);
    } else if (this.isDepartureMode) {
      this.trySetDepartureAtIndex(index);
    }
  }

  trySetRunwayAtIndex(index: number) {
    if (index >= this.numRunways()) {
      return;
    }
    const runway = this.getRunways()[index];
    this.trySetRunway(runway);
  }

  trySetDepartureAtIndex(index: number) {
    if (index > this.numDepartures()) {
      return;
    }
    if (index === this.numDepartures()) {
      this.trySetDeparture(null);
      return;
    }
    const departure = this.getDepartures()[index];
    this.trySetDeparture(departure);
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

  onRSK2() {
    if (!this.isDepartureMode || !this.currentDeparture) {
      return;
    }
    this.trySetTransitionAtIndex(this.index + 0);
  }

  onRSK3() {
    if (!this.isDepartureMode || !this.currentDeparture) {
      return;
    }
    this.trySetTransitionAtIndex(this.index + 1);
  }

  onRSK4() {
    if (!this.isDepartureMode || !this.currentDeparture) {
      return;
    }
    this.trySetTransitionAtIndex(this.index + 2);
  }

  onRSK5() {
    if (!this.isDepartureMode || !this.currentDeparture) {
      return;
    }
    this.trySetTransitionAtIndex(this.index + 3);
  }

  trySetTransitionAtIndex(index: number) {
    if (index > this.numTransitions()) {
      return;
    }
    if (index === this.numTransitions()) {
      this.trySetTransition(null);
      return;
    }
    this.trySetTransition(this.currentDeparture.enrouteTransitions[index]);
  }

  onRSK6() {
    if (this.hasTemporary) {
      this.CDU.flightPlanService.temporaryInsert().then(() => {
        this.openPage(new FlightPlanPage(this.display));
      });
    }
  }

  onUp() {
    if (this.index + this.rowsShown > this.maxIndex) {
      return;
    }

    this.index = this.index + this.rowsShown;
    this.refresh();
  }

  onDown() {
    if (this.index <= 0) {
      return;
    }
    if (this.isRunwaysMode || this.isDepartureMode) this.index = this.index - this.rowsShown;
    this.refresh();
  }

  onLeft() {
    if (this.isRunwaysMode) {
      this.setMode(PageMode.Departure);
    } else {
      this.setMode(PageMode.Runways);
    }
  }

  onRight() {
    if (this.isRunwaysMode) {
      this.setMode(PageMode.Departure);
    } else {
      this.setMode(PageMode.Runways);
    }
  }

  setMode(mode: PageMode) {
    this.index = 0;
    this.mode = mode;
    this.refresh();
  }
}
