import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { UICore } from '../types';

export interface DialogOptions extends Widget.WidgetOptions {
    id?: string;

    x?: number;
    y?: number;
    width?: number;
    height?: number;

    title?: string;
    titleFg?: string;

    bg?: GWU.color.ColorBase;
    borderBg?: GWU.color.ColorBase;

    widgets?: Widget.Widget[];
}

export type EventCallback = (
    ev: GWU.io.Event | string,
    dialog: Dialog,
    widget: Widget.Widget | null // null if it is the dialog
) => any | Promise<any>; // return a TRUTHY value to stop propagation of event
export type EventHandlers = Record<string, EventCallback>;

export class Dialog implements Widget.WidgetRunner {
    ui: UICore;
    id: string;
    bounds: GWU.xy.Bounds;

    title = '';
    titleFg: GWU.color.ColorBase = 0xfff;

    bg: GWU.color.ColorBase = 0x999;
    borderBg: GWU.color.ColorBase = 0x999;

    widgets: Widget.Widget[] = [];
    eventHandlers: EventHandlers = {};

    _activeWidget: Widget.Widget | null = null;
    result: any = null;
    done = false;

    timers: Record<string, number> = {};
    needsRedraw = true;

    constructor(ui: UICore, opts?: DialogOptions) {
        this.ui = ui;
        this.id = 'DIALOG';
        this.bounds = new GWU.xy.Bounds(-1, -1, 0, 0);
        if (opts) this.init(opts);
    }

    init(opts: DialogOptions) {
        if (opts.id) this.id = opts.id;
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
        if (opts.widgets) {
            opts.widgets.forEach((w) => this.widgets.push(w));
        }

        this.widgets.sort((a, b) => (a.depth < b.depth ? -1 : 1));
    }

    get activeWidget(): Widget.Widget | null {
        return this._activeWidget;
    }

    setActiveWidget(w: Widget.Widget | null, reverse = false) {
        if (w === this._activeWidget) return;

        if (this._activeWidget) {
            this._activeWidget.deactivate();
        }
        this._activeWidget = w;
        if (this._activeWidget) {
            this._activeWidget.activate(reverse);
        }
    }

    contains(e: GWU.xy.XY): boolean {
        return this.bounds.contains(e);
    }

    requestRedraw() {
        this.needsRedraw = true;
    }

    setTimeout(action: string, time: number) {
        this.timers[action] = time;
    }

    clearTimeout(action: string) {
        delete this.timers[action];
    }

    async fireAction(
        action: string,
        widget: Widget.Widget | null
    ): Promise<void> {
        const handler = this.eventHandlers[action];
        if (handler) {
            await handler(action, this, widget);
        }
    }

    // Multiple calls result in adding more handlers
    setEventHandlers(map: EventHandlers) {
        Object.assign(this.eventHandlers, map);
    }

    async show(): Promise<any> {
        this.done = false;

        // reset any temp data...
        this.widgets.forEach((w) => w.reset());

        // first tabStop is the starting active Widget
        this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);

        // start dialog
        const buffer = this.ui.startLayer();

        // run input loop
        await this.ui.loop.run(
            {
                keypress: this.keypress.bind(this),
                dir: this.dir.bind(this),
                mousemove: this.mousemove.bind(this),
                click: this.click.bind(this),
                tick: this.tick.bind(this),
                draw: () => {
                    this.draw(buffer);
                    buffer.render();
                },
            },
            100
        );

        // stop dialog
        this.ui.finishLayer();

