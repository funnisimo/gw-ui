import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Text from './text';
import { installWidget } from './make';
import * as Widget from './widget';
import { PropType } from '../types';

export interface InputOptions extends Omit<Text.TextOptions, 'text'> {
    text?: string; // don't have to have text
    id: string; // have to have id
    placeholder?: string;

    minLength?: number;
    maxLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;

    required?: boolean;
    disabled?: boolean;
}

export class Input extends Text.Text {
    placeholder = '';

    default: string;
    minLength = 0;
    maxLength = 0;

    numbersOnly = false;
    min = 0;
    max = 0;

    constructor(layer: Layer, opts: InputOptions) {
        super(
            layer,
            (() => {
                opts.text = opts.text || '';
                opts.tag = opts.tag || 'input';
                opts.action = opts.action || opts.id;
                opts.width =
                    opts.width ||
                    opts.maxLength ||
                    Math.max(opts.minLength || 0, 10);
                return opts as Text.TextOptions;
            })()
        );

        this.default = this._text;
        if (opts.placeholder) this.placeholder = opts.placeholder;
        if (opts.numbersOnly) {
            this.numbersOnly = true;
            this.min = opts.min || 0;
            this.max = opts.max || 0;
        } else {
            this.minLength = opts.minLength || 0;
            this.maxLength = opts.maxLength || 0;
        }
        if (opts.required) {
            this.attr('required', true);
            this.prop('required', true);
        }
        if (opts.disabled) {
            this.attr('disabled', true);
            this.prop('disabled', true);
        }

        this.prop('valid', this.isValid()); // redo b/c rules are now set
        this.on('blur', () => this._fireEvent('change', this));
    }

    reset() {
        this.text(this.default);
    }

    _setProp(name: string, v: PropType): void {
        super._setProp(name, v);
        this._props.valid = this.isValid();
    }

    isValid(): boolean {
        const t = this._text || '';
        if (this.numbersOnly) {
            const val = Number.parseInt(t);
            if (this.min !== undefined && val < this.min) return false;
            if (this.max !== undefined && val > this.max) return false;
            return val > 0;
        }
        const minLength = Math.max(
            this.minLength,
            this.prop('required') ? 1 : 0
        );
        return (
            t.length >= minLength &&
            (!this.maxLength || t.length <= this.maxLength)
        );
    }

    keypress(ev: GWU.io.Event): boolean {
        if (!ev.key) return false;

        const textEntryBounds = this.numbersOnly ? ['0', '9'] : [' ', '~'];

        if (ev.key === 'Enter' && this.isValid()) {
            const action = this._attrStr('action');
            if (action && action.length) {
                this._fireEvent(action, this);
            } else {
                this.layer.nextTabStop();
            }
            return true;
        }
        if (ev.key == 'Delete' || ev.key == 'Backspace') {
            if (this._text.length) {
                this.text(
                    GWU.text.spliceRaw(this._text, this._text.length - 1, 1)
                );
                this._fireEvent('input', this);
            }
            return true;
        } else if (ev.key.length > 1) {
            // ignore other special keys...
            return false;
        }

        // eat/use all other keys
        if (ev.key >= textEntryBounds[0] && ev.key <= textEntryBounds[1]) {
            // allow only permitted input
            if (!this.maxLength || this._text.length < this.maxLength) {
                this.text(this._text + ev.key);
                this._fireEvent('input', this);
            }
        }
        return true;
    }

    text(): string;
    text(v: string): this;
    text(v?: string): this | string {
        if (v === undefined) return this._text;
        super.text(v);
        this.prop('empty', this._text.length === 0);
        this.prop('valid', this.isValid());
        return this;
    }

    _draw(buffer: GWU.buffer.Buffer, _force = false): boolean {
        this._drawFill(buffer);

        let vOffset = 0;
        if (this._used.valign === 'bottom') {
            vOffset = this.bounds.height - this._lines.length;
        } else if (this._used.valign === 'middle') {
            vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
        }

        let show = this._text;
        if (this._text.length > this.bounds.width) {
            show = this._text.slice(this._text.length - this.bounds.width);
        }

        buffer.drawText(
            this.bounds.x,
            this.bounds.y + vOffset,
            show,
            this._used.fg,
            -1,
            this.bounds.width,
            this._used.align
        );
        return true;
    }
}

installWidget('input', (l, opts) => new Input(l, opts));

// extend Layer

export type AddInputOptions = InputOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        input(opts: AddInputOptions): Input;
    }
}
Layer.prototype.input = function (opts: AddInputOptions): Input {
    const options = Object.assign({}, this._opts, opts);
    const list = new Input(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
