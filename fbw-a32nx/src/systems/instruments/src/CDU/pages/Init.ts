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
import { CDUScratchpad } from '@cdu/model/Scratchpad';
import { SimbriefStatus } from '@cdu/model/Subsystem/Simbrief';
import { InitFuelPred } from '@cdu/pages/InitFuelPred';
import { Airport } from '../../../../../../../fbw-common/src/systems/navdata';
import { FmgcFlightPhase } from '@shared/flightphase';

export class Init extends DisplayablePage {
  title = 'INIT';

  arrows = { up: false, down: false, left: true, right: true };

  static readonly pageID: string = 'INIT';
  _pageID = Init.pageID;
  allowsTyping = true;

  lines = this.makeInitPageLines();

  makeInitPageLines() {
    const origin = this.CDU.FlightInformation.origin;
    const dest = this.CDU.FlightInformation.destination;
    const altn = this.CDU.FlightInformation.alternate;
    const fltNo = this.CDU.FlightInformation.flightNumber;
    const costIndex = this.CDU.FlightInformation.costIndex;
    const crzFl = this.CDU.FlightInformation.cruiseLevel;
    const crzFlTemp = this.CDU.FlightInformation.crzFlTemp;
    const defaultCrzFlTemp = +this.CDU.FlightInformation.defaultCrzFLTemp;
    const manualTropo = this.CDU.FlightInformation.manuallyEnteredTropo;
    const tropo = this.CDU.FlightInformation.tropo;
    const uplinkDone = this.CDU.Simbrief.uplinkDone;
    const manualGndTmp = this.CDU.FlightInformation.manuallyEnteredGroundTemp;

    return makeLines(
      new CDULine(
        new CDUElement(origin ? '' : '__________', origin ? CDUColor.Cyan : CDUColor.Amber),
        new CDUElement('CO RTE'),
        origin
          ? new CDUElement(origin.ident + '/' + (dest ? dest.ident : '\xa0\xa0\xa0\xa0'), CDUColor.Cyan)
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
        manualTropo
          ? new CDUElement(manualTropo.toFixed(0), CDUColor.Cyan, CDUTextSize.Large)
          : new CDUElement(tropo ? tropo.toFixed(0) : '36090', CDUColor.Cyan, CDUTextSize.Small),
        new CDUElement('TROPO'),
      ),
      new CDULine(
        new CDUElement(
          crzFl ? ('FL' + crzFl.toFixed(0)).padEnd(6, '\xa0') : '----- ',
          crzFl ? CDUColor.Cyan : CDUColor.White,
          CDUTextSize.Large,
          crzFl
            ? new CDUElement(
                '/' + (crzFlTemp ?? defaultCrzFlTemp.toFixed(0)) + '°',
                CDUColor.Cyan,
                crzFlTemp ? CDUTextSize.Large : CDUTextSize.Small,
              )
            : new CDUElement('/---°'),
        ),
        new CDUElement('CRZ FL/TEMP'),
        origin
          ? new CDUElement(
              (manualGndTmp ? manualGndTmp.toFixed(0) : this.CDU.FlightInformation.defaultGroundTemp.toFixed(0)) + '°',
              CDUColor.Cyan,
              manualGndTmp ? CDUTextSize.Large : CDUTextSize.Small,
            )
          : new CDUElement('---°'),
        new CDUElement('GND TEMP'),
      ),
    );
  }

  onRefresh() {
    this.lines = this.makeInitPageLines();
    if (this.CDU.Simbrief.uplinkDone) {
      this.refreshRate = RefreshRate.None;
    }
  }

  refresh() {
    this.lines = this.makeInitPageLines();
    super.refresh();
  }

  onRSK1() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK2() {
    if (this.CDU.Simbrief.uplinkDone) {
      return;
    }
    this.CDU.addMessageToQueue(
      NXSystemMessages.uplinkInsertInProg.getModifiedMessage('', () => this.CDU.Simbrief.uplinkDone),
    );
    this.CDU.Simbrief.tryUplinkFlightPlan();
    this.refreshRate = RefreshRate.Medium;
    this.refresh();
  }

  onRSK3() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK4() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onRSK5() {
    if (this.scratchpad.isEmpty()) return;
    if (this.scratchpad.isCLR() && this.CDU.FlightInformation.manuallyEnteredTropo) {
      this.CDU.FlightInformation.manuallyEnteredTropo = undefined;
      this.refresh();
      return;
    }

    if (this.scratchpad.contentIsNumber()) {
      const num = this.scratchpad.getNumber();
      if (num < 0 || num > 60000) {
        this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      } else {
        this.scratchpad.clear();
        this.CDU.FlightInformation.manuallyEnteredTropo = Math.round(num / 10) * 10;
        this.refresh();
      }
    } else {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
    }
  }

  onRSK6() {
    if (this.CDU.flightPhaseManager.phase !== FmgcFlightPhase.Preflight) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }

    if (this.scratchpad.isCLR()) {
      this.CDU.FlightInformation.manuallyEnteredGroundTemp = undefined;
      this.scratchpad.clear();
      this.refresh();
      return;
    }

    if (!this.scratchpad.contentIsNumber()) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    const num = Math.round(this.scratchpad.getNumber());
    if (num < -99 || num > 99) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }

    this.CDU.FlightInformation.manuallyEnteredGroundTemp = num;
    this.scratchpad.clear();
    this.refresh();
  }

  onLSK1() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK2() {
    const altDestIdent = this.scratchpad.getContents();
    if (!altDestIdent || altDestIdent === 'NONE' || altDestIdent === CDUScratchpad.clrValue) {
      this.CDU.ATSU.fmsClient.resetAtisAutoUpdate();
      this.CDU.flightPlanService.setAlternate(undefined).then(() => {
        this.refresh();
      });
      this.scratchpad.clear();
      return;
    }

    this.searchAirport(altDestIdent).then((airportAltDest) => {
      if (airportAltDest) {
        this.CDU.ATSU.fmsClient.resetAtisAutoUpdate();
        this.CDU.flightPlanService.setAlternate(altDestIdent).then(() => {
          this.refresh();
        });
        this.scratchpad.clear();
      } else {
        this.scratchpad.setMessage(NXSystemMessages.notInDatabase);
      }
      this.refresh();
    });
  }

  async searchAirport(icao: string): Promise<Airport> {
    return this.CDU.navigationDatabase.searchAirport(icao);
  }

  onLSK3() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLSK5() {
    if (this.scratchpad.isEmpty()) return;

    if (this.scratchpad.isCLR()) {
      this.CDU.FlightInformation.costIndex = undefined;
      this.scratchpad.clear();
      this.refresh();
      return;
    }

    if (this.scratchpad.contentIsNumber()) {
      const num = this.scratchpad.getNumber();
      if (num < 0 || num > 999) {
        this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      } else {
        this.CDU.FlightInformation.costIndex = num.toFixed(0);
        this.scratchpad.clear();
        this.refresh();
      }
    } else {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
    }
  }

  onLSK6() {
    this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLeft() {
    this.openPage(new InitFuelPred(this.display));
  }

  onRight() {
    this.openPage(new InitFuelPred(this.display));
  }
}
