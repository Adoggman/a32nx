import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { ICDULine, ICDUPage } from 'instruments/src/CDU/model/CDUPage';
import { CDUPage } from 'instruments/src/CDU/Page';

export interface PageProps {
  page: ICDUPage;
}

export interface LineProps {
  line: ICDULine;
  lineIndex: number;
}

export interface ScratchpadProps {
  message: string;
  showArrow?: boolean;
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

const sanitize = (text?: string) => {
  return text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
};

export class CDUHeader extends DisplayComponent<PageProps> {
  render(): VNode | null {
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

export class CDUInfo extends DisplayComponent<PageProps> {
  render(): VNode | null {
    return (
      <div id="cdu-page-info" class="s-text">
        <span id="cdu-page-current"></span>
        <span id="cdu-page-slash"></span>
        <span id="cdu-page-count"></span>
      </div>
    );
  }
}

export class Labels extends DisplayComponent<LineProps> {
  render(): VNode | null {
    const lineNum = this.props.lineIndex;
    const leftElement = this.props.line?.labelElements[0];
    const rightElement = this.props.line?.labelElements[1];
    return (
      <div class="label s-text">
        <span id={`cdu-label-${lineNum}}-left`} class="fmc-block label label-left">
          <span class={leftElement?.color}>{sanitize(leftElement?.text)}</span>
        </span>
        <span id={`cdu-label-${lineNum}}-right`} class="fmc-block label label-right">
          <span class={rightElement?.color}>{sanitize(rightElement?.text)}</span>
        </span>
        <span id={`cdu-label-${lineNum}}-center`} class="fmc-block label label-center"></span>
      </div>
    );
  }
}

export class Line extends DisplayComponent<LineProps> {
  render(): VNode | null {
    const lineNum = this.props.lineIndex;
    const leftElement = this.props.line?.textElements[0];
    const rightElement = this.props.line?.textElements[1];
    return (
      <div class="line">
        <span id={`cdu-line-${lineNum}}-left`} class="fmc-block line line-left">
          <span class={leftElement?.color}>{sanitize(leftElement?.text)}</span>
        </span>
        <span id={`cdu-line-${lineNum}}-right`} class="fmc-block line line-right">
          <span class={rightElement?.color}>{sanitize(rightElement?.text)}</span>
        </span>
        <span id={`cdu-line-${lineNum}}-center`} class="fmc-block line line-center"></span>
      </div>
    );
  }
}

export class Scratchpad extends DisplayComponent<ScratchpadProps> {
  render(): VNode {
    return (
      <div class="line">
        <span id="cdu-in-out" class="white">
          {this.props.message}
        </span>
        <span id="cdu-arrow-vertical" style={!this.props.showArrow ? 'opacity: 0;' : ''}>
          ↓&nbsp;&nbsp;
        </span>
      </div>
    );
  }
}
