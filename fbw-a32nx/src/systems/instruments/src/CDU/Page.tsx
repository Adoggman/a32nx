// import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
// //import { CDUDisplay } from 'instruments/src/CDU/CDU';
// import { DisplayablePage } from 'instruments/src/CDU/model/CDUPage';
// import { CDUHeader, CDUInfo, Labels, Line } from 'instruments/src/CDU/PageComponents';

// export interface CDUPageProps {
//   page: DisplayablePage;
//   pageID: Subject<string>;
// }

// export class CDUPage extends DisplayComponent<CDUPageProps> {
//   render(): VNode | null {
//     console.log('page rendering...');
//     const page = this.props.page;
//     return (
//       <>
//         <div class="s-text" id="cdu-title-left"></div>
//         <CDUHeader title={page.title} />
//         <CDUInfo page={page} />
//         {page.lines.map((line, index) => (
//           <>
//             <Labels line={line} lineIndex={index} />
//             <Line line={line} lineIndex={index} />
//           </>
//         ))}
//       </>
//     );
//   }

//   onAfterRender() {
//     console.log('page rendered');
//     this.props.pageID.sub((newPageID) => console.log('New page ' + newPageID));
//   }
// }
