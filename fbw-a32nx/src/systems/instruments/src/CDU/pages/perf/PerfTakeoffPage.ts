import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXSystemMessages } from '@cdu/data/NXMessages';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  makeLines,
  RefreshRate,
} from '@cdu/model/CDUPage';
import { RunwayUtils } from '@fmgc/index';
import { FmgcFlightPhase } from '@shared/flightphase';

export class PerfTakeoffPage extends DisplayablePage {
  static readonly pageID: string = 'PERF_TAKEOFF';
  _pageID = PerfTakeoffPage.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.refreshRate = RefreshRate.Medium;
    this.title = new CDUElement(
      'TAKE OFF RWY ',
      CDUColor.White,
      CDUTextSize.Large,
      new CDUElement(
        this.currentRunway ? RunwayUtils.runwayString(this.currentRunway.ident) : '\xa0\xa0\xa0',
        CDUColor.Green,
      ),
    );
    this.lines = this.makeTakeoffPerfLines();
    this.allowsTyping = true;
  }

  makeTakeoffPerfLines() {
    return makeLines(
      this.makeLine1(),
      this.makeLine2(),
      this.makeLine3(),
      this.makeLine4(),
      this.makeLine5(),
      this.makeLine6(),
    );
  }

  makeLine1() {
    const v1Speed = this.CDU.Performance.v1Speed;
    const flapRetractSpeed = this.CDU.Performance.flapRetractSpeed;
    return new CDULine(
      new CDUElement(
        v1Speed ? v1Speed.toFixed(0) : '___',
        v1Speed ? CDUColor.Cyan : CDUColor.Amber,
        CDUTextSize.Large,
        new CDUElement(
          '\xa0\xa0\xa0\xa0F=',
          CDUColor.White,
          CDUTextSize.Large,
          new CDUElement(
            flapRetractSpeed ? flapRetractSpeed.toFixed(0) : '---',
            flapRetractSpeed ? CDUColor.Green : CDUColor.White,
          ),
        ),
      ),
      new CDUElement('\xa0V1\xa0\xa0FLP RETR'),
    );
  }

  makeLine2() {
    const vRSpeed = this.CDU.Performance.vRSpeed;
    const slatRetractSpeed = this.CDU.Performance.slatRetractSpeed;
    return new CDULine(
      new CDUElement(
        vRSpeed ? vRSpeed.toFixed(0) : '___',
        vRSpeed ? CDUColor.Cyan : CDUColor.Amber,
        CDUTextSize.Large,
        new CDUElement(
          '\xa0\xa0\xa0\xa0S=',
          CDUColor.White,
          CDUTextSize.Large,
          new CDUElement(
            slatRetractSpeed ? slatRetractSpeed.toFixed(0) : '---',
            slatRetractSpeed ? CDUColor.Green : CDUColor.White,
          ),
        ),
      ),
      new CDUElement('\xa0VR\xa0\xa0SLT RETR'),
      this.currentRunway
        ? new CDUElement(
            '[M]',
            CDUColor.Inop,
            CDUTextSize.Small,
            new CDUElement('[\xa0\xa0]*', CDUColor.Inop, CDUTextSize.Large),
          )
        : new CDUElement('----\xa0', CDUColor.Inop),
      new CDUElement('TO SHIFT\xa0'),
    );
  }

  makeLine3() {
    const v2Speed = this.CDU.Performance.v2Speed;
    const cleanSpeed = this.CDU.Performance.cleanSpeed;
    const flaps = this.CDU.Performance.takeoffFlaps;
    const ths = this.CDU.Performance.takeoffTrim;
    const formattedThs =
      ths && isFinite(ths)
        ? ths >= 0 && !Object.is(ths, -0)
          ? `UP${Math.abs(ths).toFixed(1)}`
          : `DN${Math.abs(ths).toFixed(1)}`
        : '';
    return new CDULine(
      new CDUElement(
        v2Speed ? v2Speed.toFixed(0) : '___',
        v2Speed ? CDUColor.Cyan : CDUColor.Amber,
        CDUTextSize.Large,
        new CDUElement(
          '\xa0\xa0\xa0\xa0O=',
          CDUColor.White,
          CDUTextSize.Large,
          new CDUElement(cleanSpeed ? cleanSpeed.toFixed(0) : '---', cleanSpeed ? CDUColor.Green : CDUColor.White),
        ),
      ),
      new CDUElement('\xa0V2\xa0\xa0\xa0\xa0\xa0CLEAN'),
      new CDUElement(
        (flaps ? flaps.toFixed(0) : '[]') + '/' + (formattedThs ? formattedThs : '[\xa0\xa0\xa0]'),
        CDUColor.Cyan,
      ),
      new CDUElement('FLAPS/THS'),
    );
  }

  makeLine4() {
    const plan = this.CDU.flightPlanService.activeOrTemporary;
    const hasOrigin = !!plan?.originAirport;
    const transAlt = plan?.performanceData.transitionAltitude;
    const transAltitudeIsFromDatabase = plan?.performanceData.transitionAltitudeIsFromDatabase;
    return {
      left: new CDUElement(
        transAlt ? transAlt.toFixed(0) : hasOrigin ? '[\xa0\xa0\xa0\xa0]' : '',
        CDUColor.Cyan,
        transAltitudeIsFromDatabase ? CDUTextSize.Small : CDUTextSize.Large,
      ),
      leftLabel: new CDUElement('TRANS ALT'),
      right: new CDUElement('[\xa0\xa0]°', CDUColor.Cyan),
      rightLabel: new CDUElement('FLEX TO TEMP'),
    };
  }

  makeLine5() {
    const plan = this.CDU.flightPlanService.activeOrTemporary;
    const hasOrigin = !!plan?.originAirport;
    const color = hasOrigin
      ? this.CDU.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff
        ? CDUColor.Green
        : CDUColor.Cyan
      : CDUColor.White;
    const thrustReductionAlt = plan.performanceData.thrustReductionAltitude;
    const isThrustReductionManual = thrustReductionAlt && plan.performanceData.thrustReductionAltitudeIsPilotEntered;
    const accelerationAlt = plan.performanceData.accelerationAltitude;
    const isAccelerationManual = accelerationAlt && plan.performanceData.accelerationAltitudeIsPilotEntered;
    const engineOutAlt = plan.performanceData.engineOutAccelerationAltitude;
    const isEngineOutManual = engineOutAlt && plan.performanceData.engineOutAccelerationAltitudeIsPilotEntered;
    return {
      left: new CDUElement(
        thrustReductionAlt ? thrustReductionAlt.toFixed(0).padStart(5, '\xa0') : '-----',
        color,
        isThrustReductionManual ? CDUTextSize.Large : CDUTextSize.Small,
        new CDUElement(
          '/',
          color,
          CDUTextSize.Large,
          new CDUElement(
            accelerationAlt ? accelerationAlt.toFixed(0) : '-----',
            color,
            isAccelerationManual ? CDUTextSize.Large : CDUTextSize.Small,
          ),
        ),
      ),
      leftLabel: new CDUElement('THR RED/ACC'),
      right: new CDUElement(
        engineOutAlt ? engineOutAlt.toFixed(0) : '-----',
        color,
        isEngineOutManual ? CDUTextSize.Large : CDUTextSize.Small,
      ),
      rightLabel: new CDUElement('ENG OUT ACC'),
    };
  }

  makeLine6() {
    return {
      left: new CDUElement('<TO DATA', CDUColor.Inop),
      leftLabel: new CDUElement('\xa0UPLINK', CDUColor.Inop),
      right: new CDUElement('PHASE>'),
      rightLabel: new CDUElement('NEXT\xa0'),
    };
  }

  onLSK1() {
    if (this.scratchpad.isCLR() || this.scratchpad.isEmpty()) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    const contents = this.scratchpad.getContents();
    const v = parseInt(contents);
    if (!isFinite(v) || !/^\d{2,3}$/.test(contents)) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }
    if (!this.CDU.Performance.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Performance.setV1Speed(v);
    this.scratchpad.clear();
    this.refresh();
  }

  onLSK2() {
    if (this.scratchpad.isCLR() || this.scratchpad.isEmpty()) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    const contents = this.scratchpad.getContents();
    const v = parseInt(contents);
    if (!isFinite(v) || !/^\d{2,3}$/.test(contents)) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }
    if (!this.CDU.Performance.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Performance.setVRSpeed(v);
    this.scratchpad.clear();
    this.refresh();
  }

  onLSK3() {
    if (this.scratchpad.isCLR() || this.scratchpad.isEmpty()) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }
    const contents = this.scratchpad.getContents();
    const v = parseInt(contents);
    if (!isFinite(v) || !/^\d{2,3}$/.test(contents)) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }
    if (!this.CDU.Performance.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Performance.setV2Speed(v);
    this.scratchpad.clear();
    this.refresh();
  }

  onRSK3() {
    // Clear
    if (this.scratchpad.isCLR()) {
      this.CDU.Performance.setTakeoffFlaps(null);
      this.CDU.Performance.setTakeoffTrim(null);
      this.CDU.Performance.tryCheckToData();
      return;
    }

    let newFlaps = null;
    let newThs = null;

    const [flaps, ths] = this.scratchpad.getSplitContents();

    if (flaps && flaps.length > 0) {
      if (!/^\d$/.test(flaps)) {
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }

      const flapsNum = parseInt(flaps);
      if (!this.CDU.Performance.isValidFlaps(flapsNum)) {
        this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
        return;
      }

      newFlaps = flapsNum;
    }

    if (ths && ths.length > 0) {
      // allow AAN.N and N.NAA, where AA is UP or DN
      if (!/^(UP|DN)(\d|\d?\.\d|\d\.\d?)|(\d|\d?\.\d|\d\.\d?)(UP|DN)$/.test(ths)) {
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }

      let direction = null;
      const thsClean = ths.replace(/(UP|DN)/g, (substr) => {
        direction = substr;
        return '';
      });

      if (direction) {
        let thsNum = parseFloat(thsClean);
        if (direction === 'DN') {
          // Note that 0 *= -1 will result in -0, which is strictly
          // the same as 0 (that is +0 === -0) and doesn't make a
          // difference for the calculation itself. However, in order
          // to differentiate between DN0.0 and UP0.0 we'll do check
          // later when displaying this value using Object.is to
          // determine whether the pilot entered DN0.0 or UP0.0.
          thsNum *= -1;
        }
        if (!isFinite(thsNum) || !this.CDU.Performance.isValidTakeoffTrim(thsNum)) {
          this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
          return false;
        }
        newThs = thsNum;
      }
    }

    if (newFlaps !== null) {
      this.CDU.Performance.setTakeoffFlaps(newFlaps);
    }
    if (newThs !== null) {
      this.CDU.Performance.setTakeoffTrim(newThs);
    }
    this.refresh();
    this.scratchpad.clear();
  }

  onLSK4() {
    if (this.scratchpad.isEmpty()) {
      return;
    }

    if (this.scratchpad.isCLR()) {
      this.CDU.Performance.setTransitionAltitude(null);
      this.scratchpad.clear();
      this.refresh();
      return;
    }

    if (!this.scratchpad.contentIsNumber()) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    const num = Math.round(this.scratchpad.getNumber() / 10) * 10;
    if (num < 1000 || num > 45000) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }

    this.CDU.Performance.setTransitionAltitude(num);
    this.scratchpad.clear();
    this.refresh();
  }

  onRefresh() {
    this.lines = this.makeTakeoffPerfLines();
  }

  refresh() {
    this.lines = this.makeTakeoffPerfLines();
    super.refresh();
  }

  private get currentRunway() {
    return this.CDU.flightPlanService.activeOrTemporary.originRunway;
  }
}
