export const getISATemp = (alt: number) => {
  return Math.min(alt, 36089) * -0.0019812 + 15;
};
