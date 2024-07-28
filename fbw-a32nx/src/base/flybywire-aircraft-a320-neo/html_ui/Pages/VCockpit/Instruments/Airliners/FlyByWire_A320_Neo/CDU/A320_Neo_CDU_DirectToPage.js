// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// TODO this whole thing is thales layout...
const MODE_DIRECT = 1;
const MODE_ABEAM = 2;
const MODE_RADIAL_IN = 3;
const MODE_RADIAL_OUT = 4;

class CDUDirectToPage {

    static ShowPage(mcdu, directWaypoint, wptsListIndex = 0, dirToMode = MODE_DIRECT, radialValue = false, cachedPredictions = { utc: false, dist: false }, suppressRefresh = false) {
        //Fmgc.CDU.Pages.DirectTo.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue, cachedPredictions, suppressRefresh);
        //return;

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DirectToPage;
        mcdu.returnPageCallback = () => {
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue);
        };

        const hasTemporary = mcdu.flightPlanService.hasTemporary;

        mcdu.activeSystem = 'FMGC';

        let directWaypointIdent = "";
        if (directWaypoint) {
            directWaypointIdent = directWaypoint.ident;
        } else if (hasTemporary) {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDUDirectToPage.ShowPage(mcdu);
            });
            return;
        }

        const waypointsCell = ["", "", "", "", ""];
        let iMax = 5;
        let eraseLabel = "";
        let eraseLine = "";
        let insertLabel = "";
        let insertLine = "";
        if (hasTemporary) {
            iMax--;
            eraseLabel = "\xa0DIR TO[color]amber";
            eraseLine = "{ERASE[color]amber";
            insertLabel = "DIR TO\xa0[color]amber";
            insertLine = "INSERT*[color]amber";
            mcdu.onLeftInput[5] = () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUDirectToPage.ShowPage(mcdu);
                });
            };
            mcdu.onRightInput[5] = () => {
                mcdu.insertTemporaryFlightPlan(() => { }, (success) => {
                    if (success) {
                        SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
                        CDUFlightPlanPage.ShowPage(mcdu);
                    } else {
                        mcdu.addMessageToQueue(NXSystemMessages.adjustDesiredHdgTrk);
                        mcdu.addMessageToQueue(NXSystemMessages.noNavIntercept);
                    }
                });
            };
        }

        let defaultHeading = false;
        if (directWaypoint) {
            if (directWaypoint.bearing) {
                defaultHeading = (directWaypoint.bearing + 180) % 360;
            } else {
                const waypointIndex = mcdu.flightPlanService.active.allLegs.findIndex((it) => it.isDiscontinuity === false && it.terminatesWithWaypoint(directWaypoint));
                if (waypointIndex > 1) {
                    const waypointLeg = mcdu.flightPlanService.active.allLegs[waypointIndex];
                    if (waypointLeg.definition.magneticCourse) {
                        defaultHeading = (waypointLeg.definition.magneticCourse + 180) % 360;
                    } else {
                        const prevLeg = mcdu.flightPlanService.active.allLegs[waypointIndex - 1];
                        if (!prevLeg.isDiscontinuity) {
                            const prevWaypoint = prevLeg.terminationWaypoint();
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
            if (value === FMCMainDisplay.clrValue) {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUDirectToPage.ShowPage(mcdu, undefined, wptsListIndex);
                });
                return;
            }

            Fmgc.WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false).then((w) => {
                if (w) {
                    mcdu.eraseTemporaryFlightPlan(() => {
                        mcdu.directToWaypoint(w).then(() => {
                            CDUDirectToPage.ShowPage(mcdu, w, wptsListIndex);
                        }).catch(err => {
                            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                            console.error(err);
                        });
                    });
                } else {
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
                }
            }).catch((err) => {
                // Rethrow if error is not an FMS message to display
                if (err.type === undefined) {
                    throw err;
                }

                mcdu.showFmsErrorMessage(err.type);
            });
        };

        // DIRECT TO
        mcdu.onRightInput[1] = () => {
            if (dirToMode === MODE_DIRECT) {
                return;
            }
            mcdu.eraseTemporaryFlightPlan(() => {
                mcdu.directToWaypoint(directWaypoint).then(() => {
                    CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_DIRECT);
                }).catch(err => {
                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                    console.error(err);
                });
            });
        };
        // ABEAM
        mcdu.onRightInput[2] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            //CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_ABEAM);
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
                    mcdu.directToWaypoint(directWaypoint, defaultHeading).then(() => {
                        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_IN, defaultHeading);
                    }).catch(err => {
                        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_IN, defaultHeading, cachedPredictions, true);
                        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                        console.error(err);
                    });
                });
                return;
            }

            if (dirToMode === MODE_RADIAL_IN && value === FMCMainDisplay.clrValue) {
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_DIRECT);
                return;
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
                mcdu.directToWaypoint(directWaypoint, magCourse).then(() => {
                    CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_IN, magCourse);
                }).catch(err => {
                    CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_IN, magCourse, cachedPredictions, true);
                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                    console.error(err);
                });
            });
            return;
        };
        // RADIAL OUT
        mcdu.onRightInput[4] = (value, scratchpadCallback) => {
            // If no waypoint entered, don't do anything
            if (!hasTemporary) {
                return;
            }

            // Clear the radial out, go back to normal direct to
            if (dirToMode === MODE_RADIAL_OUT && value === FMCMainDisplay.clrValue) {
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_DIRECT);
                return;
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
                        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_OUT, magCourse);
                    })
                    .catch((err) => {
                        CDUDirectToPage.ShowPage(
                            mcdu,
                            directWaypoint,
                            wptsListIndex,
                            MODE_RADIAL_OUT,
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
        wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanService.active.activeLegIndex);

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
                waypointsCell[cellIter] = (leg.ident === directWaypointIdent ? "\xa0" : "{") + leg.ident + "[color]cyan";
                if (waypointsCell[cellIter]) {
                    mcdu.onLeftInput[cellIter + 1] = () => {
                        mcdu.eraseTemporaryFlightPlan(() => {
                            mcdu.directToLeg(legIndex).then(() => {
                                CDUDirectToPage.ShowPage(mcdu, leg.terminationWaypoint(), wptsListIndex);
                            }).catch(err => {
                                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                                console.error(err);
                            });
                        });
                    };
                }
            } else {
                waypointsCell[cellIter] = "----";
            }
            i++;
            cellIter++;
        }
        if (cellIter < iMax) {
            waypointsCell[cellIter] = "--END--";
        }
        let up = false;
        let down = false;
        if (wptsListIndex < totalWaypointsCount - 5) {
            mcdu.onUp = () => {
                wptsListIndex++;
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue, cachedPredictions);
            };
            up = true;
        }
        if (wptsListIndex > 0) {
            mcdu.onDown = () => {
                wptsListIndex--;
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue, cachedPredictions);
            };
            down = true;
        }
        mcdu.setArrows(up, down, false, false);

        const colorForHasTemporary = hasTemporary ? "yellow" : "cyan";

        const directWaypointCell = directWaypointIdent ? directWaypointIdent + "[color]yellow" : "{small}[\xa0\xa0\xa0\xa0\xa0]{end}[color]cyan";
        let calculatedDistance = cachedPredictions.dist;
        const activeLegCalculated = hasTemporary ? mcdu.flightPlanService.temporary.activeLeg.calculated : false;
        if (hasTemporary && activeLegCalculated) {
            calculatedDistance = activeLegCalculated.distance;
        }
        const distanceLabel = (hasTemporary && dirToMode === MODE_DIRECT && calculatedDistance) ? calculatedDistance.toFixed(0) : "\xa0\xa0\xa0";
        const distanceCell = hasTemporary ? (distanceLabel + "\xa0[color]yellow") : "---\xa0";

        let utcCell = "----";
        let calculatedUTC = cachedPredictions.utc;
        if (hasTemporary) {
            const mcduProfile = mcdu.guidanceController.vnavDriver.mcduProfile;
            if (dirToMode === MODE_DIRECT && activeLegCalculated && mcduProfile && mcduProfile.isReadyToDisplay && mcduProfile.tempPredictions && mcduProfile.tempPredictions.size > 0) {
                const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                const secondsFromPresent = mcduProfile.tempPredictions.get(1).secondsFromPresent;
                calculatedUTC = utcTime + secondsFromPresent;
            }
            utcCell = calculatedUTC ? FMCMainDisplay.secondsToUTC(calculatedUTC) + "[color]yellow" : "\xa0\xa0\xa0\xa0[color]yellow";
        }
        const directToCell = "DIRECT TO\xa0" + ((hasTemporary && dirToMode !== MODE_DIRECT) ? "}" : "\xa0") + "[color]" + (dirToMode === MODE_DIRECT ? colorForHasTemporary : "cyan");
        // TODO: support abeam
        const abeamPtsCell = "ABEAM PTS\xa0\xa0[color]" + (dirToMode === MODE_ABEAM ? colorForHasTemporary : "cyan");

        let radialInCell = '{small}[\xa0]°{end}\xa0\xa0[color]cyan';
        if (hasTemporary) {
            if (dirToMode === MODE_RADIAL_IN) {
                if (radialValue === false) {
                    console.log('Radial in selected with no heading');
                    radialInCell = '[\xa0]°\xa0\xa0[color]yellow';
                } else {
                    radialInCell = radialValue.toFixed(0).padStart(3, '0') + '°\xa0\xa0[color]yellow';
                }
            } else if (defaultHeading) {
                radialInCell = '{small}' + defaultHeading.toFixed(0).padStart(3, '0') + '°{end}\xa0}[color]cyan';
            }
        }
        let radialOutCell = '{small}[\xa0]°{end}\xa0\xa0[color]cyan';
        if (dirToMode === MODE_RADIAL_OUT) {
            if (radialValue === false) {
                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                console.log('Radial out selected with no heading');
                radialOutCell = '[\xa0]°\xa0\xa0[color]yellow';
            } else {
                radialOutCell = radialValue.toFixed(0).padStart(3, '0') + '°\xa0\xa0[color]yellow';
            }
        }

        mcdu.setTemplate([
            ["DIR TO[color]" + colorForHasTemporary],
            ["WAYPOINT", "DIST\xa0", "\xa0UTC"],
            [directWaypointCell, distanceCell, utcCell],
            ["F-PLN WPTS"],
            [waypointsCell[0], directToCell],
            ["", "WITH\xa0\xa0\xa0\xa0\xa0\xa0\xa0"],
            [waypointsCell[1], abeamPtsCell],
            ["", "RADIAL IN\xa0\xa0"],
            [waypointsCell[2], radialInCell],
            ["", "RADIAL OUT\xa0"],
            [waypointsCell[3], radialOutCell],
            [eraseLabel, insertLabel],
            [eraseLine ? eraseLine : waypointsCell[4], insertLine]
        ]);

        // regular update due to showing dynamic data on this page (distance/UTC)
        if (hasTemporary && !suppressRefresh) {

            // Medium refresh until we have calcluated distances
            if (!activeLegCalculated) {
                mcdu.page.SelfPtr = setTimeout(() => {
                    if (mcdu.page.Current === mcdu.page.DirectToPage) {
                        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode, radialValue, { utc: calculatedUTC, dist: calculatedDistance });
                    }
                }, mcdu.PageTimeout.Medium);
            } else {
                if (dirToMode === MODE_DIRECT) {
                    // If we've already calculated, do a slow refresh with a fresh waypoint at the end in case we've moved
                    mcdu.page.SelfPtr = setTimeout(() => {
                        if (mcdu.page.Current === mcdu.page.DirectToPage) {
                            // Refresh temp plan when in direct to mode as T-P will change, don't clear predictions though as they are probably kinda right
                            mcdu.eraseTemporaryFlightPlan(() => {
                                mcdu.directToWaypoint(directWaypoint).then(() => {
                                    CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_DIRECT, false, { utc: calculatedUTC, dist: calculatedDistance });
                                }).catch(err => {
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
