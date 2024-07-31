import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { ICDUPage } from 'instruments/src/CDU/model/CDUPage';
import { CDUHeader } from 'instruments/src/CDU/PageComponents';

export interface CDUPageProps {
  page: ICDUPage;
}

export class CDUPage extends DisplayComponent<CDUPageProps> {
  static readonly columns = 24;
  paddedCenter(text: string, width: number = CDUPage.columns): string {
    const before = Math.floor((width - text.length) / 2);
    const after = width - (text.length + before);
    return CDUDisplay.nbSpace.repeat(before) + text + CDUDisplay.nbSpace.repeat(after);
  }

  padBefore(text: string, width: number = CDUPage.columns): string {
    const before = Math.floor((width - text.length) / 2);
    return CDUDisplay.nbSpace.repeat(before);
  }

  padAfter(text: string, width: number = CDUPage.columns): string {
    const before = Math.floor((width - text.length) / 2);
    const after = width - (text.length + before);
    return CDUDisplay.nbSpace.repeat(after);
  }

  render(): VNode | null {
    const page = this.props.page;
    console.log('Line: ' + page.lines[0].text[0]);
    return (
      <div id="CDU_Page">
        <div class="s-text" id="cdu-title-left"></div>
        <CDUHeader page={page} />
        <div id="cdu-page-info" class="s-text">
          <span id="cdu-page-current"></span>
          <span id="cdu-page-slash"></span>
          <span id="cdu-page-count"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-0-left" class="fmc-block label label-left">
            <span class="white">
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-0-right" class="fmc-block label label-right">
            <span class="inop">{page.lines[0].labels[1]}</span>
          </span>
          <span id="cdu-label-0-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-0-left" class="fmc-block line line-left">
            <span class="green">{page.lines[0].text[0]}</span>
          </span>
          <span id="cdu-line-0-right" class="fmc-block line line-right">
            <span class="inop">{page.lines[0].text[1]}</span>
          </span>
          <span id="cdu-line-0-center" class="fmc-block line line-center"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-1-left" class="fmc-block label label-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-1-right" class="fmc-block label label-right"></span>
          <span id="cdu-label-1-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-1-left" class="fmc-block line line-left">
            <span class="white">
              <span class="white">&lt;ATSU&nbsp;</span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-line-1-right" class="fmc-block line line-right"></span>
          <span id="cdu-line-1-center" class="fmc-block line line-center"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-2-left" class="fmc-block label label-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-2-right" class="fmc-block label label-right"></span>
          <span id="cdu-label-2-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-2-left" class="fmc-block line line-left">
            <span class="white">
              <span class="white">&lt;AIDS&nbsp;</span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-line-2-right" class="fmc-block line line-right"></span>
          <span id="cdu-line-2-center" class="fmc-block line line-center"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-3-left" class="fmc-block label label-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-3-right" class="fmc-block label label-right"></span>
          <span id="cdu-label-3-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-3-left" class="fmc-block line line-left">
            <span class="white">
              <span class="white">&lt;CFDS&nbsp;</span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-line-3-right" class="fmc-block line line-right"></span>
          <span id="cdu-line-3-center" class="fmc-block line line-center"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-4-left" class="fmc-block label label-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-4-right" class="fmc-block label label-right"></span>
          <span id="cdu-label-4-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-4-left" class="fmc-block line line-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-line-4-right" class="fmc-block line line-right"></span>
          <span id="cdu-line-4-center" class="fmc-block line line-center"></span>
        </div>
        <div class="label s-text">
          <span id="cdu-label-5-left" class="fmc-block label label-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-label-5-right" class="fmc-block label label-right"></span>
          <span id="cdu-label-5-center" class="fmc-block label label-center"></span>
        </div>
        <div class="line">
          <span id="cdu-line-5-left" class="fmc-block line line-left">
            <span class="white">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span class="s-text"></span>
              <span class="b-text"></span>
            </span>
          </span>
          <span id="cdu-line-5-right" class="fmc-block line line-right"></span>
          <span id="cdu-line-5-center" class="fmc-block line line-center"></span>
        </div>
        <div class="line">
          <span id="cdu-in-out" class="white">
            {page.scratchpad}
          </span>
          <span id="cdu-arrow-vertical" style="opacity: 0;">
            ↓&nbsp;&nbsp;
          </span>
        </div>
      </div>
    );
  }
}
