import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, ICDULine, makeLines } from '@cdu/model/CDUPage';
import { Airport, Approach, ApproachType, Arrival, ProcedureTransition, Runway } from '@navdata';
import { ApproachUtils, RunwayUtils } from '@systems/shared';
import { FlightPlanPage } from '@cdu/pages/FlightPlanPage';
import { NXUnits } from '@flybywiresim/fbw-sdk';
import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXSystemMessages } from '@cdu/data/NXMessages';

enum PageMode {
  Approach,
  Arrival,
}

export class ArrivalsPage extends DisplayablePage {
  static readonly pageID: string = 'ARRIVALS';
  _pageID = ArrivalsPage.pageID;

  // #region Properties

  index: number;
  airport: Airport;
  mode: PageMode;
  noneArrival: boolean;
  noneApproach: boolean;
  noneTransition: boolean;
  //ilsSystems: Promise<IlsNavaid[]>;
  sortedApproaches: Approach[];

  private get currentApproach() {
    return this.CDU.flightPlanService.activeOrTemporary.approach;
  }

  private get currentDestinationRunway() {
    return this.CDU.flightPlanService.activeOrTemporary.destinationRunway;
  }

  private get currentArrival() {
    return this.CDU.flightPlanService.activeOrTemporary.arrival;
  }

  private get currentTransition() {
    return this.CDU.flightPlanService.activeOrTemporary.arrivalEnrouteTransition;
  }

  private get maxIndex() {
    return (this.isApproachMode ? this.numApproaches : Math.max(this.numArrivals, this.numTransitions)) - 1;
  }

  private get isApproachMode() {
    return this.mode === PageMode.Approach;
  }

  private get isArrivalMode() {
    return this.mode === PageMode.Arrival;
  }

  private get hasTemporary() {
    return this.CDU.flightPlanService.hasTemporary;
  }

  private get currentColor() {
    return this.hasTemporary ? CDUColor.Yellow : CDUColor.Green;
  }

  private get runways() {
    return this.CDU.flightPlanService.activeOrTemporary.availableDestinationRunways;
  }

  private get availableArrivals() {
    return [undefined, ...this.CDU.flightPlanService.activeOrTemporary.availableArrivals.slice()];
  }

  private get availableVias() {
    return this.CDU.flightPlanService.activeOrTemporary.availableApproachVias;
  }

  private get hasAvailableVias() {
    return this.availableVias.length > 0;
  }

  private rowsShown = 3;
  private get numApproaches() {
    return this.sortedApproaches.length + this.runways.length;
  }

  private get hasArrival() {
    return this.currentArrival || this.noneArrival;
  }

  private get numArrivals() {
    return this.availableArrivals.length;
  }

  private get numTransitions() {
    return this.currentArrival ? this.currentArrival.enrouteTransitions.length : 0;
  }

  // #endregion

  // #region Page

  constructor(display: CDUDisplay) {
    super(display);
    this.index = 0;
    this.airport = this.CDU.flightPlanService.activeOrTemporary.destinationAirport;

    this.arrows = { up: true, down: false, left: true, right: true };
    this.mode = PageMode.Approach;

    //this.ilsSystems = this.CDU.navigationDatabase.backendDatabase.getIlsAtAirport(this.airport.ident);
    this.sortedApproaches = this.sortApproaches(this.CDU.flightPlanService.activeOrTemporary.availableApproaches);

    this.title = new CDUElement(
      'ARRIVAL ',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement(
        'TO ',
        CDUColor.White,
        CDUTextSize.Small,
        new CDUElement(this.airport.ident + '\xa0\xa0', CDUColor.Green, CDUTextSize.Large),
      ),
    );

    this.makeLines();
  }

  refresh() {
    this.makeLines();
    this.updateArrows();
    super.refresh();
  }

  updateArrows() {
    this.arrows.down = this.index > 0;
    this.arrows.up = this.index + this.rowsShown < this.maxIndex;
  }

  // #endregion

  // #region Lines

  makeLines() {
    if (this.isApproachMode) {
      this.makeApproachLines();
    } else {
      this.makeArrivalLines();
    }
  }

