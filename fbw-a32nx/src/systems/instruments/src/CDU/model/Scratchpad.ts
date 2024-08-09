import { CDUDisplay } from '@cdu/CDUDisplay';
import { TypeIIMessage, TypeIMessage } from '@cdu/data/NXMessages';
import { CDUColor, DisplayablePage } from '@cdu/model/CDUPage';
import { MessageQueue } from '@cdu/model/MessageQueue';
import { FMMessage } from '@flybywiresim/fbw-sdk';
import { Subject } from '@microsoft/msfs-sdk';
import { recallMessageById } from '@fmgc/index';

export namespace CDUScratchpad {
  export const clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  export const ovfyValue = '\u0394';
  export const _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  export const nbSpace = '\xa0';
}

export class Scratchpad {
  // Display elements - subjects so if they change the display automatically updates, no refresh required
  displayedText: Subject<string> = Subject.create<string>('');
  color: Subject<string> = Subject.create<string>(CDUColor.White);
  typedText: Subject<string> = Subject.create<string>('');

  messageQueue: MessageQueue;
  currentMessage: TypeIMessage | TypeIIMessage | undefined;
  isShowingPageDefaultMessage: boolean = false;

  //isShowingMessage: boolean = false;

  private display: CDUDisplay;

  constructor(display: CDUDisplay) {
    this.display = display;

    this.messageQueue = new MessageQueue((message) => this.onQueueUpdated(message));
    if (this.display.currentPage) {
      this.onOpenPage(this.display.currentPage);
    }

    this.typedText.sub((newValue) => {
      this.displayedText.set(newValue);
      this.color.set(CDUColor.White);
      this.clearMessage();
    });

    this.initMessageHandler();
  }

  initMessageHandler() {
    Coherent.on('A32NX_FMGC_SEND_MESSAGE_TO_MCDU', (message: FMMessage) => {
      console.log(`[CDU${this.display.Side}] MCDU message received: ${message.text}`);
      this.addMessageToQueue(
        new TypeIIMessage(
          message.text,
          message.color === 'Amber',
          '',
          () => false,
          () => {
            if (message.clearable) {
              recallMessageById(message.id);
            }
          },
        ),
      );
    });

    Coherent.on('A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID', (text) => {
      console.log(`[CDU${this.display.Side}] MCDU message received: ${text}`);
      this.removeMessageFromQueue(text);
    });
  }

  removeMessageFromQueue(text: string) {
    if (this.currentMessage && this.currentMessage.text === text) {
      this.clearMessage();
    }
    this.messageQueue.removeMessage(text);
  }

  addMessageToQueue(message: TypeIIMessage) {
    this.messageQueue.addMessage(message);
  }

  onQueueUpdated(message: TypeIIMessage) {
    if (!this.isShowingPageDefaultMessage) {
      this.setMessage(message);
    }
  }

  setTypedText(text: string) {
    this.typedText.set(text);
    this.clearMessage();
  }

  isEmpty() {
    return this.typedText.get().length === 0 && !this.currentMessage;
  }

  isCLR() {
    return this.typedText.get() === CDUScratchpad.clrValue;
  }

  contentIsNumber() {
    return this.isNumber(this.typedText.get());
  }

  isNumber(text: string, maxDecimals = 1) {
    if (text.length === 0) return false;
    const decimalIndex = text.indexOf('.');
    if (decimalIndex > 0) {
      const numDecimals = text.length - 1 - decimalIndex;
      if (numDecimals > maxDecimals) {
        return false;
      }
    }
    const num = +text;
    return !isNaN(num);
  }

  getNumber() {
    return +this.typedText.get();
  }

  clear() {
    this.typedText.set('');
  }

  clearMessage() {
    if (this.currentMessage) {
      const messageText = this.displayedText.get();
      this.currentMessage = undefined;
      this.isShowingPageDefaultMessage = false;
      this.displayedText.set(this.typedText.get());
      this.color.set(CDUColor.White);
      this.messageQueue.removeMessage(messageText);
    }
  }

  onOpenPage(page: DisplayablePage): void {
    // Clear old page's message
    if (this.isShowingPageDefaultMessage) {
      this.clearMessage();
    }
    // Add new page's message
    if (page.defaultMessage) {
      this.setMessage(page.defaultMessage);
      this.isShowingPageDefaultMessage = true;
    } else {
      this.messageQueue.updateDisplayedMessage();
    }
  }

  setMessage(message: TypeIMessage | TypeIIMessage) {
    this.displayedText.set(message.text);
    this.color.set(message.isAmber ? CDUColor.Amber : CDUColor.White);
    this.currentMessage = message;
  }

  getContents() {
    return this.typedText.get();
  }

  getSplitContents(split = '/') {
    return this.typedText.get().split(split);
  }

  typeCharacter(text: string) {
    if (!this.display.currentPage.allowsTyping) {
      if (this.currentMessage && !this.isShowingPageDefaultMessage) {
        this.clearMessage();
      }
      return;
    }

    const currentContents = this.typedText.get();
    // Handle if we're on CLR
    if (currentContents === CDUScratchpad.clrValue) {
      this.typedText.set(text === CDUScratchpad.clrValue ? '' : text);
      return;
    }
    // Handle if we're showing a message
    if (this.currentMessage) {
      this.clearMessage();
      return;
    }
    // Handle if we hit CLR and there is text to erase
    if (text === CDUScratchpad.clrValue && !(currentContents.length === 0)) {
      this.typedText.set(currentContents.substring(0, currentContents.length - 1));
      return;
    }

    // Handle plus/minus
    if (text === '-' && currentContents.endsWith('-')) {
      this.typedText.set(currentContents.substring(0, currentContents.length - 1) + '+');
      return;
    }
    if (text === '-' && currentContents.endsWith('+')) {
      this.typedText.set(currentContents.substring(0, currentContents.length - 1) + '-');
      return;
    }

    this.typedText.set(currentContents + text);
  }
}
