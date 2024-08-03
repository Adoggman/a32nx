import {
  CDUColor,
  CDUElement,
  CDULine,
  CDULineRight,
  CDUTextSize,
  DisplayablePage,
  makeLines,
} from 'instruments/src/CDU/model/CDUPage';

export class TestPage extends DisplayablePage {
  static readonly pageID: string = 'TEST_PAGE';
  _pageID = TestPage.pageID;

  title = 'TEST';
  pageCurrent?: number;
  pageCount?: number;
  titleLeft = 'LEFT';
  l3Size = CDUTextSize.Large;

  lines = makeLines(
    new CDULine(
      new CDUElement('<TEST1', CDUColor.Green),
      new CDUElement('\xa0TEST2', CDUColor.Inop),
      new CDUElement('TEST3>', CDUColor.White),
      new CDUElement('TEST4\xa0', CDUColor.Yellow),
    ),
    new CDULine(
      new CDUElement('{TEST5', CDUColor.Cyan),
      new CDUElement('\xa0TEST6', CDUColor.Red),
      new CDUElement('TEST7}', CDUColor.Amber),
      new CDUElement('TEST8\xa0', CDUColor.Magenta),
    ),
    new CDULine(
      new CDUElement('TEST9', CDUColor.Cyan, CDUTextSize.Large),
      new CDUElement('TEST10', CDUColor.Red, CDUTextSize.Large),
      new CDUElement('TEST11', CDUColor.Amber, CDUTextSize.Large),
      new CDUElement('TEST12', CDUColor.Magenta, CDUTextSize.Large),
    ),
    new CDULine(
      new CDUElement('TEST 13', undefined, CDUTextSize.Small),
      new CDUElement('TEST 14', undefined, CDUTextSize.Small),
      new CDUElement('TEST 15', undefined, CDUTextSize.Small),
      new CDUElement('TEST 16', undefined, CDUTextSize.Small),
    ),
    new CDULine(new CDUElement('TEST 17'), new CDUElement('TEST 18')),
    new CDULineRight(new CDUElement('TEST 19'), new CDUElement('TEST 20')),
  );

  onDown() {
    this.arrows.down = !this.arrows.down;
    this.refresh();
  }

  onUp() {
    this.arrows.up = !this.arrows.up;
    this.refresh();
  }

  onLeft() {
    this.arrows.left = !this.arrows.left;
    this.refresh();
  }

  onRight() {
    this.arrows.right = !this.arrows.right;
    this.refresh();
  }

  onRSK1() {
    this.pageCurrent = this.pageCurrent ? 0 : 1;
    this.refresh();
  }

  onRSK2() {
    this.pageCount = this.pageCount ? 0 : 2;
    this.refresh();
  }

  onLSK3() {
    const newSize = this.l3Size === CDUTextSize.Small ? CDUTextSize.Large : CDUTextSize.Small;
    this.l3Size = newSize;
    this.lines[2] = new CDULine(
      new CDUElement('TEST9', CDUColor.Cyan, newSize),
      new CDUElement('TEST10', CDUColor.Red, newSize),
      new CDUElement('TEST11', CDUColor.Amber, newSize),
      new CDUElement('TEST12', CDUColor.Magenta, newSize),
    );
    this.refresh();
  }

  defaultScratchpad = 'TEST SCREEN PLS IGNORE';
}
