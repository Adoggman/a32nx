import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { InitPage } from '@cdu/pages/InitPage';
import { NXFictionalMessages, NXSystemMessages } from '@cdu/data/NXMessages';
import { NXUnits } from '@flybywiresim/fbw-sdk';
import { getZfw, getZfwcg } from '@cdu/model/A32NX Base/Payload';
import { CDUDisplay } from '@cdu/CDUDisplay';

export class InitFuelPredPage extends DisplayablePage {
  static readonly pageID: string = 'INIT_FUEL_PRED';
  _pageID = InitFuelPredPage.pageID;

  constructor(display: CDUDisplay) {
    super(display);
    this.title = 'INIT FUEL PRED';
    this.arrows = { up: false, down: false, left: true, right: true };
    this.allowsTyping = true;
    this.lines = this.makeInitFuelPredLines();
  }

  onRefresh() {
    this.lines = this.makeInitFuelPredLines();
  }

  refresh() {
    this.lines = this.makeInitFuelPredLines();
    super.refresh();
  }

  makeInitFuelPredLines() {
    const tfw = this.CDU.FuelWeight.taxiFuelWeight;
    const rsvTime = this.CDU.FuelWeight.reserveTime;
    const rsvPct = this.CDU.FuelWeight.reservePercent;
    const zfw = this.CDU.FuelWeight.zeroFuelWeight;
    const zfwCg = this.CDU.FuelWeight.zeroFuelWeightCG;
    const block = this.CDU.FuelWeight.block;

    return makeLines(
      new CDULine(
        new CDUElement(
          tfw?.toFixed(1) ?? this.CDU.FuelWeight.taxiFuelWeightDefault.toFixed(1),
          CDUColor.Cyan,
          tfw ? CDUTextSize.Large : CDUTextSize.Small,
        ),
        new CDUElement('TAXI'),
        zfw
          ? new CDUElement(zfw.toFixed(1) + '/' + zfwCg.toFixed(1).padStart(4), CDUColor.Cyan)
          : new CDUElement('___._/__._', CDUColor.Amber),
        new CDUElement('ZFW/ZFWCG'),
      ),
      new CDULine(
        new CDUElement('---.-/----'),
        new CDUElement('TRIP /TIME'),
        block ? new CDUElement(block.toFixed(1), CDUColor.Cyan) : new CDUElement('__._', CDUColor.Amber),
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
                '/' + (rsvPct?.toFixed(1) ?? this.CDU.FuelWeight.reservePercentDefault.toFixed(1)),
                CDUColor.Cyan,
              ),
        ),
        new CDUElement('RTE RSV/%'),
        zfw && !block ? new CDUElement('PLANNING}', CDUColor.Amber) : undefined,
        zfw && !block ? new CDUElement('FUEL\xa0', CDUColor.Amber) : undefined,
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

  onRSK1() {
    if (this.scratchpad.isEmpty()) {
      let zfw = undefined;
      let zfwCg = undefined;
      const a32nxBoarding = SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'bool');
      const gsxBoarding = SimVar.GetSimVarValue('L:FSDT_GSX_BOARDING_STATE', 'number');
      if (a32nxBoarding || (gsxBoarding >= 4 && gsxBoarding < 6)) {
        zfw = NXUnits.kgToUser(SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_DESIRED', 'number'));
        zfwCg = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED', 'number');
      } else if (isFinite(getZfw()) && isFinite(getZfwcg())) {
        zfw = getZfw();
        zfwCg = getZfwcg();
      }

      // ZFW/ZFWCG auto-fill helper
      if (zfw && zfwCg) {
        this.scratchpad.setTypedText(`${(zfw / 1000).toFixed(1)}/${zfwCg.toFixed(1)}`);
        return;
      } else {
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }
    }

    if (this.scratchpad.isCLR()) {
      this.scratchpad.setMessage(NXSystemMessages.notAllowed);
      return;
    }

    const contents = this.scratchpad.getSplitContents();
    if (contents.length === 2 && contents[1].length > 0) {
      // try to set zfw and zfwcg
      if (!this.scratchpad.isNumber(contents[0]) || !this.scratchpad.isNumber(contents[1])) {
        // Not numbers
        this.scratchpad.setMessage(NXSystemMessages.formatError);
        return;
      }
      const zfw = +contents[0];
      const zfwCg = +contents[1];
      if (!this.CDU.FuelWeight.isValidZFW(zfw) || !this.CDU.FuelWeight.isValidZFWCG(zfwCg)) {
        this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
        return;
      }
      this.CDU.FuelWeight.zeroFuelWeight = zfw;
      this.CDU.FuelWeight.zeroFuelWeightCG = zfwCg;
      this.scratchpad.clear();
      this.refresh();
      return;
    } else if (contents.length === 1 || (contents.length === 2 && contents[1].length === 0)) {
      if (this.CDU.FuelWeight.zeroFuelWeightCG) {
        // just set zfw
        if (!this.scratchpad.isNumber(contents[0])) {
          // Not number
          this.scratchpad.setMessage(NXSystemMessages.formatError);
          return;
        }
        const zfw = +contents[0];
        if (!this.CDU.FuelWeight.isValidZFW(zfw)) {
          this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
          return;
        }
        this.CDU.FuelWeight.zeroFuelWeight = zfw;
        this.scratchpad.clear();
        this.refresh();
        return;
      } else {
        this.scratchpad.setMessage(NXSystemMessages.notAllowed);
        return;
      }
    }

    this.scratchpad.setMessage(NXSystemMessages.formatError);
  }

  onRSK2() {
    if (this.scratchpad.isEmpty()) {
      return;
    }

    if (this.scratchpad.isCLR()) {
      this.CDU.FuelWeight.block = undefined;
      this.scratchpad.clear();
      this.refresh();
      return;
    }

    if (this.scratchpad.contentIsNumber()) {
      const num = this.scratchpad.getNumber();
      if (!this.CDU.FuelWeight.isValidBlockFuel(num)) {
        this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
        return;
      }
      this.CDU.FuelWeight.block = Math.round(num * 10) / 10;
      this.scratchpad.clear();
      this.refresh();
      return;
    }

    this.scratchpad.setMessage(NXSystemMessages.formatError);
  }

  onRSK3() {
    if (this.CDU.FuelWeight.zeroFuelWeight && !this.CDU.FuelWeight.block) {
      this.scratchpad.setMessage(NXFictionalMessages.notYetImplementedTS);
    }
  }

  onLSK1() {
    // Default to scratchpad if empty
    if (this.scratchpad.isEmpty()) {
      if (!this.CDU.FuelWeight.taxiFuelWeight) {
        this.scratchpad.setTypedText(this.CDU.FuelWeight.taxiFuelWeightDefault.toFixed(1));
      }
      return;
    }
    if (this.scratchpad.isCLR()) {
      this.CDU.FuelWeight.taxiFuelWeight = undefined;
      this.scratchpad.clear();
      this.lines = this.makeInitFuelPredLines();
      this.refresh();
      return;
    }

    // Not number
    if (!this.scratchpad.contentIsNumber()) {
      this.scratchpad.setMessage(NXSystemMessages.formatError);
      return;
    }

    // Set value if not empty
    const num = this.scratchpad.getNumber();
    if (this.CDU.FuelWeight.isValidTaxiFuel(num)) {
      this.CDU.FuelWeight.taxiFuelWeight = this.scratchpad.getNumber();
      this.scratchpad.clear();
      this.lines = this.makeInitFuelPredLines();
      this.refresh();
      return;
    } else {
      this.scratchpad.setMessage(NXSystemMessages.entryOutOfRange);
      return;
    }
  }

  onLSK3() {
    if (this.scratchpad.isEmpty()) {
      return;
    }
    // Handle clear
    if (this.scratchpad.isCLR()) {
      this.CDU.FuelWeight.reserveTime = undefined;
      this.CDU.FuelWeight.reservePercent = undefined;
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
        if (this.CDU.FuelWeight.isValidReserveTime(num)) {
          this.CDU.FuelWeight.reserveTime = num;
          this.CDU.FuelWeight.reservePercent = undefined;
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
        if (this.CDU.FuelWeight.isValidReservePercent(num)) {
          this.CDU.FuelWeight.reservePercent = num;
          this.CDU.FuelWeight.reserveTime = undefined;
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
    this.openPage(new InitPage(this.display));
  }

  onRight() {
    this.openPage(new InitPage(this.display));
  }
}
