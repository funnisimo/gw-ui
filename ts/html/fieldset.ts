import * as GWU from 'gw-utils';
import { PropType } from './types';
import * as Style from './style';
import * as Element from './element';
import * as Parser from './parser';

Style.defaultStyle.add('fieldset', {
    margin: 1,
    border: 'dark_gray',
    fg: 'white',
    bg: -1,
    padding: 1,
});

export class FieldSet extends Element.Element {
    static default: Record<string, PropType> = {};

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);

        Object.entries(FieldSet.default).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                this.prop(key, value);
            } else if (value !== undefined) {
                this.attr(key, '' + value);
            }
        });
    }

    // ATTRIBUTES

    // PROPERTIES

    // CONTENT

    // DRAWING

    _drawBorder(buffer: GWU.canvas.DataBuffer) {
        super._drawBorder(buffer);

        const legend = this.attr('legend');
        if (!legend || legend.length == 0) return;

        const used = this._usedStyle;

        const fg = used.fg || 'white';
        const top = this.innerTop - (used.padTop || 0) - 1; // -1 for border
        const width = this.innerWidth;
        const left = this.innerLeft;
        const align = used.align;
        buffer.drawText(left, top, legend, fg, -1, width, align);
    }

    // EVENTS
}

Parser.installElement('fieldset', (tag: string, sheet?: Style.Sheet) => {
    return new FieldSet(tag, sheet);
});
