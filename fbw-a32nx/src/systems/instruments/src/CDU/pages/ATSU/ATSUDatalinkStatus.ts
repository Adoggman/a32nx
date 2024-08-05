import { DatalinkModeCode, DatalinkStatusCode } from '@datalink/common';
import { CDUColor, CDUElement, CDULine, CDUTextSize, DisplayablePage, makeLines } from '@cdu/model/CDUPage';
import { NXFictionalMessages } from '@cdu/data/NXMessages';
import { ATSUMenu } from '@cdu/pages/ATSU/ATSUMenu';

export class ATSUDatalinkStatus extends DisplayablePage {
  title = 'DATALINK STATUS';

  static readonly pageID: string = 'ATSU_DATALINK_STATUS';
  _pageID = ATSUDatalinkStatus.pageID;

  lines = this.makeDatalinkLines();

  private makeDatalinkLines() {
    const vhfStatusCode = this.CDU.ATSU.fmsClient.getDatalinkStatus('vhf');
    const vhfModeCode = this.CDU.ATSU.fmsClient.getDatalinkMode('vhf');
    const satcomStatusCode = this.CDU.ATSU.fmsClient.getDatalinkStatus('satcom');
    const satcomModeCode = this.CDU.ATSU.fmsClient.getDatalinkMode('satcom');
    const hfStatusCode = this.CDU.ATSU.fmsClient.getDatalinkStatus('hf');
    const hfModeCode = this.CDU.ATSU.fmsClient.getDatalinkMode('hf');

    return makeLines(
      new CDULine(
        new CDUElement('VHF3\xa0\xa0\xa0', CDUColor.White, CDUTextSize.Large, this.statusElement(vhfStatusCode)),
      ),
      new CDULine(
        new CDUElement('SATCOM\xa0\xa0\xa0', CDUColor.White, CDUTextSize.Large, this.statusElement(satcomStatusCode)),
        this.modeElement(vhfModeCode, 7),
      ),
      new CDULine(
        new CDUElement('HF\xa0\xa0\xa0', CDUColor.White, CDUTextSize.Large, this.statusElement(hfStatusCode)),
        this.modeElement(satcomModeCode, 9),
      ),
      new CDULine(undefined, this.modeElement(hfModeCode, 5)),
      CDULine.EmptyLine,
      new CDULine(new CDUElement('<RETURN'), undefined, new CDUElement('PRINT*', CDUColor.Cyan)),
    );
  }

  onLSK6() {
    this.openPage(new ATSUMenu(this.display));
  }

  onRSK6() {
    this.CDU.setMessage(NXFictionalMessages.notYetImplementedTS);
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

  modeElement(modeCode: DatalinkModeCode, padLeft: number): CDUElement {
    switch (modeCode) {
      case DatalinkModeCode.AtcAoc:
        return new CDUElement('\xa0'.repeat(padLeft) + 'ATC/AOC');
      case DatalinkModeCode.Aoc:
        return new CDUElement('\xa0'.repeat(padLeft) + 'AOC ONLY');
      case DatalinkModeCode.Atc:
        return new CDUElement('\xa0'.repeat(padLeft) + 'ATC ONLY');
      case DatalinkModeCode.None:
        return new CDUElement('\xa0'.repeat(padLeft) + ' ');
      default:
        return new CDUElement('\xa0'.repeat(padLeft) + 'ERROR', CDUColor.Red);
    }
  }
}
