import { DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { CDUDisplay } from 'instruments/src/CDU/CDU';
import { ICDUPage } from 'instruments/src/CDU/model/CDUPage';
import { CDUHeader, CDUInfo, Labels, Line, Scratchpad } from 'instruments/src/CDU/PageComponents';

export interface CDUPageProps {
  page: ICDUPage;
  scratchpad?: string;
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
    return (
      <>
        <div class="s-text" id="cdu-title-left"></div>
        <CDUHeader page={page} />
        <CDUInfo page={page} />
        {page.lines.map((line, index) => (
          <>
            <Labels line={line} lineIndex={index} />
            <Line line={line} lineIndex={index} />
          </>
        ))}
        <Scratchpad message={this.props.scratchpad} />
      </>
    );
  }
}
