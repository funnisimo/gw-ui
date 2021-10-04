import * as GWU from 'gw-utils';
import * as Widget from './widget';

export interface ButtonOptions extends Widget.WidgetOptions {}

export class Button extends Widget.Widget {
    constructor(id: string, opts?: ButtonOptions) {
        super(id, opts);
    }

    init(opts: ButtonOptions) {
        if (!opts.text)
            throw new Error(
                'Must have text value in config for Button widget - ' + this.id
            );

        opts.tabStop = opts.tabStop ?? true; // Can receive input (Enter)
        super.init(opts);
    }

    click(_ev: GWU.io.Event): boolean | Promise<boolean> {
        // TODO - hit test?  active test?
        const r = this.parent.fireAction(this.action, this);
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
