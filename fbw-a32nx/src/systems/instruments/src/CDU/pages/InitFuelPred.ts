import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { Init } from '@cdu/pages/Init';
import { NXSystemMessages } from '@cdu/data/NXMessages';

export class InitFuelPred extends DisplayablePage {
  title = 'INIT FUEL PRED';

  arrows = { up: false, down: false, left: true, right: true };

  static readonly pageID: string = 'INIT_FUEL_PRED';
  _pageID = InitFuelPred.pageID;

  allowsTyping = true;

  lines = this.makeInitFuelPredLines();

  makeInitFuelPredLines() {
    const tfw = this.CDU.Fuel.taxiFuelWeight;
    const rsvTime = this.CDU.Fuel.reserveTime;
    const rsvPct = this.CDU.Fuel.reservePercent;
    return makeLines(
      new CDULine(
        new CDUElement(
          tfw?.toFixed(1) ?? this.CDU.Fuel.taxiFuelWeightDefault.toFixed(1),
          CDUColor.Cyan,
          tfw ? CDUTextSize.Large : CDUTextSize.Small,
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
        new CDUElement(
          rsvTime?.toFixed(1).padStart(5, '\xa0') ?? '---.-',
          rsvTime ? CDUColor.Cyan : CDUColor.White,
          CDUTextSize.Large,
          rsvTime
            ? new CDUElement('/-.-')
            : new CDUElement(
                '/' + (rsvPct?.toFixed(1) ?? this.CDU.Fuel.reservePercentDefault.toFixed(1)),
                CDUColor.Cyan,
              ),
        ),
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
    // Default to scratchpad if empty
    if (this.scratchpad.isEmpty()) {
      if (!this.CDU.Fuel.taxiFuelWeight) {
        this.scratchpad.setTypedText(this.CDU.Fuel.taxiFuelWeightDefault.toFixed(1));
      }
      return;
    }
    if (this.scratchpad.isCLR()) {
      this.CDU.Fuel.taxiFuelWeight = undefined;
      this.scratchpad.clear();
      this.lines = this.makeInitFuelPredLines();
      this.refresh();
      return;
    }

    // Not number
    if (!this.scratchpad.contentIsNumber()) {
      this.display.setMessage(NXSystemMessages.formatError);
      return;
    }

    // Set value if not empty
    const num = this.scratchpad.getNumber();
    if (num >= 0) {
      this.CDU.Fuel.taxiFuelWeight = this.scratchpad.getNumber();
      this.scratchpad.clear();
      this.lines = this.makeInitFuelPredLines();
      this.refresh();
      return;
    } else {
      this.display.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
  }

  onLSK3() {
    if (this.scratchpad.isEmpty()) {
      return;
    }
    // Handle clear
    if (this.scratchpad.isCLR()) {
      this.CDU.Fuel.reserveTime = undefined;
      this.CDU.Fuel.reservePercent = undefined;
      this.scratchpad.clear();
      this.lines = this.makeInitFuelPredLines();
      this.refresh();
      return;
    }

    const parts = this.scratchpad.getSplitContents();

    if (parts.length === 1) {
      // Handle input no slash
      if (this.scratchpad.contentIsNumber()) {
        const num = this.scratchpad.getNumber();
        if (this.CDU.Fuel.isValidReserveTime(num)) {
          this.CDU.Fuel.reserveTime = num;
          this.CDU.Fuel.reservePercent = undefined;
          this.scratchpad.clear();
          this.lines = this.makeInitFuelPredLines();
          this.refresh();
          return;
        } else {
          this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
          return;
        }
      } else {
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }
    } else {
      // Handle slash input
      const rsvPct = parts[1];
      if (this.scratchpad.isNumber(rsvPct)) {
        const num = +rsvPct;
        if (this.CDU.Fuel.isValidReservePercent(num)) {
          this.CDU.Fuel.reservePercent = num;
          this.CDU.Fuel.reserveTime = undefined;
          this.scratchpad.clear();
          this.lines = this.makeInitFuelPredLines();
          this.refresh();
          return;
        } else {
          this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
          return;
        }
      } else {
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }
    }
  }

  onLeft() {
    this.openPage(new Init(this.display));
  }

  onRight() {
    this.openPage(new Init(this.display));
  }
}
