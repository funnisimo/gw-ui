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

        Object.entries(UnorderedList.default).forEach(([key, value]) =>
            this.attr(key, value)
        );
    }

    // CONTENT

    _calcContentWidth(): number {
        return 2 + super._calcContentWidth();
    }

    _calcContentHeight(): number {
        this._lines = GWU.text.splitIntoLines(this._text, this.innerWidth - 2);
        return Math.max(1, this._lines.length);
    }

    get innerLeft(): number {
        return super.innerLeft + 2;
    }

    get innerWidth(): number {
        return Math.max(0, super.innerWidth - 2);
    }

    // DRAWING

    _drawChildren(buffer: GWU.canvas.DataBuffer) {
        let v = this._attrs.bullet;

        this.children.forEach((c) => {
            const fg = c.used('fg') || 'white';
            const top = c.innerTop;
            const left = c.innerLeft - 2;

            buffer.drawText(left, top, v, fg, -1);
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

export class OrderedList extends Element.Element {}

Element.installElement('ol', (tag: string, sheet?: Style.Sheet) => {
    return new OrderedList(tag, sheet);
});
