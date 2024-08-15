import { CDUDisplay } from '@cdu/CDUDisplay';
import { formatAltRounded } from '@cdu/Format';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  ICDULine,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { CDUScratchpad } from '@cdu/model/Scratchpad';
import { LatRevPage } from '@cdu/pages/LatRevPage';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

type FPLeg = { leg: FlightPlanLeg; legIndex: number } | undefined;

// #region Enums/Classes

const enum PseudoLegType {
  EndOfFlightPlan,
  EndOfAlternateFlightPlan,
  NoAltnernateFlightPlan,
}

abstract class FlightPlanDisplayElement {
  isPseudo: boolean;
  isDiscontinuity: boolean;
  leg?: FlightPlanLeg;
}

class LegDisplayElement extends FlightPlanDisplayElement {
  isPseudo = false;
  isDiscontinuity = false;
  isAlternate: boolean;

  constructor(leg: FlightPlanLeg, isAlternate = false) {
    super();
    this.leg = leg;
    this.isAlternate = isAlternate;
  }
}

class DiscontinuityDisplayElement extends FlightPlanDisplayElement {
  isPseudo = false;
  isDiscontinuity = true;

  constructor() {
    super();
  }
}

class PseudoDisplayElement extends FlightPlanDisplayElement {
  pseudoLegType: PseudoLegType;
  isPseudo = true;
  isDiscontinuity = false;

  constructor(pseudoLegType: PseudoLegType) {
    super();
    this.pseudoLegType = pseudoLegType;
  }
}

// #endregion

export class FlightPlanPage extends DisplayablePage {
  static readonly pageID: string = 'FPLN_A';
  _pageID = FlightPlanPage.pageID;

  index: number;
  maxIndex: number;
  displayedLegs: [FPLeg, FPLeg, FPLeg, FPLeg, FPLeg] = [undefined, undefined, undefined, undefined, undefined];

  tempPlanColor = CDUColor.Yellow;
  activePlanColor = CDUColor.Green;
  alternatePlanColor = CDUColor.Cyan;
  activeLegColor = CDUColor.White;
  altConstraintColor = CDUColor.Magenta;

  // #region Page

  constructor(display: CDUDisplay, index = 0) {
    super(display);
    this.allowsTyping = true;
    this.refreshRate = RefreshRate.Default;
    this.titleLeft = '';
    this.index = index;
    this.arrows.left = true;
    this.arrows.right = true;
    this.drawPage();
  }

  onRefresh() {
    this.drawPage();
  }

  refresh() {
    this.drawPage();
    super.refresh();
  }

  drawPage() {
    const hasPlan = this.hasFlightPlan();
    this.updateArrows(hasPlan);
    this.updateTitle();

    if (!hasPlan) {
      this.maxIndex = 0;
      this.lines = this.makeEmptyFplnLines();
      return;
    }

    const elements = this.getFlightPlanElements();
    this.maxIndex = elements.length;
    this.lines = this.makeFplnLines(elements);
  }

  updateTitle() {
    const flightNum = this.CDU.FlightInformation.flightNumber;
    this.titleLeft = this.index === this.originLegIndex ? '\xa0FROM' : '';
    this.titleRight = flightNum ? flightNum + '\xa0\xa0\xa0' : '';
    this.title = this.hasTemporary ? new CDUElement('TMPY' + '\xa0'.repeat(8), this.tempPlanColor) : '';
  }

  updateArrows(hasPlan: boolean) {
    this.arrows.up = hasPlan;
    this.arrows.down = hasPlan;
  }
  // #endregion Page

  // #region FPLN Building

  getFlightPlanElements(): FlightPlanDisplayElement[] {
    const hasAlternate = !!this.flightPlan?.alternateDestinationAirport;
    if (hasAlternate) {
      return [
        ...this.flightPlan.allLegs.map((element) => {
          return this.getDisplayElement(element, false);
        }),
        new PseudoDisplayElement(PseudoLegType.EndOfFlightPlan),
        ...this.flightPlan.alternateFlightPlan.allLegs.map((element) => {
          return this.getDisplayElement(element, true);
        }),
        new PseudoDisplayElement(PseudoLegType.EndOfAlternateFlightPlan),
      ];
    }
    return [
      ...this.flightPlan.allLegs.map((element) => {
        return this.getDisplayElement(element, false);
      }),
      new PseudoDisplayElement(PseudoLegType.EndOfFlightPlan),
      new PseudoDisplayElement(PseudoLegType.NoAltnernateFlightPlan),
    ];
  }

