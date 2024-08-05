import { CDUDisplay } from '@cdu/CDUDisplay';
import { TypeIMessage } from '@cdu/data/NXMessages';
import { CDUColor } from '@cdu/model/CDUPage';
import { Subject } from '@microsoft/msfs-sdk';

export namespace CDUScratchpad {
  export const clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  export const ovfyValue = '\u0394';
  export const _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  export const nbSpace = '\xa0';
}

export class Scratchpad {
  displayedText: Subject<string> = Subject.create<string>('');
  color: Subject<string> = Subject.create<string>(CDUColor.White);
  typedText: Subject<string> = Subject.create<string>('');

  private display: CDUDisplay;

  constructor(display: CDUDisplay) {
    this.display = display;

    this.typedText.sub((newValue) => {
      this.displayedText.set(newValue);
      this.color.set(CDUColor.White);
    });
  }

  setTypedText(text: string) {
    this.typedText.set(text);
  }

  isEmpty() {
    return this.typedText.get().length === 0;
  }

  isCLR() {
    return this.typedText.get() === CDUScratchpad.clrValue;
  }

  isPositiveNumber() {
    const text = this.typedText.get();
    if (text.length === 0) return false;
    const num = +text;
    return !isNaN(num) && num >= 0;
  }

  isNumber() {
    const text = this.typedText.get();
    if (text.length === 0) return false;
    const num = +text;
    return !isNaN(num);
  }

  getNumber() {
    return +this.typedText.get();
  }

  clear() {
    this.typedText.set('');
  }

  setMessage(message: TypeIMessage, replacement?: string) {
    this.displayedText.set(message.getText(replacement));
    this.color.set(message.isAmber ? CDUColor.Amber : CDUColor.White);
  }

  typeCharacter(text: string) {
    const currentContents = this.typedText.get();
    // Handle if we're on CLR
    if (currentContents === CDUScratchpad.clrValue) {
      this.typedText.set(text === CDUScratchpad.clrValue ? '' : text);
      return;
    }
    // Handle if we're not showing the typed message and hit clr to get rid of it
    if (text === CDUScratchpad.clrValue && this.displayedText.get() !== currentContents) {
      this.displayedText.set(currentContents);
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
