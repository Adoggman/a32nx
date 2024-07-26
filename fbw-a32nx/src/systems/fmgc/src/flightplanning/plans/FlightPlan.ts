// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, ApproachType, Fix, LegType, MathUtils, NXDataStore } from '@flybywiresim/fbw-sdk';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';
import { EventBus, MagVar } from '@microsoft/msfs-sdk';
import { FixInfoData, FixInfoEntry } from '@fmgc/flightplanning/plans/FixInfo';
import { loadAllDepartures, loadAllRunways } from '@fmgc/flightplanning/DataLoading';
import { Coordinates, Degrees } from 'msfs-geo';
import { FlightPlanElement, FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { FlightArea } from '@fmgc/navigation/FlightArea';
import { CopyOptions } from '@fmgc/flightplanning/plans/CloningOptions';
import { ImportedPerformanceData } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import {
  FlightPlanPerformanceData,
  FlightPlanPerformanceDataProperties,
} from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { BaseFlightPlan, FlightPlanQueuedOperation, SerializedFlightPlan } from './BaseFlightPlan';

export class FlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> extends BaseFlightPlan<P> {
  static empty<P extends FlightPlanPerformanceData>(
    index: number,
    bus: EventBus,
    performanceDataInit: P,
  ): FlightPlan<P> {
    return new FlightPlan(index, bus, performanceDataInit);
  }

  /**
   * Alternate flight plan associated with this flight plan
   */
  alternateFlightPlan = new AlternateFlightPlan<P>(this.index, this);

  /**
   * Performance data for this flight plan
   */
  performanceData: P;

  /**
   * FIX INFO entries
   */
  fixInfos: readonly FixInfoEntry[] = [];

  /**
   * Shown as the "flight number" in the MCDU, but it's really the callsign
   */
  flightNumber: string | undefined = undefined;

  constructor(index: number, bus: EventBus, performanceDataInit: P) {
    super(index, bus);
    this.performanceData = performanceDataInit;
  }

  destroy() {
    super.destroy();

    this.alternateFlightPlan.destroy();
  }

  clone(newIndex: number, options: number = CopyOptions.Default): FlightPlan<P> {
    const newPlan = FlightPlan.empty(newIndex, this.bus, this.performanceData.clone());

    newPlan.version = this.version;
    newPlan.originSegment = this.originSegment.clone(newPlan);
    newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan);
    newPlan.departureSegment = this.departureSegment.clone(newPlan);
    newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan);
    newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan);
    newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan);
    newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan);
    newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan);
    newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan);
    newPlan.approachSegment = this.approachSegment.clone(newPlan);
    newPlan.destinationSegment = this.destinationSegment.clone(newPlan);
    newPlan.missedApproachSegment = this.missedApproachSegment.clone(newPlan);

    newPlan.alternateFlightPlan = this.alternateFlightPlan.clone(newPlan);

    newPlan.availableOriginRunways = [...this.availableOriginRunways];
    newPlan.availableDepartures = [...this.availableDepartures];
    newPlan.availableDestinationRunways = [...this.availableDestinationRunways];
    newPlan.availableArrivals = [...this.availableArrivals];
    newPlan.availableApproaches = [...this.availableApproaches];
    newPlan.availableApproachVias = [...this.availableApproachVias];

    newPlan.activeLegIndex = this.activeLegIndex;

    newPlan.flightNumber = this.flightNumber;

    if (options & CopyOptions.IncludeFixInfos) {
      newPlan.fixInfos = this.fixInfos.map((it) => it?.clone());
    }

    return newPlan;
  }

  get alternateDestinationAirport(): Airport {
    return this.alternateFlightPlan.destinationAirport;
  }

  async setAlternateDestinationAirport(icao: string | undefined) {
    await this.deleteAlternateFlightPlan();
    await this.alternateFlightPlan.setDestinationAirport(icao);

    if (this.alternateFlightPlan.originAirport) {
      this.alternateFlightPlan.availableOriginRunways = await loadAllRunways(this.alternateFlightPlan.originAirport);
      this.alternateFlightPlan.availableDepartures = await loadAllDepartures(this.alternateFlightPlan.originAirport);
    }

    await this.alternateFlightPlan.originSegment.refreshOriginLegs();

    await this.alternateFlightPlan.flushOperationQueue();
  }

  async deleteAlternateFlightPlan() {
    await this.alternateFlightPlan.setOriginRunway(undefined);
    await this.alternateFlightPlan.setDeparture(undefined);
    await this.alternateFlightPlan.setDepartureEnrouteTransition(undefined);
    await this.alternateFlightPlan.setDestinationRunway(undefined);
    await this.alternateFlightPlan.setArrivalEnrouteTransition(undefined);
    await this.alternateFlightPlan.setArrival(undefined);
    await this.alternateFlightPlan.setApproach(undefined);
    await this.alternateFlightPlan.setApproachVia(undefined);
    await this.alternateFlightPlan.setDestinationAirport(undefined);

    this.alternateFlightPlan.allLegs.length = 0;

    this.alternateFlightPlan.incrementVersion();
  }

  directToLeg(ppos: Coordinates, trueTrack: Degrees, targetLegIndex: number, _withAbeam = false) {
    if (targetLegIndex >= this.firstMissedApproachLegIndex) {
      throw new Error('[FPM] Cannot direct to a leg in the missed approach segment');
    }

    const targetLeg = this.legElementAt(targetLegIndex);
    if (!targetLeg.isXF()) {
      throw new Error('[FPM] Cannot direct to a non-XF leg');
    }

    const magVar = MagVar.get(ppos.lat, ppos.long);
    const magneticCourse = A32NX_Util.trueToMagnetic(trueTrack, magVar);

    const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, magneticCourse);
    const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, targetLeg.terminationWaypoint());

    turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;
    turnEnd.withDefinitionFrom(targetLeg).withPilotEnteredDataFrom(targetLeg);
    // If we don't do this, the turn end will have the termination waypoint's ident which may not be the leg ident (for runway legs for example)
    turnEnd.ident = targetLeg.ident;

    this.redistributeLegsAt(0);
    this.redistributeLegsAt(targetLegIndex);

    const indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === targetLeg);
    if (indexInEnrouteSegment === -1) {
      throw new Error('[FPM] Target leg of a direct to not found in enroute segment after leg redistribution!');
    }

    this.enrouteSegment.allLegs.splice(0, indexInEnrouteSegment + 1, turningPoint, turnEnd);
    this.incrementVersion();

    const turnEndLegIndexInPlan = this.allLegs.findIndex((it) => it === turnEnd);

    this.setActiveLegIndex(turnEndLegIndexInPlan);
  }

  private static maxInterceptDistance = 500;
  interceptRadialInCourse(ppos: Coordinates, trueTrack: DegreesTrue, waypoint: Fix, radial: Degrees): boolean {
    let newFlightPlanElements: FlightPlanElement[] = [];

    const interceptPosition = A32NX_Util.greatCircleIntersection(ppos, trueTrack, waypoint.location, radial);
    const distance = Avionics.Utils.computeGreatCircleDistance(ppos, waypoint.location);
    const headingAfterIntercept = Avionics.Utils.computeGreatCircleHeading(interceptPosition, waypoint.location);

    // Couldn't find an intercept, give up
    if (distance > FlightPlan.maxInterceptDistance || Math.abs(headingAfterIntercept - radial) > 90) {
      return false;
    }

    const inbound = FlightPlanLeg.inboundPoint(this.enrouteSegment, ppos, trueTrack);
    const intercept = FlightPlanLeg.courseToIntercept(this.enrouteSegment, ppos, trueTrack);
    newFlightPlanElements = [inbound, intercept];

    // Remove disco, insert new legs
    this.enrouteSegment.allLegs.splice(0, 1, ...newFlightPlanElements);
    this.syncSegmentLegsChange(this.enrouteSegment);
    this.incrementVersion();

    this.setActiveLegIndex(1);
    return true;
  }

  interceptRadialOutCourse(
    ppos: Coordinates,
    trueTrack: DegreesTrue,
    waypoint: Fix,
    radial: Degrees,
    activeLegIndex: number,
  ): boolean {
    let newFlightPlanElements: FlightPlanElement[] = [];

    const interceptPosition = A32NX_Util.greatCircleIntersection(ppos, trueTrack, waypoint.location, radial);
    const distance = Avionics.Utils.computeGreatCircleDistance(ppos, waypoint.location);
    const headingAfterIntercept = Avionics.Utils.computeGreatCircleHeading(waypoint.location, interceptPosition);

    // Couldn't find an intercept, give up
    if (distance > FlightPlan.maxInterceptDistance || Math.abs(headingAfterIntercept - radial) > 90) {
      return false;
    }

    const inboundLeg = FlightPlanLeg.outboundPoint(this.enrouteSegment, ppos, trueTrack);
    const interceptLeg = FlightPlanLeg.interceptPoint(this.enrouteSegment, trueTrack, interceptPosition);
    const manualLeg = FlightPlanLeg.manual(this.enrouteSegment, interceptPosition, radial);
    newFlightPlanElements = [inboundLeg, interceptLeg, manualLeg, { isDiscontinuity: true }];

    this.enrouteSegment.allLegs.splice(0, activeLegIndex + 1, ...newFlightPlanElements);

    this.syncSegmentLegsChange(this.enrouteSegment);
    this.incrementVersion();

    const newActiveLegIndex = this.allLegs.findIndex((it) => it === interceptLeg);
    this.setActiveLegIndex(newActiveLegIndex);
    this.cleanUpAfterDiscontinuity(newActiveLegIndex + 2);
    return true;
  }

  radialOut(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, radial: Degrees) {
    const initialLeg = FlightPlanLeg.radialOutIF(this.enrouteSegment, waypoint);
    initialLeg.flags |= FlightPlanLegFlags.RadialOut;
    const manualLeg = FlightPlanLeg.manual(this.enrouteSegment, waypoint.location, radial);
    const newFlightPlanElements: FlightPlanElement[] = [
      { isDiscontinuity: true },
      initialLeg,
      manualLeg,
      { isDiscontinuity: true },
    ];

    this.enrouteSegment.allLegs.splice(0, 0, ...newFlightPlanElements);
    this.incrementVersion();
    this.syncSegmentLegsChange(this.enrouteSegment);

    const activeLegIndexInPlan = this.allLegs.findIndex((it) => it === manualLeg);
    this.cleanUpAfterDiscontinuity(activeLegIndexInPlan + 1);
    this.setActiveLegIndex(activeLegIndexInPlan);
  }

  directToWaypoint(ppos: Coordinates, trueTrack: Degrees, waypoint: Fix, withAbeam = false, radial: false | Degrees) {
    // TODO withAbeam
    // TODO handle direct-to into the alternate (make alternate active...?

    const existingLegIndex = this.allLegs.findIndex(
      (it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(waypoint),
    );

    // If we already have this waypoint, go directly there
    const foundInRoute = existingLegIndex !== -1;
    if (existingLegIndex !== -1 && existingLegIndex < this.firstMissedApproachLegIndex) {
      if (radial === false) {
        this.directToLeg(ppos, trueTrack, existingLegIndex, withAbeam);
        return;
      } else {
        this.allLegs.splice(0, existingLegIndex);
      }
    }

    let newFlightPlanElements: FlightPlanElement[] = [];
    let toBeActiveLeg: FlightPlanLeg;

    if (radial === false) {
      const magVar = MagVar.get(ppos.lat, ppos.long);
      const magneticCourse = A32NX_Util.trueToMagnetic(trueTrack, magVar);
      const turningPoint = FlightPlanLeg.turningPoint(this.enrouteSegment, ppos, magneticCourse);
      const turnEnd = FlightPlanLeg.directToTurnEnd(this.enrouteSegment, waypoint);
      turningPoint.flags |= FlightPlanLegFlags.DirectToTurningPoint;
      toBeActiveLeg = turnEnd;
      newFlightPlanElements = [turningPoint, turnEnd];
    } else {
      const radialInLeg = FlightPlanLeg.radialIn(this.enrouteSegment, waypoint, radial);
      radialInLeg.flags |= FlightPlanLegFlags.RadialIn;
      toBeActiveLeg = radialInLeg;
      newFlightPlanElements = [{ isDiscontinuity: true }, radialInLeg];
    }

    // Move all legs before active one to the enroute segment
    let indexInEnrouteSegment = 0;
    this.redistributeLegsAt(0);
    if (this.activeLegIndex >= 1) {
      this.redistributeLegsAt(this.activeLegIndex);
      indexInEnrouteSegment = this.enrouteSegment.allLegs.findIndex((it) => it === this.activeLeg);
    }

    // Remove legs before active on from enroute
    this.enrouteSegment.allLegs.splice(0, indexInEnrouteSegment, ...newFlightPlanElements);
    this.incrementVersion();

    const activeLegIndexInPlan = this.allLegs.findIndex((it) => it === toBeActiveLeg);
    if (!foundInRoute && this.maybeElementAt(activeLegIndexInPlan + 1)?.isDiscontinuity === false) {
      this.enrouteSegment.allLegs.splice(newFlightPlanElements.length, 0, { isDiscontinuity: true });
      this.syncSegmentLegsChange(this.enrouteSegment);
      this.incrementVersion();

      // Since we added a discontinuity after the DIR TO leg, we want to make sure that the leg after it
      // is a leg that can be after a disco (not something like a CI) and convert it to IF
      this.cleanUpAfterDiscontinuity(activeLegIndexInPlan + 1);
    }

    this.setActiveLegIndex(activeLegIndexInPlan);
  }

  /**
   * Find next XF leg after a discontinuity and convert it to IF
   * Remove non-ground-referenced leg after the discontinuity before the XF leg
   * @param discontinuityIndex
   */
  private cleanUpAfterDiscontinuity(discontinuityIndex: number) {
    // Find next XF/HX leg
    const xFLegIndexInPlan = this.allLegs.findIndex(
      (it, index) => index > discontinuityIndex && it.isDiscontinuity === false && (it.isXF() || it.isHX()),
    );

    if (xFLegIndexInPlan !== -1) {
      // Remove elements to next XF leg
      this.removeRange(discontinuityIndex + 1, xFLegIndexInPlan);
      this.incrementVersion();

      // Replace next XF leg with IF leg if not already IF or CF
      const [segment, xfLegIndexInSegment] = this.segmentPositionForIndex(xFLegIndexInPlan);
      const xfLegAfterDiscontinuity = segment.allLegs[xfLegIndexInSegment] as FlightPlanLeg;

      if (xfLegAfterDiscontinuity.type !== LegType.IF && xfLegAfterDiscontinuity.type !== LegType.CF) {
        const iFLegAfterDiscontinuity = FlightPlanLeg.fromEnrouteFix(
          segment,
          xfLegAfterDiscontinuity.definition.waypoint,
          '',
          LegType.IF,
        )
          .withDefinitionFrom(xfLegAfterDiscontinuity)
          .withPilotEnteredDataFrom(xfLegAfterDiscontinuity);

        segment.allLegs.splice(xfLegIndexInSegment, 1, iFLegAfterDiscontinuity);
        this.syncSegmentLegsChange(segment);
        this.incrementVersion();
      }
    }
  }

  async enableAltn(atIndex: number, cruiseLevel: number) {
    if (!this.alternateDestinationAirport) {
      throw new Error('[FMS/FPM] Cannot enable alternate with no alternate destination defined');
    }

    this.redistributeLegsAt(atIndex);

    if (this.legCount > atIndex + 1) {
      this.removeRange(atIndex + 1, this.legCount);
    }

    // We call the segment methods because we only want to rebuild the arrival/approach when we've changed all the procedures
    await this.destinationSegment.setDestinationIcao(this.alternateDestinationAirport.ident);
    await this.destinationSegment.setDestinationRunway(this.alternateFlightPlan.destinationRunway?.ident ?? undefined);
    await this.approachSegment.setProcedure(this.alternateFlightPlan.approach?.databaseId ?? undefined);
    await this.approachViaSegment.setProcedure(this.alternateFlightPlan.approachVia?.databaseId ?? undefined);
    await this.arrivalSegment.setProcedure(this.alternateFlightPlan.arrival?.databaseId ?? undefined);
    await this.arrivalEnrouteTransitionSegment.setProcedure(
      this.alternateFlightPlan.arrivalEnrouteTransition?.databaseId ?? undefined,
    );

    const alternateLastEnrouteIndex =
      this.alternateFlightPlan.originSegment.legCount +
      this.alternateFlightPlan.departureRunwayTransitionSegment.legCount +
      this.alternateFlightPlan.departureSegment.legCount +
      this.alternateFlightPlan.departureEnrouteTransitionSegment.legCount +
      this.alternateFlightPlan.enrouteSegment.legCount;
    const alternateLegsToInsert = this.alternateFlightPlan.allLegs
      .slice(0, alternateLastEnrouteIndex)
      .map((it) => (it.isDiscontinuity === false ? it.clone(this.enrouteSegment) : it));

    if (
      this.enrouteSegment.allLegs[this.enrouteSegment.legCount - 1]?.isDiscontinuity === false &&
      alternateLegsToInsert[0]?.isDiscontinuity === false
    ) {
      this.enrouteSegment.allLegs.push({ isDiscontinuity: true });
    }

    this.enrouteSegment.allLegs.push(...alternateLegsToInsert);
    this.syncSegmentLegsChange(this.enrouteSegment);
    this.enrouteSegment.strung = false;

    this.setPerformanceData('cruiseFlightLevel', cruiseLevel);
    this.setPerformanceData('costIndex', 0);

    this.deleteAlternateFlightPlan();

    this.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
    this.enqueueOperation(FlightPlanQueuedOperation.Restring);
    await this.flushOperationQueue();
  }

  override async newDest(index: number, airportIdent: string): Promise<void> {
    await super.newDest(index, airportIdent);

    this.deleteAlternateFlightPlan();
  }

  setFixInfoEntry(index: 1 | 2 | 3 | 4, fixInfo: FixInfoData | null, notify = true): void {
    const planFixInfo = this.fixInfos as FixInfoEntry[];

    planFixInfo[index] = fixInfo ? new FixInfoEntry(fixInfo.fix, fixInfo.radii, fixInfo.radials) : undefined;

    if (notify) {
      this.sendEvent('flightPlan.setFixInfoEntry', { planIndex: this.index, forAlternate: false, index, fixInfo });
    }

    this.incrementVersion();
  }

  editFixInfoEntry(index: 1 | 2 | 3 | 4, callback: (fixInfo: FixInfoEntry) => FixInfoEntry, notify = true): void {
    const planFixInfo = this.fixInfos as FixInfoEntry[];

    const res = callback(planFixInfo[index]);

    if (res) {
      planFixInfo[index] = res;
    }

    if (notify) {
      this.sendEvent('flightPlan.setFixInfoEntry', { planIndex: this.index, forAlternate: false, index, fixInfo: res });
    }

    this.incrementVersion();
  }

  /**
   * Returns the active flight area for this flight plan
   */
  calculateActiveArea(): FlightArea {
    const activeLegIndex = this.activeLegIndex;

    if (activeLegIndex >= this.legCount) {
      return FlightArea.Enroute;
    }

    const [activeSegment] = this.segmentPositionForIndex(activeLegIndex);

    if (
      activeSegment === this.missedApproachSegment ||
      activeSegment === this.destinationSegment ||
      activeSegment === this.approachSegment ||
      activeSegment === this.approachViaSegment
    ) {
      const approachType = this.approach?.type ?? ApproachType.Unknown;

      switch (approachType) {
        case ApproachType.Ils:
          return FlightArea.PrecisionApproach;
        case ApproachType.Gps:
        case ApproachType.Rnav:
          return FlightArea.GpsApproach;
        case ApproachType.Vor:
        case ApproachType.VorDme:
          return FlightArea.VorApproach;
        default:
          return FlightArea.NonPrecisionApproach;
      }
    }

    if (activeSegment.class === SegmentClass.Arrival || activeSegment.class === SegmentClass.Departure) {
      return FlightArea.Terminal;
    }

    return FlightArea.Enroute;
  }

  async setOriginAirport(icao: string): Promise<void> {
    await super.setOriginAirport(icao);

    FlightPlan.setOriginDefaultPerformanceData(this, this.originAirport);
  }

  async setDestinationAirport(icao: string | undefined): Promise<void> {
    await super.setDestinationAirport(icao);

    FlightPlan.setDestinationDefaultPerformanceData(this, this.destinationAirport);
  }

  /**
   * Sets performance data imported from uplink
   * @param data performance data available in uplink
   */
  setImportedPerformanceData(data: ImportedPerformanceData) {
    this.setPerformanceData('databaseTransitionAltitude', data.departureTransitionAltitude);
    this.setPerformanceData('databaseTransitionLevel', data.destinationTransitionLevel);
    this.setPerformanceData('costIndex', data.costIndex);
    this.setPerformanceData('cruiseFlightLevel', data.cruiseFlightLevel);
    this.setPerformanceData('pilotTropopause', data.pilotTropopause);
  }

  setFlightNumber(flightNumber: string, notify = true) {
    this.flightNumber = flightNumber;

    if (notify) {
      this.sendEvent('flightPlan.setFlightNumber', { planIndex: this.index, forAlternate: false, flightNumber });
    }
  }

  /**
   * Sets defaults for performance data parameters related to an origin
   *
   * @param plan the flight plan
   * @param airport the origin airport
   */
  private static setOriginDefaultPerformanceData<P extends FlightPlanPerformanceData>(
    plan: FlightPlan<P>,
    airport: Airport | undefined,
  ): void {
    const referenceAltitude = airport?.location.alt;

    if (referenceAltitude !== undefined) {
      plan.setPerformanceData(
        'defaultThrustReductionAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_THR_RED_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultEngineOutAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
      );
    } else {
      plan.setPerformanceData('defaultThrustReductionAltitude', null);
      plan.setPerformanceData('defaultAccelerationAltitude', null);
      plan.setPerformanceData('defaultEngineOutAccelerationAltitude', null);
    }

    plan.setPerformanceData('pilotThrustReductionAltitude', null);
    plan.setPerformanceData('pilotAccelerationAltitude', null);
    plan.setPerformanceData('pilotEngineOutAccelerationAltitude', null);
  }

  /**
   * Sets defaults for performance data parameters related to a destination
   *
   * @param plan the flight plan
   * @param airport the destination airport
   */
  private static setDestinationDefaultPerformanceData<P extends FlightPlanPerformanceData>(
    plan: FlightPlan<P>,
    airport: Airport,
  ): void {
    const referenceAltitude = airport?.location.alt;

    if (referenceAltitude !== undefined) {
      plan.setPerformanceData(
        'defaultMissedThrustReductionAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_THR_RED_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultMissedAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_ACCEL_ALT', '1500')),
      );
      plan.setPerformanceData(
        'defaultMissedEngineOutAccelerationAltitude',
        referenceAltitude + parseInt(NXDataStore.get('CONFIG_ENG_OUT_ACCEL_ALT', '1500')),
      );
    } else {
      plan.setPerformanceData('defaultMissedThrustReductionAltitude', null);
      plan.setPerformanceData('defaultMissedAccelerationAltitude', null);
      plan.setPerformanceData('defaultMissedEngineOutAccelerationAltitude', null);
    }

    plan.setPerformanceData('pilotMissedThrustReductionAltitude', null);
    plan.setPerformanceData('pilotMissedAccelerationAltitude', null);
    plan.setPerformanceData('pilotMissedEngineOutAccelerationAltitude', null);
  }

  static fromSerializedFlightPlan<P extends FlightPlanPerformanceData>(
    index: number,
    serialized: SerializedFlightPlan,
    bus: EventBus,
    performanceDataInit: P,
  ): FlightPlan<P> {
    const newPlan = FlightPlan.empty<P>(index, bus, performanceDataInit);

    newPlan.activeLegIndex = serialized.activeLegIndex;
    newPlan.fixInfos = serialized.fixInfo;

    newPlan.originSegment.setFromSerializedSegment(serialized.segments.originSegment);
    newPlan.departureSegment.setFromSerializedSegment(serialized.segments.departureSegment);
    newPlan.departureRunwayTransitionSegment.setFromSerializedSegment(
      serialized.segments.departureRunwayTransitionSegment,
    );
    newPlan.departureEnrouteTransitionSegment.setFromSerializedSegment(
      serialized.segments.departureEnrouteTransitionSegment,
    );
    newPlan.enrouteSegment.setFromSerializedSegment(serialized.segments.enrouteSegment);
    newPlan.arrivalSegment.setFromSerializedSegment(serialized.segments.arrivalSegment);
    newPlan.arrivalRunwayTransitionSegment.setFromSerializedSegment(serialized.segments.arrivalRunwayTransitionSegment);
    newPlan.arrivalEnrouteTransitionSegment.setFromSerializedSegment(
      serialized.segments.arrivalEnrouteTransitionSegment,
    );
    newPlan.approachSegment.setFromSerializedSegment(serialized.segments.approachSegment);
    newPlan.approachViaSegment.setFromSerializedSegment(serialized.segments.approachViaSegment);
    newPlan.destinationSegment.setFromSerializedSegment(serialized.segments.destinationSegment);

    return newPlan;
  }

  /**
   * Sets a performance data parameter
   *
   * The union type in the signature is to work around https://github.com/microsoft/TypeScript/issues/28662.
   */
  setPerformanceData<k extends keyof (P & FlightPlanPerformanceDataProperties) & string>(
    key: k,
    value: P[k] | null,
    notify = true,
  ) {
    this.performanceData[key] = value;

    if (notify) {
      this.sendPerfEvent(
        `flightPlan.setPerformanceData.${key}` as any,
        { planIndex: this.index, forAlternate: false, value } as any,
      );
    }

    this.incrementVersion();
  }

  /**
   * Check if the thrust reduction altitude is limited by a constraint and reduce it if so
   * @returns true if a reduction occured
   */
  reconcileThrustReductionWithConstraints(): boolean {
    const lowestClimbConstraint = MathUtils.round(this.lowestClimbConstraint(), 10);
    if (
      Number.isFinite(lowestClimbConstraint) &&
      this.performanceData.thrustReductionAltitude !== null &&
      this.performanceData.thrustReductionAltitude > lowestClimbConstraint
    ) {
      this.setPerformanceData(
        'defaultThrustReductionAltitude',
        this.performanceData.defaultThrustReductionAltitude !== null
          ? Math.min(this.performanceData.defaultThrustReductionAltitude, lowestClimbConstraint)
          : null,
      );
      this.setPerformanceData(
        'pilotThrustReductionAltitude',
        this.performanceData.pilotThrustReductionAltitude !== null
          ? Math.min(this.performanceData.pilotThrustReductionAltitude, lowestClimbConstraint)
          : null,
      );

      return true;
    }

    return false;
  }

  /**
   * Check if the acceleration altitude is limited by a constraint and reduce it if so
   * @returns true if a reduction occured
   */
  reconcileAccelerationWithConstraints(): boolean {
    const lowestClimbConstraint = MathUtils.round(this.lowestClimbConstraint(), 10);
    if (
      Number.isFinite(lowestClimbConstraint) &&
      this.performanceData.accelerationAltitude !== null &&
      this.performanceData.accelerationAltitude > lowestClimbConstraint
    ) {
      this.setPerformanceData(
        'defaultAccelerationAltitude',
        this.performanceData.defaultAccelerationAltitude !== null
          ? Math.min(this.performanceData.defaultAccelerationAltitude, lowestClimbConstraint)
          : null,
      );
      this.setPerformanceData(
        'pilotAccelerationAltitude',
        this.performanceData.pilotAccelerationAltitude !== null
          ? Math.min(this.performanceData.pilotAccelerationAltitude, lowestClimbConstraint)
          : null,
      );

      return true;
    }

    return false;
  }
}
