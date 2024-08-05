import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, EmptyLine, makeLines } from '@cdu/model/CDUPage';
import { InitFuelPred } from '@cdu/pages/InitFuelPred';

export class Init extends DisplayablePage {
  title = 'INIT';

  arrows = { up: false, down: false, left: true, right: true };

  static readonly pageID: string = 'INIT';
  _pageID = Init.pageID;

  lines = makeLines(
    new CDULine(
      new CDUElement('__________', CDUColor.Amber),
      new CDUElement('CO RTE'),
      new CDUElement('____/____', CDUColor.Amber),
      new CDUElement('FROM/TO\xa0\xa0'),
    ),
    new CDULine(
      new CDUElement('----/----------'),
      new CDUElement('ALTN/CO RTE'),
      new CDUElement('REQUEST*', CDUColor.Amber),
      new CDUElement('INIT\xa0', CDUColor.Amber),
    ),
    new CDULine(new CDUElement('________', CDUColor.Amber), new CDUElement('FLT NBR')),
    EmptyLine,
    new CDULine(new CDUElement('---'), new CDUElement('COST INDEX'), new CDUElement('WIND>')),
    new CDULine(
      new CDUElement('----- /---°'),
      new CDUElement('CRZ FL/TEMP'),
      new CDUElement('36090', CDUColor.Cyan, CDUTextSize.Small),
      new CDUElement('TROPO'),
    ),
  );

  onRSK2() {
    this.display.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  onLeft() {
    this.openPage(new InitFuelPred(this.display));
  }

  onRight() {
    this.openPage(new InitFuelPred(this.display));
  }
}
