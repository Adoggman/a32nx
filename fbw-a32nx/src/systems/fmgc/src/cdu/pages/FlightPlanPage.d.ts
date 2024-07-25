declare function renderFixTableHeader(isFlying: any): string[];
declare function renderFixHeader(rowObj: any, showNm?: boolean, showDist?: boolean, showFix?: boolean): string[];
declare function renderFixContent(rowObj: any, spdRepeat?: boolean, altRepeat?: boolean): string[];
declare function emptyFplnPage(forPlan: any): string[][];
/**
 * Check whether leg is a course reversal leg
 * @param {FlightPlanLeg} leg
 * @returns true if leg is a course reversal leg
 */
declare function legTypeIsCourseReversal(leg: FlightPlanLeg): boolean;
/**
 * Check whether leg has a coded forced turn direction
 * @param {FlightPlanLeg} leg
 * @returns true if leg has coded forced turn direction
 */
declare function legTurnIsForced(leg: FlightPlanLeg): boolean;
declare function formatMachNumber(rawNumber: any): string;
/**
 * @param {FlightPlanLeg} leg
 * @return {boolean}
 */
declare function legHasAltConstraint(leg: FlightPlanLeg): boolean;
/**
 * @param {FlightPlanLeg} leg
 * @return {boolean}
 */
declare function legIsRunway(leg: FlightPlanLeg): boolean;
/**
 * @param {FlightPlanLeg} leg
 * @return {boolean}
 */
declare function legIsAirport(leg: FlightPlanLeg): boolean;
/**
 * Formats an altitude as an altitude or flight level for display.
 * @param {*} mcdu Reference to the MCDU instance
 * @param {number} altitudeToFormat  The altitude in feet.
 * @param {boolean} useTransAlt Whether to use transition altitude, otherwise transition level is used.
 * @returns {string} The formatted altitude/level.
 */
declare function formatAltitudeOrLevel(mcdu: any, alt: any, useTransAlt: boolean): string;
declare function formatTrack(from: any, to: any): string;
/**
 * Formats a numberical altitude to a string to be displayed in the altitude column. Does not format FLs, use {@link formatAltitudeOrLevel} for this purpose
 * @param {Number} alt The altitude to format
 * @returns {String} The formatted altitude string
 */
declare function formatAlt(alt: number): string;
declare function formatAltConstraint(mcdu: any, constraint: any, useTransAlt: any): string;
declare const MAX_FIX_ROW: 5;
declare namespace Markers {
  let FPLN_DISCONTINUITY: string[];
  let END_OF_FPLN: string[];
  let NO_ALTN_FPLN: string[];
  let END_OF_ALTN_FPLN: string[];
  let TOO_STEEP_PATH: string[];
}
declare const Altitude: Readonly<{
  Empty: '     ';
  NoPrediction: '-----';
}>;
declare const Speed: Readonly<{
  Empty: '   ';
  NoPrediction: '---';
}>;
declare const Time: Readonly<{
  Empty: '    ';
  NoPrediction: '----';
}>;
declare class CDUFlightPlanPage {
  static ShowPage(mcdu: any, offset?: number, forPlan?: number): void;
  static clearElement(
    mcdu: any,
    fpIndex: any,
    offset: any,
    forPlan: any,
    forAlternate: any,
    scratchpadCallback: any,
  ): Promise<void>;
  static ensureCanClearElement(
    mcdu: any,
    fpIndex: any,
    forPlan: any,
    forAlternate: any,
    scratchpadCallback: any,
  ): boolean;
  static updatePlanCentre(mcdu: any, waypointsAndMarkers: any, offset: any, forPlan: any, side: any): void;
}
