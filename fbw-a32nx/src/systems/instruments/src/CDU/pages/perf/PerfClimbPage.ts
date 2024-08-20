import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXFictionalMessages, NXSystemMessages } from '@cdu/data/NXMessages';
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
    this.allowsTyping = true;

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
    if (this.hasCostIndex()) {
      const showManagedSpeed = this.hasFromToPair() && this.hasCostIndex();
      const canClickManagedSpeed =
        showManagedSpeed && this.CDU.Performance.preSelectedClimbSpeed && !this.isClimbFlightPhase();
      const climbSpeed = this.CDU.FMGC.getCurrentClimbManagedSpeed();
      speedDisplay = (canClickManagedSpeed ? '*' : '\xa0') + climbSpeed.toFixed();
      speedColor = CDUColor.Green;
    }
    return {
      left: new CDUElement(speedDisplay, speedColor, CDUTextSize.Small),
      leftLabel: new CDUElement('MANAGED'),
    };
  }

  preselLine(): ICDULine {
    const preselSpeed = this.CDU.Performance.preSelectedClimbSpeed;
    return {
      left: new CDUElement(preselSpeed ? '\xa0' + preselSpeed.toFixed(0) : '*[ ]', CDUColor.Cyan),
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
    if (this.hasFromToPair()) {
      if (this.hasCostIndex()) {
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

  private hasFromToPair(): boolean {
    return !!(this.CDU.flightPlanService.active.originAirport && this.CDU.flightPlanService.active.destinationAirport);
  }

  private hasCostIndex(): boolean {
    return typeof this.CDU.FlightInformation.costIndex === 'number';
  }

  private isClimbFlightPhase() {
    return this.CDU.flightPhaseManager.phase === FmgcFlightPhase.Climb;
  }

  private isTakeoffFlightPhase() {
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

  onLSK3() {
    const showManagedSpeed = this.hasFromToPair() && this.hasCostIndex();
    const canClickManagedSpeed =
      showManagedSpeed && this.CDU.Performance.preSelectedClimbSpeed && !this.isClimbFlightPhase();
    if (!canClickManagedSpeed) {
      return;
    }

    this.CDU.Performance.setPreSelectedClimbSpeed(undefined);
    this.refresh();
  }

  onLSK4() {
    if (this.scratchpad.isEmpty()) {
      return;
    }
    if (this.scratchpad.isCLR()) {
      this.CDU.Performance.setPreSelectedClimbSpeed(undefined);
      return;
    }

    const contents = this.scratchpad.getContents();
    const SPD_REGEX = /\d{1,3}/;
    if (contents.match(SPD_REGEX) === null) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    const spd = parseInt(contents);
    if (!Number.isFinite(spd)) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    if (spd < 100 || spd > 350) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }

    this.CDU.Performance.setPreSelectedClimbSpeed(spd);
    this.scratchpad.clear();
    this.refresh();
  }

  // #endregion
}
