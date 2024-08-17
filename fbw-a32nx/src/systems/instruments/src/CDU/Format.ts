import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A320FlightPlanPerformanceData } from '@fmgc/index';

export const secondsTohhmm = (seconds: Seconds) => {
  if (seconds === 0) return '0000';
  if (!seconds) return '----';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  return h.toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};

export const secondsToUTC = (seconds: Seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  return (h % 24).toFixed(0).padStart(2, '0') + m.toFixed(0).padStart(2, '0');
};

type MultipleOfTen = 1 | 10 | 100 | 1000;
export const formatAltRounded = (altitude: number, roundTo: MultipleOfTen = 10) => {
  return (Math.round(altitude / roundTo) * roundTo).toFixed(0);
};

export const formatAltitudeOrLevel = (
  flightPlan: FlightPlan<A320FlightPlanPerformanceData>,
  altitude: Feet,
  useTransAlt: boolean,
) => {
  let isFl = false;
  if (useTransAlt) {
    const transAlt = flightPlan.performanceData.transitionAltitude;
    isFl = transAlt !== null && altitude > transAlt;
  } else {
    const transLevel = flightPlan.performanceData.transitionLevel;
    isFl = transLevel !== null && altitude >= transLevel * 100;
  }

  if (isFl) {
    return `FL${(altitude / 100).toFixed(0).padStart(3, '0')}`;
  }

  return formatAltRounded(altitude, 10);
};

export const sanitize = (text?: string) => {
  return text ? htmlEntities(text) : '';
};

export const htmlEntities = (str) => {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
