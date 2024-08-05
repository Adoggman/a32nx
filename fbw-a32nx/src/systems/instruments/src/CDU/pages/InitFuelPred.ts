import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { Init } from '@cdu/pages/Init';

export class InitFuelPred extends DisplayablePage {
  title = 'INIT FUEL PRED';

  arrows = { up: false, down: false, left: true, right: true };

  static readonly pageID: string = 'INIT_FUEL_PRED';
  _pageID = InitFuelPred.pageID;

  lines = this.makeInitFuelPredLines();

  makeInitFuelPredLines() {
    return makeLines(
      new CDULine(
        new CDUElement(
          this.CDU.Fuel.taxiFuelWeight?.toFixed(1) ?? this.CDU.Fuel.defaultTaxiFuelWeight.toFixed(1),
          CDUColor.Cyan,
          this.CDU.Fuel.taxiFuelWeight ? CDUTextSize.Large : CDUTextSize.Small,
        ),
        new CDUElement('TAXI'),
        new CDUElement('___._/__._', CDUColor.Amber),
        new CDUElement('ZFW/ZFWCG'),
      ),
      new CDULine(
        new CDUElement('---.-/----'),
        new CDUElement('TRIP /TIME'),
        new CDUElement('__._', CDUColor.Amber),
        new CDUElement('BLOCK'),
      ),
      new CDULine(
        new CDUElement('---.-', CDUColor.White, CDUTextSize.Large, new CDUElement('/5.0', CDUColor.Cyan)),
        new CDUElement('RTE RSV/%'),
      ),
      new CDULine(
        new CDUElement('---.-/----'),
        new CDUElement('ALTN /TIME'),
        new CDUElement('---.-/---.-'),
        new CDUElement('TOW/\xa0\xa0\xa0LW'),
      ),
      new CDULine(
        new CDUElement('---.-/----'),
        new CDUElement('FINAL/TIME'),
        new CDUElement('-----'),
        new CDUElement('TRIP WIND'),
      ),
      new CDULine(
        new CDUElement('---.-'),
        new CDUElement('MIN DEST FOB'),
        new CDUElement('---.-/----'),
        new CDUElement('EXTRA/TIME'),
      ),
    );
  }

  onLSK1() {
    this.CDU.Fuel.taxiFuelWeight = 0.3;
    this.lines = this.makeInitFuelPredLines();
    this.refresh();
  }

  onLeft() {
    this.openPage(new Init(this.display));
  }

  onRight() {
    this.openPage(new Init(this.display));
  }
}
