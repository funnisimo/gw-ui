import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Widget from './widget/widget';
import { UILayer, UIStylesheet, StyleOptions } from './types';

export interface UICore {
    // buffer: GWU.canvas.Buffer;
    readonly loop: GWU.io.Loop;
    readonly canvas: GWU.canvas.BaseCanvas;
    readonly width: number;
    readonly height: number;
    readonly styles: Style.Sheet;

    // render(): void;
    // readonly layer: UILayer;

    startNewLayer(): Layer;
    copyUIBuffer(dest: GWU.canvas.DataBuffer): void;
    finishLayer(layer: Layer): void;

    stop(): void;

    // fadeTo(color?: GWU.color.ColorBase, duration?: number): Promise<void>;
    // getInputAt(
    //     x: number,
    //     y: number,
    //     maxLength: number,
    //     opts?: Widget.InputOptions
    // ): Promise<string>;
    // alert(opts: number | AlertOptions, text: string, args: any): Promise<void>;
}

export class Layer implements UILayer {
    ui: UICore;
    buffer: GWU.canvas.Buffer;
    body: Widget.Widget;
    styles: UIStylesheet;
    needsDraw = true;
    result: any = undefined;

    _attachOrder: Widget.Widget[] = [];
    _depthOrder: Widget.Widget[] = [];
    _focusWidget: Widget.Widget | null = null;
    _hasTabStop = false;
    timers: Record<string, number> = {};

    _opts: Widget.WidgetOptions = {};

    constructor(ui: UICore) {
        this.ui = ui;
        this.buffer = ui.canvas.buffer.clone();
        this.styles = new Style.Sheet(ui.styles);
        this.body = new Widget.Widget(this, {
            tag: 'body',
            id: 'BODY',
            depth: -1,
            width: this.buffer.width,
            height: this.buffer.height,
        });
    }

    get width(): number {
        return this.ui.width;
    }
    get height(): number {
        return this.ui.height;
    }

    // Style and Opts

    reset(): this {
        this._opts = { x: 0, y: 0 };
        return this;
    }

    fg(v: GWU.color.ColorBase): this {
        this._opts.fg = v;
        return this;
    }

    bg(v: GWU.color.ColorBase): this {
        this._opts.bg = v;
        return this;
    }

