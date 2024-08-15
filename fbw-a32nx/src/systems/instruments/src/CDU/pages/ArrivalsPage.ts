import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULineRight,
  CDUTextSize,
  DisplayablePage,
  ICDULine,
  makeLines,
} from '@cdu/model/CDUPage';
import {
  Airport,
  Approach,
  ApproachType,
  Departure,
  ProcedureTransition,
  Runway,
  IlsNavaid,
} from '../../../../../../../fbw-common/src/systems/navdata/shared';
import { ApproachUtils, RunwayUtils } from '../../../../../../../fbw-common/src/systems/shared/src';
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
  index: number;
  airport: Airport;
  mode: PageMode;
  noneArrival: boolean;
  noneApproach: boolean;
  noneTransition: boolean;
  ilsSystems: Promise<IlsNavaid[]>;
  sortedApproaches: Approach[];

  constructor(display: CDUDisplay) {
    super(display);
    this.index = 0;
    this.airport = this.CDU.flightPlanService.activeOrTemporary.destinationAirport;

    this.arrows = { up: true, down: false, left: true, right: true };
    this.mode = PageMode.Approach;

    this.ilsSystems = this.CDU.navigationDatabase.backendDatabase.getIlsAtAirport(this.airport.ident);

    this.sortedApproaches = this.CDU.flightPlanService.activeOrTemporary.availableApproaches
      .slice()
      // The A320 cannot fly TACAN approaches
      .filter(({ type }) => type !== ApproachType.Tacan)
      // Filter out approaches with no matching runway
      // Approaches not going to a specific runway (i.e circling approaches are filtered out at DB level)
      .filter((a) => !!this.runways.find((rw) => rw.ident === a.runwayIdent))
      // Sort the approaches in Honeywell's documented order
      .sort((a, b) => ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type]);

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
    return this.isApproachMode ? this.numApproaches() : Math.max(this.numDepartures() + 1, this.numTransitions() + 1);
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
        } else {
          approachLines.push({
            leftLabel: lastApproach || lastRunway ? this.approachLabel(lastApproach, lastRunway, lastColor) : undefined,
          });
          lastApproach = undefined;
          lastRunway = undefined;
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
    if (lastApproach) {
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
    //     const departures = this.getArrivals();
    //     const transitions = this.currentDeparture ? this.currentDeparture.enrouteTransitions : [];
    //     const departureLines: ICDULine[] = [];
    //     for (let row = 0; row < 4; row++) {
    //       const sharedIndex = this.index + row;
    //       const departure = sharedIndex < departures.length ? departures[sharedIndex] : undefined;
    //       const isNoSid = sharedIndex === departures.length;
    //       const transition = sharedIndex < transitions.length ? transitions[sharedIndex] : undefined;
    //       const isNoTransition = sharedIndex === transitions.length && transitions.length !== 0;
    //       const isCurrentDeparture = this.isCurrentArrival(departure);
    //       const isCurrentTransition = this.isCurrentTransition(transition);
    //       departureLines.push(
    //         new CDULine(
    //           departure
    //             ? new CDUElement(
    //                 (isCurrentDeparture ? '\xa0' : '{') + departure.ident,
    //                 isCurrentDeparture && !this.hasTemporary ? this.currentColor : CDUColor.Cyan,
    //               )
    //             : new CDUElement(
    //                 isNoSid ? (this.noneArrival ? ' ' : '{') + 'NO SID' : '',
    //                 this.noneArrival && !this.hasTemporary ? this.currentColor : CDUColor.Cyan,
    //               ),
    //           undefined,
    //           transition
    //             ? new CDUElement(
    //                 transition.ident + (isCurrentTransition ? '\xa0' : '}'),
    //                 isCurrentTransition && !this.hasTemporary ? this.currentColor : CDUColor.Cyan,
    //               )
    //             : new CDUElement(
    //                 isNoTransition ? 'NO TRANS' + (this.noneTransition ? ' ' : '}') : '',
    //                 this.noneTransition && !this.hasTemporary ? this.currentColor : CDUColor.Cyan,
    //               ),
    //         ),
    //       );
    // }
    //     departureLines[0].leftLabel = new CDUElement('SIDS');
    //     departureLines[0].centerLabel = new CDUElement('AVAILABLE');
    //     departureLines[0].rightLabel = new CDUElement('TRANS');

    this.lines = makeLines(this.topLine(), this.secondLine(), undefined, undefined, undefined, this.bottomLine());
  }

  approachLabel(approach: Approach, runway: Runway, color: CDUColor) {
    // const matchingIls =
    //   approach.type === ApproachType.Ils
    //     ? this.ilsSystems.find((ils) => finalLeg && finalLeg.recommendedNavaid && ils.databaseId === finalLeg.recommendedNavaid.databaseId,)
    //     : undefined;
    //const hasIls = !!matchingIls;
    //const ilsText = hasIls ? `${matchingIls.ident.padStart(6)}/${matchingIls.frequency.toFixed(2)}` : '';
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

  private isCurrentApproach(approach: Approach) {
    return this.currentApproach && this.currentApproach.ident === approach.ident;
  }

  private isCurrentlySelectedRunway(runway: Runway) {
    return (
      !this.currentApproach && this.currentDestinationRunway && runway.ident === this.currentDestinationRunway.ident
    );
  }

  private isCurrentArrival(departure: Departure) {
    return this.currentArrival && departure && this.currentArrival.databaseId === departure.databaseId;
  }

  private isCurrentTransition(transition: ProcedureTransition) {
    return this.currentTransition && transition && this.currentTransition.databaseId === transition.databaseId;
  }

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
      '------',
      'STAR\xa0',
      this.currentApproach ? new CDUElement('NONE', this.currentColor) : new CDUElement('------', CDUColor.White),
      'VIA',
    );
  }

  secondLine(): ICDULine {
    return new CDULineRight('------', 'TRANS\xa0');
  }

  bottomLine(): ICDULine {
    return this.hasTemporary
      ? new CDULine(new CDUElement('{ERASE', CDUColor.Amber), undefined, new CDUElement('INSERT*', CDUColor.Amber))
      : new CDULine('<RETURN');
  }

  getArrivals() {
    return this.CDU.flightPlanService.activeOrTemporary.availableArrivals;
  }

  private rowsShown = 3;
  numApproaches() {
    return this.sortedApproaches.length + this.runways.length;
  }

  numDepartures() {
    return this.getArrivals().length;
  }

  numTransitions() {
    return this.currentArrival ? this.currentArrival.enrouteTransitions.length : 0;
  }

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

  //   trySetDeparture(departure: Departure) {
  //     if (this.isCurrentArrival(departure)) {
  //       this.scratchpad.setMessage(NXSystemMessages.notAllowed);
  //       return;
  //     }
  //     this.noneArrival = !departure;
  //     this.CDU.flightPlanService.setDepartureProcedure(departure?.databaseId).then(() => {
  //       this.refresh();
  //     });
  //   }

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

  onLSK3() {
    const index = this.index;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      //this.trySetDepartureAtIndex(index);
    }
  }

  onLSK4() {
    const index = this.index + 1;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      //this.trySetDepartureAtIndex(index);
    }
  }

  onLSK5() {
    const index = this.index + 2;
    if (this.isApproachMode) {
      this.trySetApproachAtIndex(index);
    } else if (this.isArrivalMode) {
      //this.trySetDepartureAtIndex(index);
    }
  }

  trySetApproachAtIndex(index: number) {
    if (index >= this.numApproaches()) {
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

  //   trySetDepartureAtIndex(index: number) {
  //     if (index > this.numDepartures()) {
  //       return;
  //     }
  //     if (index === this.numDepartures()) {
  //       this.trySetDeparture(null);
  //       return;
  //     }
  //     const departure = this.getArrivals()[index];
  //     this.trySetDeparture(departure);
  //   }

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

  setMode(mode: PageMode) {
    this.index = 0;
    this.mode = mode;
    this.refresh();
  }
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
