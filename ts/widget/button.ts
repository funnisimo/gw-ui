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

        opts.tabStop = GWU.first(opts.tabStop, true); // Can receive input (Enter)
        super.init(opts);
    }

    async click(
        ev: GWU.io.Event,
        dialog: Widget.WidgetRunner
    ): Promise<boolean> {
        if (!this.contains(ev)) return false;

        await dialog.fireAction(this.action, this);

        return true;
    }

    async keypress(
        ev: GWU.io.Event,
        dialog: Widget.WidgetRunner
    ): Promise<boolean> {
        if (!ev.key) return false;

        if (ev.key === 'Enter') {
            await dialog.fireAction(this.action, this);
            return true;
        }
        return false;
    }
}
