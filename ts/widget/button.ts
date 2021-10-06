import * as GWU from 'gw-utils';
import * as Widget from './widget';

export type ActionFn = (
    e: GWU.io.Event,
    button: Button
) => void | Promise<void>;

export interface ButtonOptions extends Widget.WidgetOptions {
    actionFn?: ActionFn;
}

export class Button extends Widget.Widget {
    actionFn!: ActionFn | null;

    constructor(id: string, opts?: ButtonOptions) {
        super(id, opts);
    }

    init(opts: ButtonOptions) {
        this.actionFn = null;
        if (!opts.text)
            throw new Error(
                'Must have text value in config for Button widget - ' + this.id
            );

        opts.tabStop = opts.tabStop ?? true; // Can receive input (Enter)
        super.init(opts);
        if (opts.actionFn) this.actionFn = opts.actionFn;
    }

    click(ev: GWU.io.Event): boolean | Promise<boolean> {
        if (!this.contains(ev)) return false;

        let r: void | Promise<void>;
        if (this.actionFn) {
            r = this.actionFn(ev, this);
        } else {
            r = this.parent.fireAction(this.action, this);
        }

        if (r) return r.then(() => true);
        return true;
    }

    keypress(ev: GWU.io.Event): boolean | Promise<boolean> {
        if (!ev.key) return false;

        if (ev.key === 'Enter') {
            const r = this.parent.fireAction(this.action, this);
            if (r) return r.then(() => true);
            return true;
        }
        return false;
    }
}