        return this.result;
    }

    close(returnValue: any) {
        this.result = returnValue;
        this.done = true;
    }

    widgetAt(x: number, y: number): Widget.Widget | null {
        return this.widgets.find((w) => w.contains(x, y)) || null;
    }

    getWidget(id: string): Widget.Widget | null {
        return this.widgets.find((w) => w.id === id) || null;
    }

    nextTabstop() {
        if (!this.activeWidget) {
            this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
            return !!this.activeWidget;
        }

        const next = GWU.arrayNext(
            this.widgets,
            this.activeWidget,
            (w) => w.tabStop
        );
        if (next) {
            this.setActiveWidget(next);
            return true;
        }
        return false;
    }

    prevTabstop() {
        if (!this.activeWidget) {
            this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
            return !!this.activeWidget;
        }

        const prev = GWU.arrayPrev(
            this.widgets,
            this.activeWidget,
            (w) => w.tabStop
        );
        if (prev) {
            this.setActiveWidget(prev, true);
            return true;
        }
        return false;
    }

    async tick(e: GWU.io.Event): Promise<boolean> {
        const dt = e.dt;
        let promises = [];

        Object.entries(this.timers).forEach(([action, time]) => {
            time -= dt;
            if (time <= 0) {
                delete this.timers[action];
                promises.push(this.fireAction(action, null));
            } else {
                this.timers[action] = time;
            }
        });

        for (let w of this.widgets) {
            promises.push(w.tick(e, this));
        }
        if (promises.length) {
            return Promise.all(promises).then(() => this.done);
        }
        return this.done;
    }

    // TODO - async - to allow animations or events on mouseover?
    async mousemove(e: GWU.io.Event): Promise<boolean> {
        // this.setActiveWidget(null);
        await Promise.all(
            this.widgets.map(async (w) => {
                await w.mousemove(e, this);
                if (w.hovered && w.tabStop) {
                    this.setActiveWidget(w);
                }
            })
        );

        return this.done;
    }

    async click(e: GWU.io.Event): Promise<boolean> {
        // this.mousemove(e); // make sure activeWidget is set correctly

        // if (!this.contains(e)) {
        //     return false;
        // }

        const widget = this.widgetAt(e.x, e.y);

        let fn: EventCallback | null = null;
        if (widget) {
            if (await widget.click(e, this)) {
                return this.done;
            }
            fn = this.eventHandlers[widget.id];
        }
        fn = fn || this.eventHandlers[this.id] || this.eventHandlers.click;

        if (fn) {
            await fn(e, this, this.activeWidget);
        }
        return this.done;
    }

    async keypress(e: GWU.io.Event): Promise<boolean> {
        if (!e.key) return false;

        if (this.activeWidget) {
            if (await this.activeWidget.keypress(e, this)) {
                return this.done;
            }
        }

        const fn =
            this.eventHandlers[e.key] ||
            this.eventHandlers[e.code] ||
            this.eventHandlers.keypress;
        if (fn) {
            if (await fn(e, this, this.activeWidget)) {
                return this.done;
            }
        }

        if (e.key === 'Tab') {
            // Next widget
            this.nextTabstop();
            return false; // not done
        } else if (e.key === 'TAB') {
            // Prev Widget
            this.prevTabstop();
            return false; // not done
        }

        return this.done;
    }

    async dir(e: GWU.io.Event): Promise<boolean> {
        if (this.activeWidget) {
            if (await this.activeWidget.dir(e, this)) {
                return this.done;
            }
        }

        const fn = this.eventHandlers.dir || this.eventHandlers.keypress;
        if (fn) {
            await fn(e, this, this.activeWidget);
        }
        return this.done;
    }

    draw(buffer: GWU.canvas.DataBuffer, force = false) {
        if (!this.needsRedraw && !force) return;

        this.ui.resetLayerBuffer(buffer);

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

        this.widgets.forEach((w) => w.draw(buffer));
    }
}

export class DialogBuilder {
    dialog: Dialog;
    nextY = 0;

    constructor(ui: UICore, opts: DialogOptions = {}) {
        this.nextY = 1;

        this.dialog = new Dialog(ui, opts);
    }

    with(widget: Widget.Widget): this {
        // widget bounds are set relative to the dialog top left,
        // if we don't get any, help them out

        // TODO - Get rid of x, y
        this.addWidget(widget);

        this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1);

        return this;
    }

    center(): this {
        const size = this.dialog.ui.buffer;
        const bounds = this.dialog.bounds;
        bounds.x = Math.floor((size.width - bounds.width) / 2);
        bounds.y = Math.floor((size.height - bounds.height) / 2);
        return this;
    }

    place(x: number, y: number): this {
        const bounds = this.dialog.bounds;
        bounds.x = x;
        bounds.y = y;
        return this;
    }

    done(): Dialog {
        if (this.dialog.bounds.x < 0) this.dialog.bounds.x = 0;
        if (this.dialog.bounds.y < 0) this.dialog.bounds.y = 0;
        if (this.dialog.bounds.right > this.dialog.ui.buffer.width)
            throw new Error('Dialog is off screen!');
        if (this.dialog.bounds.bottom > this.dialog.ui.buffer.height)
            throw new Error('Dialog is off screen!');

        // lock in locations
        this.dialog.widgets.forEach((w) => {
            w.bounds.x += this.dialog.bounds.x;
            w.bounds.y += this.dialog.bounds.y;
        });

        return this.dialog;
    }

    protected addWidget<T extends Widget.Widget>(widget: T): T {
        const dlgBounds = this.dialog.bounds;
        const x = widget.bounds.x;
        const y = widget.bounds.y;

        if (x >= 0) {
            dlgBounds.width = Math.max(
                dlgBounds.width,
                widget.bounds.width + x
            );
        } else if (x < 0) {
            widget.bounds.x = dlgBounds.width - widget.bounds.width + x;
        }

        if (y >= 0) {
            dlgBounds.height = Math.max(
                dlgBounds.height,
                widget.bounds.height + y
            );
        } else if (y < 0) {
            widget.bounds.y = dlgBounds.height - widget.bounds.height + y;
        }

        this.dialog.widgets.push(widget);
        return widget;
    }
}

export function buildDialog(
    ui: UICore,
    opts: DialogOptions = {}
): DialogBuilder {
    return new DialogBuilder(ui, opts);
}
