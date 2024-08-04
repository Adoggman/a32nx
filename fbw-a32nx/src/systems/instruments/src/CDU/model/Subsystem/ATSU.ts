import { AtsuStatusCodes } from '@datalink/common';
import { FmsClient } from 'atsu/fmsclient/src';
import { CDU } from 'instruments/src/CDU/model/CDU';
import { NXFictionalMessages, NXSystemMessages } from 'instruments/src/CDU/model/NXMessages';
import { CDUSubsystem } from 'instruments/src/CDU/model/Subsystem';

export class ATSU extends CDUSubsystem {
  fmsClient: FmsClient;
  constructor(cdu: CDU) {
    super(cdu);
    this.fmsClient = new FmsClient(this, cdu.flightPlanService);
  }

  printPage(_page: string[]) {
    this.cdu.setMessage(NXFictionalMessages.notYetImplementedTS);
  }

  /**
   * General ATSU message handler which converts ATSU status codes to new MCDU messages
   * @param code ATSU status code
   */
  addNewAtsuMessage(code: AtsuStatusCodes) {
    switch (code) {
      case AtsuStatusCodes.CallsignInUse:
        this.cdu.setMessage(NXFictionalMessages.fltNbrInUse);
        break;
      case AtsuStatusCodes.NoHoppieConnection:
        this.cdu.setMessage(NXFictionalMessages.noHoppieConnection);
        break;
      case AtsuStatusCodes.ComFailed:
        this.cdu.setMessage(NXSystemMessages.comUnavailable);
        break;
      case AtsuStatusCodes.NoAtc:
        this.cdu.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.MailboxFull:
        this.cdu.setMessage(NXSystemMessages.dcduFileFull);
        break;
      case AtsuStatusCodes.UnknownMessage:
        this.cdu.setMessage(NXFictionalMessages.unknownAtsuMessage);
        break;
      case AtsuStatusCodes.ProxyError:
        this.cdu.setMessage(NXFictionalMessages.reverseProxy);
        break;
      case AtsuStatusCodes.NoTelexConnection:
        this.cdu.setMessage(NXFictionalMessages.telexNotEnabled);
        break;
      case AtsuStatusCodes.OwnCallsign:
        this.cdu.setMessage(NXSystemMessages.noAtc);
        break;
      case AtsuStatusCodes.SystemBusy:
        this.cdu.setMessage(NXSystemMessages.systemBusy);
        break;
      case AtsuStatusCodes.NewAtisReceived:
        this.cdu.setMessage(NXSystemMessages.newAtisReceived);
        break;
      case AtsuStatusCodes.NoAtisReceived:
        this.cdu.setMessage(NXSystemMessages.noAtisReceived);
        break;
      case AtsuStatusCodes.EntryOutOfRange:
        this.cdu.setMessage(NXSystemMessages.entryOutOfRange);
        break;
      case AtsuStatusCodes.FormatError:
        this.cdu.setMessage(NXSystemMessages.formatError);
        break;
      case AtsuStatusCodes.NotInDatabase:
        this.cdu.setMessage(NXSystemMessages.notInDatabase);
        break;
      default:
        break;
    }
  }
}
