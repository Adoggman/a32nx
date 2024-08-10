import { CDUDisplay } from '@cdu/CDUDisplay';
import {
  CDUColor,
  CDUElement,
  CDUTextSize,
  DisplayablePage,
  ICDULine,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { LatRev } from '@cdu/pages/LatRev';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

type FPLeg = { leg: FlightPlanLeg; legIndex: number } | undefined;

export class FlightPlanPage extends DisplayablePage {
  title = '';
  titleLeft = '';

  static readonly pageID: string = 'FPLN';
  _pageID = FlightPlanPage.pageID;
  allowsTyping = true;
  refreshRate = RefreshRate.Medium;

  index: number;
  displayedLegs: [FPLeg, FPLeg, FPLeg, FPLeg, FPLeg] = [undefined, undefined, undefined, undefined, undefined];

  constructor(display: CDUDisplay, index = 0) {
    super(display);
    this.index = index;
    this.arrows.left = true;
    this.arrows.right = true;
    this.drawPage();
  }

  maxIndex() {
    return this.getFlightPlanElements().length + 1;
  }

  onRefresh() {
    this.drawPage();
  }

  refresh() {
    this.drawPage();
    super.refresh();
  }

  drawPage() {
    this.index = this.index ?? 0;
    const elements = this.getFlightPlanElements();

    this.updateTitle();
    this.updateArrows(elements.length > 0);

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

  makeFplnLines(elements: FlightPlanElement[]) {
    this.displayedLegs = [undefined, undefined, undefined, undefined, undefined];
    if (elements.length === 0) {
      return makeLines(
        this.fromLine(),
        this.discontinuityLine(),
        this.endOfFplnLine(),
        this.noAltnFplnLine(),
        undefined,
        this.destLine(),
      );
    }
    const lines: ICDULine[] = [];
    let hasShownNm = false;
    for (let row = 0; row < 5; row++) {
      let legIndex = this.index + row;
      if (legIndex === elements.length) {
        this.displayedLegs[row] = undefined;
        lines.push(this.endOfFplnLine());
        continue;
      }
      if (legIndex > elements.length) {
        legIndex = (legIndex - 1) % elements.length;
      }

      const element = elements[legIndex];
      if (element.isDiscontinuity) {
        this.displayedLegs[row] = undefined;
        lines.push(this.discontinuityLine());
        continue;
      }
      const leg = element as FlightPlanLeg;
      if (leg.ident) {
        lines.push(this.legLine(leg, legIndex, hasShownNm));
        this.displayedLegs[row] = { leg: leg, legIndex: legIndex };
        hasShownNm = row > 0 && !!leg.calculated?.distance;
      }
    }
    lines[0].leftLabel = this.topLabel();
    lines.push(this.destLine());
    return makeLines(...lines);
  }

  getFlightPlanElements() {
    return this.CDU.flightPlanService.activeOrTemporary.allLegs;
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

  private get currentColor() {
    return this.hasTemporary ? CDUColor.Yellow : CDUColor.Green;
  }

  topLabel() {
    return new CDUElement('\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0');
  }

  legLine(leg: FlightPlanLeg, legIndex: number, hasShownDistNM): ICDULine {
    const showTime = legIndex === 0;
    const identElement = new CDUElement(leg.ident.padEnd(8, '\xa0'), this.currentColor);
    const timeElement = new CDUElement(
      (showTime ? '0000' : '----').padEnd(6, '\xa0'),
      showTime ? this.currentColor : CDUColor.White,
    );
    const speedElement = new CDUElement('---', CDUColor.White);
    const alt: number = (leg.definition.waypoint?.location as any).alt;
    const altElement = alt
      ? new CDUElement(
          '/' + formatAlt(alt).padStart(6, '\xa0'),
          this.currentColor,
          legIndex === 0 ? CDUTextSize.Large : CDUTextSize.Small,
        )
      : new CDUElement('/\xa0-----', CDUColor.White);

    identElement.secondElement = timeElement;
    timeElement.secondElement = speedElement;
    speedElement.secondElement = altElement;

    const label = new CDUElement(
      '\xa0'.repeat(17) +
        (leg.calculated?.distance ? leg.calculated.distance.toFixed(0) + (hasShownDistNM ? '' : 'NM') : ''),
      this.currentColor,
    );
    return {
      left: identElement,
      leftLabel: label,
    };
  }

  fromLine(): ICDULine {
    return this.CDU.flightPlanService.activeOrTemporary.originAirport
      ? {
          left: new CDUElement(
            this.CDU.flightPlanService.activeOrTemporary.originAirport.ident.padEnd(8, '\xa0'),
            this.currentColor,
            CDUTextSize.Large,
            new CDUElement(
              '0000',
              this.currentColor,
              CDUTextSize.Large,
              new CDUElement(
                '\xa0\xa0---',
                CDUColor.White,
                CDUTextSize.Small,
                new CDUElement(
                  '/' +
                    formatAlt(this.CDU.flightPlanService.activeOrTemporary.originAirport.location.alt).padStart(
                      6,
                      '\xa0',
                    ),
                  this.currentColor,
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
            this.currentColor,
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

  discontinuityLine(): ICDULine {
    return { left: new CDUElement('---F-PLN DISCONTINUITY--') };
  }

  endOfFplnLine(): ICDULine {
    return { left: new CDUElement('------END OF F-PLN------') };
  }

  noAltnFplnLine(): ICDULine {
    return { left: new CDUElement('-----NO ALTN F-PLN------') };
  }

  onLSK1(): void {
    if (this.displayedLegs[0]) {
      const element = this.displayedLegs[0];
      this.openPage(new LatRev(this.display, element.leg, element.legIndex));
    }
  }

  onLSK2(): void {
    if (this.displayedLegs[1]) {
      const element = this.displayedLegs[1];
      this.openPage(new LatRev(this.display, element.leg, element.legIndex));
    }
  }

  onLSK3(): void {
    if (this.displayedLegs[2]) {
      const element = this.displayedLegs[2];
      this.openPage(new LatRev(this.display, element.leg, element.legIndex));
    }
  }

  onLSK4(): void {
    if (this.displayedLegs[3]) {
      const element = this.displayedLegs[4];
      this.openPage(new LatRev(this.display, element.leg, element.legIndex));
    }
  }

  onLSK5(): void {
    if (this.displayedLegs[4]) {
      const element = this.displayedLegs[4];
      this.openPage(new LatRev(this.display, element.leg, element.legIndex));
    }
  }

  onLSK6(): void {
    if (this.CDU.flightPlanService.activeOrTemporary.destinationAirport) {
      const elements = this.getFlightPlanElements();
      const lastIndex = elements.length - 1;
      const lastElement = elements[lastIndex];
      if (!lastElement.isDiscontinuity) {
        this.openPage(new LatRev(this.display, lastElement as FlightPlanLeg, lastIndex));
      } else {
        throw Error('Tried to open destination Lat Rev page but last element is discontinuity');
      }
    }
  }

  onDown() {
    this.index = this.index - 1;
    if (this.index < 0) {
      this.index = this.maxIndex() - 1;
    }
    this.refresh();
  }

  onUp() {
    this.index = (this.index + 1) % this.maxIndex();
    this.refresh();
  }
}

const formatAlt = (altitude: number) => {
  return (Math.round(altitude / 10) * 10).toFixed(0);
};
