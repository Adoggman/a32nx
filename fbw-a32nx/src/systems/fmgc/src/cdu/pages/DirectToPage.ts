// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FMS } from '@fmgc/cdu/FMS';
import { CDU } from '@fmgc/cdu/CDU';
import { FMCMainDisplay } from '@fmgc/cdu/FMSMainDisplay.d';

// TODO this whole thing is thales layout...

export enum DirToMode {
  Direct = 1,
  Abeam = 2,
  RadialIn = 3,
  RadialOut = 4,
}

export interface Predictions {
  utc: false | Number;
  dist: false | Number;
}

export class DirectToPage {
  static ShowPage(
    mcdu: FMS,
    directWaypoint?: Fix,
    wptsListIndex: number = 0,
    dirToMode: DirToMode = DirToMode.Direct,
    radialValue: Degrees | false = false,
    cachedPredictions: Predictions = { utc: false, dist: false },
    suppressRefresh: boolean = false,
  ) {
    console.log('AJH Showing direct to page');
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue);
    };

    const hasTemporary = mcdu.flightPlanService.hasTemporary;

    mcdu.activeSystem = 'FMGC';

    let directWaypointIdent = '';
    if (directWaypoint) {
      directWaypointIdent = directWaypoint.ident;
    } else if (hasTemporary) {
      mcdu.eraseTemporaryFlightPlan(() => {
        DirectToPage.ShowPage(mcdu);
      });
      return;
    }

    const waypointsCell = ['', '', '', '', ''];
    let iMax = 5;
    let eraseLabel = '';
    let eraseLine = '';
    let insertLabel = '';
    let insertLine = '';
    if (hasTemporary) {
      iMax--;
      eraseLabel = '\xa0DIR TO[color]amber';
      eraseLine = '{ERASE[color]amber';
      insertLabel = 'DIR TO\xa0[color]amber';
      insertLine = 'INSERT*[color]amber';
      mcdu.onLeftInput[5] = () => {
        mcdu.eraseTemporaryFlightPlan(() => {
          DirectToPage.ShowPage(mcdu);
        });
      };
      mcdu.onRightInput[5] = () => {
        mcdu.insertTemporaryFlightPlan(
          () => {},
          (success) => {
            if (success) {
              SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
              (CDUFlightPlanPage as any).ShowPage(mcdu);
            } else {
              mcdu.addMessageToQueue(NXSystemMessages.adjustDesiredHdgTrk);
              mcdu.addMessageToQueue(NXSystemMessages.noNavIntercept);
            }
          },
        );
      };
    }

    let defaultHeading: boolean | Degrees = false;
    if (directWaypoint) {
      if ('bearing' in directWaypoint && typeof directWaypoint.bearing === 'number') {
        defaultHeading = (directWaypoint.bearing + 180) % 360;
      } else {
        const waypointIndex = mcdu.flightPlanService.active.allLegs.findIndex(
          (it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(directWaypoint),
        );
        if (waypointIndex > 1) {
          let waypointLeg = mcdu.flightPlanService.active.allLegs[waypointIndex];
          if (waypointLeg.isDiscontinuity) {
            throw new Error("[FMGC] Found a discontinuity where there shouldn't be one");
          } else {
            waypointLeg = waypointLeg as FlightPlanLeg;
          }
          if ((waypointLeg as FlightPlanLeg).definition.magneticCourse) {
            defaultHeading = (waypointLeg.definition.magneticCourse + 180) % 360;
          } else {
            const prevLeg = mcdu.flightPlanService.active.allLegs[waypointIndex - 1];
            if (!prevLeg.isDiscontinuity) {
              const prevWaypoint = (prevLeg as FlightPlanLeg).terminationWaypoint();
              if (prevWaypoint) {
                const magVar = Facilities.getMagVar(directWaypoint.location.lat, directWaypoint.location.long);
                const track = Avionics.Utils.computeGreatCircleHeading(directWaypoint.location, prevWaypoint.location);
                const magTrack = A32NX_Util.trueToMagnetic(track, magVar);
                defaultHeading = magTrack;
              }
            }
          }
        }
      }
    }

    mcdu.onLeftInput[0] = (value) => {
      if (value === CDU.clrValue) {
        mcdu.eraseTemporaryFlightPlan(() => {
          DirectToPage.ShowPage(mcdu, undefined, wptsListIndex);
        });
        return;
      }

      Fmgc.WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false)
        .then((w) => {
          if (w) {
            mcdu.eraseTemporaryFlightPlan(() => {
              mcdu
                .directToWaypoint(w)
                .then(() => {
                  DirectToPage.ShowPage(mcdu, w, wptsListIndex, DirToMode.Direct);
                })
                .catch((err) => {
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
          }
        })
        .catch((err) => {
          // Rethrow if error is not an FMS message to display
          if (err.type === undefined) {
            throw err;
          }

          mcdu.showFmsErrorMessage(err.type);
        });
    };

    // DIRECT TO
    mcdu.onRightInput[1] = () => {
      if (dirToMode === DirToMode.Direct) {
        return;
      }
      mcdu.eraseTemporaryFlightPlan(() => {
        mcdu
          .directToWaypoint(directWaypoint)
          .then(() => {
            DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.Direct);
          })
          .catch((err) => {
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
            console.error(err);
          });
      });
    };
    // ABEAM
    mcdu.onRightInput[2] = () => {
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
      //DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.Abeam);
    };
    // RADIAL IN
    mcdu.onRightInput[3] = (value, scratchpadCallback) => {
      // If no waypoint entered, don't do anything
      if (!hasTemporary) {
        return;
      }

      // If no input and bearing already exists, add calculated bearing
      if (value.length === 0 && hasTemporary && !!directWaypoint && defaultHeading) {
        mcdu.eraseTemporaryFlightPlan(() => {
          mcdu
            .directToWaypoint(directWaypoint, defaultHeading)
            .then(() => {
              DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.RadialIn, defaultHeading);
            })
            .catch((err) => {
              DirectToPage.ShowPage(
                mcdu,
                directWaypoint,
                wptsListIndex,
                DirToMode.RadialIn,
                defaultHeading,
                cachedPredictions,
                true,
              );
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
              console.error(err);
            });
        });
        return;
      }

      if (dirToMode === DirToMode.RadialIn && value === CDU.clrValue) {
        DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.Direct);
      }

      // If none of the above, make sure we have a valid heading
      if (value.match(/^[0-9]{1,3}$/) === null) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }
      const magCourse = parseInt(value);
      if (magCourse > 360 || magCourse < 0) {
        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        scratchpadCallback();
        return;
      }

      mcdu.eraseTemporaryFlightPlan(() => {
        mcdu
          .directToWaypoint(directWaypoint, magCourse)
          .then(() => {
            DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.RadialIn, magCourse);
          })
          .catch((err) => {
            DirectToPage.ShowPage(
              mcdu,
              directWaypoint,
              wptsListIndex,
              DirToMode.RadialIn,
              magCourse,
              cachedPredictions,
              true,
            );
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
            console.error(err);
          });
      });
      return;
    };
    // RADIAL OUT
    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      // mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
      // DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.RadialOut);

      // If no waypoint entered, don't do anything
      if (!hasTemporary) {
        return;
      }

      // Clear the radial out, go back to normal direct to
      if (dirToMode === DirToMode.RadialOut && value === CDU.clrValue) {
        DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.Direct);
      }

      // If none of the above, make sure we have a valid heading
      if (value.match(/^[0-9]{1,3}$/) === null) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }
      const magCourse = parseInt(value);
      if (magCourse > 360 || magCourse < 0) {
        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        scratchpadCallback();
        return;
      }

      mcdu.eraseTemporaryFlightPlan(() => {
        mcdu
          .radialOut(directWaypoint, magCourse)
          .then(() => {
            DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.RadialOut, magCourse);
          })
          .catch((err) => {
            DirectToPage.ShowPage(
              mcdu,
              directWaypoint,
              wptsListIndex,
              DirToMode.RadialOut,
              magCourse,
              cachedPredictions,
              true,
            );
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
            console.error(err);
          });
      });
      return;
    };

    const plan = mcdu.flightPlanService.active;

    let i = 0;
    let cellIter = 0;
    wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanService.active?.activeLegIndex);

    const totalWaypointsCount = plan.firstMissedApproachLegIndex;

    while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && cellIter < iMax) {
      const legIndex = i + wptsListIndex;
      if (plan.elementAt(legIndex).isDiscontinuity) {
        i++;
        continue;
      }

      const leg = plan.legElementAt(legIndex);

      if (leg) {
        if (!leg.isXF()) {
          i++;
          continue;
        }

        // Naive handling of detecting if waypoint is already selected
        waypointsCell[cellIter] = (leg.ident === directWaypointIdent ? '\xa0' : '{') + leg.ident + '[color]cyan';
        if (waypointsCell[cellIter]) {
          mcdu.onLeftInput[cellIter + 1] = () => {
            mcdu.eraseTemporaryFlightPlan(() => {
              mcdu
                .directToLeg(legIndex)
                .then(() => {
                  DirectToPage.ShowPage(mcdu, leg.terminationWaypoint(), wptsListIndex);
                })
                .catch((err) => {
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
          };
        }
      } else {
        waypointsCell[cellIter] = '----';
      }
      i++;
      cellIter++;
    }
    if (cellIter < iMax) {
      waypointsCell[cellIter] = '--END--';
    }
    let up = false;
    let down = false;
    if (wptsListIndex < totalWaypointsCount - 5) {
      mcdu.onUp = () => {
        wptsListIndex++;
        DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
      };
      up = true;
    }
    if (wptsListIndex > 0) {
      mcdu.onDown = () => {
        wptsListIndex--;
        DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
      };
      down = true;
    }
    mcdu.setArrows(up, down, false, false);

    const colorForHasTemporary = hasTemporary ? 'yellow' : 'cyan';

    const directWaypointCell = directWaypointIdent
      ? directWaypointIdent + '[color]yellow'
      : '[\xa0\xa0\xa0\xa0\xa0][color]cyan';
    let calculatedDistance = cachedPredictions.dist;
    const activeLeg = hasTemporary ? mcdu.flightPlanService.temporary.activeLeg : false;
    const activeLegCalculated =
      activeLeg && !activeLeg.isDiscontinuity ? (activeLeg as FlightPlanLeg).calculated : false;
    if (hasTemporary && activeLegCalculated) {
      calculatedDistance = activeLegCalculated.distance;
    }
    const distanceLabel =
      hasTemporary && dirToMode === DirToMode.Direct && calculatedDistance
        ? calculatedDistance.toFixed(0)
        : '\xa0\xa0\xa0';
    const distanceCell = hasTemporary ? distanceLabel + '\xa0[color]yellow' : '---\xa0';

    let utcCell = '----';
    let calculatedUTC = cachedPredictions.utc;
    if (hasTemporary) {
      const mcduProfile = mcdu.guidanceController.vnavDriver.mcduProfile;
      if (
        dirToMode === DirToMode.Direct &&
        activeLegCalculated &&
        mcduProfile &&
        mcduProfile.isReadyToDisplay &&
        mcduProfile.tempPredictions &&
        mcduProfile.tempPredictions.size > 0
      ) {
        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        const secondsFromPresent = mcduProfile.tempPredictions.get(1).secondsFromPresent;
        calculatedUTC = utcTime + secondsFromPresent;
      }
      utcCell = calculatedUTC
        ? FMCMainDisplay.secondsToUTC(calculatedUTC) + '[color]yellow'
        : '\xa0\xa0\xa0\xa0[color]yellow';
    }
    const directToCell =
      'DIRECT TO' +
      (hasTemporary && dirToMode !== DirToMode.Direct ? '}' : '\xa0') +
      '[color]' +
      (dirToMode === DirToMode.Direct ? colorForHasTemporary : 'cyan');
    // TODO: support abeam
    const abeamPtsCell = 'ABEAM PTS\xa0[color]' + (dirToMode === DirToMode.Abeam ? colorForHasTemporary : 'cyan');

    let radialInCell = '{small}[\xa0]°{end}\xa0[color]cyan';
    if (hasTemporary) {
      if (dirToMode === DirToMode.RadialIn) {
        if (radialValue === false) {
          console.log('Radial in selected with no heading');
          radialInCell = '[\xa0]°\xa0[color]yellow';
        } else {
          radialInCell = radialValue.toFixed(0).padStart(3, '0') + '°\xa0[color]yellow';
        }
      } else if (defaultHeading) {
        radialInCell = '{small}' + defaultHeading.toFixed(0).padStart(3, '0') + '°{end}}[color]cyan';
      }
    }

    let radialOutCell = '{small}[\xa0]°{end}\xa0[color]cyan';
    if (dirToMode === DirToMode.RadialOut) {
      if (radialValue === false) {
        console.log('Radial out selected with no heading');
        radialOutCell = '[\xa0]°\xa0[color]yellow';
      } else {
        radialOutCell = radialValue.toFixed(0).padStart(3, '0') + '°\xa0[color]yellow';
      }
    }

    mcdu.setTemplate([
      ['DIR TO[color]' + colorForHasTemporary],
      ['WAYPOINT', 'DIST\xa0', '\xa0UTC'],
      [directWaypointCell, distanceCell, utcCell],
      ['F-PLN WPTS'],
      [waypointsCell[0], directToCell],
      ['', 'WITH\xa0'],
      [waypointsCell[1], abeamPtsCell],
      ['', 'RADIAL IN\xa0'],
      [waypointsCell[2], radialInCell],
      ['', 'RADIAL OUT\xa0'],
      [waypointsCell[3], radialOutCell],
      [eraseLabel, insertLabel],
      [eraseLine ? eraseLine : waypointsCell[4], insertLine],
    ]);

    // regular update due to showing dynamic data on this page (distance/UTC)
    if (hasTemporary && !suppressRefresh) {
      // Medium refresh until we have calcluated distances
      if (!activeLegCalculated) {
        mcdu.page.SelfPtr = setTimeout(() => {
          if (mcdu.page.Current === mcdu.page.DirectToPage) {
            DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue, {
              utc: calculatedUTC,
              dist: calculatedDistance,
            });
          }
        }, mcdu.PageTimeout.Medium);
      } else {
        if (dirToMode === DirToMode.Direct) {
          // If we've already calculated, do a slow refresh with a fresh waypoint at the end in case we've moved
          mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.DirectToPage) {
              // Refresh temp plan when in direct to mode as T-P will change, don't clear predictions though as they are probably kinda right
              mcdu.eraseTemporaryFlightPlan(() => {
                mcdu
                  .directToWaypoint(directWaypoint)
                  .then(() => {
                    DirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, DirToMode.Direct, false, {
                      utc: calculatedUTC,
                      dist: calculatedDistance,
                    });
                  })
                  .catch((err) => {
                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                    console.error(err);
                  });
              });
            }
          }, mcdu.PageTimeout.Slow);
        }
      }
    }
  }
}
