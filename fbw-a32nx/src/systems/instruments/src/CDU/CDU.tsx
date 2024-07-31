import {
  EventBus,
  DisplayComponent,
  ComponentProps,
  NodeReference,
  FSComponent,
  VNode,
  HEvent,
} from '@microsoft/msfs-sdk';
//import { CDUSimvars } from 'instruments/src/CDU/model/CDUSimvarPublisher';

export type Side = 1 | 2;

interface CDUProps extends ComponentProps {
  bus: EventBus;
  side: Side;
}

const MCDUMenuHTML = `\
  <div class="s-text" id="title-left"></div>\
  <div id="header"><span id="title"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id="mcduTitle" class="white">MCDU&nbsp;MENU&nbsp;TS</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="arrow-horizontal" style="opacity: 0;">←&nbsp;&nbsp;</span></div>\
  <div id="page-info" class="s-text"><span id="page-current"></span><span id="page-slash"></span><span id="page-count"></span></div>\
  <div class="label s-text"><span id="label-0-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="inop">SELECT</span>&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-0-right" class="fmc-block label label-right"></span><span id="label-0-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-0-left" class="fmc-block line line-left"><span class="white"><span class="green">&lt;FMGC&nbsp;</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="inop">NAV&nbsp;B/UP&gt;</span><span class="s-text"></span><span class="b-text"></span></span></span><span id="line-0-right" class="fmc-block line line-right"></span><span id="line-0-center" class="fmc-block line line-center"></span></div>\
  <div class="label s-text"><span id="label-1-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-1-right" class="fmc-block label label-right"></span><span id="label-1-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-1-left" class="fmc-block line line-left"><span class="white"><span class="white">&lt;ATSU&nbsp;</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="line-1-right" class="fmc-block line line-right"></span><span id="line-1-center" class="fmc-block line line-center"></span></div>\
  <div class="label s-text"><span id="label-2-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-2-right" class="fmc-block label label-right"></span><span id="label-2-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-2-left" class="fmc-block line line-left"><span class="white"><span class="white">&lt;AIDS&nbsp;</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="line-2-right" class="fmc-block line line-right"></span><span id="line-2-center" class="fmc-block line line-center"></span></div>\
  <div class="label s-text"><span id="label-3-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-3-right" class="fmc-block label label-right"></span><span id="label-3-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-3-left" class="fmc-block line line-left"><span class="white"><span class="white">&lt;CFDS&nbsp;</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="line-3-right" class="fmc-block line line-right"></span><span id="line-3-center" class="fmc-block line line-center"></span></div>\
  <div class="label s-text"><span id="label-4-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-4-right" class="fmc-block label label-right"></span><span id="label-4-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-4-left" class="fmc-block line line-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="line-4-right" class="fmc-block line line-right"></span><span id="line-4-center" class="fmc-block line line-center"></span></div>\
  <div class="label s-text"><span id="label-5-left" class="fmc-block label label-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="label-5-right" class="fmc-block label label-right"></span><span id="label-5-center" class="fmc-block label label-center"></span></div>\
  <div class="line"><span id="line-5-left" class="fmc-block line line-left"><span class="white">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="s-text"></span><span class="b-text"></span></span></span><span id="line-5-right" class="fmc-block line line-right"></span><span id="line-5-center" class="fmc-block line line-center"></span></div>\
  <div class="line"><span id="in-out" class="white">SELECT DESIRED SYSTEM</span><span id="arrow-vertical" style="opacity: 0;">↓&nbsp;&nbsp;</span></div>"`;

export namespace CDUDisplay {
  export const clrValue = '\xa0\xa0\xa0\xa0\xa0CLR';
  export const ovfyValue = '\u0394';
  export const _AvailableKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  export const nbSpace = '\xa0';
}

export class CDUComponent extends DisplayComponent<CDUProps> {
  private containerRef: NodeReference<HTMLElement> = FSComponent.createRef();
  private side: Side;

  setScratchpad(msg: string) {
    this.containerRef.instance.querySelector('#in-out').innerHTML = msg.toUpperCase();
  }

  render(): VNode {
    this.side = this.props.side;
    console.log('AJH Rendering TypeScript CDU ' + this.side.toString());
    const result = <div id="Mainframe" ref={this.containerRef} />;

    this.containerRef.instance.innerHTML = MCDUMenuHTML;
    return result;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.initializeKeyHandlers();
  }

  initializeKeyHandlers(): void {
    const hEventsSub = this.props.bus.getSubscriber<HEvent>();
    hEventsSub.on('hEvent').handle((eventName) => {
      switch (eventName) {
        case `A320_Neo_CDU_${this.side}_BTN_OVFY`:
          this.setScratchpad(CDUDisplay.ovfyValue);
          break;
        case `A320_Neo_CDU_${this.side}_BTN_CLR`:
          this.setScratchpad(CDUDisplay.clrValue);
          break;
        default:
          break;
      }
    });
  }
}
