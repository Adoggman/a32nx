import { DisplayComponent, FSComponent, VNode, Subscribable, SubscribableArray } from '@microsoft/msfs-sdk';
import { CDUScratchpad } from 'instruments/src/CDU/CDU';
import { CDULine, DisplayablePage, ICDULine } from 'instruments/src/CDU/model/CDUPage';

// #region Properties
export interface PageProp {
  page?: DisplayablePage;
}

export interface HeaderProps {
  page?: DisplayablePage;
  arrowLeft?: boolean;
  arrowRight?: boolean;
}

export interface LinesProp {
  lines: SubscribableArray<CDULine>;
}

export interface LineProps {
  line: ICDULine;
  lineIndex: number;
}

export interface ScratchpadProps {
  message: Subscribable<string>;
  arrowUp?: boolean;
  arrowDown?: boolean;
}

//#endregion
const columns = 24;

// #region Formatting
const padBefore = (text: string, width: number = columns) => {
  const before = Math.floor((width - text.length) / 2);
  return CDUScratchpad.nbSpace.repeat(before);
};

const padAfter = (text: string, width: number = columns) => {
  const before = Math.floor((width - text.length) / 2);
  const after = width - (text.length + before);
  return CDUScratchpad.nbSpace.repeat(after);
};

const sanitize = (text?: string) => {
  return text ? htmlEntities(text) : '';
};

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// #endregion

export class CDUHeader extends DisplayComponent<HeaderProps> {
  render(): VNode | null {
    let arrowContent = '←\xa0\xa0';
    if (this.props.arrowLeft && this.props.arrowRight) {
      arrowContent = '←→\xa0';
    } else if (this.props.arrowRight) {
      arrowContent = '\xa0→\xa0';
    }
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
        <span id="cdu-arrow-horizontal" style={!this.props.arrowLeft && !this.props.arrowRight ? 'opacity: 0;' : ''}>
          {arrowContent}
        </span>
      </div>
    );
  }
}

export class CDUPageInfo extends DisplayComponent<PageProp> {
  render(): VNode | null {
    const showPage = this.props.page.pageCount || this.props.page.pageCurrent;
    return (
      <div id="cdu-page-info" class="s-text">
        <span id="cdu-page-current">{showPage ? this.props.page.pageCurrent?.toFixed(0) : ''}</span>
        <span id="cdu-page-slash">{showPage ? '/' : ''}</span>
        <span id="cdu-page-count">{showPage ? this.props.page.pageCount?.toFixed(0) : ''}</span>
      </div>
    );
  }
}

export class Lines extends DisplayComponent<PageProp> {
  render(): VNode | null {
    return (
      <>
        {this.props.page?.lines.map((line, index) => (
          <>
            <Labels line={line} lineIndex={index} />
            <Line line={line} lineIndex={index} />
          </>
        ))}
      </>
    );
  }
}

export class Labels extends DisplayComponent<LineProps> {
  render(): VNode | null {
    const lineNum = this.props.lineIndex;
    const leftElement = this.props.line?.labelElements[0];
    const rightElement = this.props.line?.labelElements[1];
    const centerElement = this.props.line?.labelElements[2];
    return (
      <div class={'label s-text'}>
        <span id={`cdu-label-${lineNum}}-left`} class="fmc-block label label-left">
          <span class={leftElement?.color + ' ' + leftElement?.size}>{sanitize(leftElement?.text)}</span>
        </span>
        <span id={`cdu-label-${lineNum}}-right`} class="fmc-block label label-right">
          <span class={rightElement?.color + ' ' + rightElement?.size}>{sanitize(rightElement?.text)}</span>
        </span>
        <span id={`cdu-label-${lineNum}}-center`} class="fmc-block label label-center">
          <span class={centerElement?.color + ' ' + centerElement?.size}>{sanitize(centerElement?.text)}</span>
        </span>
      </div>
    );
  }
}

export class Line extends DisplayComponent<LineProps> {
  render(): VNode | null {
    const lineNum = this.props.lineIndex;
    const leftElement = this.props.line?.textElements[0];
    const rightElement = this.props.line?.textElements[1];
    const centerElement = this.props.line?.textElements[2];
    return (
      <div class="line">
        <span id={`cdu-line-${lineNum}-left`} class="fmc-block line line-left">
          <span class={leftElement?.color + ' ' + leftElement?.size}>{sanitize(leftElement?.text)}</span>
        </span>
        <span id={`cdu-line-${lineNum}-right`} class="fmc-block line line-right">
          <span class={rightElement?.color + ' ' + rightElement?.size}>{sanitize(rightElement?.text)}</span>
        </span>
        <span id={`cdu-line-${lineNum}-center `} class="fmc-block line line-center">
          <span class={centerElement?.color + ' ' + centerElement?.size}>{sanitize(centerElement?.text)}</span>
        </span>
      </div>
    );
  }
}

export class Scratchpad extends DisplayComponent<ScratchpadProps> {
  render(): VNode {
    let arrowContents = '↓\xa0\xa0';
    if (this.props.arrowUp && this.props.arrowDown) {
      arrowContents = '↓↑\xa0';
    } else if (this.props.arrowUp) {
      arrowContents = '\xa0↑\xa0';
    }
    return (
      <div class="line">
        <span id="cdu-in-out" class="white">
          {this.props.message}
        </span>
        <span id="cdu-arrow-vertical" style={!this.props.arrowUp && !this.props.arrowDown ? 'opacity: 0;' : ''}>
          {arrowContents}
        </span>
      </div>
    );
  }
}
