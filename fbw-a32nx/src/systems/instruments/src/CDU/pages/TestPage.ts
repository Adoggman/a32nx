import { CDUColor, CDUElement, CDULine, DisplayablePage, makeLines } from 'instruments/src/CDU/model/CDUPage';

export class TestPage extends DisplayablePage {
  static readonly pageID: string = 'TEST_PAGE';
  _pageID = TestPage.pageID;

  title = 'TEST';
  pageCurrent?: number;
  pageCount?: number;
  titleLeft = 'LEFT';

  lines = makeLines(
    new CDULine(
      new CDUElement('<TEST1', CDUColor.Green),
      new CDUElement('TEST2>', CDUColor.White),
      new CDUElement('\xa0TEST3', CDUColor.Inop),
      new CDUElement('TEST4\xa0', CDUColor.Yellow),
    ),
    new CDULine(
      new CDUElement('{TEST5', CDUColor.Cyan),
      new CDUElement('TEST6}', CDUColor.Amber),
      new CDUElement('\xa0TEST7', CDUColor.Red),
      new CDUElement('TEST8\xa0', CDUColor.Magenta),
    ),
  );
  scratchpad = 'TEST SCREEN PLEASE IGNORE';
}