  makeEmptyFplnLines() {
    return makeLines(
      this.fromLine(),
      this.discontinuityLine(),
      this.endOfFplnLine(),
      this.noAltnFplnLine(),
      undefined,
      this.lastLine(),
    );
  }

  makeFplnLines(elements: FlightPlanDisplayElement[]) {
    this.displayedLegs = [undefined, undefined, undefined, undefined, undefined];
    const lines: ICDULine[] = [];
    let hasShownNm = false;
    let lastLeg = undefined;
    for (let row = 0; row < 5; row++) {
      let legIndex = this.index + row;
      if (legIndex >= elements.length) {
        legIndex = legIndex % elements.length;
      }

      const element = elements[legIndex];
      if (element.isDiscontinuity) {
        this.displayedLegs[row] = undefined;
        lines.push(this.discontinuityLine(row === 0));
        lastLeg = undefined;
        continue;
      }
      if (element.isPseudo) {
        this.displayedLegs[row] = undefined;
        lines.push(this.pseudoLegLine((element as PseudoDisplayElement).pseudoLegType, row === 0));
        continue;
      }
      const leg = element.leg;
      const isAlternate = (element as LegDisplayElement).isAlternate;
      if (leg?.ident) {
        lines.push(
          this.legLine(
            leg,
            legIndex,
            row,
            hasShownNm,
            isAlternate,
            lastLeg,
            legIndex + 1 < elements.length ? elements[legIndex + 1]?.leg : undefined,
          ),
        );
        this.displayedLegs[row] = { leg: leg, legIndex: legIndex };
        hasShownNm = row > 0 && !!leg.calculated?.distance;
        lastLeg = leg;
      } else {
        lines.push(this.unknownLine(row === 0));
        console.log('Unknown leg');
        console.log(leg);
      }
    }
    lines.push(this.lastLine());
    return makeLines(...lines);
  }
  // #endregion

  // #region Lines

  legLine(
    leg: FlightPlanLeg,
    legIndex: number,
    rowIndex: number,
    hasShownDistNM: boolean,
    isAlternate: boolean,
    lastLeg?: FlightPlanLeg,
    nextLeg?: FlightPlanLeg,
  ): ICDULine {
    const legColor = this.getColorForLeg(legIndex, isAlternate);
    const identElement = this.legIdentElement(leg, nextLeg, legColor);
    const timeElement = this.timeElement(legIndex, legColor);
    const speedElement = this.speedElement();
    const altElement = this.altitudeElement(legColor, legIndex, leg);

    const lineElement = CDUElement.stringTogether(identElement, timeElement, speedElement, altElement);
    let labelElement: CDUElement;
    if (rowIndex === 0) {
      labelElement = this.topLabel(leg.annotation);
    } else {
      labelElement = this.lineLabel(rowIndex, legIndex, lastLeg, leg, legColor, hasShownDistNM, labelElement);
    }

    return {
      left: lineElement,
      leftLabel: labelElement,
    };
  }

  fromLine(): ICDULine {
    const origin = this.flightPlan.originAirport;
    return origin
      ? {
          left: new CDUElement(
            origin.ident.padEnd(8, '\xa0'),
            this.planColor,
            CDUTextSize.Large,
            new CDUElement(
              '0000',
              this.planColor,
              CDUTextSize.Large,
              new CDUElement(
                '\xa0\xa0---',
                CDUColor.White,
                CDUTextSize.Small,
                new CDUElement(
                  '/' + formatAltRounded(origin.location.alt, 10).padStart(6, '\xa0'),
                  this.planColor,
                  CDUTextSize.Large,
                ),
              ),
            ),
          ),
          leftLabel: new CDUElement('\xa0FROM\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0'),
        }
      : {
          left: new CDUElement(
            'PPOS\xa0\xa0\xa0\xa0',
            this.planColor,
            CDUTextSize.Large,
            new CDUElement('----\xa0\xa0\xa0\xa0\xa0/\xa0-----'),
          ),
          leftLabel: new CDUElement('\xa0FROM\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0'),
        };
  }

  destLine(): ICDULine {
    const distance = this.CDU.FMGC.guidanceController.alongTrackDistanceToDestination;
    const distanceDisplay = distance ? Math.round(distance).toFixed(0).padStart(4, '\xa0') : '----';
    return this.flightPlan.destinationAirport
      ? {
          left: new CDUElement(
            this.flightPlan.destinationAirport.ident.padEnd(8, '\xa0'),
            CDUColor.White,
            CDUTextSize.Large,
            new CDUElement('----\xa0\xa0' + distanceDisplay + '\xa0---.-', CDUColor.White, CDUTextSize.Small),
          ),
          leftLabel: new CDUElement('\xa0DEST\xa0\xa0\xa0TIME\xa0\xa0DIST\xa0\xa0EFOB'),
        }
      : {
          left: new CDUElement(
            '-------\xa0',
            CDUColor.White,
            CDUTextSize.Large,
            new CDUElement('----\xa0\xa0----\xa0---.-', CDUColor.White, CDUTextSize.Small),
          ),
          leftLabel: new CDUElement('\xa0DEST\xa0\xa0\xa0TIME\xa0\xa0DIST\xa0\xa0EFOB'),
        };
  }

