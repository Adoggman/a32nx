import { CDUDisplay } from '@cdu/CDUDisplay';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { RunwayUtils } from '@fmgc/index';

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
    const vRSpeed = this.CDU.Speeds.v2Speed;
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
      new CDUElement('----\xa0', CDUColor.Inop),
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
    return {
      leftLabel: new CDUElement('TRANS ALT'),
      right: new CDUElement('[\xa0\xa0]°', CDUColor.Cyan),
      rightLabel: new CDUElement('FLEX TO TEMP'),
    };
  }

  makeLine5() {
    return {
      left: new CDUElement('-----/-----', CDUColor.White, CDUTextSize.Small),
      leftLabel: new CDUElement('THR RED/ACC'),
      right: new CDUElement('-----', CDUColor.White, CDUTextSize.Small),
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

  private get currentRunway() {
    return this.CDU.flightPlanService.activeOrTemporary.originRunway;
  }
}
