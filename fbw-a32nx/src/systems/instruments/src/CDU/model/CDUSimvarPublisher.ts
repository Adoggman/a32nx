// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export interface CDUSimvars {
  acEssIsPowered: boolean;
  ac2IsPowered: boolean;
}

export enum CDUVars {
  acEssIsPowered = 'L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED',
  ac2IsPowered = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
}

export class CDUSimvarPublisher extends SimVarPublisher<CDUSimvars> {
  private static simvars = new Map<keyof CDUSimvars, SimVarDefinition>([
    ['acEssIsPowered', { name: CDUVars.acEssIsPowered, type: SimVarValueType.Bool }],
    ['ac2IsPowered', { name: CDUVars.ac2IsPowered, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(CDUSimvarPublisher.simvars, bus);
  }
}
