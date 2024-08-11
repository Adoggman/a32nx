import { CDUDisplay } from '@cdu/CDUDisplay';
import { NXSystemMessages } from '@cdu/data/NXMessages';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { RunwayUtils } from '@fmgc/index';
import { FmgcFlightPhase } from '@shared/flightphase';

export class PerfTakeoffPage extends DisplayablePage {
  static readonly pageID: string = 'PERF_TAKEOFF';
  _pageID = PerfTakeoffPage.pageID;

  constructor(display: CDUDisplay) {
    super(display);
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
    const v1Speed = this.CDU.Speeds.v1Speed;
    const flapRetractSpeed = this.CDU.Speeds.flapRetractSpeed;
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
    const vRSpeed = this.CDU.Speeds.vRSpeed;
    const slatRetractSpeed = this.CDU.Speeds.slatRetractSpeed;
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
    const v2Speed = this.CDU.Speeds.v2Speed;
    const cleanSpeed = this.CDU.Speeds.cleanSpeed;
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
      new CDUElement('[]/[\xa0\xa0\xa0]', CDUColor.Cyan),
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
    if (!this.CDU.Speeds.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Speeds.setV1Speed(v);
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
    if (!this.CDU.Speeds.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Speeds.setVRSpeed(v);
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
    if (!this.CDU.Speeds.isValidVSpeed(v)) {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
    this.scratchpad.removeMessageFromQueue(NXSystemMessages.checkToData.text);
    this.CDU.Speeds.setV2Speed(v);
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
