import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { UICore } from '../types';

export interface DialogOptions extends Widget.WidgetOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;

    title?: string;
    titleFg?: string;

    bg?: GWU.color.ColorBase;
    borderBg?: GWU.color.ColorBase;
}

export type EventCallback = (
    ev: GWU.io.Event,
    widget: Widget.Widget | null, // null if it is the dialog
    dialog: Dialog
) => void | Promise<void>;
export type EventHandlers = Record<string, EventCallback>;

export type ActionCallback = (
    action: string,
    widget: Widget.Widget | null, // null if it is the dialog
    dialog: Dialog
) => void | Promise<void>;
export type ActionHandlers = Record<string, ActionCallback>;

export class Dialog implements Widget.WidgetContainer {
    id: string;
    bounds: GWU.xy.Bounds;

    title = '';
    titleFg: GWU.color.ColorBase = 0xfff;

    bg: GWU.color.ColorBase = 0x999;
    borderBg: GWU.color.ColorBase = 0x999;

    widgets: Widget.Widget[] = [];
    actionHandlers: ActionHandlers = {};
    keypressHandlers: EventHandlers = {};
    clickHandlers: EventHandlers = {};

    activeWidget: Widget.Widget | null = null;
    result: any = null;
    done = false;

    timers: Record<string, number> = {};

    constructor(id: string, opts?: DialogOptions) {
        this.id = id;
        this.bounds = new GWU.xy.Bounds(-1, -1, 0, 0);
        if (opts) this.init(opts);
    }

    init(opts: DialogOptions) {
        if (opts.x !== undefined) this.bounds.x = opts.x;
        if (opts.y !== undefined) this.bounds.y = opts.y;
        if (opts.height !== undefined) this.bounds.height = opts.height;
        if (opts.width !== undefined) this.bounds.width = opts.width;
        if (opts.title) this.title = opts.title;
        if (opts.titleFg) this.titleFg = opts.titleFg;
        if (opts.bg) {
            this.bg = opts.bg;
            this.borderBg = opts.bg;
        }
        if (opts.borderBg) {
            this.borderBg = opts.borderBg;
        }
    }

    setTimeout(action: string, time: number) {
        this.timers[action] = time;
    }

    clearTimeout(action: string) {
        delete this.timers[action];
    }

    addWidget<T extends Widget.Widget>(x: number, y: number, widget: T): T {
        widget.parent = this;

        if (x >= 0) {
            widget.bounds.x = x;
            this.bounds.width = Math.max(
                this.bounds.width,
                widget.bounds.width + x + 1
            );
        } else {
            this.bounds.width = Math.max(
                this.bounds.width,
                widget.bounds.width - x
            );
            widget.bounds.x = this.bounds.width + x;
        }
        if (y >= 0) {
            widget.bounds.y = y;
            this.bounds.height = Math.max(
                this.bounds.height,
                widget.bounds.height + y + 1
            );
        } else {
            this.bounds.height = Math.max(
                this.bounds.height,
                widget.bounds.height - y
            );
            widget.bounds.y = this.bounds.height + y;
        }

        this.widgets.push(widget);
        return widget;
    }

    fireAction(
        action: string,
        widget: Widget.Widget | null
    ): void | Promise<void> {
        const handler = this.actionHandlers[action];
        if (handler) {
            return handler(action, widget, this);
        }
    }

    setActionHandlers(map: ActionHandlers) {
        this.actionHandlers = map;
    }

    setKeyHandlers(map: EventHandlers) {
        this.keypressHandlers = map;
    }

    setClickHandlers(map: EventHandlers) {
        this.clickHandlers = map;
    }

    async show(ui: UICore): Promise<any> {
        this.done = false;

        this.widgets.forEach((w) => w.reset());

        if (this.bounds.x < 0) {
            this.bounds.x = Math.floor(
                (ui.buffer.width - this.bounds.width) / 2
            );
        }
        if (this.bounds.y < 0) {
            this.bounds.y = Math.floor(
                (ui.buffer.height - this.bounds.height) / 2
            );
        }

        // first tabStop is the starting active Widget
        this.activeWidget = this.widgets.find((w) => w.tabStop) || null;

        // start dialog
        const buffer = ui.startDialog();

        // run input loop
        await ui.loop.run(
            {
                keypress: this.keypress.bind(this),
                mousemove: this.mousemove.bind(this),
                click: this.click.bind(this),
                tick: this.tick.bind(this),
                draw: () => {
                    this.draw(buffer);
                },
            },
            100
        );

        // stop dialog
        ui.finishDialog();

        return this.result;
    }

