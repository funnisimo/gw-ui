import * as GWU from 'gw-utils';
import { PropType } from './types';
import * as Style from './style';
import * as Element from './element';
import { Document } from './document';

export class Input extends Element.Element {
    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
        this.on('keypress', this.keypress.bind(this));
        this.prop('tabindex', true);
    }

    // ATTRIBUTES

    protected _setAttr(name: string, value: string) {
        this._attrs[name] = value;
        if (name === 'value') {
            this._setProp('value', value);
        }
    }

    protected _setProp(name: string, value: PropType) {
        this._props[name] = value;
    }

    // CONTENT

    _calcContentWidth(): number {
        const size = this._attrs.size || '';
        if (size.length) return Number.parseInt(size);
        return 10; // default somewhere else?
    }

    _calcContentHeight(): number {
        return 1;
    }

    _updateContentHeight() {}

    // DRAWING

    _drawContent(buffer: GWU.canvas.DataBuffer) {
        const fg = this.used('fg') || 'white';
        const top = this.innerTop;
        const width = this.innerWidth;
        const left = this.innerLeft;
        const align = this.used('align');
        buffer.drawText(
            left,
            top,
            this.prop('value') as string,
            fg,
            -1,
            width,
            align
        );
    }

    // EVENTS

    keypress(
        document: Document,
        _element: Element.Element,
        e?: GWU.io.Event
    ): boolean {
        if (!e) return false;

        if (e.key === 'Enter') {
            document.nextTabStop();
            return true;
        }
        if (e.key === 'Escape') {
            this._setProp('value', '');
            return true;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const v = this._props.value ? '' + this._props.value : '';
            this._setProp('value', v.substring(0, v.length - 1));
            return true;
        }
        if (e.key.length > 1) {
            return false;
        }
        let v = this._props.value ? this._props.value : '';
        this._setProp('value', v + e.key);
        return true;
    }
}

Element.installElement('input', (tag: string, sheet?: Style.Sheet) => {
    return new Input(tag, sheet);
});
