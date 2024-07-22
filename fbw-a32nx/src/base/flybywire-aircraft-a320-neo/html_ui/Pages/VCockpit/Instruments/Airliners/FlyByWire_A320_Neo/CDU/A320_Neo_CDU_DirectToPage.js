// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// TODO this whole thing is thales layout...

const MODE_DIRECT = 1;
const MODE_ABEAM = 2;
const MODE_RADIAL_IN = 3;
const MODE_RADIAL_OUT = 4;

class CDUDirectToPage {

    static ShowPage(mcdu, directWaypoint, wptsListIndex = 0, dirToMode = MODE_DIRECT) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DirectToPage;
        mcdu.returnPageCallback = () => {
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
        };

        const hasTemporary = mcdu.flightPlanService.hasTemporary;

        // regular update due to showing dynamic data on this page (distance/UTC)
        if (hasTemporary) {
            mcdu.page.SelfPtr = setTimeout(() => {
                if (mcdu.page.Current === mcdu.page.DirectToPage) {
                    CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
                }
            }, mcdu.PageTimeout.Medium);
        }

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
                mcdu.insertTemporaryFlightPlan(() => {
                    SimVar.SetSimVarValue("K:A32NX.FMGC_DIR_TO_TRIGGER", "number", 0);
                    CDUFlightPlanPage.ShowPage(mcdu);
                });
            };
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

        mcdu.onRightInput[1] = () => {
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_DIRECT);
        };
        mcdu.onRightInput[2] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_ABEAM);
        };
        mcdu.onRightInput[3] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_IN);
        };
        mcdu.onRightInput[4] = () => {
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, MODE_RADIAL_OUT);
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
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
            };
            up = true;
        }
        if (wptsListIndex > 0) {
            mcdu.onDown = () => {
                wptsListIndex--;
                CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex, dirToMode);
            };
            down = true;
        }
        mcdu.setArrows(up, down, false, false);

        const colorForHasTemporary = hasTemporary ? "yellow" : "cyan";
        const directWaypointCell = directWaypointIdent ? directWaypointIdent + "[color]yellow" : "[\xa0\xa0\xa0\xa0\xa0][color]cyan";
        let calculatedDistance = false;
        const activeLegCalculated = mcdu.flightPlanService.temporary.activeLeg.calculated;
        if (hasTemporary && activeLegCalculated) {
            calculatedDistance = activeLegCalculated.distance;
        }
        const distanceLabel = (hasTemporary && dirToMode === MODE_DIRECT && calculatedDistance) ? calculatedDistance.toFixed(0) : "\xa0\xa0\xa0";
        const distanceCell = hasTemporary ? (distanceLabel + "\xa0[color]yellow") : "---\xa0";

        let utcCell = "----";
        if (hasTemporary) {
            const mcduProfile = mcdu.guidanceController.vnavDriver.mcduProfile;
            if (dirToMode === MODE_DIRECT && activeLegCalculated && mcduProfile && mcduProfile.isReadyToDisplay && mcduProfile.tempPredictions && mcduProfile.tempPredictions.size > 0) {
                const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                const secondsFromPresent = mcduProfile.tempPredictions.get(1).secondsFromPresent;
                utcCell = FMCMainDisplay.secondsToUTC(utcTime + secondsFromPresent) + "[color]yellow";
            } else {
                utcCell = "\xa0\xa0\xa0\xa0[color]yellow";
            }
        }
        const directToCell = "DIRECT TO" + ((hasTemporary && dirToMode !== MODE_DIRECT) ? "}" : "\xa0") + "[color]" + (dirToMode === MODE_DIRECT ? colorForHasTemporary : "cyan");
        // TODO: support abeam
        const abeamPtsCell = "ABEAM PTS\xa0[color]" + (dirToMode === MODE_ABEAM ? colorForHasTemporary : "cyan");
        // TODO: support setting radial in, radial out
        const radialIn = (hasTemporary && !!directWaypoint && directWaypoint.bearing) ? directWaypoint.bearing.toFixed(0).padStart(3, "0") + "°" + (dirToMode !== MODE_RADIAL_IN ? "}" : "\xa0") : false;
        const radialInCell = (radialIn ? radialIn : "[\xa0]°\xa0") + "[color]" + (dirToMode === MODE_RADIAL_IN ? colorForHasTemporary : "cyan");
        const radialOutCell = "[\xa0]°\xa0[color]" + (dirToMode === MODE_RADIAL_OUT ? colorForHasTemporary : "cyan");

        mcdu.setTemplate([
            ["DIR TO[color]" + colorForHasTemporary],
            ["WAYPOINT", "DIST\xa0", "\xa0UTC"],
            [directWaypointCell, distanceCell, utcCell],
            ["F-PLN WPTS"],
            [waypointsCell[0], directToCell],
            ["", "WITH\xa0"],
            [waypointsCell[1], abeamPtsCell],
            ["", "RADIAL IN\xa0"],
            [waypointsCell[2], radialInCell],
            ["", "RADIAL OUT\xa0"],
            [waypointsCell[3], radialOutCell],
            [eraseLabel, insertLabel],
            [eraseLine ? eraseLine : waypointsCell[4], insertLine]
        ]);
    }
}