    close(returnValue: any) {
        this.result = returnValue;
        this.done = true;
    }

    widgetAt(x: number, y: number): Widget.Widget | null {
        x -= this.bounds.x;
        y -= this.bounds.y;
        return this.widgets.find((w) => w.contains(x, y)) || null;
    }

    nextTabstop() {
        if (!this.activeWidget) {
            this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
            return !!this.activeWidget;
        }

        let current = this.widgets.indexOf(this.activeWidget);

        for (let i = current + 1; i < this.widgets.length; ++i) {
            const w = this.widgets[i];
            if (w.tabStop) {
                this.activeWidget = w;
                return true;
            }
        }

        for (let i = 0; i < current; ++i) {
            const w = this.widgets[i];
            if (w.tabStop) {
                this.activeWidget = w;
                return true;
            }
        }

        return false;
    }

    prevTabstop() {
        if (!this.activeWidget) {
            this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
            return !!this.activeWidget;
        }

        let current = this.widgets.indexOf(this.activeWidget);

        for (let i = current - 1; i >= 0; --i) {
            const w = this.widgets[i];
            if (w.tabStop) {
                this.activeWidget = w;
                return true;
            }
        }

        for (let i = this.widgets.length - 1; i > current; --i) {
            const w = this.widgets[i];
            if (w.tabStop) {
                this.activeWidget = w;
                return true;
            }
        }

        return false;
    }

    tick(e: GWU.io.Event): boolean | Promise<boolean> {
        const dt = e.dt;
        let promises = [];

        Object.entries(this.timers).forEach(([action, time]) => {
            time -= dt;
            if (time <= 0) {
                delete this.timers[action];
                const r = this.fireAction(action, null);
                if (r && r.then) {
                    promises.push(r);
                }
            } else {
                this.timers[action] = time;
            }
        });

        for (let w of this.widgets) {
            const r = w.tick(e);
            if (r && r.then) {
                promises.push(r);
            }
        }
        if (promises.length) {
            return Promise.all(promises).then(() => this.done);
        }
        return this.done;
    }

    // TODO - async - to allow animations or events on mouseover?
    mousemove(e: GWU.io.Event): boolean {
        const x = e.x - this.bounds.x;
        const y = e.y - this.bounds.y;
        this.activeWidget = null;
        this.widgets.forEach((w) => {
            w.mousemove(x, y);
            if (w.active) {
                this.activeWidget = w;
            }
        });
        return this.done;
    }

    click(e: GWU.io.Event): boolean | Promise<boolean> {
        this.mousemove(e); // make sure activeWidget is set correctly

        if (this.activeWidget) {
            const fn = this.clickHandlers[this.activeWidget.id];
            if (fn) {
                const r = fn(e, this.activeWidget, this);
                if (r && r.then) {
                    return r.then(() => this.done);
                }
                return this.done;
            }

            const r = this.activeWidget.click(e);
            if (typeof r !== 'boolean') {
                return r.then(() => this.done);
            }
        }
        return this.done;
    }

    keypress(e: GWU.io.Event): boolean | Promise<boolean> {
        if (!e.key) return false;

        const fn =
            this.keypressHandlers[e.key] ||
            (e.code && this.keypressHandlers[e.code]) ||
            this.keypressHandlers.keypress;
        if (fn) {
            const r = fn(e, this.activeWidget, this);
            if (r && r.then) {
                return r.then(() => this.done);
            }
            return this.done;
        }
        if (this.activeWidget) {
            const r = this.activeWidget.keypress(e);
            if (typeof r !== 'boolean') {
                return r.then(() => this.done);
            }

            if (e.key === 'Tab') {
                // Next widget
                this.nextTabstop();
            } else if (e.key === 'TAB') {
                // Prev Widget
                this.prevTabstop();
            }
        }
        return this.done;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        // Draw dialog
        if (this.borderBg) {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height,
                ' ',
                this.borderBg,
                this.borderBg
            );
            buffer.fillRect(
                this.bounds.x + 1,
                this.bounds.y + 1,
                this.bounds.width - 2,
                this.bounds.height - 2,
                ' ',
                this.bg,
                this.bg
            );
        } else {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height,
                ' ',
                this.bg,
                this.bg
            );
        }

        if (this.title) {
            const x =
                this.bounds.x +
                Math.floor(
                    (this.bounds.width - GWU.text.length(this.title)) / 2
                );
            buffer.drawText(x, this.bounds.y, this.title, this.titleFg);
        }

        this.widgets.forEach((w) =>
            w.draw(buffer, this.bounds.x, this.bounds.y)
        );
    }
}