    dim(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._opts.fg = GWU.color
                .from(this._opts.fg || 'white')
                .darken(pct);
        }
        if (bg) {
            this._opts.bg = GWU.color
                .from(this._opts.bg || 'black')
                .darken(pct);
        }
        return this;
    }

    bright(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._opts.fg = GWU.color
                .from(this._opts.fg || 'white')
                .lighten(pct);
        }
        if (bg) {
            this._opts.bg = GWU.color
                .from(this._opts.bg || 'black')
                .lighten(pct);
        }
        return this;
    }

    invert(): this {
        [this._opts.fg, this._opts.bg] = [this._opts.bg, this._opts.fg];
        return this;
    }

    // STYLE

    style(opts: StyleOptions): this {
        Object.assign(this._opts, opts);
        return this;
    }

    // POSITION

    pos(x: number, y: number): this {
        this._opts.x = GWU.clamp(x, 0, this.width);
        this._opts.y = GWU.clamp(y, 0, this.height);
        return this;
    }

    moveTo(x: number, y: number): this {
        return this.pos(x, y);
    }

    move(dx: number, dy: number): this {
        this._opts.x = GWU.clamp(this._opts.x! + dx, 0, this.width);
        this._opts.y = GWU.clamp(this._opts.y! + dy, 0, this.height);
        return this;
    }

    up(n = 1): this {
        return this.move(0, -n);
    }

    down(n = 1): this {
        return this.move(0, n);
    }

    left(n = 1): this {
        return this.move(-n, 0);
    }

    right(n = 1): this {
        return this.move(n, 0);
    }

    nextLine(n = 1): this {
        return this.pos(0, this._opts.y! + n);
    }

    prevLine(n = 1): this {
        return this.pos(0, this._opts.y! - n);
    }

    // EDIT

    // erase and move back to top left
    clear(color?: GWU.color.ColorBase): this {
        this.body.children = [];
        this._depthOrder = [this.body];
        if (color) {
            this.body.style().set('bg', color);
        } else {
            this.body.style().unset('bg');
        }
        return this;
    }

    // Effects

    fadeTo(_color?: GWU.color.ColorBase, _duration?: number): void {
        throw new Error('Method not implemented.');
    }

    // Widgets

    // create(tag: string, opts: any): UIWidget {
    //     const options = Object.assign({ tag }, this._opts, opts);
    //     const widget = createWidget(tag, this, options);
    //     this.addWidget(widget);
    //     return widget;
    // }

    sortWidgets(): this {
        this._depthOrder.sort((a, b) => b.depth - a.depth);
        return this;
    }

    attach(w: Widget.Widget): this {
        if (!this._attachOrder.includes(w)) {
            const index = this._depthOrder.findIndex(
                (aw) => aw.depth <= w.depth
            );
            if (index < 0) {
                this._depthOrder.push(w);
            } else {
                this._depthOrder.splice(index, 0, w);
            }
            this._attachOrder.push(w);
            this.needsDraw = true;
        }

        if (!w.parent && w !== this.body && this.body) {
            w.setParent(this.body);
            this.needsDraw = true;
        }

        this._hasTabStop = this._hasTabStop || w._propBool('tabStop');

        return this;
    }

    detach(w: Widget.Widget): this {
        // GWU.arrayDelete(this.widgets, w);
        w.setParent(null);
        GWU.arrayDelete(this._depthOrder, w);
        GWU.arrayDelete(this._attachOrder, w);

        if (this._focusWidget === w) {
            this._hasTabStop = this.nextTabStop();
        }
        this.needsDraw = true;
        return this;
    }

    widgetAt(x: number, y: number): Widget.Widget;
    widgetAt(xy: GWU.xy.XY): Widget.Widget;
    widgetAt(...args: any[]): Widget.Widget {
        return (
            this._depthOrder.find(
                (w) => w.contains(args[0], args[1]) && !w.hidden
            ) || this.body
        );
    }

    get focusWidget(): Widget.Widget | null {
        return this._focusWidget;
    }

    setFocusWidget(w: Widget.Widget | null, reverse = false) {
        if (w === this._focusWidget) return;
        if (this._focusWidget && this._focusWidget.blur(reverse)) return;
        if (w && w.focus(reverse)) return;
        this._focusWidget = w;
    }

    getWidget(id: string): Widget.Widget | null {
        return this._depthOrder.find((w) => w.attr('id') === id) || null;
    }

    nextTabStop(): boolean {
        if (!this.focusWidget) {
            this.setFocusWidget(
                this._attachOrder.find(
                    (w) =>
                        !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden
                ) || null
            );
            return !!this.focusWidget;
        }

        const next = GWU.arrayNext(
            this._attachOrder,
            this.focusWidget,
            (w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden
        );
        if (next) {
            this.setFocusWidget(next);
            return true;
        }
        return false;
    }

    prevTabStop(): boolean {
        if (!this.focusWidget) {
            this.setFocusWidget(
                this._attachOrder.find(
                    (w) =>
                        !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden
                ) || null
            );
            return !!this.focusWidget;
        }

        const prev = GWU.arrayPrev(
            this._attachOrder,
            this.focusWidget,
            (w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden
        );
        if (prev) {
            this.setFocusWidget(prev, true);
            return true;
        }
        return false;
    }

    // EVENTS

    on(event: string, cb: Widget.EventCb): this {
        this.body.on(event, cb);
        return this;
    }

    off(event: string, cb?: Widget.EventCb): this {
        this.body.off(event, cb);
        return this;
    }

    mousemove(e: GWU.io.Event): boolean {
        this._depthOrder.forEach((w) => {
            w.mousemove(e);
        });

        return false; // TODO - this._done
    }

    click(e: GWU.io.Event): boolean {
        const w = this.widgetAt(e);
        if (w.prop('tabStop') && !w.prop('disabled')) {
            this.setFocusWidget(w);
        }
        w.click(e);

        return false; // TODO - this._done
    }

    keypress(e: GWU.io.Event): boolean {
        if (!e.key) return false;

        if (this.focusWidget) {
            if (this.focusWidget.keypress(e)) {
                return false;
            }
        }

        //         const fn =
        //             this.eventHandlers[e.key] ||
        //             this.eventHandlers[e.code] ||
        //             this.eventHandlers.keypress;
        //         if (fn) {
        //             if (await fn(e, this, this.focusWidget)) {
        //                 return this.done;
        //             }
        //         }

        if (e.key === 'Tab') {
            // Next widget
            this.nextTabStop();
            return false; // not done
        } else if (e.key === 'TAB') {
            // Prev Widget
            this.prevTabStop();
            return false; // not done
        }

        //         return this.done;
        return false;
    }

    dir(e: GWU.io.Event): boolean {
        const target = this.focusWidget || this.body;
        target.dir(e);
        // return this.done;
        return false;
    }

    tick(e: GWU.io.Event): boolean {
        const dt = e.dt;
        let promises = [];

        Object.entries(this.timers).forEach(([action, time]) => {
            time -= dt;
            if (time <= 0) {
                delete this.timers[action];
                promises.push(this.body._fireEvent(action, this.body));
            } else {
                this.timers[action] = time;
            }
        });

        for (let w of this._depthOrder) {
            w.tick(e);
        }
        //         return this.done;
        return false;
    }

    draw() {
        if (this._hasTabStop && !this._focusWidget) {
            this.nextTabStop();
        }
        if (this.styles.dirty) {
            this.needsDraw = true;
            this._depthOrder.forEach((w) => w.updateStyle());
            this.styles.dirty = false;
        }
        if (!this.needsDraw) return;
        this.needsDraw = false;

        this.ui.copyUIBuffer(this.buffer);

        // draw from low depth to high depth
        for (let i = this._depthOrder.length - 1; i >= 0; --i) {
            const w = this._depthOrder[i];
            w.draw(this.buffer);
        }
        console.log('draw');
        this.buffer.render();
    }

    // LOOP

    setTimeout(action: string, time: number) {
        this.timers[action] = time;
    }

    clearTimeout(action: string) {
        delete this.timers[action];
    }

    finish(result?: any) {
        this.result = result;
        this.ui.finishLayer(this);
    }
}