  makeApproachLines() {
    const approaches = this.sortedApproaches;
    const approachLines: ICDULine[] = [];
    let lastApproach: Approach;
    let lastRunway: Runway;
    let lastColor: CDUColor;
    for (let row = 0; row < this.rowsShown; row++) {
      const approachIndex = this.index + row;
      if (approachIndex >= approaches.length) {
        const runwayIndex = approachIndex - approaches.length;
        if (runwayIndex < this.runways.length) {
          const runway = this.runways[runwayIndex];
          const isCurrentRunwaySelected = this.isCurrentlySelectedRunway(runway);
          const color = isCurrentRunwaySelected && !this.hasTemporary ? this.currentColor : CDUColor.Cyan;
          approachLines.push(
            new CDULine(
              new CDUElement(
                (isCurrentRunwaySelected ? '\xa0' : '{') + RunwayUtils.runwayString(runway.ident).padEnd(8, '\xa0'),
                color,
                CDUTextSize.Large,
                new CDUElement(
                  NXUnits.mToUser(runway.length).toFixed(0).padStart(6, '\xa0'),
                  color,
                  CDUTextSize.Large,
                  new CDUElement(NXUnits.userDistanceUnit().padEnd(2), color, CDUTextSize.Small),
                ),
              ),
              lastApproach || lastRunway ? this.approachLabel(lastApproach, lastRunway, lastColor) : undefined,
            ),
          );
          lastRunway = runway;
          lastColor = color;
        } else {
          approachLines.push({
            leftLabel: lastApproach || lastRunway ? this.approachLabel(lastApproach, lastRunway, lastColor) : undefined,
          });
          lastApproach = undefined;
          lastRunway = undefined;
          lastColor = undefined;
        }
        lastApproach = undefined;

        continue;
      }
      const approach = approaches[approachIndex];
      const matchingRunway = this.runways.find((runway) => runway.ident === approach.runwayIdent);

      if (!matchingRunway) {
        throw new Error(`[FMS/FPM] Can't find runway '${approach.runwayIdent}' at ${this.airport.ident}`);
      }

      const isCurrentApproach = this.isCurrentApproach(approach);
      const color = isCurrentApproach && !this.hasTemporary ? this.currentColor : CDUColor.Cyan;
      approachLines.push(
        new CDULine(
          new CDUElement(
            (isCurrentApproach ? '\xa0' : '{') + ApproachUtils.shortApproachName(approach).padEnd(8, '\xa0'),
            color,
            CDUTextSize.Large,
            new CDUElement(
              NXUnits.mToUser(matchingRunway.length).toFixed(0).padStart(6, '\xa0'),
              color,
              CDUTextSize.Large,
              new CDUElement(NXUnits.userDistanceUnit().padEnd(2), color, CDUTextSize.Small),
            ),
          ),
          lastApproach ? this.approachLabel(lastApproach, lastRunway, lastColor) : undefined,
        ),
      );
      lastApproach = approach;
      lastRunway = matchingRunway;
      lastColor = color;
    }
    approachLines[0].leftLabel = new CDUElement(
      'APPR\xa0\xa0\xa0',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement('AVAILABLE', CDUColor.White, CDUTextSize.Small),
    );
    const lastLine = this.bottomLine();
    if (lastApproach || lastRunway) {
      lastLine.leftLabel = this.approachLabel(lastApproach, lastRunway, lastColor);
    }

    this.lines = makeLines(
      this.topLine(),
      this.secondLine(),
      approachLines[0],
      approachLines[1],
      approachLines[2],
      lastLine,
    );
  }

  makeArrivalLines() {
    const arrivals = this.availableArrivals;
    const transitions = this.currentArrival ? [undefined, ...this.currentArrival.enrouteTransitions] : [];
    const arrivalLines: ICDULine[] = [];
    for (let row = 0; row < this.rowsShown; row++) {
      const sharedIndex = this.index + row;

      let arrivalElement = undefined;
      if (sharedIndex < arrivals.length) {
        const arrival = arrivals[sharedIndex];
        const isCurrentArrival = this.isCurrentArrival(arrival);
        const color = isCurrentArrival && !this.hasTemporary ? this.currentColor : CDUColor.Cyan;
        arrivalElement = arrival
          ? new CDUElement((isCurrentArrival ? '\xa0' : '{') + arrival.ident, color)
          : new CDUElement((isCurrentArrival ? '\xa0' : '{') + 'NO STAR', color);
      }

      let transitionElement = undefined;
      if (sharedIndex < transitions.length) {
        const transition = transitions[sharedIndex];
        const isCurrentTransition = this.isCurrentTransition(transition);
        const color = isCurrentTransition && !this.hasTemporary ? this.currentColor : CDUColor.Cyan;
        transitionElement = transition
          ? new CDUElement(transition.ident + (isCurrentTransition ? '\xa0' : '}'), color)
          : new CDUElement('NO TRANS' + (isCurrentTransition ? '\xa0' : '}'), color);
      }

      arrivalLines.push(new CDULine(arrivalElement, undefined, transitionElement));
    }

    arrivalLines[0].leftLabel = new CDUElement(
      'STARS\xa0\xa0',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement('AVAILABLE', CDUColor.White, CDUTextSize.Small),
    );
    arrivalLines[0].rightLabel = new CDUElement('TRANS', CDUColor.White, CDUTextSize.Large);
    this.lines = makeLines(
      this.topLine(),
      this.secondLine(),
      arrivalLines[0],
      arrivalLines[1],
      arrivalLines[2],
      this.bottomLine(),
    );
  }

