import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import {
  DisplayablePage,
  makeLines,
  CDULine,
  CDUElement,
  CDUColor,
  CDULineRight,
  CDUTextSize,
  EmptyLine,
} from '@cdu/model/CDUPage';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class LatRev extends DisplayablePage {
  static readonly pageID: string = 'LAT_REV';
  _pageID = LatRev.pageID;

  leg: FlightPlanLeg;
  legIndex: number;

  constructor(display: CDUDisplay, leg: FlightPlanLeg, legIndex: number) {
    super(display);
    this.leg = leg;
    this.legIndex = legIndex;

    this.title = new CDUElement(
      'LAT REV ',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement(
        'FROM ',
        CDUColor.White,
        CDUTextSize.Small,
        new CDUElement(this.leg.ident, CDUColor.Green, CDUTextSize.Large),
      ),
    );

    this.lines = this.makeLatRevLines();
  }

  makeLatRevLines() {
    const isOrigin = this.legIndex === this.originLegIndex;
    const isDestination = this.legIndex === this.destinationLegIndex;
    return makeLines(
      {
        left: { text: isOrigin ? '<DEPARTURE' : '' },
        right: { text: isDestination ? 'ARRIVAL>' : 'FIX INFO>' },
        centerLabel: new CDUElement(formatLatLong(this.leg.definition.waypoint.location), CDUColor.Green),
      },
      new CDULine(
        new CDUElement('<OFFSET', CDUColor.Inop),
        undefined,
        new CDUElement('[\xa0\xa0]°/[\xa0]°/[]', CDUColor.Inop),
        new CDUElement('LL XING/INCR/NO', CDUColor.Inop),
      ),
      new CDULineRight(
        new CDUElement('[\xa0\xa0\xa0\xa0]', CDUColor.Cyan, CDUTextSize.Small),
        new CDUElement('NEW DEST\xa0'),
      ),
      new CDULineRight(new CDUElement('[\xa0\xa0]', CDUColor.Cyan, CDUTextSize.Small), new CDUElement('NEXT WPT\xa0')),
      EmptyLine,
      new CDULine('<RETURN'),
    );
  }

  onLSK1() {
    if (this.legIndex === this.originLegIndex) {
      // <DEPARTURE
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
      return;
    }
  }

  onRSK1() {
    if (this.legIndex === this.destinationLegIndex) {
      // ARRIVAL >
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
      return;
    }
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK3() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK4() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK6() {
    this.display.openLastPage();
  }

  get originLegIndex() {
    return this.CDU.flightPlanService.active.originLegIndex;
  }

  get destinationLegIndex() {
    return this.CDU.flightPlanService.active.destinationLegIndex;
  }
}

const convertDDToDMS = (degrees: Degrees, isLong: boolean) => {
  // converts decimal degrees to degrees minutes seconds
  const M = 0 | ((degrees % 1) * 60e7);
  let degree;
  if (isLong) {
    degree = (0 | (degrees < 0 ? -degrees : degrees)).toString().padStart(3, '0');
  } else {
    degree = 0 | (degrees < 0 ? -degrees : degrees);
  }
  return {
    dir: degrees < 0 ? (isLong ? 'W' : 'S') : isLong ? 'E' : 'N',
    deg: degree,
    min: Math.abs(0 | (M / 1e7)),
    sec: Math.abs((0 | (((M / 1e6) % 1) * 6e4)) / 100),
  };
};

const formatLatLong = (location: Coordinates) => {
  const lat = convertDDToDMS(location.lat, false);
  const long = convertDDToDMS(location.long, true);
  return `${lat.deg}°${lat.min}.${Math.ceil(Number(lat.sec / 100))}${lat.dir}/${long.deg}°${long.min}.${Math.ceil(Number(long.sec / 100))}${long.dir}`;
};
