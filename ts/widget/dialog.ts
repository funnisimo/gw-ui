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

    pad?: number;
    padX?: number;
    padY?: number;
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
    ui: UICore;
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
    }

    get activeWidget(): Widget.Widget | null {
        return this._activeWidget;
    }
    set activeWidget(w: Widget.Widget | null) {
        if (this._activeWidget) {
            this._activeWidget.active = false;
        }
        this._activeWidget = w;
        if (this._activeWidget) {
            this._activeWidget.active = true;
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

    async show(): Promise<any> {
        this.done = false;

        // reset any temp data...
        this.widgets.forEach((w) => w.reset());

        // first tabStop is the starting active Widget
        this.activeWidget = this.widgets.find((w) => w.tabStop) || null;

        // start dialog
        const buffer = this.ui.startDialog();

        // run input loop
        await this.ui.loop.run(
            {
                keypress: this.keypress.bind(this),
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
        this.ui.finishDialog();

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
            this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
            return !!this.activeWidget;
        }

        const next = GWU.arrayNext(
            this.widgets,
            this.activeWidget,
            (w) => w.tabStop
        );
        if (next) {
            this.activeWidget = next;
            return true;
        }
        return false;
    }

    prevTabstop() {
        if (!this.activeWidget) {
            this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
            return !!this.activeWidget;
        }

        const prev = GWU.arrayPrev(
            this.widgets,
            this.activeWidget,
            (w) => w.tabStop
        );
        if (prev) {
            this.activeWidget = prev;
            return true;
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
            const r = w.tick(e, this.ui);
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
        // this.activeWidget = null;
        this.widgets.forEach((w) => {
            w.mousemove(e, this.ui);
            if (w.hovered && w.tabStop) {
                this.activeWidget = w;
            }
        });

        return this.done;
    }

    click(e: GWU.io.Event): boolean | Promise<boolean> {
        this.mousemove(e); // make sure activeWidget is set correctly

        let fn: EventCallback | null = null;
        if (this.activeWidget) {
            fn = this.clickHandlers[this.activeWidget.id];
        }
        if (!fn && this.contains(e)) {
            fn = this.clickHandlers[this.id];
        }
        if (!fn) {
            fn = this.clickHandlers.click;
        }

        if (fn) {
            const r = fn(e, this.activeWidget, this);
            if (r && r.then) {
                return r.then(() => this.done);
            }
        } else if (this.activeWidget) {
            const r = this.activeWidget.click(e, this.ui);
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
            const r = this.activeWidget.keypress(e, this.ui);
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

    draw(buffer: GWU.canvas.DataBuffer, force = false) {
        if (!this.needsRedraw && !force) return;

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
    padY = 1;
    padX = 1;

    constructor(ui: UICore, opts: DialogOptions = {}) {
        this.padX = opts.padX || opts.pad || 1;
        this.padY = opts.padY || opts.pad || 1;
        this.nextY = this.padY;

        this.dialog = new Dialog(ui, opts);
    }

    with(widget: Widget.Widget): this {
        // widget bounds are set relative to the dialog top left,
        // if we don't get any, help them out
        let y = widget.bounds.y;
        if (y >= 0 && y < this.padY) {
            y = this.nextY;
        } else if (y < 0 && y > -this.padY) {
            y = -this.padY;
        }
        widget.bounds.y = y;

        let x = widget.bounds.x;
        if (x >= 0 && x < this.padX) {
            x = this.padX;
        } else if (x < 0 && x > -this.padX) {
            x = -this.padX;
        }
        widget.bounds.x = x;

        // TODO - Get rid of x, y
        this.addWidget(widget);

        this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1 + this.padY);

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
        // lock in locations
        this.dialog.widgets.forEach((w) => {
            w.bounds.x += this.dialog.bounds.x;
            w.bounds.y += this.dialog.bounds.y;
        });

        return this.dialog;
    }

    protected addWidget<T extends Widget.Widget>(widget: T): T {
        widget.parent = this.dialog;

        const dlgBounds = this.dialog.bounds;
        const x = widget.bounds.x;
        const y = widget.bounds.y;

        if (x >= 0) {
            dlgBounds.width = Math.max(
                dlgBounds.width,
                widget.bounds.width + x + this.padX
            );
        } else {
            widget.bounds.x = dlgBounds.width - widget.bounds.width + x;
        }

        if (y >= 0) {
            dlgBounds.height = Math.max(
                dlgBounds.height,
                widget.bounds.height + y + this.padY
            );
        } else {
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