  // #endregion

  // #region Line

  topLine(): ICDULine {
    return new CDULine(
      this.currentApproach || this.currentDestinationRunway
        ? new CDUElement(
            this.currentApproach
              ? ApproachUtils.shortApproachName(this.currentApproach)
              : RunwayUtils.runwayString(this.currentDestinationRunway.ident),
            this.currentColor,
            CDUTextSize.Large,
          )
        : '------',
      '\xa0APPR',
      this.hasArrival
        ? new CDUElement(this.currentArrival ? this.currentArrival.ident : 'NONE', this.currentColor)
        : '------',
      'STAR\xa0',
      this.currentApproach && !this.hasAvailableVias
        ? new CDUElement('NONE', this.currentColor)
        : new CDUElement('------', CDUColor.White),
      'VIA',
    );
  }

  secondLine(): ICDULine {
    const hasVias = this.hasAvailableVias;
    return new CDULine(
      hasVias ? new CDUElement('<VIAS') : undefined,
      hasVias ? new CDUElement('\xa0APPR') : undefined,
      this.hasArrival ? new CDUElement('NONE', this.currentColor) : '------',
      'TRANS\xa0',
    );
  }

  bottomLine(): ICDULine {
    return this.hasTemporary
      ? new CDULine(new CDUElement('{ERASE', CDUColor.Amber), undefined, new CDUElement('INSERT*', CDUColor.Amber))
      : new CDULine('<RETURN');
  }

  // #endregion

  // #region Elements and Labels

  approachLabel(approach: Approach, runway: Runway, color: CDUColor) {
    return new CDUElement(
      '\xa0\xa0\xa0' + runway.magneticBearing.toFixed(0).padStart(3, '0'),
      color,
      CDUTextSize.Small,
      approach && runway.lsIdent && approach.type === ApproachType.Ils
        ? new CDUElement(
            `${runway.lsIdent.padStart(6)}/${runway.lsFrequencyChannel.toFixed(2)}`,
            color,
            CDUTextSize.Small,
          )
        : undefined,
    );
  }

  // #endregion

  // #region Helpers

