import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Text from './text';
import { installWidget } from './make';

export interface CheckboxOptions extends Text.TextOptions {
    uncheck?: string;
    check?: string;
    checked?: boolean;
    pad?: number;
    value?: string;
}

export class Checkbox extends Text.Text {
    static default = {
        uncheck: '\u2610', // unchecked
        check: '\u2612', // checked - with X
        pad: 1,
        value: 'on',
    };

    constructor(layer: Layer, opts: CheckboxOptions) {
        super(
            layer,
            (() => {
                opts.action = opts.action || opts.id || 'input';
                opts.tag = opts.tag || 'checkbox';
                return opts as Text.TextOptions;
            })()
        );

        this.attr('uncheck', opts.uncheck || Checkbox.default.uncheck);
        this.attr('check', opts.check || Checkbox.default.check);
        this.attr('pad', opts.pad || Checkbox.default.pad);
        this.attr('value', opts.value || Checkbox.default.value);

        if (opts.checked) {
            this.prop('checked', true);
        }
    }

    keypress(ev: GWU.io.Event): boolean {
        if (!ev.key) return false;

        if (ev.key === 'Enter' || ev.key === ' ') {
            this.toggleProp('checked');
            this._fireEvent('input', this, ev);
            return true;
        }
        if (ev.key === 'Backspace' || ev.key === 'Delete') {
            this.prop('checked', false);
            this._fireEvent('input', this, ev);
            return true;
        }
        return false;
    }

    click(ev: GWU.io.Event): boolean {
        if (!this.contains(ev)) return false;
        this.toggleProp('checked');
        this.layer.setFocusWidget(this);
        this._fireEvent('input', this, ev);
        return true;
    }

    _draw(buffer: GWU.buffer.Buffer): boolean {
        const fg = this._used.fg || 'white';
        const align = this._used.align;

        const state = this.prop('checked') ? 'check' : 'uncheck';
        let v = '' + this._attrs[state];
        buffer.drawText(this.bounds.x, this.bounds.y, v, fg, -1);

        let vOffset = 0;
        if (this._used.valign === 'bottom') {
            vOffset = this.bounds.height - this._lines.length;
        } else if (this._used.valign === 'middle') {
            vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
        }

        const pad = this._attrInt('pad') + 1;
        this._lines.forEach((line, i) => {
            buffer.drawText(
                this.bounds.x + pad,
                this.bounds.y + i + vOffset,
                line,
                fg,
                -1,
                this.bounds.width - pad,
                align
            );
        });

        return true;
    }
}

installWidget('checkbox', (l, opts) => new Checkbox(l, opts));
