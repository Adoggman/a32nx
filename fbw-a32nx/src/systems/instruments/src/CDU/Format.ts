export const secondsTohhmm = (seconds: Seconds) => {
  if (seconds === 0) return '0000';
  if (!seconds) return '----';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};

type MultipleOfTen = 1 | 10 | 100 | 1000;
export const formatAltRounded = (altitude: number, roundTo: MultipleOfTen = 10) => {
  return (Math.round(altitude / roundTo) * roundTo).toFixed(0);
};

export const sanitize = (text?: string) => {
  return text ? htmlEntities(text) : '';
};

export const htmlEntities = (str) => {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
