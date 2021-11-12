import * as GWU from 'gw-utils';
import { Layer } from '../ui/layer';
import * as Text from './text';
import { installWidget } from './make';
import * as Widget from './widget';

export interface ButtonOptions extends Omit<Text.TextOptions, 'text'> {
    text?: string; // don't have to have text
    id: string; // have to have id
}

export class Button extends Text.Text {
    constructor(layer: Layer, opts: ButtonOptions) {
        super(
            layer,
            (() => {
                opts.text = opts.text || '';
                opts.action = opts.action || opts.id;
                opts.tag = opts.tag || 'button';
                if (!opts.text && !opts.width)
                    throw new Error('Buttons must have text or width.');
                return opts as Text.TextOptions;
            })()
        );
    }

    keypress(ev: GWU.io.Event): boolean {
        if (!ev.key) return false;

        if (this._fireEvent('keypress', this, ev)) return true;

        if (ev.key === 'Enter') {
            const action = this._attrStr('action');
            if (action && action.length) this._bubbleEvent(action, this);
            return true;
        }

        return false;
    }

    click(ev: GWU.io.Event): boolean {
        if (!this.contains(ev)) return false;

        if (this._fireEvent('click', this, ev)) return true;

        const action = this._attrStr('action');
        if (action && action.length) return this._bubbleEvent(action, this);

        return false;
    }
}

installWidget('button', (l, opts) => new Button(l, opts));

// extend Layer

export type AddButtonOptions = Omit<ButtonOptions, 'text'> &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../ui/layer' {
    interface Layer {
        button(text: string, opts?: AddButtonOptions): Button;
    }
}
Layer.prototype.button = function (
    text: string,
    opts: AddButtonOptions
): Button {
    const options: ButtonOptions = Object.assign({}, this._opts, opts, {
        text,
    });
    const widget = new Button(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    this.pos(widget.bounds.x, widget.bounds.bottom);
    return widget;
};
