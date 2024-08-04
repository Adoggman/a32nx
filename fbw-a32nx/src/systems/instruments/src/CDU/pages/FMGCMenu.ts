import { DatabaseIdent } from '@flybywiresim/fbw-sdk';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  makeLines,
} from 'instruments/src/CDU/model/CDUPage';
import { NXFictionalMessages } from 'instruments/src/CDU/model/NXMessages';

export class FMGCMenu extends DisplayablePage {
  title = 'A320-200';

  static readonly pageID: string = 'FMGC_MENU';
  _pageID = FMGCMenu.pageID;

  lines = this.makeFmgcMenuLines();

  makeFmgcMenuLines() {
    const navDbIdent = this.CDU.navDbIdent;
    const navCycleDates = formatActiveDates(navDbIdent);
    const navSerial = navDbIdent
      ? `${navDbIdent.provider.substring(0, 2).toUpperCase()}${navDbIdent.airacCycle}0001`
      : '';
    return makeLines(
      new CDULine(new CDUElement(this.CDU.Info.engine, CDUColor.Green), new CDUElement('\xa0ENG'), undefined),
      new CDULine(
        new CDUElement('\xa0' + navCycleDates, CDUColor.Cyan),
        new CDUElement('\xa0ACTIVE NAV DATA BASE'),
        new CDUElement(navSerial, CDUColor.Green),
      ),
      new CDULine(
        new CDUElement('{' + navCycleDates, CDUColor.Cyan, CDUTextSize.Small),
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

  onLSK3() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }
}

const formatNum = (num: number): string => {
  return num < 0 ? num.toFixed(1) : '+' + num.toFixed(1);
};

const formatActiveDates = (dbIdent: DatabaseIdent): string => {
  const effDay = dbIdent.effectiveFrom.substring(8);
  const effMonth = dbIdent.effectiveFrom.substring(5, 7);
  const expDay = dbIdent.effectiveTo.substring(8);
  const expMonth = dbIdent.effectiveTo.substring(5, 7);

  return `${effDay}${DB_MONTHS[effMonth]}-${expDay}${DB_MONTHS[expMonth]}`;
};

const DB_MONTHS = Object.freeze({
  '01': 'JAN',
  '02': 'FEB',
  '03': 'MAR',
  '04': 'APR',
  '05': 'MAY',
  '06': 'JUN',
  '07': 'JUL',
  '08': 'AUG',
  '09': 'SEP',
  '10': 'OCT',
  '11': 'NOV',
  '12': 'DEC',
});
