import { DisplayComponent, FSComponent, VNode, Subscribable } from '@microsoft/msfs-sdk';
import { DisplayablePage, ICDULine, ICDUElement, CDUColor } from '@cdu/model/CDUPage';
import { sanitize } from '@cdu/Format';

// #region Properties
export interface PageProp {
  page?: DisplayablePage;
}

export interface HeaderProps {
  page?: DisplayablePage;
  arrowLeft?: boolean;
  arrowRight?: boolean;
}

export interface LineProps {
  line: ICDULine;
  lineIndex: number;
}

export interface ElementProps {
  element: ICDUElement;
}

export interface ScratchpadProps {
  message: Subscribable<string>;
  arrowUp?: boolean;
  arrowDown?: boolean;
  color: Subscribable<string>;
}

//#endregion

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
            {/* {padBefore(this.props.page.title)} */}
            <span class="white">{this.props.page.title}</span>
            {/* {padAfter(this.props.page.title)} */}
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
    const leftElement = this.props.line?.leftLabel;
    const rightElement = this.props.line?.rightLabel;
    const centerElement = this.props.line?.centerLabel;
    return (
      <div class={'label s-text'}>
        <span id={`cdu-label-${lineNum}-left`} class="fmc-block label label-left">
          <CDUElementSpan element={leftElement} />
        </span>
        <span id={`cdu-label-${lineNum}-right`} class="fmc-block label label-right">
          <CDUElementSpan element={rightElement} />
        </span>
        <span id={`cdu-label-${lineNum}-center`} class="fmc-block label label-center">
          <CDUElementSpan element={centerElement} />
        </span>
      </div>
    );
  }
}

export class Line extends DisplayComponent<LineProps> {
  render(): VNode | null {
    const lineNum = this.props.lineIndex;
    const leftElement = this.props.line?.left;
    const rightElement = this.props.line?.right;
    const centerElement = this.props.line?.center;
    return (
      <div class="line">
        <span id={`cdu-line-${lineNum}-left`} class="fmc-block line line-left">
          <CDUElementSpan element={leftElement} />
        </span>
        <span id={`cdu-line-${lineNum}-right`} class="fmc-block line line-right">
          <CDUElementSpan element={rightElement} />
        </span>
        <span id={`cdu-line-${lineNum}-center `} class="fmc-block line line-center">
          <CDUElementSpan element={centerElement} />
        </span>
      </div>
    );
  }
}

export class CDUElementSpan extends DisplayComponent<ElementProps> {
  render(): VNode {
    const color = this.props.element?.color ?? CDUColor.White;
    return (
      <span class={color + ' ' + this.props.element?.size}>
        {sanitize(this.props.element?.text)}
        {this.props.element?.secondElement && <CDUElementSpan element={this.props.element.secondElement} />}
      </span>
    );
  }
}

export class ScratchpadDisplay extends DisplayComponent<ScratchpadProps> {
  render(): VNode {
    let arrowContents = '↓\xa0\xa0';
    if (this.props.arrowUp && this.props.arrowDown) {
      arrowContents = '↓↑\xa0';
    } else if (this.props.arrowUp) {
      arrowContents = '\xa0↑\xa0';
    }
    return (
      <div class="line">
        <span id="cdu-in-out" class={this.props.color}>
          {this.props.message}
        </span>
        <span id="cdu-arrow-vertical" style={!this.props.arrowUp && !this.props.arrowDown ? 'opacity: 0;' : ''}>
          {arrowContents}
        </span>
      </div>
    );
  }
}