  sortApproaches(approaches: Approach[]) {
    return (
      approaches
        .slice()
        // The A320 cannot fly TACAN approaches
        .filter(({ type }) => type !== ApproachType.Tacan)
        // Filter out approaches with no matching runway
        // Approaches not going to a specific runway (i.e circling approaches are filtered out at DB level)
        .filter((a) => !!this.runways.find((rw) => rw.ident === a.runwayIdent))
        // Sort the approaches in Honeywell's documented order
        .sort((a, b) => ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type])
    );
  }

  private isCurrentApproach(approach: Approach) {
    return this.currentApproach && this.currentApproach.ident === approach.ident;
  }

  private isCurrentlySelectedRunway(runway: Runway) {
    return (
      !this.currentApproach && this.currentDestinationRunway && runway.ident === this.currentDestinationRunway.ident
    );
  }

  private isCurrentArrival(arrival: Arrival) {
    return (
      (this.noneArrival && !arrival) ||
      (this.currentArrival && arrival && this.currentArrival.databaseId === arrival.databaseId)
    );
  }

  private isCurrentTransition(transition: ProcedureTransition) {
    return this.currentTransition && transition && this.currentTransition.databaseId === transition.databaseId;
  }

  setMode(mode: PageMode) {
    this.index = 0;
    this.mode = mode;
    this.refresh();
  }

  // #endregion

  // #region Data Setting

  trySetApproach(approach: Approach) {
    if (this.isCurrentApproach(approach)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.CDU.flightPlanService.setApproach(approach.databaseId).then(() => {
      this.setMode(PageMode.Arrival);
    });
  }

  trySetDestinationRunway(runway: Runway) {
    if (this.isCurrentlySelectedRunway(runway)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.CDU.flightPlanService.setApproach(undefined);
    this.CDU.flightPlanService.setDestinationRunway(runway.ident).then(() => {
      this.setMode(PageMode.Arrival);
    });
  }

  trySetApproachAtIndex(index: number) {
    if (index >= this.numApproaches) {
      return;
    }
    if (index < this.sortedApproaches.length) {
      const approach = this.sortedApproaches[index];
      this.trySetApproach(approach);
    } else {
      const runway = this.runways[index - this.sortedApproaches.length];
      this.trySetDestinationRunway(runway);
    }
  }

  trySetArrivalAtIndex(index: number) {
    if (index > this.numArrivals) {
      return;
    }
    const arrival = this.availableArrivals[index];
    this.trySetArrival(arrival);
  }

  //   trySetTransitionAtIndex(index: number) {
  //     if (index > this.numTransitions()) {
  //       return;
  //     }
  //     if (index === this.numTransitions()) {
  //       this.trySetTransition(null);
  //       return;
  //     }
  //     this.trySetTransition(this.currentDeparture.enrouteTransitions[index]);
  //   }

  trySetArrival(arrival: Arrival) {
    if (this.isCurrentArrival(arrival)) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    this.noneArrival = !arrival;
    this.CDU.flightPlanService.setArrival(arrival?.databaseId).then(() => {
      this.refresh();
    });
  }

  //   trySetTransition(transition: ProcedureTransition) {
  //     if (transition && this.isCurrentTransition(transition)) {
  //       this.scratchpad.setMessage(NXSystemMessages.notAllowed);
  //       return;
  //     }
  //     this.noneTransition = !transition;
  //     this.CDU.flightPlanService.setDepartureEnrouteTransition(transition?.databaseId).then(() => {
  //       this.refresh();
  //     });
  //   }

  // #endregion

  // #region Input Handling

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
    if (this.isApproachMode || this.isArrivalMode) this.index = this.index - this.rowsShown;
    this.refresh();
  }

  onLeft() {
    if (this.isApproachMode) {
      this.setMode(PageMode.Arrival);
    } else {
      this.setMode(PageMode.Approach);
    }
  }

  onRight() {
    if (this.isApproachMode) {
      this.setMode(PageMode.Arrival);
    } else {
      this.setMode(PageMode.Approach);
    }
  }

  onLSK3() {
    const index = this.index;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      this.trySetArrivalAtIndex(index);
    }
  }

  onLSK4() {
    const index = this.index + 1;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      this.trySetArrivalAtIndex(index);
    }
  }

  onLSK5() {
    const index = this.index + 2;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      this.trySetArrivalAtIndex(index);
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

  //   onRSK2() {
  //     if (!this.isArrivalMode || !this.currentDeparture) {
  //       return;
  //     }
  //     this.trySetTransitionAtIndex(this.index + 0);
  //   }

  //   onRSK3() {
  //     if (!this.isArrivalMode || !this.currentDeparture) {
  //       return;
  //     }
  //     this.trySetTransitionAtIndex(this.index + 1);
  //   }

  //   onRSK4() {
  //     if (!this.isArrivalMode || !this.currentDeparture) {
  //       return;
  //     }
  //     this.trySetTransitionAtIndex(this.index + 2);
  //   }

  //   onRSK5() {
  //     if (!this.isArrivalMode || !this.currentDeparture) {
  //       return;
  //     }
  //     this.trySetTransitionAtIndex(this.index + 3);
  //   }

  // #endregion
}

const ApproachTypeOrder = Object.freeze({
  [ApproachType.Mls]: 0,
  [ApproachType.MlsTypeA]: 1,
  [ApproachType.MlsTypeBC]: 2,
  [ApproachType.Ils]: 3,
  [ApproachType.Gls]: 4,
  [ApproachType.Igs]: 5,
  [ApproachType.Loc]: 6,
  [ApproachType.LocBackcourse]: 7,
  [ApproachType.Lda]: 8,
  [ApproachType.Sdf]: 9,
  [ApproachType.Fms]: 10,
  [ApproachType.Gps]: 11,
  [ApproachType.Rnav]: 12,
  [ApproachType.VorDme]: 13,
  [ApproachType.Vortac]: 13, // VORTAC and VORDME are intentionally the same
  [ApproachType.Vor]: 14,
  [ApproachType.NdbDme]: 15,
  [ApproachType.Ndb]: 16,
  [ApproachType.Unknown]: 17,
});
