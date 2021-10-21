import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Element from './element';
import * as Parser from './parser';
// import { Document } from './document';

// Style.defaultStyle.add('button', {
//     fg: 'black',
//     bg: 'gray',
// });

export class DataList extends Element.Element {
    _data: any[];

    static default = {
        bullet: '\u2022', // bullet
        empty: '-',
        prefix: null,
        wrap: false,
        width: 10,
    };

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
        this._data = [];
    }

    // CONTENT

    _setData(v: any) {
        if (!Array.isArray(v)) {
            throw new Error(
                '<datalist> only uses Array values for data field.'
            );
        }
        super._setData(v);
        this.dirty = true;
    }

    protected get indentWidth(): number {
        const prefix = this.attr('prefix') || DataList.default.prefix;
        if (!prefix) return 0;

        if (prefix.includes('#')) {
            return prefix.length - 1 + this._data.length >= 10 ? 2 : 1;
        }
        return prefix.length;
    }

    _calcContentWidth(): number {
        const width = this._data.reduce((len, d) => {
            const dlen = ('' + d).length; // calculate formatted width
            return Math.max(dlen, len);
        }, 0);
        return width ? this.indentWidth + width : DataList.default.width; //
    }

    _calcContentHeight(): number {
        return Math.max(1, this._data.length);
    }

    get innerLeft(): number {
        return super.innerLeft + this.indentWidth;
    }

    get innerWidth(): number {
        return Math.max(0, super.innerWidth - this.indentWidth);
    }

    // DRAWING

    _drawContent(buffer: GWU.canvas.DataBuffer) {
        const fg = this.used('fg') || 'white';
        const top = this.innerTop;
        const left = this.innerLeft + this.indentWidth;
        const width = this.innerWidth - this.indentWidth;
        const align = this.used('align');
        const empty = this.attr('empty') || DataList.default.empty;

        if (this._data.length == 0) {
            buffer.drawText(left, top, empty, fg, -1, width, align);
        }

        this._data.forEach((d, i) => {
            if (!d) {
                buffer.drawText(left, top + i, empty, fg, -1, width, align);
            } else {
                buffer.drawText(left, top + i, d, fg, -1, width, align);
            }
            // this._drawBullet(buffer, i, left, top, fg);
        });
    }

    // CHILDREN

    _isValidChild(_child: Element.Element): boolean {
        return false; // no children
    }
}

Parser.installElement('datalist', (tag: string, sheet?: Style.Sheet) => {
    return new DataList(tag, sheet);
});
