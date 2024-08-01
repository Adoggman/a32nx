import { DisplayComponent, FSComponent, VNode, Subscribable, SubscribableArray } from '@microsoft/msfs-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { CDULine, DisplayablePage, ICDULine } from 'instruments/src/CDU/model/CDUPage';

export interface PageProp {
  page?: DisplayablePage;
}

export interface HeaderProps {
  title?: Subscribable<string>;
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
  showArrow?: Subscribable<boolean>;
}

const columns = 24;

const padBefore = (text: string, width: number = columns) => {
  const before = Math.floor((width - text.length) / 2);
  return CDUDisplay.nbSpace.repeat(before);
};

const padAfter = (text: string, width: number = columns) => {
  const before = Math.floor((width - text.length) / 2);
  const after = width - (text.length + before);
  return CDUDisplay.nbSpace.repeat(after);
};

const sanitize = (text?: string) => {
  return text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
};

export class CDUHeader extends DisplayComponent<HeaderProps> {
  render(): VNode | null {
    return (
      <div id="cdu-header">
        <span id="cdu-title">
          <span class="white">
            {padBefore(this.props.title.get())}
            <span class="white">{this.props.title}</span>
            {padAfter(this.props.title.get())}
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

export class CDUInfo extends DisplayComponent<PageProp> {
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
