import { CDUScratchpad } from '@cdu/model/Scratchpad';

export const secondsTohhmm = (seconds: Seconds) => {
  if (seconds === 0) return '0000';
  if (!seconds) return '----';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const padBefore = (text: string, width: number) => {
  const before = Math.floor((width - text.length) / 2);
  return CDUScratchpad.nbSpace.repeat(before);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const padAfter = (text: string, width: number) => {
  const before = Math.floor((width - text.length) / 2);
  const after = width - (text.length + before);
  return CDUScratchpad.nbSpace.repeat(after);
};

export const sanitize = (text?: string) => {
  return text ? htmlEntities(text) : '';
};

export const htmlEntities = (str) => {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
