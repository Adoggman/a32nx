import { TypeIIMessage } from '@cdu/data/NXMessages';
import { Scratchpad } from '@cdu/model/Scratchpad';

export class MessageQueue {
  queue: TypeIIMessage[];
  scratchpad: Scratchpad;

  constructor(scratchpad: Scratchpad) {
    this.queue = [];
    this.scratchpad = scratchpad;
  }

  addMessage(message: TypeIIMessage) {
    if (message.isResolved()) {
      this.updateDisplayedMessage();
      return;
    }

    this._addToQueueOrUpdateQueuePosition(message);
    this.updateDisplayedMessage();
  }

  removeMessage(text: string) {
    for (let i = 0; i < this.queue.length; i++) {
      const message = this.queue[i];
      if (message.text === text) {
        message.onClear();
        this.queue.splice(i, 1);
        if (i === 0) {
          this.updateDisplayedMessage();
        }
        break;
      }
    }
  }

  resetQueue() {
    this.queue = [];
  }

  updateDisplayedMessage() {
    if (this.queue.length > 0) {
      const message = this.queue[0];
      if (message.isResolved()) {
        this.queue.splice(0, 1);
        return this.updateDisplayedMessage();
      }

      this.scratchpad.setMessage(message);
    }
  }

  _addToQueueOrUpdateQueuePosition(message: TypeIIMessage) {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].text === message.text) {
        if (i !== 0) {
          this.queue.unshift(this.queue[i]);
          this.queue.splice(i + 1, 1);
        }
        return;
      }
    }

    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].isResolved()) {
        this.queue.splice(i, 1);
      }
    }

    this.queue.unshift(message);

    if (this.queue.length > 5) {
      this.queue.splice(5, 1);
    }
  }
}
