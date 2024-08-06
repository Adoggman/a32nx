import { NXFictionalMessages, NXSystemMessages } from '@cdu/data/NXMessages';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULineRight,
  CDUTextSize,
  DisplayablePage,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { SimbriefStatus } from '@cdu/model/Subsystem/Simbrief';
import { InitFuelPred } from '@cdu/pages/InitFuelPred';

export class Init extends DisplayablePage {
  title = 'INIT';

  arrows = { up: false, down: false, left: true, right: true };

  static readonly pageID: string = 'INIT';
  _pageID = Init.pageID;
  allowsTyping = true;

  lines = this.makeInitPageLines();

  makeInitPageLines() {
    const origin = this.CDU.flightPlanService.active.originAirport;
    const dest = this.CDU.flightPlanService.active.destinationAirport;
    const altn = this.CDU.flightPlanService.active.alternateDestinationAirport;
    const fltNo = this.CDU.Simbrief.flightNumber;
    const costIndex = this.CDU.Simbrief.Data?.costIndex;
    const crzFl = this.CDU.Simbrief.crzFL;
    const crzFlTemp = +this.CDU.Simbrief.crzFLTemp;
    const tropo = this.CDU.Simbrief.tropo;
    const uplinkDone = this.CDU.Simbrief.uplinkDone;

    return makeLines(
      new CDULine(
        new CDUElement(origin ? '' : '__________', origin ? CDUColor.Cyan : CDUColor.Amber),
        new CDUElement('CO RTE'),
        origin
          ? new CDUElement(origin.ident + '/' + dest.ident, CDUColor.Cyan)
          : new CDUElement('____/____', CDUColor.Amber),
        new CDUElement('FROM/TO\xa0\xa0'),
      ),
      new CDULine(
        altn ? new CDUElement(altn.ident, CDUColor.Cyan) : new CDUElement('----/----------'),
        new CDUElement('ALTN/CO RTE'),
        uplinkDone
          ? undefined
          : new CDUElement(
              'REQUEST' + (this.CDU.Simbrief.Status === SimbriefStatus.Requesting ? '\xa0' : '*'),
              CDUColor.Amber,
            ),
        uplinkDone ? undefined : new CDUElement('INIT\xa0', CDUColor.Amber),
      ),
      new CDULine(
        new CDUElement(fltNo ?? '________', fltNo ? CDUColor.Cyan : CDUColor.Amber),
        new CDUElement('FLT NBR'),
        uplinkDone ? new CDUElement('IRS INIT>') : undefined,
      ),
      new CDULineRight(new CDUElement('WIND/TEMP>')),
      new CDULine(
        new CDUElement(uplinkDone ? costIndex : '---', uplinkDone ? CDUColor.Cyan : CDUColor.White),
        new CDUElement('COST INDEX'),
        new CDUElement(tropo ? tropo.toFixed(0) : '36090', CDUColor.Cyan),
        new CDUElement('TROPO'),
      ),
      new CDULine(
        new CDUElement(
          crzFl ? ('FL' + crzFl.toFixed(0)).padEnd(6, '\xa0') : '----- ',
          crzFl ? CDUColor.Cyan : CDUColor.White,
          CDUTextSize.Large,
          crzFl
            ? new CDUElement('/' + crzFlTemp.toFixed(0) + '°', CDUColor.Cyan, CDUTextSize.Small)
            : new CDUElement('/---°'),
        ),
        new CDUElement('CRZ FL/TEMP'),
        this.CDU.Simbrief.originGroundTemp
          ? new CDUElement(this.CDU.Simbrief.originGroundTemp.toFixed(0) + '°', CDUColor.Cyan, CDUTextSize.Small)
          : new CDUElement('---°'),
        new CDUElement('GND TEMP'),
      ),
    );
  }

  onRefresh() {
    this.lines = this.makeInitPageLines();
  }

  onRSK1() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK2() {
    if (this.CDU.Simbrief.uplinkDone) {
      return;
    }
    this.CDU.addMessageToQueue(NXSystemMessages.uplinkInsertInProg);
    this.CDU.Simbrief.tryUplinkFlightPlan();
    this.refreshRate = RefreshRate.Fast;
    this.refresh();
  }

  onRSK3() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK4() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK5() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK6() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK1() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK2() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK3() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK5() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK6() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLeft() {
    this.openPage(new InitFuelPred(this.display));
  }

  onRight() {
    this.openPage(new InitFuelPred(this.display));
  }
}
