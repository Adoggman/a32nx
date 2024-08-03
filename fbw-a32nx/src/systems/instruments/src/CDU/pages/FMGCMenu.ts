import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  makeLines,
} from 'instruments/src/CDU/model/CDUPage';

export class FMGCMenu extends DisplayablePage {
  title = 'A320-200';

  static readonly pageID: string = 'FMGC_MENU';
  _pageID = FMGCMenu.pageID;

  lines = makeLines(
    new CDULine(new CDUElement(this.CDU.Info.engine, CDUColor.Green), new CDUElement('\xa0ENG'), undefined),
    new CDULine(
      new CDUElement('\xa0' + this.CDU.Info.navCycleDates, CDUColor.Cyan),
      new CDUElement('\xa0ACTIVE NAV DATA BASE'),
      new CDUElement(this.CDU.Info.navSerial, CDUColor.Green),
    ),
    new CDULine(
      new CDUElement('{' + this.CDU.Info.navCycleDates, CDUColor.Cyan, CDUTextSize.Small),
      new CDUElement('\xa0SECOND NAV DATA BASE'),
    ),
    new CDULine(),
    new CDULine(new CDUElement('[\xa0\xa0]', CDUColor.Inop, CDUTextSize.Small), new CDUElement('CHG CODE')),
    new CDULine(
      new CDUElement(formatNum(this.CDU.Info.idle) + '/' + formatNum(this.CDU.Info.perf), CDUColor.Green),
      new CDUElement('IDLE/PERF'),
      new CDUElement('STATUS/XLOAD>', CDUColor.Inop),
      new CDUElement('SOFTWARE\xa0'),
    ),
  );
}

const formatNum = (num: number): string => {
  return num < 0 ? num.toFixed(1) : '+' + num.toFixed(1);
};
