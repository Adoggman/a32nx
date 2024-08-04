import { DatalinkModeCode, DatalinkStatusCode } from '@datalink/common';
import {
  CDUColor,
  CDUElement,
  CDULine,
  CDUTextSize,
  DisplayablePage,
  makeLines,
} from 'instruments/src/CDU/model/CDUPage';
import { NXFictionalMessages } from 'instruments/src/CDU/model/NXMessages';
import { ATSUMenu } from 'instruments/src/CDU/pages/ATSU/ATSUMenu';

export class ATSUDatalinkStatus extends DisplayablePage {
  title = 'DATALINK STATUS';

  static readonly pageID: string = 'ATSU_DATALINK_STATUS';
  _pageID = ATSUDatalinkStatus.pageID;

  lines = this.makeDatalinkLines();

  private makeDatalinkLines() {
    const vhfStatusCode = this.CDU.ATSU.getDatalinkStatus('vhf');
    const vhfModeCode = this.CDU.ATSU.getDatalinkMode('vhf');
    const satcomStatusCode = this.CDU.ATSU.getDatalinkStatus('satcom');
    const satcomModeCode = this.CDU.ATSU.getDatalinkMode('satcom');
    const hfStatusCode = this.CDU.ATSU.getDatalinkStatus('hf');
    const hfModeCode = this.CDU.ATSU.getDatalinkMode('hf');

    return makeLines(
      this.statusLine('VHF3', vhfStatusCode, vhfModeCode),
      this.statusLine('SATCOM', satcomStatusCode, satcomModeCode),
      this.statusLine('HF', hfStatusCode, hfModeCode),
      CDULine.EmptyLine,
      CDULine.EmptyLine,
      new CDULine(new CDUElement('<RETURN'), undefined, new CDUElement('PRINT*', CDUColor.Cyan)),
    );
  }

  onLSK6() {
    this.openPage(new ATSUMenu(this.display));
  }

  onRSK6() {
    this.CDU.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  statusElement(statusCode: DatalinkStatusCode): CDUElement {
    switch (statusCode) {
      case DatalinkStatusCode.Inop:
        return new CDUElement('INOP', CDUColor.Red);
      case DatalinkStatusCode.NotInstalled:
        return new CDUElement('NOT INSTALLED', undefined, CDUTextSize.Small);
      case DatalinkStatusCode.DlkNotAvail:
        return new CDUElement('DLK NOT AVAIL', undefined, CDUTextSize.Small);
      case DatalinkStatusCode.DlkAvail:
        return new CDUElement('DLK AVAIL', CDUColor.Green);
      default:
        return new CDUElement('ERROR', CDUColor.Red);
    }
  }

  modeElement(modeCode: DatalinkModeCode): CDUElement {
    switch (modeCode) {
      case DatalinkModeCode.AtcAoc:
        return new CDUElement('ATC/AOC');
      case DatalinkModeCode.Aoc:
        return new CDUElement('AOC ONLY');
      case DatalinkModeCode.Atc:
        return new CDUElement('ATC ONLY');
      case DatalinkModeCode.None:
        return new CDUElement(' ');
      default:
        return new CDUElement('ERROR', CDUColor.Red);
    }
  }

  statusLine(system: string, statusCode: DatalinkStatusCode, modeCode: DatalinkModeCode) {
    return new CDULine(new CDUElement(system), undefined, this.statusElement(statusCode), this.modeElement(modeCode));
  }
}
