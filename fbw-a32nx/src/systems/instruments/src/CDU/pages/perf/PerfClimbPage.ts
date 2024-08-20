import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { formatAltitudeOrLevel } from '@cdu/Format';
import {
  CDUColor,
  CDUElement,
  CDUTextSize,
  DisplayablePage,
  ICDULine,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { PerfTakeoffPage } from '@cdu/pages/perf/PerfTakeoffPage';
import { FmgcFlightPhase } from '@shared/flightphase';

export class PerfClimbPage extends DisplayablePage {
  static readonly pageID: string = 'PERF_CLIMB';
  _pageID = PerfClimbPage.pageID;

  // #region Properties

  // #endregion

  // #region Page

  constructor(display: CDUDisplay) {
    super(display);
    this.title = new CDUElement('\xa0CLB', this.isClimbFlightPhase() ? CDUColor.Green : CDUColor.White);
    this.refreshRate = RefreshRate.Default;
    this.lines = makeLines(...this.getLines());
  }

  refresh() {
    this.lines = makeLines(...this.getLines());
    super.refresh();
  }

  // #endregion

  // #region Lines

  getLines(): ICDULine[] {
    return [
      this.actModeLine(),
      this.costIndexLine(),
      this.managedLine(),
      this.preselLine(),
      undefined,
      this.lastLine(),
    ];
  }

  // #endregion

  // #region Line

  actModeLine(): ICDULine {
    const isPhaseActive = this.isClimbFlightPhase();
    const isSelected =
      (isPhaseActive && Simplane.getAutoPilotAirspeedSelected()) ||
      (!isPhaseActive && this.CDU.FMGC.getPreSelectedClbSpeed() !== undefined);
    return {
      left: new CDUElement(isSelected ? 'SELECTED' : 'MANAGED', CDUColor.Green),
      leftLabel: new CDUElement('ACT MODE'),
    };
  }

  costIndexLine(): ICDULine {
    const costIndexElement = this.costIndexElement();
    const predToElement = this.predToElement();
    return { left: costIndexElement, leftLabel: new CDUElement('CI'), right: predToElement };
  }

  managedLine(): ICDULine {
    let speedDisplay = '\xa0---/---';
    let speedColor = CDUColor.White;
    if (typeof this.CDU.FlightInformation.costIndex === 'number') {
      const climbSpeed = this.CDU.FMGC.getCurrentClimbManagedSpeed();
      speedDisplay = '\xa0' + climbSpeed.toFixed();
      speedColor = CDUColor.Green;
    }
    return {
      left: new CDUElement(speedDisplay, speedColor, CDUTextSize.Small),
      leftLabel: new CDUElement('MANAGED'),
    };
  }

  preselLine(): ICDULine {
    return {
      left: new CDUElement('*[ ]', CDUColor.Cyan),
      leftLabel: new CDUElement('PRESEL'),
    };
  }

  lastLine(): ICDULine {
    const isClimbPhase = this.isClimbFlightPhase();
    const left = new CDUElement(isClimbPhase ? '<APPR PHASE' : '<PHASE');
    const leftLabel = new CDUElement(isClimbPhase ? '\xa0ACTIVATE' : '\xa0PREV');
    const right = new CDUElement('PHASE>');
    const rightLabel = new CDUElement('NEXT\xa0');
    return { left, leftLabel, right, rightLabel };
  }

  // #endregion

  // #region Elements and Labels

  costIndexElement(): CDUElement {
    const hasFromToPair =
      this.CDU.flightPlanService.active.originAirport && this.CDU.flightPlanService.active.destinationAirport;
    if (hasFromToPair) {
      if (typeof this.CDU.FlightInformation.costIndex === 'number') {
        return new CDUElement(this.CDU.FlightInformation.costIndex.toFixed(0), CDUColor.Cyan);
      } else {
        return new CDUElement('___', CDUColor.Amber);
      }
    } else {
      return new CDUElement('---', CDUColor.White);
    }
  }

  predToElement(): CDUElement {
    const showPredTo = this.isClimbFlightPhase() || this.isTakeoffFlightPhase();
    if (!showPredTo) {
      return undefined;
    }
    const cruiseAltitude: Feet = this.CDU.FlightInformation.cruiseLevel * 100;
    const fcuAltitude: Feet = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const pilotEnteredAlt = undefined; // TODO allow setting
    const altitudeToPredict = pilotEnteredAlt !== undefined ? pilotEnteredAlt : Math.min(cruiseAltitude, fcuAltitude);
    return CDUElement.stringTogether(
      new CDUElement('PRED TO ', CDUColor.White, CDUTextSize.Small),
      new CDUElement(formatAltitudeOrLevel(this.CDU.flightPlanService.active, altitudeToPredict, true)),
    );
  }

  // #endregion

  // #region Helpers

  isClimbFlightPhase() {
    return this.CDU.flightPhaseManager.phase === FmgcFlightPhase.Climb;
  }

  isTakeoffFlightPhase() {
    return this.CDU.flightPhaseManager.phase === FmgcFlightPhase.Takeoff;
  }

  // #endregion

  // #region Input Handling

  onLSK6() {
    if (this.isClimbFlightPhase()) {
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
      return;
    }
    this.openPage(new PerfTakeoffPage(this.display));
  }

  // #endregion
}
