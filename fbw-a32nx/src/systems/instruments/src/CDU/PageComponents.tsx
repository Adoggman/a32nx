import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { ICDUPage } from 'instruments/src/CDU/model/CDUPage';
import { CDUPage } from 'instruments/src/CDU/Page';

export interface HeaderProps {
  page: ICDUPage;
}

export interface LineProps {
  page: ICDUPage;
  lineIndex: number;
}

const padBefore = (text: string, width: number = CDUPage.columns) => {
  const before = Math.floor((width - text.length) / 2);
  return CDUDisplay.nbSpace.repeat(before);
};

const padAfter = (text: string, width: number = CDUPage.columns) => {
  const before = Math.floor((width - text.length) / 2);
  const after = width - (text.length + before);
  return CDUDisplay.nbSpace.repeat(after);
};

export class CDUHeader extends DisplayComponent<HeaderProps> {
  render(): VNode | null {
    console.log('rendering header');
    return (
      <div id="cdu-header">
        <span id="cdu-title">
          <span class="white">
            {padBefore(this.props.page.title)}
            <span class="white">{this.props.page.title}</span>
            {padAfter(this.props.page.title)}
            <span class="s-text"></span>
            <span class="b-text"></span>
          </span>
        </span>
        <span id="cdu-arrow-horizontal" style="opacity: 0;">
          ←&nbsp;&nbsp;
        </span>
      </div>
    );
  }
}

//  export const Info(): VNode {
//     return (
//       <div id="cdu-page-info" class="s-text">
//         <span id="cdu-page-current"></span>
//         <span id="cdu-page-slash"></span>
//         <span id="cdu-page-count"></span>
//       </div>
//     );
//   }

// export const Labels(props: LineProps): VNode {
//     return (
//       <div class="label s-text">
//         <span id={`cdu-label-${props.lineIndex}}-left`} class="fmc-block label label-left">
//           <span class="white">{props.page.lines[props.lineIndex].labels[0]}</span>
//         </span>
//         <span id={`cdu-label-${props.lineIndex}}-right`} class="fmc-block label label-right">
//           <span class="inop">{props.page.lines[props.lineIndex].labels[1]}</span>
//         </span>
//         <span id={`cdu-label-${props.lineIndex}}-center`} class="fmc-block label label-center"></span>
//       </div>
//     );
//   }

// export const Line(props: LineProps): VNode {
//     return (
//       <div class="line">
//         <span id={`cdu-line-${props.lineIndex}}-left`} class="fmc-block line line-left">
//           <span class="green">{props.page.lines[props.lineIndex].text[0]}</span>
//         </span>
//         <span id={`cdu-line-${props.lineIndex}}-right`} class="fmc-block line line-right">
//           <span class="inop">{props.page.lines[props.lineIndex].text[1]}</span>
//         </span>
//         <span id={`cdu-line-${props.lineIndex}}-center`} class="fmc-block line line-center"></span>
//       </div>
//     );
//   }
