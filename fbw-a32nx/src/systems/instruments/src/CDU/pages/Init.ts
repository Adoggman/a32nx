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
    const hasFlight = !!origin;
    const dest = this.CDU.FlightInformation.destination;
    const altn = this.CDU.FlightInformation.alternate;
    const fltNo = this.CDU.FlightInformation.flightNumber;
    const costIndex = this.CDU.FlightInformation.costIndex;
    const crzFl = this.CDU.FlightInformation.cruiseLevel;
    const crzFlTemp = this.CDU.FlightInformation.crzFlTemp;
    const defaultCrzFlTemp = +this.CDU.FlightInformation.defaultCrzFLTemp;
    const manualTropo = this.CDU.FlightInformation.manuallyEnteredTropo;
    const tropo = this.CDU.FlightInformation.tropo;
    const manualGndTmp = this.CDU.FlightInformation.manuallyEnteredGroundTemp;
    const simbriefUplinkDone = this.CDU.Simbrief.uplinkDone;

    const coRteElement = new CDUElement(hasFlight ? '' : '__________', origin ? CDUColor.Cyan : CDUColor.Amber);
    const originDestElement = hasFlight
      ? new CDUElement(origin.ident + '/' + (dest ? dest.ident : '\xa0\xa0\xa0\xa0'), CDUColor.Cyan)
      : new CDUElement('____/____', CDUColor.Amber);

    const alternateElement = hasFlight
      ? new CDUElement(altn?.ident ?? 'NONE', CDUColor.Cyan)
      : new CDUElement('----/----------');

    let flightLevelTempElement = hasFlight
      ? new CDUElement('_____ /___°', CDUColor.Amber)
      : new CDUElement('----- ', CDUColor.White, CDUTextSize.Large, new CDUElement('/---°'));

    if (crzFl) {
      flightLevelTempElement = new CDUElement(
        'FL' + crzFl.toFixed(0).padEnd(6, '\xa0'),
        CDUColor.Cyan,
        CDUTextSize.Large,
        new CDUElement(
          '/' + (crzFlTemp ?? defaultCrzFlTemp.toFixed(0)) + '°',
          CDUColor.Cyan,
          crzFlTemp ? CDUTextSize.Large : CDUTextSize.Small,
        ),
      );
    }

    const gndTempElement = hasFlight
      ? new CDUElement(
          (manualGndTmp ? manualGndTmp.toFixed(0) : this.CDU.FlightInformation.defaultGroundTemp.toFixed(0)) + '°',
          CDUColor.Cyan,
          manualGndTmp ? CDUTextSize.Large : CDUTextSize.Small,
        )
      : new CDUElement('---°');

    return makeLines(
      new CDULine(coRteElement, new CDUElement('CO RTE'), originDestElement, new CDUElement('FROM/TO\xa0\xa0')),
      new CDULine(
        alternateElement,
        new CDUElement('ALTN/CO RTE'),
        simbriefUplinkDone
          ? undefined
          : new CDUElement(
              'REQUEST' + (this.CDU.Simbrief.Status === SimbriefStatus.Requesting ? '\xa0' : '*'),
              CDUColor.Amber,
            ),
        simbriefUplinkDone ? undefined : new CDUElement('INIT\xa0', CDUColor.Amber),
      ),
      new CDULine(
        new CDUElement(fltNo ?? '________', fltNo ? CDUColor.Cyan : CDUColor.Amber),
        new CDUElement('FLT NBR'),
        hasFlight ? new CDUElement('IRS INIT>') : undefined,
      ),
      new CDULineRight(new CDUElement('WIND/TEMP>')),
      new CDULine(
        hasFlight
          ? new CDUElement(costIndex ? costIndex : '___', costIndex ? CDUColor.Cyan : CDUColor.Amber)
          : new CDUElement(costIndex ?? '---'),
        new CDUElement('COST INDEX'),
        manualTropo
          ? new CDUElement(manualTropo.toFixed(0), CDUColor.Cyan, CDUTextSize.Large)
          : new CDUElement(tropo ? tropo.toFixed(0) : '36090', CDUColor.Cyan, CDUTextSize.Small),
        new CDUElement('TROPO'),
      ),
      new CDULine(flightLevelTempElement, new CDUElement('CRZ FL/TEMP'), gndTempElement, new CDUElement('GND TEMP')),
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
    if (this.scratchpad.isEmpty()) {
      // TODO: CO RTE list
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
      return;
    }

    if (this.scratchpad.isCLR()) {
      // Clear
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }

    const contents = this.scratchpad.getSplitContents();
    if (contents.length !== 2) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    const orig = contents[0];
    const dest = contents[1];

    this.searchAirports([orig, dest]).then((airports) => {
      const from = airports[0];
      const to = airports[1];
      if (from && to) {
        this.CDU.ATSU.fmsClient.resetAtisAutoUpdate();
        this.CDU.flightPlanService.newCityPair(orig, dest).then(() => {
          this.refresh();
        });
        this.scratchpad.clear();
      } else {
        this.scratchpad.setMessage(NXSystemMessages.notInDatabase);
      }
    });
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
    if (this.scratchpad.isCLR()) {
      this.CDU.FlightInformation.manuallyEnteredTropo = undefined;
      this.scratchpad.clear();
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
    if (this.scratchpad.isEmpty()) return;

    const icao = this.scratchpad.getContents();
    if (icao === 'NONE' || icao === CDUScratchpad.clrValue) {
      this.CDU.ATSU.fmsClient.resetAtisAutoUpdate();
      this.CDU.flightPlanService.setAlternate(undefined).then(() => {
        this.refresh();
      });
      this.scratchpad.clear();
      return;
    }

    this.searchAirport(icao).then((airport) => {
      if (airport) {
        this.CDU.ATSU.fmsClient.resetAtisAutoUpdate();
        this.CDU.flightPlanService.setAlternate(icao).then(() => {
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

  async searchAirports(icaos: string[]): Promise<Airport[]> {
    return this.CDU.navigationDatabase.searchAirports(icaos);
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
