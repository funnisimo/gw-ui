import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Element from './element';
import * as Parser from './parser';
import { Document } from './document';

// Style.defaultStyle.add('button', {
//     fg: 'black',
//     bg: 'gray',
// });

export type PrefixType = 'none' | 'letter' | 'number' | 'bullet';

export class DataList extends Element.Element {
    _data: any[];

    static default = {
        bullet: '\u2022', // bullet
        empty: '-',
        prefix: 'none' as PrefixType,
        width: 10,
    };

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
        this._data = [];
    }

    // CONTENT

    protected _setData(doc: Document, v: any) {
        if (!Array.isArray(v)) {
            throw new Error(
                '<datalist> only uses Array values for data field.'
            );
        }
        super._setData(doc, v);
        this.dirty = true;

        if (this.children.length) {
            const oldChildren = doc.select(
                this.children.filter((c) => c.tag === 'data')
            );
            oldChildren.detach();
        }

        if (!this._data) return;

        this._data.forEach((item: any) => {
            doc.create('<data>').text(item).appendTo(this);
        });
    }

    protected get indentWidth(): number {
        return 0;
        // const prefix = this.attr('prefix') || DataList.default.prefix;
        // if (!prefix) return 0;

        // if (prefix.includes('#')) {
        //     return prefix.length - 1 + this._data.length >= 10 ? 2 : 1;
        // }
        // return prefix.length;
    }

    _calcContentWidth(): number {
        return DataList.default.width; // no legend or data, so use default
    }

    _calcContentHeight(): number {
        return 1; // no legend or data so just an empty cell
    }

    _calcChildHeight(): number {
        if (!this._data || this._data.length === 0) {
            return super._calcChildHeight() + 1; // legend (if present) + empty cell
        }
        return super._calcChildHeight();
    }

    get innerLeft(): number {
        return super.innerLeft + this.indentWidth;
    }

    get innerWidth(): number {
        return Math.max(0, super.innerWidth - this.indentWidth);
    }

    // DRAWING

    _drawContent(buffer: GWU.canvas.DataBuffer) {
        // draw legend and data (if any)
        this._drawChildren(buffer);

        if (!this._data || this._data.length == 0) {
            // empty cell is necessary
            const fg = this.used('fg') || 'white';
            const top = this.innerBottom - 1;
            const left = this.innerLeft + this.indentWidth;
            const width = this.innerWidth - this.indentWidth;
            const align = this.used('align');
            const empty = this.attr('empty') || DataList.default.empty;
            buffer.drawText(left, top, empty, fg, -1, width, align);
        }
    }

    // CHILDREN

    _isValidChild(child: Element.Element): boolean {
        return ['data', 'legend'].includes(child.tag);
    }
}

Parser.installElement('datalist', (tag: string, sheet?: Style.Sheet) => {
    return new DataList(tag, sheet);
});
