import { CDUDisplay } from '@cdu/CDUDisplay';
import { formatAltitudeOrLevel, formatAltRounded, secondsTohhmm, secondsToUTC } from '@cdu/Format';
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
import { AltitudeConstraint, WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { PseudoWaypoint } from '@fmgc/guidance/PseudoWaypoint';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { FmgcFlightPhase } from '@shared/flightphase';

type DisplayedLeg = { leg: FlightPlanLeg; legIndex: number } | undefined;

type LineReturnType = {
  line: CDULine;
  hasShownNm: boolean;
  lastSpeed: number;
  lastAltitude: number;
  lastDistance: number;
};

// #region Enums/Classes

const enum DisplayOnlyType {
  EndOfFlightPlan,
  EndOfAlternateFlightPlan,
  NoAltnernateFlightPlan,
}

abstract class FlightPlanDisplayElement {
  isDisplayOnly: boolean;
  displayLegType: DisplayOnlyType;

  isDiscontinuity: boolean;

  leg?: FlightPlanLeg;
  legIndex: number;
  public get isLeg() {
    return !!this.leg;
  }

  pseudoWaypoint?: PseudoWaypoint;
  public get isPseudo() {
    return !!this.pseudoWaypoint;
  }
}

class LegDisplayElement extends FlightPlanDisplayElement {
  isDisplayOnly = false;
  isDiscontinuity = false;
  isAlternate: boolean;

  constructor(leg: FlightPlanLeg, legIndex: number, isAlternate = false) {
    super();
    this.leg = leg;
    this.legIndex = legIndex;
    this.isAlternate = isAlternate;
  }
}

class DiscontinuityDisplayElement extends FlightPlanDisplayElement {
  isDisplayOnly = false;
  isDiscontinuity = true;

  constructor() {
    super();
  }
}

class DisplayOnlyElement extends FlightPlanDisplayElement {
  displayLegType: DisplayOnlyType;
  isDisplayOnly = true;
  isDiscontinuity = false;

  constructor(pseudoLegType: DisplayOnlyType) {
    super();
    this.displayLegType = pseudoLegType;
  }
}

class PseudoWaypointElement extends FlightPlanDisplayElement {
  isDisplayOnly = false;
  isDiscontinuity = false;

  constructor(pseudoWaypoint: PseudoWaypoint, legIndex: number) {
    super();
    this.pseudoWaypoint = pseudoWaypoint;
    this.legIndex = legIndex;
  }
}

// #endregion

export class FlightPlanPage extends DisplayablePage {
  static readonly pageID: string = 'FPLN_A';
  _pageID = FlightPlanPage.pageID;

  // #region Properties

  index: number;
  maxIndex: number;
  displayedLegs: [DisplayedLeg, DisplayedLeg, DisplayedLeg, DisplayedLeg, DisplayedLeg] = [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ];

  tempPlanColor = CDUColor.Yellow;
  activePlanColor = CDUColor.Green;
  alternatePlanColor = CDUColor.Cyan;
  activeLegColor = CDUColor.White;
  altConstraintColor = CDUColor.Magenta;

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

  private get hasOrigin() {
    return !!this.flightPlan?.originAirport;
  }

  private get isFlying() {
    const flightPhase = this.CDU.flightPhaseManager.phase;
    return flightPhase >= FmgcFlightPhase.Takeoff && flightPhase != FmgcFlightPhase.Done;
  }

  // #endregion

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
    const hasPlan = this.hasOrigin;
    this.updateArrows(hasPlan);
    this.updateTitle();

    if (!hasPlan) {
      this.maxIndex = 0;
      this.lines = this.makeEmptyFplnLines();
      return;
    }

    const elements = this.getFlightPlanElements();

    const fmsGeometryProfile = this.CDU.FMGC.guidanceController.vnavDriver.mcduProfile;

    const waypointPredictions =
      fmsGeometryProfile && fmsGeometryProfile.isReadyToDisplay ? fmsGeometryProfile.waypointPredictions : undefined;
    this.maxIndex = elements.length;
    this.lines = this.makeFplnLines(elements, waypointPredictions);
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
    const mainFlightPlan = this.getFlightPlanWithPseudoWaypoints();
    if (hasAlternate) {
      return [
        ...mainFlightPlan,
        new DisplayOnlyElement(DisplayOnlyType.EndOfFlightPlan),
        ...this.flightPlan.alternateFlightPlan.allLegs.map((element, index) => {
          return this.getDisplayElement(element, index, true);
        }),
        new DisplayOnlyElement(DisplayOnlyType.EndOfAlternateFlightPlan),
      ];
    }
    return [
      ...mainFlightPlan,
      new DisplayOnlyElement(DisplayOnlyType.EndOfFlightPlan),
      new DisplayOnlyElement(DisplayOnlyType.NoAltnernateFlightPlan),
    ];
  }

  getFlightPlanWithPseudoWaypoints(): FlightPlanDisplayElement[] {
    const legs = this.flightPlan.allLegs;
    const pseudos = this.CDU.FMGC.guidanceController?.currentPseudoWaypoints
      .filter((p) => p.displayedOnMcdu)
      .sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    if (!pseudos || pseudos.length === 0) {
      return legs.map((leg, index) => {
        return this.getDisplayElement(leg, index, false);
      });
    }

    const combinedElements: FlightPlanDisplayElement[] = [];
    legs.forEach((leg, index) => {
      const pseudosForLeg = pseudos.filter((p) => p.alongLegIndex === index);
      combinedElements.push(...pseudosForLeg.map((p) => new PseudoWaypointElement(p, index)));
      combinedElements.push(this.getDisplayElement(leg, index, false));
    });

    return combinedElements;
  }

  makeEmptyFplnLines() {
    return makeLines(
      this.pposLine(),
      this.discontinuityLine(),
      this.endOfFplnLine(),
      this.noAltnFplnLine(),
      undefined,
      this.lastLine(),
    );
  }

  makeFplnLines(elements: FlightPlanDisplayElement[], waypointPredictions: Map<number, VerticalWaypointPrediction>) {
    this.displayedLegs = [undefined, undefined, undefined, undefined, undefined];
    const lines: ICDULine[] = [];
    let hasShownNm = false;
    let lastLeg = undefined;
    let lastSpeed = undefined;
    let lastAltitude = undefined;
    let lastDistance = undefined;
    for (let row = 0; row < 5; row++) {
      let elementIndex = this.index + row;
      if (elementIndex >= elements.length) {
        elementIndex = elementIndex % elements.length;
      }

      const element = elements[elementIndex];
      if (element.isDiscontinuity) {
        this.displayedLegs[row] = undefined;
        lines.push(this.discontinuityLine(row === 0));
        lastLeg = undefined;
        lastSpeed = undefined;
        lastAltitude = undefined;
        lastDistance = undefined;
        continue;
      }
      if (element.isDisplayOnly) {
        this.displayedLegs[row] = undefined;
        lines.push(this.displayOnlyLegLine((element as DisplayOnlyElement).displayLegType, row === 0));
        continue;
      }
      if (element.isPseudo) {
        const pseudoWaypoint = element.pseudoWaypoint;
        //const legIndex = element.legIndex;
        const result = this.pseudoWaypointLine(pseudoWaypoint, row, lastSpeed, lastAltitude, hasShownNm, lastDistance);
        lines.push(result.line);
        lastSpeed = result.lastSpeed;
        lastAltitude = result.lastAltitude;
        lastDistance = result.lastDistance;
        hasShownNm = result.hasShownNm;
        continue;
      }
      const leg = element.leg;
      const legIndex = element.legIndex;
      const isAlternate = (element as LegDisplayElement).isAlternate;
      const isMissedApproach = legIndex >= this.flightPlan.firstMissedApproachLegIndex;
      if (leg) {
        if (legIndex === this.originLegIndex) {
          lines.push(this.originLine(leg, row));
          lastSpeed = undefined;
          lastAltitude = undefined;
          lastDistance = 0;
          hasShownNm = false;
        } else {
          const prediction = waypointPredictions ? waypointPredictions.get(legIndex) : undefined;
          const nextLeg = legIndex + 1 < elements.length ? elements[legIndex + 1]?.leg : undefined;
          const result = this.legLine(
            leg,
            legIndex,
            row,
            hasShownNm,
            isAlternate || isMissedApproach,
            lastLeg,
            nextLeg,
            lastSpeed,
            lastAltitude,
            prediction,
            lastDistance,
          );
          lines.push(result.line);
          lastSpeed = result.lastSpeed;
          lastAltitude = result.lastAltitude;
          lastDistance = result.lastDistance;
          hasShownNm = result.hasShownNm;
        }
        this.displayedLegs[row] = { leg: leg, legIndex: legIndex };
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
    isAlternateOrMissed: boolean,
    lastLeg: FlightPlanLeg,
    nextLeg: FlightPlanLeg,
    lastSpeed: number,
    lastAltitude: number,
    prediction: VerticalWaypointPrediction,
    lastDistance: number,
  ): LineReturnType {
    const legColor = this.getColorForLeg(legIndex, isAlternateOrMissed);
    const identElement = this.legIdentElement(leg, nextLeg, legColor);
    const timeElement = this.timeElement(legIndex, prediction, legColor, isAlternateOrMissed);
    const speedElements = this.speedElements(leg, legIndex, prediction, lastSpeed, legColor, isAlternateOrMissed);
    const altElements = this.altitudeElements(leg, legIndex, prediction, lastAltitude, legColor, isAlternateOrMissed);

    const lineElement = CDUElement.stringTogether(identElement, timeElement, ...speedElements, ...altElements);
    let labelElement: CDUElement;
    if (rowIndex === 0) {
      labelElement = this.topLabel('\xa0' + leg.annotation);
    } else {
      labelElement = this.lineLabel(
        rowIndex,
        legIndex,
        lastLeg,
        leg,
        legColor,
        hasShownDistNM,
        labelElement,
        lastDistance,
      );
    }

    return {
      line: {
        left: lineElement,
        leftLabel: labelElement,
      },
      lastAltitude: prediction ? Math.round(prediction.altitude) : undefined,
      lastDistance: prediction?.distanceFromStart,
      hasShownNm: leg.calculated && !!lastDistance,
      lastSpeed: prediction?.speed,
    };
  }

  pseudoWaypointLine(
    pseudoWaypoint: PseudoWaypoint,
    rowIndex: number,
    lastSpeed: number,
    lastAltitude: number,
    hasShownDistNM: boolean,
    lastDistance: number,
  ): LineReturnType {
    const color = this.getColorForLeg(pseudoWaypoint.alongLegIndex, false);
    const header = pseudoWaypoint.mcduHeader ?? '';
    const relevantLeg = this.flightPlan.legElementAt(pseudoWaypoint.alongLegIndex);
    const distance = pseudoWaypoint.distanceFromStart ? pseudoWaypoint.distanceFromStart - lastDistance : undefined;
    let labelElement: CDUElement;
    if (rowIndex === 0) {
      labelElement = this.topLabel(header, color);
    } else {
      labelElement = new CDUElement(
        header.padEnd(15, '\xa0') +
          (distance ? distance.toFixed(0).padStart(4, '\xa0') + (hasShownDistNM ? '' : 'NM') : ''),
        color,
      );
    }

    const timeFromNow = pseudoWaypoint.flightPlanInfo.secondsFromPresent;
    const displayTime = this.isFlying ? secondsToUTC(timeFromNow + this.CDU.getTimeUTC()) : secondsTohhmm(timeFromNow);
    const speed = pseudoWaypoint.flightPlanInfo.speed;
    const displaySpeed = speed === lastSpeed ? '\xa0"\xa0' : this.formatSpeed(speed);
    const alt = Math.round(pseudoWaypoint.flightPlanInfo.altitude);
    const displayAlt =
      alt === lastAltitude
        ? '\xa0\xa0"\xa0\xa0'
        : formatAltitudeOrLevel(
            this.flightPlan,
            alt,
            this.getLegConstraintType(relevantLeg, pseudoWaypoint.alongLegIndex) === WaypointConstraintType.CLB,
          );
    const line = new CDULine(
      CDUElement.stringTogether(
        new CDUElement(pseudoWaypoint.ident.padEnd(8, '\xa0'), color, CDUTextSize.Large),
        new CDUElement(displayTime, color, CDUTextSize.Small),
        new CDUElement(displaySpeed.padStart(5, '\xa0'), color, CDUTextSize.Small),
        new CDUElement('/', color, CDUTextSize.Small),
        new CDUElement(displayAlt.padStart(6, '\xa0'), color, CDUTextSize.Small),
      ),
      labelElement,
    );
    return {
      line: line,
      hasShownNm: !!distance,
      lastSpeed: speed,
      lastAltitude: alt,
      lastDistance: pseudoWaypoint.distanceFromStart,
    };
  }

  originLine(leg: FlightPlanLeg, rowIndex: number): ICDULine {
    const origin = this.flightPlan.originAirport;
    return {
      left: CDUElement.stringTogether(
        new CDUElement(leg.ident.padEnd(8, '\xa0'), this.planColor, CDUTextSize.Large),
        new CDUElement('0000', this.planColor, CDUTextSize.Large),
        this.CDU.Performance.v1Speed
          ? new CDUElement(this.CDU.Performance.v1Speed.toFixed(0).padStart(5, '\xa0'), this.planColor)
          : new CDUElement('\xa0\xa0---', CDUColor.White),
        new CDUElement(
          '/' + formatAltRounded(origin.location.alt, 10).padStart(6, '\xa0'),
          this.planColor,
          CDUTextSize.Large,
        ),
      ),
      leftLabel: rowIndex === 0 ? this.topLabel('\xa0' + leg.annotation) : new CDUElement('\xa0' + leg.annotation),
    };
  }

  pposLine() {
    return {
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
    const timeRemaining = this.CDU.FMGC.guidanceController.vnavDriver?.mcduProfile?.getTimeToDestination();
    let timeDisplay = '----';
    if (Number.isFinite(timeRemaining)) {
      timeDisplay = this.isFlying ? secondsToUTC(this.CDU.getTimeUTC() + timeRemaining) : secondsTohhmm(timeRemaining);
    }
    let destIdent = this.flightPlan.destinationAirport?.ident ?? '-------';
    if (this.flightPlan.destinationRunway) {
      destIdent = this.flightPlan.destinationRunway.ident;
    }
    return this.flightPlan.destinationAirport
      ? {
          left: new CDUElement(
            destIdent.padEnd(8, '\xa0'),
            CDUColor.White,
            CDUTextSize.Large,
            new CDUElement(timeDisplay + '\xa0\xa0' + distanceDisplay + '\xa0---.-', CDUColor.White, CDUTextSize.Small),
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

  displayOnlyLegLine(pseudoLegType: DisplayOnlyType, isTopRow: boolean): ICDULine {
    switch (pseudoLegType) {
      case DisplayOnlyType.EndOfFlightPlan:
        return this.endOfFplnLine(isTopRow);
      case DisplayOnlyType.EndOfAlternateFlightPlan:
        return this.endOfAltnFplnLine(isTopRow);
      case DisplayOnlyType.NoAltnernateFlightPlan:
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

  // #region Elements and Labels

  getDisplayElement(leg: FlightPlanElement, index: number, isAlternate: boolean) {
    if (leg.isDiscontinuity) {
      return new DiscontinuityDisplayElement();
    } else {
      return new LegDisplayElement(leg as FlightPlanLeg, index, isAlternate);
    }
  }

  topLabel(annotation: string = '', annotationColor: CDUColor = CDUColor.White) {
    return new CDUElement(
      `${annotation ?? ''}`.padEnd(8, '\xa0'),
      annotationColor,
      CDUTextSize.Small,
      new CDUElement('TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0', CDUColor.White),
    );
  }

  lineLabel(
    rowIndex: number,
    legIndex: number,
    lastLeg: FlightPlanLeg,
    leg: FlightPlanLeg,
    legColor: CDUColor,
    hasShownDistNM: boolean,
    labelElement: CDUElement,
    lastDistance: number,
  ) {
    const identLabel = new CDUElement(('\xa0' + leg.annotation).padEnd(8, '\xa0'), CDUColor.White);
    const bearingTrack = this.getBearingOrTrack(rowIndex, legIndex, lastLeg, leg);
    const timeLabel = new CDUElement(bearingTrack.padEnd(7, '\xa0'), legColor);
    const distance =
      leg.calculated && lastDistance ? leg.calculated.cumulativeDistanceWithTransitions - lastDistance : undefined;
    const speedAltLabel = new CDUElement(
      distance !== undefined ? distance.toFixed(0).padStart(4, '\xa0') + (hasShownDistNM ? '' : 'NM') : '',
      legColor,
    );
    labelElement = CDUElement.stringTogether(identLabel, timeLabel, speedAltLabel);
    return labelElement;
  }

  timeElement(legIndex: number, prediction: VerticalWaypointPrediction, legColor: CDUColor, isAlternate: boolean) {
    let timeCell = '----';
    let color = CDUColor.White;
    const timeSize = legIndex === this.flightPlan.fromLegIndex ? CDUTextSize.Large : CDUTextSize.Small;
    if (!isAlternate && prediction?.secondsFromPresent) {
      timeCell = this.isFlying
        ? secondsToUTC(this.CDU.getTimeUTC() + prediction.secondsFromPresent)
        : secondsTohhmm(prediction.secondsFromPresent);
      color = legColor;
    }

    return new CDUElement(timeCell.padEnd(5, '\xa0'), color, timeSize);
  }

  speedElements(
    leg: FlightPlanLeg,
    legIndex: number,
    prediction: VerticalWaypointPrediction,
    lastSpeed: number,
    legColor: CDUColor,
    isAlternate: boolean,
  ) {
    const isFromLeg = legIndex === this.fromIndex;
    let speedText = leg.type === 'HM' ? '\xa0\xa0\xa0' : '---';
    let speedPrefix = new CDUElement('\xa0');
    let color = CDUColor.White;
    const size = isFromLeg ? CDUTextSize.Large : CDUTextSize.Small;

    if (!isAlternate && !this.hasTemporary && leg.type !== 'HM') {
      if (isFromLeg) {
        speedText = '\xa0\xa0\xa0';
      } else if (prediction?.speed) {
        if (lastSpeed === prediction.speed) {
          speedText = '\xa0"\xa0';
        } else {
          speedText = this.formatSpeed(prediction.speed);
        }
        color = legColor;
        if (prediction?.speedConstraint) {
          speedPrefix = new CDUElement(
            '*',
            prediction.isSpeedConstraintMet ? CDUColor.Magenta : CDUColor.Amber,
            CDUTextSize.Large,
          );
        }
      } else if (leg.hasPilotEnteredSpeedConstraint()) {
        speedText = Math.round(leg.pilotEnteredSpeedConstraint.speed).toFixed(0);
        color = CDUColor.Magenta;
      } else if (leg.hasDatabaseSpeedConstraint()) {
        speedText = Math.round(leg.definition.speed).toFixed(0);
        color = CDUColor.Magenta;
      }
    }
    const speedElement = new CDUElement(speedText, color, size);
    return [speedPrefix, speedElement];
  }

  altitudeElements(
    leg: FlightPlanLeg,
    legIndex: number,
    prediction: VerticalWaypointPrediction,
    lastAltitude: number,
    legColor: CDUColor,
    isAlternate: boolean,
  ): CDUElement[] {
    let altElement = new CDUElement('/\xa0-----', CDUColor.White);
    if (this.hasTemporary) {
      return [altElement];
    }
    const isFromLeg = legIndex === this.flightPlan.fromLegIndex;

    if (legIndex === this.flightPlan.destinationLegIndex) {
      // Destination
      altElement = this.flightPlan.destinationRunway
        ? new CDUElement(
            '/' + formatAltRounded(this.flightPlan.destinationRunway.thresholdCrossingHeight, 10).padStart(6, '\xa0'),
            this.altConstraintColor,
            CDUTextSize.Small,
          )
        : new CDUElement(
            formatAltRounded(this.flightPlan.destinationAirport.location.alt, 10).padStart(6, '\xa0'),
            legColor,
            legIndex === this.fromIndex ? CDUTextSize.Large : CDUTextSize.Small,
          );
    } else if (!isAlternate && prediction?.altitude) {
      const hasConstraint = this.legHasAltConstraint(leg) && !isFromLeg;
      const altPrefix = new CDUElement(
        hasConstraint ? '*' : '\xa0',
        prediction.isAltitudeConstraintMet ? CDUColor.Magenta : CDUColor.Amber,
        CDUTextSize.Large,
      );
      let altitudeString = '';
      const predictedAlt = Math.round(prediction.altitude);
      if (!hasConstraint && lastAltitude === predictedAlt) {
        altitudeString = '\xa0\xa0"\xa0\xa0';
      } else {
        altitudeString = formatAltitudeOrLevel(
          this.flightPlan,
          predictedAlt,
          this.getLegConstraintType(leg, legIndex) === WaypointConstraintType.CLB,
        ).padStart(5, '\xa0');
      }
      const altitude = new CDUElement(altitudeString, legColor, isFromLeg ? CDUTextSize.Large : CDUTextSize.Small);

      const slash = new CDUElement('/', legColor, isFromLeg ? CDUTextSize.Large : CDUTextSize.Small);
      return [slash, altPrefix, altitude];
    } else if (this.legHasAltConstraint(leg)) {
      // Altitude constraint
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
      // None of the above
      altElement = new CDUElement('/\xa0-----', CDUColor.White);
    }
    return [altElement];
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

  // #region Input handling

  onLSK1(): void {
    if (this.displayedLegs[0]) {
      const element = this.displayedLegs[0];
      this.openPage(new LatRevPage(this.display, element.leg, element.legIndex));
      return;
    }

    if (!this.hasOrigin) {
      this.openPage(new LatRevPage(this.display));
      return;
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
      let destLeg = this.flightPlan.destinationLeg;
      if (destLeg.isDiscontinuity) {
        console.error('Destination leg is a discontinuity. How did you get in this situation???');
        return;
      }
      destLeg = destLeg as FlightPlanLeg;
      this.openPage(new LatRevPage(this.display, destLeg, this.flightPlan.destinationLegIndex));
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

  // #region Helpers

  getLegConstraintType(leg: FlightPlanLeg, legIndex: number) {
    if (leg.constraintType !== WaypointConstraintType.Unknown) {
      return leg.constraintType;
    }

    return this.flightPlan.autoConstraintTypeForLegIndex(legIndex);
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

  formatAltConstraint(constraint: AltitudeConstraint, useTransAlt: boolean) {
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

  formatSpeed(speed: number) {
    return speed < 1 ? this.formatMachNumber(speed) : Math.round(speed).toFixed(0);
  }

  formatAlt(alt: number) {
    return (Math.round(alt / 10) * 10).toFixed(0);
  }

  formatMachNumber(rawNumber: number) {
    return (Math.round(100 * rawNumber) / 100).toFixed(2).slice(1);
  }

  // #endregion
}
