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
        this.prop('value', '');
    }

    // reset() {
    //     this.prop('value', this._attrString('value'));
    // }

    // ATTRIBUTES

    protected _setAttr(name: string, value: string) {
        super._setAttr(name, value);
        if (name === 'value') {
            this._setProp('value', value);
        }
        super._setProp('valid', this.isValid());
    }

    protected _setProp(name: string, value: PropType) {
        if (name === 'value') {
            value = '' + value;
            const maxLength = this._attrInt('maxLength', 0);
            if (maxLength && value.length > maxLength) {
                value = value.substring(0, maxLength);
            }
            super._setProp('empty', value.length == 0);
            this._props.value = value;
            this.dirty = true;
        } else {
            super._setProp(name, value);
        }

        super._setProp('valid', this.isValid());
    }

    get isTypeNumber(): boolean {
        return this._attrs.type === 'number';
    }

    // PROPERTIES

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

    isValid(): boolean {
        const v = this._propString('value');
        if (this.isTypeNumber) {
            const val = this._propInt('value');
            const min = this._attrInt('min', Number.MIN_SAFE_INTEGER);
            if (val < min) return false;
            const max = this._attrInt('max', Number.MAX_SAFE_INTEGER);
            if (val > max) return false;
            return v.length > 0;
        }
        const requiredLen = this._propInt('required', 0);
        // console.log(
        //     'required',
        //     this._attrs.required,
        //     requiredLen,
        //     v,
        //     v.length,
        //     this._attrInt('minLength', requiredLen)
        // );
        return (
            v.length >= this._attrInt('minLength', requiredLen) &&
            v.length <= this._attrInt('maxLength', Number.MAX_SAFE_INTEGER)
        );
    }

    // DRAWING

    _drawContent(buffer: GWU.canvas.DataBuffer) {
        const fg = this.used('fg') || 'white';
        const top = this.innerTop;
        const width = this.innerWidth;
        const left = this.innerLeft;
        const align = this.used('align');

        let v = this._propString('value');
        if (v.length == 0) {
            v = this._attrString('placeholder');
        }

        buffer.drawText(left, top, v, fg, -1, width, align);
    }

    // EVENTS

    onblur(doc: Document) {
        super.onblur(doc);
        if (this.val() !== this.attr('value')) {
            doc._fireEvent(this, 'change');
        }
    }

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
            document._fireEvent(this, 'input', e);
            return true;
        }
        if (e.key === 'Backspace' || e.key === 'Delete') {
            const v = this._propString('value');
            this._setProp('value', v.substring(0, v.length - 1));
            document._fireEvent(this, 'input', e);
            return true;
        }
        if (e.key.length > 1) {
            return false;
        }

        const textEntryBounds = this.isTypeNumber ? ['0', '9'] : [' ', '~'];

        // eat/use all other keys
        if (e.key >= textEntryBounds[0] && e.key <= textEntryBounds[1]) {
            // allow only permitted input
            const v = this._propString('value');
            this._setProp('value', v + e.key);
            document._fireEvent(this, 'input', e);
        }
        return true;
    }
}

Element.installElement('input', (tag: string, sheet?: Style.Sheet) => {
    return new Input(tag, sheet);
});
