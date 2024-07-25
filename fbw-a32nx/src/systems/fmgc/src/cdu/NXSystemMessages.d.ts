declare class McduMessage {
  constructor(text: any, isAmber?: boolean, replace?: string);
  text: any;
  isAmber: boolean;
  replace: string;
  isTypeTwo: boolean;
}
declare class TypeIMessage extends McduMessage {
  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   */
  getModifiedMessage(t: any): McduMessage;
}
declare class TypeIIMessage extends McduMessage {
  constructor(text: any, isAmber?: boolean, replace?: string, isResolved?: () => boolean, onClear?: () => void);
  isResolved: () => boolean;
  onClear: () => void;
  /**
   * Only returning a "copy" of the object to ensure thread safety when trying to edit the original message
   * t {string} replaces defined elements, see this.replace
   * isResolved {function} overrides present function
   * onClear {function} overrides present function
   */
  getModifiedMessage(t: any, isResolved?: any, onClear?: any): TypeIIMessage;
}
declare namespace NXSystemMessages {
  let aocActFplnUplink: TypeIIMessage;
  let arptTypeAlreadyInUse: TypeIMessage;
  let awyWptMismatch: TypeIMessage;
  let cancelAtisUpdate: TypeIMessage;
  let checkMinDestFob: TypeIIMessage;
  let checkSpeedMode: TypeIIMessage;
  let checkToData: TypeIIMessage;
  let checkWeight: TypeIIMessage;
  let comUnavailable: TypeIMessage;
  let cstrDelUpToWpt: TypeIIMessage;
  let databaseCodingError: TypeIIMessage;
  let dcduFileFull: TypeIMessage;
  let destEfobBelowMin: TypeIIMessage;
  let enterDestData: TypeIIMessage;
  let entryOutOfRange: TypeIMessage;
  let mandatoryFields: TypeIMessage;
  let formatError: TypeIMessage;
  let fplnElementRetained: TypeIMessage;
  let initializeWeightOrCg: TypeIIMessage;
  let keyNotActive: TypeIMessage;
  let latLonAbreviated: TypeIMessage;
  let listOf99InUse: TypeIMessage;
  let newAccAlt: TypeIIMessage;
  let newAtisReceived: TypeIMessage;
  let newCrzAlt: TypeIIMessage;
  let newThrRedAlt: TypeIIMessage;
  let noAtc: TypeIMessage;
  let noAtisReceived: TypeIMessage;
  let noIntersectionFound: TypeIMessage;
  let noPreviousAtis: TypeIMessage;
  let notAllowed: TypeIMessage;
  let notAllowedInNav: TypeIMessage;
  let notInDatabase: TypeIMessage;
  let rwyLsMismatch: TypeIIMessage;
  let selectDesiredSystem: TypeIMessage;
  let setHoldSpeed: TypeIIMessage;
  let spdLimExceeded: TypeIIMessage;
  let systemBusy: TypeIMessage;
  let toSpeedTooLow: TypeIIMessage;
  let uplinkInsertInProg: TypeIIMessage;
  let usingCostIndex: TypeIMessage;
  let vToDisagree: TypeIIMessage;
  let waitForSystemResponse: TypeIMessage;
  let xxxIsDeselected: TypeIMessage;
  let stepAboveMaxFl: TypeIIMessage;
  let stepAhead: TypeIIMessage;
  let stepDeleted: TypeIIMessage;
  let noNavIntercept: TypeIIMessage;
  let adjustDesiredHdgTrk: TypeIIMessage;
}
declare namespace NXFictionalMessages {
  let noNavigraphUser: TypeIMessage;
  let internalError: TypeIMessage;
  let noAirportSpecified: TypeIMessage;
  let fltNbrInUse: TypeIMessage;
  let fltNbrMissing: TypeIMessage;
  let notYetImplemented: TypeIMessage;
  let recipientNotFound: TypeIMessage;
  let authErr: TypeIMessage;
  let invalidMsg: TypeIMessage;
  let unknownDownlinkErr: TypeIMessage;
  let telexNotEnabled: TypeIMessage;
  let freeTextDisabled: TypeIMessage;
  let freetextEnabled: TypeIMessage;
  let enabledFltNbrInUse: TypeIMessage;
  let noOriginApt: TypeIMessage;
  let noOriginSet: TypeIMessage;
  let secondIndexNotFound: TypeIMessage;
  let firstIndexNotFound: TypeIMessage;
  let noRefWpt: TypeIMessage;
  let noWptInfos: TypeIMessage;
  let emptyMessage: TypeIMessage;
  let reloadPlaneApply: TypeIIMessage;
  let noHoppieConnection: TypeIMessage;
  let unknownAtsuMessage: TypeIMessage;
  let reverseProxy: TypeIMessage;
}
