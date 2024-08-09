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
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class FlightPlan extends DisplayablePage {
  title = '';
  titleLeft = '\xa0'.repeat(14) + (this.CDU.FlightInformation.flightNumber ?? '');

  arrows = { up: true, down: true, left: true, right: true };

  static readonly pageID: string = 'FPLN';
  _pageID = FlightPlan.pageID;
  allowsTyping = true;
  refreshRate = RefreshRate.Medium;

  lines = this.makeFplnLines();

  index: number;

  constructor(display: CDUDisplay) {
    super(display);
    this.index = 0;
  }

  maxIndex() {
    return this.getFlightPlanElements().length + 1;
  }

  onRefresh() {
    this.lines = this.makeFplnLines();
  }

  refresh() {
    this.lines = this.makeFplnLines();
    super.refresh();
  }

  makeFplnLines() {
    this.index = this.index ?? 0;
    const elements = this.getFlightPlanElements();
    if (elements.length === 0) {
      this.arrows.up = false;
      this.arrows.down = false;
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
        lines.push(this.endOfFplnLine());
        continue;
      }
      if (legIndex > elements.length) {
        legIndex = (legIndex - 1) % elements.length;
      }

      const element = elements[legIndex];
      if (element.isDiscontinuity) {
        lines.push(this.discontinuityLine());
        continue;
      }
      const leg = element as FlightPlanLeg;
      if (leg.ident) {
        lines.push(this.legLine(leg, legIndex, hasShownNm));
        hasShownNm = row > 0 && !!leg.calculated.distance;
      }
    }
    lines[0].leftLabel = this.topLabel();
    lines.push(this.destLine());
    return makeLines(...lines);
  }

  getFlightPlanElements() {
    return this.CDU.flightPlanService.activeOrTemporary.allLegs;
  }

  topLabel() {
    return new CDUElement('\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0');
  }

  legLine(leg: FlightPlanLeg, legIndex: number, hasShownDistNM): ICDULine {
    const showTime = legIndex === 0;
    const identElement = new CDUElement(leg.ident.padEnd(8, '\xa0'), CDUColor.Green);
    const timeElement = new CDUElement(
      (showTime ? '0000' : '----').padEnd(6, '\xa0'),
      showTime ? CDUColor.Green : CDUColor.White,
    );
    const speedElement = new CDUElement('---', CDUColor.White);
    const alt: number = (leg.definition.waypoint?.location as any).alt;
    const altElement = alt
      ? new CDUElement(
          '/' + formatAlt(alt).padStart(6, '\xa0'),
          CDUColor.Green,
          legIndex === 0 ? CDUTextSize.Large : CDUTextSize.Small,
        )
      : new CDUElement('/\xa0-----', CDUColor.White);

    identElement.secondElement = timeElement;
    timeElement.secondElement = speedElement;
    speedElement.secondElement = altElement;

    const label = new CDUElement(
      '\xa0'.repeat(18) +
        (leg.calculated.distance ? leg.calculated.distance.toFixed(0) + (hasShownDistNM ? '' : 'NM') : ''),
      CDUColor.Green,
    );
    return {
      left: identElement,
      leftLabel: label,
    };
  }

  fromLine(): ICDULine {
    return this.CDU.flightPlanService.active.originAirport
      ? {
          left: new CDUElement(
            this.CDU.flightPlanService.active.originAirport.ident.padEnd(8, '\xa0'),
            CDUColor.Green,
            CDUTextSize.Large,
            new CDUElement(
              '0000',
              CDUColor.Green,
              CDUTextSize.Large,
              new CDUElement(
                '\xa0\xa0---',
                CDUColor.White,
                CDUTextSize.Small,
                new CDUElement(
                  '/' + formatAlt(this.CDU.flightPlanService.active.originAirport.location.alt).padStart(6, '\xa0'),
                  CDUColor.Green,
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
            CDUColor.Green,
            CDUTextSize.Large,
            new CDUElement('----\xa0\xa0\xa0\xa0\xa0/\xa0-----'),
          ),
          leftLabel: new CDUElement('\xa0FROM\xa0\xa0\xa0TIME\xa0\xa0SPD/ALT\xa0\xa0\xa0'),
        };
  }

  destLine(): ICDULine {
    const distance = this.CDU.FMGC.guidanceController.alongTrackDistanceToDestination;
    const distanceDisplay = distance ? Math.round(distance).toFixed(0).padStart(4, '\xa0') : '----';
    return this.CDU.flightPlanService.active.destinationAirport
      ? {
          left: new CDUElement(
            this.CDU.flightPlanService.active.destinationAirport.ident.padEnd(8, '\xa0'),
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