  lastLine(): ICDULine {
    if (this.hasTemporary) {
      return new CDULine(
        new CDUElement('{ERASE', CDUColor.Amber),
        undefined,
        new CDUElement('INSERT*', CDUColor.Amber),
      );
    } else {
      return this.destLine();
    }
  }

  pseudoLegLine(pseudoLegType: PseudoLegType, isTopRow: boolean): ICDULine {
    switch (pseudoLegType) {
      case PseudoLegType.EndOfFlightPlan:
        return this.endOfFplnLine(isTopRow);
      case PseudoLegType.EndOfAlternateFlightPlan:
        return this.endOfAltnFplnLine(isTopRow);
      case PseudoLegType.NoAltnernateFlightPlan:
        return this.noAltnFplnLine(isTopRow);
      default:
        break;
    }
  }

  discontinuityLine(isTopLine: boolean = false): ICDULine {
    return { center: new CDUElement('---F-PLN DISCONTINUITY--'), leftLabel: isTopLine ? this.topLabel() : undefined };
  }

  endOfFplnLine(isTopLine: boolean = false): ICDULine {
    return { center: new CDUElement('------END OF F-PLN------'), leftLabel: isTopLine ? this.topLabel() : undefined };
  }

  endOfAltnFplnLine(isTopLine: boolean = false): ICDULine {
    return { center: new CDUElement('---END OF ALTN F-PLN---'), leftLabel: isTopLine ? this.topLabel() : undefined };
  }

  noAltnFplnLine(isTopLine: boolean = false): ICDULine {
    return { center: new CDUElement('-----NO ALTN F-PLN------'), leftLabel: isTopLine ? this.topLabel() : undefined };
  }

  unknownLine(isTopLine: boolean = false): ICDULine {
    return { center: new CDUElement('-----UNHANDLED LEG------'), leftLabel: isTopLine ? this.topLabel() : undefined };
  }

  // #endregion

  // #region Input handling

  onLSK1(): void {
    if (this.displayedLegs[0]) {
      const element = this.displayedLegs[0];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
    }
  }

  onLSK2(): void {
    if (this.displayedLegs[1]) {
      const element = this.displayedLegs[1];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
    }
  }

  onLSK3(): void {
    if (this.displayedLegs[2]) {
      const element = this.displayedLegs[2];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
    }
  }

  onLSK4(): void {
    if (this.displayedLegs[3]) {
      const element = this.displayedLegs[4];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
    }
  }

  onLSK5(): void {
    if (this.displayedLegs[4]) {
      const element = this.displayedLegs[4];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
    }
  }

  onLSK6(): void {
    if (this.hasTemporary) {
      this.CDU.flightPlanService.temporaryDelete().then(() => {
        this.refresh();
      });
      return;
    }

    if (this.flightPlan.destinationAirport) {
      const elements = this.getFlightPlanElements();
      const lastIndex = elements.length - 1;
      const lastElement = elements[lastIndex];
      if (!('isDiscontinuity' in lastElement || 'isPseudoLeg' in lastElement)) {
        this.openPage(new LatRevPage(this.display, lastElement as FlightPlanLeg, lastIndex));
      } else {
        throw Error('Failed to open destination Lat Rev page');
      }
    }
  }

  onRSK6(): void {
    this.CDU.flightPlanService.temporaryInsert().then(() => {
      this.refresh();
    });
    return;
  }

  onDown() {
    this.index = this.index - 1;
    if (this.index < 0) {
      this.index = this.maxIndex - 1;
    }
    this.refresh();
  }

  onUp() {
    this.index = (this.index + 1) % this.maxIndex;
    this.refresh();
  }

  onAirportButton() {
    const rowOffset = 3;
    const row4Index = this.index + rowOffset;
    const destIndex = this.destinationLegIndex;
    const altnIndex = this.flightPlan.alternateFlightPlan.destinationLegIndex + this.flightPlan.allLegs.length + 1;

    // If destination is in row 4, go to alternate
    if (row4Index === destIndex && altnIndex > 0) {
      this.index = altnIndex - rowOffset;
      this.refresh();
      return;
    }

    // If alternate is in row 4, go to start
    if (row4Index === altnIndex) {
      this.index = 0;
      this.refresh();
      return;
    }

    // Otherwise go to destination
    this.index = Math.max(destIndex - rowOffset, 0);
    this.refresh();
    return;
  }

