import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Text from './text';
import { installWidget } from './make';

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
                return opts as Text.TextOptions;
            })()
        );
    }

    keypress(ev: GWU.io.Event): boolean {
        if (!ev.key) return false;

        if (ev.key === 'Enter') {
            const action = this._attrStr('action');
            if (action && action.length) this._bubbleEvent(action, this);
            return true;
        }
        return false;
    }

    click(ev: GWU.io.Event): boolean {
        if (!this.contains(ev)) return false;

        const action = this._attrStr('action');
        if (action && action.length) this._bubbleEvent(action, this);
        return true;
    }
}

installWidget('button', (l, opts) => new Button(l, opts));
