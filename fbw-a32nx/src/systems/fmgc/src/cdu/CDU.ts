import { Fix } from '@flybywiresim/fbw-sdk';
import { DirectToPage, DirToMode, Predictions } from './pages/DirectToPage';
import { FMS } from '@fmgc/cdu/FMS';

// export abstract class CDUPage {
//   static ShowPage(_mcdu: FMS, ..._params) {
//     console.log('Default page created)');
//   }
// }

export class CDU {
  static Pages = {
    DirectTo: DirectToPage,
  };

  static ShowDirectToPage(
    mcdu: FMS,
    directWaypoint?: Fix,
    wptsListIndex: number = 0,
    dirToMode: DirToMode = DirToMode.Direct,
    radialValue: Degrees | false = false,
    cachedPredictions: Predictions = { dist: false, utc: false },
    suppressRefresh: boolean = false,
  ) {
    DirectToPage.ShowPage(
      mcdu,
      directWaypoint,
      wptsListIndex,
      dirToMode,
      radialValue,
      cachedPredictions,
      suppressRefresh,
    );
  }

  static clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  static ovfyValue = '\u0394';
  static _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
}