  // #endregion

  // #region Elements and Labels

  getDisplayElement(element: FlightPlanElement, isAlternate: boolean) {
    if (element.isDiscontinuity) {
      return new DiscontinuityDisplayElement();
    } else {
      return new LegDisplayElement(element as FlightPlanLeg, isAlternate);
    }
  }

  topLabel(annotation: string = '') {
    return new CDUElement(`\xa0${annotation ?? ''}`.padEnd(8, '\xa0') + 'TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0');
  }

  lineLabel(
    rowIndex: number,
    legIndex: number,
    lastLeg: FlightPlanLeg,
    leg: FlightPlanLeg,
    legColor: CDUColor,
    hasShownDistNM: boolean,
    labelElement: CDUElement,
  ) {
    const identLabel = new CDUElement(('\xa0' + leg.annotation).padEnd(8, '\xa0'), CDUColor.White);
    const bearingTrack = this.getBearingOrTrack(rowIndex, legIndex, lastLeg, leg);
    const timeLabel = new CDUElement(bearingTrack.padEnd(7, '\xa0'), legColor);
    const speedAltLabel = new CDUElement(
      leg.calculated?.distanceWithTransitions
        ? leg.calculated.distanceWithTransitions.toFixed(0).padStart(4, '\xa0') + (hasShownDistNM ? '' : 'NM')
        : '',
      legColor,
    );
    labelElement = CDUElement.stringTogether(identLabel, timeLabel, speedAltLabel);
    return labelElement;
  }

  timeElement(legIndex: number, legColor: CDUColor) {
    const showTime = legIndex === this.fromIndex;
    const timeElement = new CDUElement(
      (showTime ? '0000' : '----').padEnd(6, '\xa0'),
      showTime ? legColor : CDUColor.White,
    );
    return timeElement;
  }

  speedElement() {
    return new CDUElement('---', CDUColor.White);
  }

  altitudeElement(legColor: CDUColor, legIndex: number, leg: FlightPlanLeg) {
    const alt: number = (leg.definition.waypoint?.location as any)?.alt;
    let altElement: CDUElement;
    if (alt) {
      altElement = new CDUElement(
        '/' + formatAltRounded(alt, 10).padStart(6, '\xa0'),
        legColor,
        legIndex === this.fromIndex ? CDUTextSize.Large : CDUTextSize.Small,
      );
    } else if (this.legHasAltConstraint(leg)) {
      const altitudeConstraint = this.formatAltConstraint(
        leg.altitudeConstraint,
        leg.constraintType === WaypointConstraintType.CLB,
      );
      altElement = new CDUElement(
        '/' + altitudeConstraint.padStart(6, '\xa0'),
        this.altConstraintColor,
        leg.hasPilotEnteredAltitudeConstraint() ? CDUTextSize.Large : CDUTextSize.Small,
      );
    } else {
      altElement = new CDUElement('/\xa0-----', CDUColor.White);
    }
    return altElement;
  }

  legIdentElement(leg: FlightPlanLeg, nextLeg: FlightPlanLeg, legColor: CDUColor): CDUElement {
    let ident = leg.ident;

    // forced turn indication if next leg is not a course reversal
    if (
      nextLeg &&
      nextLeg.isDiscontinuity === false &&
      this.legTurnIsForced(nextLeg) &&
      !this.legTypeIsCourseReversal(nextLeg)
    ) {
      if (nextLeg.definition.turnDirection === 'L') {
        ident += '{';
      } else {
        ident += '}';
      }
    } else if (leg.definition.overfly) {
      ident += CDUScratchpad.overflyValue;
    }
    return new CDUElement(ident.padEnd(8, '\xa0'), legColor);
  }

  // #endregion

  // #region Helpers

  hasFlightPlan() {
    return !!this.flightPlan?.originAirport;
  }

  get fromIndex() {
    return this.CDU.flightPlanService.activeLegIndex - 1;
  }

  get activeIndex() {
    return this.CDU.flightPlanService.activeLegIndex;
  }

  get flightPlan() {
    return this.CDU.flightPlanService?.activeOrTemporary;
  }

  get originLegIndex() {
    return this.flightPlan.originLegIndex;
  }

  get destinationLegIndex() {
    return this.flightPlan.destinationLegIndex;
  }

  private get hasTemporary() {
    return this.CDU.flightPlanService.hasTemporary;
  }

