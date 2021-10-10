import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { UICore } from '../types';
import * as Box from './box';

export type EventCallback = (
    ev: GWU.io.Event | string,
    dialog: Dialog,
    widget: Widget.Widget | null // null if it is the dialog
) => any | Promise<any>; // return a TRUTHY value to stop propagation of event
export type EventHandlers = Record<string, EventCallback>;

export class Dialog implements Widget.WidgetRunner {
    ui: UICore;
    id: string;
    // bounds: GWU.xy.Bounds;

    widgets: Widget.Widget[] = [];
    eventHandlers: EventHandlers = {};

    _activeWidget: Widget.Widget | null = null;
    result: any = null;
    done = false;

    timers: Record<string, number> = {};
    needsRedraw = true;

    constructor(ui: UICore, id?: string) {
        this.ui = ui;
        this.id = id || 'DIALOG';
        // this.bounds = new GWU.xy.Bounds(-1, -1, 0, 0);
        // if (opts) this.init(opts);
    }

    init() {
        // if (opts.id) this.id = opts.id;
        // if (opts.x !== undefined) this.bounds.x = opts.x;
        // if (opts.y !== undefined) this.bounds.y = opts.y;
        // if (opts.height !== undefined) this.bounds.height = opts.height;
        // if (opts.width !== undefined) this.bounds.width = opts.width;

        // if (opts.box) {
        //     let boxOpts: Box.BoxOptions = {
        //         fg: 'white',
        //         bg: 'gray',
        //         borderBg: 'dark_gray',
        //         width: this.bounds.width,
        //         height: this.bounds.height,
        //         x: this.bounds.x,
        //         y: this.bounds.y,
        //     };
        //     if (opts.box !== true) {
        //         Object.assign(boxOpts, opts.box);
        //     }
        //     const box = new Box.Box(this.id + '_BOX', boxOpts);
        //     this.widgets.push(box);
        // }

        // if (opts.widgets) {
        //     opts.widgets.forEach((w) => this.widgets.push(w));
        // }

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

    // contains(e: GWU.xy.XY): boolean {
    //     return this.bounds.contains(e);
    // }

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
        return (
            this.widgets.find((w) => w.contains(x, y) && w.depth >= 0) || null
        );
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

        this.ui.resetLayerBuffer();
        this.widgets.forEach((w) => w.draw(buffer));
    }
}

export class DialogBuilder {
    dialog: Dialog;
    bounds: GWU.xy.Bounds;
    nextY = 0;
    box: Box.BoxOptions | null = null;

    constructor(ui: UICore, width: number, height: number) {
        this.nextY = 1;
        this.dialog = new Dialog(ui);
        this.bounds = new GWU.xy.Bounds(-1, -1, width, height);
    }

    with(widget: Widget.Widget, at?: Widget.PosOptions): this {
        // widget bounds are set relative to the dialog top left,
        // if we don't get any, help them out

        // TODO - Get rid of x, y
        const bounds = this.bounds;

        if (at) {
            if (at.right !== undefined) {
                bounds.width = Math.max(
                    bounds.width,
                    widget.bounds.width + at.right
                );
                widget.bounds.right = bounds.width - at.right - 1;
            } else {
                widget.bounds.x = at.x || 0;
                bounds.width = Math.max(
                    bounds.width,
                    widget.bounds.width + widget.bounds.x
                );
            }
            if (at.bottom !== undefined) {
                bounds.height = Math.max(
                    bounds.height,
                    widget.bounds.height + at.bottom
                );
                widget.bounds.bottom = bounds.height - at.bottom - 1;
            } else {
                widget.bounds.y = at.y || 0;
                bounds.height = Math.max(
                    bounds.height,
                    widget.bounds.height + widget.bounds.y
                );
            }
        } else {
            bounds.width = Math.max(bounds.width, widget.bounds.right);
            bounds.height = Math.max(bounds.height, widget.bounds.bottom);
        }

        this.dialog.widgets.push(widget);
        this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1);

        return this;
    }

    center(): this {
        const size = this.dialog.ui.buffer;
        const bounds = this.bounds;
        bounds.x = Math.floor((size.width - bounds.width) / 2);
        bounds.y = Math.floor((size.height - bounds.height) / 2);
        return this;
    }

    place(x: number, y: number): this {
        const bounds = this.bounds;
        bounds.x = x;
        bounds.y = y;
        return this;
    }

    addBox(opts?: Box.BoxOptions): this {
        this.box = opts || {};
        return this;
    }

    done(): Dialog {
        if (this.bounds.x < 0) this.bounds.x = 0;
        if (this.bounds.y < 0) this.bounds.y = 0;
        if (this.bounds.right > this.dialog.ui.buffer.width)
            throw new Error('Dialog is off screen!');
        if (this.bounds.bottom > this.dialog.ui.buffer.height)
            throw new Error('Dialog is off screen!');

        if (this.box) {
            const padX = this.box.padX || this.box.pad || 1;
            const padY = this.box.padY || this.box.pad || 1;
            this.box.x = 0;
            this.box.y = 0;
            this.box.width = this.bounds.width + 2 * padX;
            this.box.height = this.bounds.height + 2 * padY;

            const widget = new Box.Box(this.dialog.id + '_BOX', this.box);

            this.dialog.widgets.forEach((w) => {
                w.bounds.x += padX;
                w.bounds.y += padY;
            });

            this.dialog.widgets.unshift(widget);
        }

        // lock in locations
        this.dialog.widgets.forEach((w) => {
            w.bounds.x += this.bounds.x;
            w.bounds.y += this.bounds.y;
        });

        return this.dialog;
    }
}

export function buildDialog(ui: UICore, width = 0, height = 0): DialogBuilder {
    return new DialogBuilder(ui, width, height);
}
