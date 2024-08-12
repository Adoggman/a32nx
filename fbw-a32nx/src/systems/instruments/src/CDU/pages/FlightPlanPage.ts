import { CDUDisplay } from '@cdu/CDUDisplay';
import { formatAltRounded } from '@cdu/Format';
import {
  CDUColor,
  CDUElement,
  CDUTextSize,
  DisplayablePage,
  ICDULine,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { LatRevPage } from '@cdu/pages/LatRevPage';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

type FPLeg = { leg: FlightPlanLeg; legIndex: number } | undefined;

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

export class FlightPlanPage extends DisplayablePage {
  static readonly pageID: string = 'FPLN';
  _pageID = FlightPlanPage.pageID;

  index: number;
  maxIndex: number;
  displayedLegs: [FPLeg, FPLeg, FPLeg, FPLeg, FPLeg] = [undefined, undefined, undefined, undefined, undefined];

  tempPlanColor = CDUColor.Yellow;
  activePlanColor = CDUColor.Green;
  alternatePlanColor = CDUColor.Cyan;
  activeLegColor = CDUColor.White;

  constructor(display: CDUDisplay, index = 0) {
    super(display);
    this.allowsTyping = true;
    this.refreshRate = RefreshRate.Medium;
    this.title = this.hasTemporary ? new CDUElement('TMPY', this.tempPlanColor) : '';
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
    this.titleLeft =
      (this.index === this.originLegIndex ? '\xa0FROM' : '').padEnd(14, '\xa0') +
      (this.CDU.FlightInformation.flightNumber ?? '');
  }

  updateArrows(hasPlan: boolean) {
    this.arrows.up = hasPlan;
    this.arrows.down = hasPlan;
  }

  makeEmptyFplnLines() {
    return makeLines(
      this.fromLine(),
      this.discontinuityLine(),
      this.endOfFplnLine(),
      this.noAltnFplnLine(),
      undefined,
      this.destLine(),
    );
  }

  makeFplnLines(elements: FlightPlanDisplayElement[]) {
    this.displayedLegs = [undefined, undefined, undefined, undefined, undefined];
    const lines: ICDULine[] = [];
    let hasShownNm = false;
    for (let row = 0; row < 5; row++) {
      let legIndex = this.index + row;
      if (legIndex >= elements.length) {
        legIndex = legIndex % elements.length;
      }

      const element = elements[legIndex];
      if (element.isDiscontinuity) {
        this.displayedLegs[row] = undefined;
        lines.push(this.discontinuityLine());
        continue;
      }
      if (element.isPseudo) {
        this.displayedLegs[row] = undefined;
        lines.push(this.pseudoLegLine((element as PseudoDisplayElement).pseudoLegType));
        continue;
      }
      const leg = element.leg;
      const isAlternate = (element as LegDisplayElement).isAlternate;
      if (leg?.ident) {
        lines.push(this.legLine(leg, legIndex, hasShownNm, isAlternate));
        this.displayedLegs[row] = { leg: leg, legIndex: legIndex };
        hasShownNm = row > 0 && !!leg.calculated?.distance;
      } else {
        lines.push(this.unknownLine());
        console.log('Unknown leg');
        console.log(leg);
      }
    }
    lines[0].leftLabel = this.topLabel();
    lines.push(this.destLine());
    return makeLines(...lines);
  }

  hasFlightPlan() {
    return !!this.CDU.flightPlanService.activeOrTemporary?.originAirport;
  }

  getFlightPlanElements(): FlightPlanDisplayElement[] {
    const hasAlternate = this.CDU.flightPlanService.activeOrTemporary?.alternateFlightPlan?.allLegs.length > 0;
    if (hasAlternate) {
      return [
        ...this.CDU.flightPlanService.activeOrTemporary.allLegs.map((element) => {
          return this.getDisplayElement(element, false);
        }),
        new PseudoDisplayElement(PseudoLegType.EndOfFlightPlan),
        ...this.CDU.flightPlanService.activeOrTemporary.alternateFlightPlan.allLegs.map((element) => {
          return this.getDisplayElement(element, true);
        }),
        new PseudoDisplayElement(PseudoLegType.EndOfAlternateFlightPlan),
      ];
    }
    return [
      ...this.CDU.flightPlanService.activeOrTemporary.allLegs.map((element) => {
        return this.getDisplayElement(element, false);
      }),
      new PseudoDisplayElement(PseudoLegType.EndOfFlightPlan),
      new PseudoDisplayElement(PseudoLegType.NoAltnernateFlightPlan),
    ];
  }

  getDisplayElement(element: FlightPlanElement, isAlternate: boolean) {
    if (element.isDiscontinuity) {
      return new DiscontinuityDisplayElement();
    } else {
      return new LegDisplayElement(element as FlightPlanLeg, isAlternate);
    }
  }

  get fromIndex() {
    return this.CDU.flightPlanService.activeLegIndex - 1;
  }

  get activeIndex() {
    return this.CDU.flightPlanService.activeLegIndex - 1;
  }

  get originLegIndex() {
    return this.CDU.flightPlanService.activeOrTemporary.originLegIndex;
  }

  get destinationLegIndex() {
    return this.CDU.flightPlanService.activeOrTemporary.destinationLegIndex;
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

  topLabel() {
    return new CDUElement('\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0');
  }

  legLine(leg: FlightPlanLeg, legIndex: number, hasShownDistNM: boolean, isAlternate: boolean): ICDULine {
    const showTime = legIndex === this.fromIndex;
    const legColor = this.getColorForLeg(legIndex, isAlternate);
    const identElement = new CDUElement(leg.ident.padEnd(8, '\xa0'), legColor);
    const timeElement = new CDUElement(
      (showTime ? '0000' : '----').padEnd(6, '\xa0'),
      showTime ? legColor : CDUColor.White,
    );
    const speedElement = new CDUElement('---', CDUColor.White);
    const alt: number = (leg.definition.waypoint?.location as any)?.alt;
    const altElement = alt
      ? new CDUElement(
          '/' + formatAltRounded(alt, 10).padStart(6, '\xa0'),
          legColor,
          legIndex === this.fromIndex ? CDUTextSize.Large : CDUTextSize.Small,
        )
      : new CDUElement('/\xa0-----', CDUColor.White);

    identElement.secondElement = timeElement;
    timeElement.secondElement = speedElement;
    speedElement.secondElement = altElement;

    const label = new CDUElement(
      '\xa0'.repeat(17) +
        (leg.calculated?.distance ? leg.calculated.distance.toFixed(0) + (hasShownDistNM ? '' : 'NM') : ''),
      this.planColor,
    );
    return {
      left: identElement,
      leftLabel: label,
    };
  }

  fromLine(): ICDULine {
    const origin = this.CDU.flightPlanService.activeOrTemporary.originAirport;
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
    return this.CDU.flightPlanService.activeOrTemporary.destinationAirport
      ? {
          left: new CDUElement(
            this.CDU.flightPlanService.activeOrTemporary.destinationAirport.ident.padEnd(8, '\xa0'),
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

  pseudoLegLine(pseudoLegType: PseudoLegType): ICDULine {
    switch (pseudoLegType) {
      case PseudoLegType.EndOfFlightPlan:
        return this.endOfFplnLine();
      case PseudoLegType.EndOfAlternateFlightPlan:
        return this.endOfAltnFplnLine();
      case PseudoLegType.NoAltnernateFlightPlan:
        return this.noAltnFplnLine();
      default:
        break;
    }
  }

  discontinuityLine(): ICDULine {
    return { center: new CDUElement('---F-PLN DISCONTINUITY--') };
  }

  endOfFplnLine(): ICDULine {
    return { center: new CDUElement('------END OF F-PLN------') };
  }

  endOfAltnFplnLine(): ICDULine {
    return { center: new CDUElement('---END OF ALTN F-PLN---') };
  }

  noAltnFplnLine(): ICDULine {
    return { center: new CDUElement('-----NO ALTN F-PLN------') };
  }

  unknownLine(): ICDULine {
    return { center: new CDUElement('-----UNHANDLED LEG------') };
  }

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
    if (this.CDU.flightPlanService.activeOrTemporary.destinationAirport) {
      const elements = this.getFlightPlanElements();
      const lastIndex = elements.length - 1;
      const lastElement = elements[lastIndex];
      if (!('isDiscontinuity' in lastElement || 'isPseudoLeg' in lastElement)) {
        this.openPage(new LatRevPage(this.display, lastElement as FlightPlanLeg, lastIndex));
      } else {
        throw Error('Tried to open destination Lat Rev page but leg is discontinuity or pseudo leg');
      }
    }
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
}