  private get planColor() {
    return this.hasTemporary ? this.tempPlanColor : this.activePlanColor;
  }

  getColorForLeg(legIndex: number, isAlternate: boolean) {
    if (isAlternate) {
      return this.alternatePlanColor;
    }
    return legIndex === this.activeIndex ? this.activeLegColor : this.planColor;
  }
  getBearingOrTrack(rowIndex: number, legIndex: number, lastLeg: FlightPlanLeg, leg: FlightPlanLeg) {
    let bearingTrack = '';
    if (rowIndex === 1) {
      const trueBearing = SimVar.GetSimVarValue('L:A32NX_EFIS_L_TO_WPT_BEARING', 'Degrees');
      if (legIndex === this.activeIndex && trueBearing !== null && trueBearing >= 0) {
        bearingTrack = `BRG${trueBearing.toFixed(0).padStart(3, '0')}\u00b0`;
      }
    } else if (rowIndex === 2) {
      bearingTrack = this.formatTrack(lastLeg, leg);
    }
    return bearingTrack;
  }

  legTypeIsCourseReversal(leg: FlightPlanLeg) {
    switch (leg.type) {
      case 'HA':
      case 'HF':
      case 'HM':
      case 'PI':
        return true;
      default:
    }
    return false;
  }

  legTurnIsForced(leg: FlightPlanLeg): boolean {
    // forced turns are only for straight legs
    return (
      (leg.definition.turnDirection === 'L' /* Left */ || leg.definition.turnDirection === 'R') /* Right */ &&
      leg.type !== 'AF' &&
      leg.type !== 'RF'
    );
  }

  formatTrack(from: FlightPlanLeg, to: FlightPlanLeg) {
    // TODO: Does this show something for non-waypoint terminated legs?
    if (
      !from ||
      !from.definition ||
      !from.definition.waypoint ||
      !from.definition.waypoint.location ||
      !to ||
      !to.definition ||
      !to.definition.waypoint ||
      to.definition.type === 'HM'
    ) {
      return '';
    }

    const magVar = Facilities.getMagVar(from.definition.waypoint.location.lat, from.definition.waypoint.location.long);
    const tr = Avionics.Utils.computeGreatCircleHeading(
      from.definition.waypoint.location,
      to.definition.waypoint.location,
    );
    const track = A32NX_Util.trueToMagnetic(tr, magVar);
    return `TRK${track.toFixed(0).padStart(3, '0')}\u00b0`;
  }

  legHasAltConstraint(leg: FlightPlanLeg): boolean {
    return leg.hasPilotEnteredAltitudeConstraint() || leg.hasDatabaseAltitudeConstraint();
  }

  formatAltConstraint(constraint, useTransAlt: boolean) {
    if (!constraint) {
      return '';
    }

    // Altitude constraint types "G" and "H" are not shown in the flight plan
    switch (constraint.altitudeDescriptor) {
      case '@': // AtAlt1
      case 'I': // AtAlt1GsIntcptAlt2
      case 'X': // AtAlt1AngleAlt2
        return this.formatAltitudeOrLevel(constraint.altitude1, useTransAlt);
      case '+': // AtOrAboveAlt1
      case 'J': // AtOrAboveAlt1GsIntcptAlt2
      case 'V': // AtOrAboveAlt1AngleAlt2
        return '+' + this.formatAltitudeOrLevel(constraint.altitude1, useTransAlt);
      case '-': // AtOrBelowAlt1
      case 'Y': // AtOrBelowAlt1AngleAlt2
        return '-' + this.formatAltitudeOrLevel(constraint.altitude1, useTransAlt);
      case 'B': // BetweenAlt1Alt2
        return 'WINDOW';
      case 'C': // AtOrAboveAlt2:
        return '+' + this.formatAltitudeOrLevel(constraint.altitude2, useTransAlt);
      default:
        return '';
    }
  }

  formatAltitudeOrLevel(alt: number, useTransAlt: boolean) {
    const activePlan = this.CDU.flightPlanService.active;

    let isFl = false;
    if (useTransAlt) {
      const transAlt = activePlan.performanceData.transitionAltitude;
      isFl = transAlt !== null && alt > transAlt;
    } else {
      const transLevel = activePlan.performanceData.transitionLevel;
      isFl = transLevel !== null && alt >= transLevel * 100;
    }

    if (isFl) {
      return `FL${(alt / 100).toFixed(0).padStart(3, '0')}`;
    }

    return this.formatAlt(alt);
  }

  formatAlt(alt: number) {
    return (Math.round(alt / 10) * 10).toFixed(0);
  }
  // #endregion
}
