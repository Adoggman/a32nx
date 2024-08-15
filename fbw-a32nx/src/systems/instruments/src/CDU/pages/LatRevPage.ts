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
import { ArrivalsPage } from '@cdu/pages/ArrivalsPage';
import { DeparturesPage } from '@cdu/pages/DeparturesPage';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export class LatRevPage extends DisplayablePage {
  static readonly pageID: string = 'LAT_REV';
  _pageID = LatRevPage.pageID;

  leg: FlightPlanLeg;
  legIndex: number;

  isOrigin: boolean;
  isDestination: boolean;
  isPPOS: boolean;
  isNormal: boolean;

  constructor(display: CDUDisplay, leg?: FlightPlanLeg, legIndex?: number) {
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
        new CDUElement(this.leg?.ident ?? 'PPOS', CDUColor.Green, CDUTextSize.Large),
      ),
    );

    this.isPPOS = !this.leg;
    this.isOrigin = this.isPPOS || this.legIndex === this.originLegIndex;
    this.isDestination = !this.isPPOS && this.legIndex === this.destinationLegIndex;
    this.isNormal = !this.isOrigin && !this.isDestination;

    this.lines = this.makeLatRevLines();
  }

  makeLatRevLines() {
    return makeLines(
      {
        left: { text: this.isOrigin && !this.isPPOS ? '<DEPARTURE' : '' },
        right: { text: this.isDestination ? 'ARRIVAL>' : this.isOrigin ? 'FIX INFO>' : '' },
        centerLabel: this.isPPOS
          ? undefined
          : new CDUElement(this.formatLatLong(this.leg.definition.waypoint.location), CDUColor.Green),
      },
      this.isDestination
        ? EmptyLine
        : new CDULine(
            this.isPPOS ? undefined : new CDUElement('<OFFSET', CDUColor.Inop),
            undefined,
            new CDUElement('[\xa0\xa0]°/[\xa0]°/[]', CDUColor.Inop),
            new CDUElement('LL XING/INCR/NO', CDUColor.Inop),
          ),
      this.isPPOS
        ? undefined
        : new CDULine(
            this.isNormal ? new CDUElement('<HOLD') : undefined,
            undefined,
            new CDUElement('[\xa0\xa0\xa0\xa0]', CDUColor.Cyan, CDUTextSize.Small),
            new CDUElement('NEXT WPT\xa0'),
          ),
      this.isPPOS
        ? undefined
        : new CDULine(
            !this.isOrigin ? new CDUElement('<ALTN', CDUColor.Cyan) : undefined,
            !this.isOrigin ? new CDUElement(' ENABLE', CDUColor.Cyan) : undefined,
            this.isDestination ? undefined : new CDUElement('[\xa0\xa0]', CDUColor.Cyan, CDUTextSize.Small),
            this.isDestination ? undefined : new CDUElement('NEW DEST\xa0'),
          ),
      this.isNormal
        ? new CDULineRight(new CDUElement('AIRWAYS>'))
        : this.isDestination
          ? new CDULine(new CDUElement('<ALTN', CDUColor.Inop))
          : EmptyLine,
      new CDULine('<RETURN'),
    );
  }

  onLSK1() {
    if (this.isOrigin) {
      // <DEPARTURE
      this.openPage(new DeparturesPage(this.display));
      return;
    }
  }

  onLSK3() {
    if (this.isNormal) {
      // <HOLD
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
    }
  }

  onLSK4() {
    if (!this.isOrigin) {
      // <ALTN ENABLE
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
    }
  }

  onLSK6() {
    this.display.openLastPage();
  }

  onRSK1() {
    if (this.isDestination) {
      // ARRIVAL >
      this.openPage(new ArrivalsPage(this.display));
      return;
    }
    if (this.isOrigin) {
      // FIX INFO>
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
      return;
    }
  }

  onRSK3() {
    // NEXT WPT
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK4() {
    if (!this.isDestination) {
      // NEW DEST
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
    }
  }

  onRSK5() {
    if (this.isNormal) {
      // AIRWAYS
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
    }
  }

  get originLegIndex() {
    return this.CDU.flightPlanService.active.originLegIndex;
  }

  get destinationLegIndex() {
    return this.CDU.flightPlanService.active.destinationLegIndex;
  }

  convertDDToDMS = (degrees: Degrees, isLong: boolean) => {
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

  formatLatLong = (location: Coordinates) => {
    const lat = this.convertDDToDMS(location.lat, false);
    const long = this.convertDDToDMS(location.long, true);
    return `${lat.deg}°${lat.min}.${Math.ceil(Number(lat.sec / 100))}${lat.dir}/${long.deg}°${long.min}.${Math.ceil(Number(long.sec / 100))}${long.dir}`;
  };
}
