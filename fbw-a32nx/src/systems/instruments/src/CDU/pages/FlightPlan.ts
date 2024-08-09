import { CDUColor, CDUElement, CDUTextSize, DisplayablePage, ICDULine, makeLines } from '@cdu/model/CDUPage';

export class FlightPlan extends DisplayablePage {
  title = '';
  titleLeft = '\xa0'.repeat(14) + (this.CDU.FlightInformation.flightNumber ?? '');

  arrows = { up: true, down: true, left: true, right: true };

  static readonly pageID: string = 'FPLN';
  _pageID = FlightPlan.pageID;
  allowsTyping = true;

  lines = this.makeFplnLines();

  makeFplnLines() {
    return makeLines(
      this.fromLine(),
      this.discontinuityLine(),
      this.endOfFplnLine(),
      this.noAltnFplnLine(),
      undefined,
      this.destLine(),
    );
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
}

const formatAlt = (altitude: number) => {
  return (Math.round(altitude / 10) * 10).toFixed(0);
};
