import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Element from './element';
import { Document } from './document';

export class CheckBox extends Element.Element {
    static default = {
        uncheck: '\u2610', // unchecked
        check: '\u2612', // checked - with X
        padCheck: '1',
        value: 'on',
    };

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
        this.on('keypress', this.keypress.bind(this));
        this.on('click', this.click.bind(this));
        this.prop('tabindex', true);
        this.prop('checked', false);

        Object.entries(CheckBox.default).forEach(([key, value]) =>
            this.attr(key, value)
        );
    }

    // reset() {
    //     this.prop('value', this._attrString('value'));
    // }

    // ATTRIBUTES

    protected _setAttr(name: string, value: string) {
        this._attrs[name] = value;
        if (name === 'value') {
            this._setProp('value', value);
        }
    }

    // PROPERTIES

    // CONTENT

    _calcContentWidth(): number {
        return 2 + super._calcContentWidth();
    }

    _calcContentHeight(): number {
        this._lines = GWU.text.splitIntoLines(this._text, this.innerWidth - 2);
        return this._lines.length;
    }

    // DRAWING

    _drawContent(buffer: GWU.canvas.DataBuffer) {
        const fg = this.used('fg') || 'white';
        const top = this.innerTop;
        const width = this.innerWidth;
        const left = this.innerLeft;
        const align = this.used('align');

        const state = this.prop('checked') ? 'check' : 'uncheck';
        let v = this._attrs[state];
        buffer.drawText(left, top, v, fg, -1);

        this._lines.forEach((line, i) => {
            buffer.drawText(left + 2, top + i, line, fg, -1, width - 2, align);
        });
    }

    // EVENTS

    onblur(doc: Document) {
        super.onblur(doc);
        doc._fireEvent(this, 'change');
    }

    keypress(
        document: Document,
        _element: Element.Element,
        e?: GWU.io.Event
    ): boolean {
        if (!e) return false;

        if (e.key === 'Enter' || e.key === ' ') {
            this.toggleProp('checked');
            document._fireEvent(this, 'input', e);
            return true;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            this.prop('checked', false);
            document._fireEvent(this, 'input', e);
            return true;
        }
        return false;
    }

    click(
        document: Document,
        _element: Element.Element,
        e?: GWU.io.Event
    ): boolean {
        if (!e) return false;
        if (!this.contains(e)) return false;

        this.toggleProp('checked');
        document.setActiveElement(this);
        return true;
    }
}

Element.installElement('checkbox', (tag: string, sheet?: Style.Sheet) => {
    return new CheckBox(tag, sheet);
});
