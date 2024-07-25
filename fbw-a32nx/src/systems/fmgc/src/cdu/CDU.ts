import { Fix } from '@flybywiresim/fbw-sdk';
import { DirectToPage, DirToMode, Predictions } from '@fmgc/cdu/pages/DirectToPage';
import { A320_Neo_CDU_MainDisplay } from '@fmgc/cdu/CDUMainDisplay';

export type FMS = A320_Neo_CDU_MainDisplay & FMCMainDisplay; // & DataInterface & DisplayInterface;

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
}
