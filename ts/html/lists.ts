import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Element from './element';
// import { Document } from './document';

// Style.defaultStyle.add('button', {
//     fg: 'black',
//     bg: 'gray',
// });

export class UnorderedList extends Element.Element {
    static default = {
        bullet: '\u2022', // bullet
    };

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
    }

    // CONTENT

    protected get indentWidth(): number {
        return 2;
    }

    _calcContentWidth(): number {
        return this.indentWidth + super._calcContentWidth();
    }

    _calcContentHeight(): number {
        this._lines = GWU.text.splitIntoLines(
            this._text,
            this.innerWidth - this.indentWidth
        );
        return Math.max(1, this._lines.length);
    }

    get innerLeft(): number {
        return super.innerLeft + this.indentWidth;
    }

    get innerWidth(): number {
        return Math.max(0, super.innerWidth - this.indentWidth);
    }

    // DRAWING

    _drawBullet(
        buffer: GWU.canvas.DataBuffer,
        _index: number,
        left: number,
        top: number,
        fg: GWU.color.ColorBase
    ) {
        const b = this._attrs.bullet || UnorderedList.default.bullet;
        buffer.drawText(left, top, b, fg, -1);
    }

    _drawChildren(buffer: GWU.canvas.DataBuffer) {
        this.children.forEach((c, i) => {
            const fg = c.used('fg') || 'white';
            const top = c.innerTop;
            const left = c.innerLeft - this.indentWidth;

            this._drawBullet(buffer, i, left, top, fg);
            c.draw(buffer);
        });
    }

    // CHILDREN

    _isValidChild(child: Element.Element): boolean {
        return child.tag === 'li';
    }
}

Element.installElement('ul', (tag: string, sheet?: Style.Sheet) => {
    return new UnorderedList(tag, sheet);
});

export class OrderedList extends UnorderedList {
    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
    }

    protected get indentWidth(): number {
        return this.children.length >= 10 ? 4 : 3;
    }

    _drawBullet(
        buffer: GWU.canvas.DataBuffer,
        index: number,
        left: number,
        top: number,
        fg: GWU.color.ColorBase
    ) {
        const b = ('' + (index + 1) + '. ').padStart(this.indentWidth, ' ');
        buffer.drawText(left, top, b, fg, -1);
    }
}

Element.installElement('ol', (tag: string, sheet?: Style.Sheet) => {
    return new OrderedList(tag, sheet);
});
