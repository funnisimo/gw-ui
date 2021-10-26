import * as GWU from 'gw-utils';
import { UICore } from '../types';
import { Grid } from './grid';
import * as Text from './text';
import * as Style from './style';
import * as Widget from './widget';
import * as Table from './table';
import * as Menu from './menu';
import * as Button from './button';
import * as Border from './border';

export class Term {
    ui: UICore;
    opts: Record<string, any> = {};

    // widgets: Widget.Widget[] = [];
    allWidgets: Widget.Widget[] = [];
    styles = new Style.Sheet();
    // _currentWidget: Widget.Widget | null = null;
    events: Record<string, Widget.EventCb[]> = {};

    _grid: Grid | null = null;
    _needsDraw = false;
    _buffer: GWU.canvas.Buffer | null = null;
    body: Widget.WidgetGroup;

    constructor(ui: UICore) {
        this.ui = ui;
        this.body = new Widget.WidgetGroup(this, {
            tag: 'body',
            id: 'BODY',
            depth: -1,
            width: ui.width,
            height: ui.height,
        });
        this.allWidgets.push(this.body);
        this.reset();
    }

    get buffer(): GWU.canvas.DataBuffer {
        return this._buffer || this.ui.buffer;
    }
    get width(): number {
        return this.ui.width;
    }
    get height(): number {
        return this.ui.height;
    }

    get needsDraw(): boolean {
        return this._needsDraw;
    }
    set needsDraw(v: boolean) {
        this._needsDraw = v;
    }

    // RUN

    show() {
        if (this._buffer) return;
        this._buffer = this.ui.startLayer();
    }

    hide() {
        if (!this._buffer) return;
        this.ui.finishLayer();
        this._buffer = null;
    }

    // COLOR

    reset(): this {
        this.opts = { x: 0, y: 0 };
        return this;
    }

    fg(v: GWU.color.ColorBase): this {
        this.opts.fg = v;
        return this;
    }

    bg(v: GWU.color.ColorBase): this {
        this.opts.bg = v;
        return this;
    }

    dim(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this.opts.fg = GWU.color.from(this.opts.fg || 'white').darken(pct);
        }
        if (bg) {
            this.opts.bg = GWU.color.from(this.opts.bg || 'black').darken(pct);
        }
        return this;
    }

    bright(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this.opts.fg = GWU.color.from(this.opts.fg || 'white').lighten(pct);
        }
        if (bg) {
            this.opts.bg = GWU.color.from(this.opts.bg || 'black').lighten(pct);
        }
        return this;
    }

    invert(): this {
        [this.opts.fg, this.opts.bg] = [this.opts.bg, this.opts.fg];
        return this;
    }

    // STYLE

    style(opts: Style.StyleOptions): this {
        Object.assign(this.opts, opts);
        return this;
    }

    // POSITION

    pos(x: number, y: number): this {
        this.opts.x = GWU.clamp(x, 0, this.width);
        this.opts.y = GWU.clamp(y, 0, this.height);
        return this;
    }

    moveTo(x: number, y: number): this {
        return this.pos(x, y);
    }

    move(dx: number, dy: number): this {
        this.opts.x = GWU.clamp(this.opts.x + dx, 0, this.width);
        this.opts.y = GWU.clamp(this.opts.y + dy, 0, this.height);
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
        return this.pos(0, this.opts.y + n);
    }

    prevLine(n = 1): this {
        return this.pos(0, this.opts.y - n);
    }

    // EDIT

    // erase and move back to top left
    clear(color?: GWU.color.ColorBase): this {
        this.body.children = [];
        this.allWidgets = [this.body];
        if (color) {
            this.body.style().set('bg', color);
        } else {
            this.body.style().unset('bg');
        }
        return this;
    }

    // // just erase screen
    // erase(color?: GWU.color.ColorBase): this {
    //     // remove all widgets
    //     this._needsDraw = true;

    //     if (color === undefined) {
    //         color = this.opts.bg;
    //     }
    //     this.buffer.fill(' ', color, color);
    //     return this;
    // }

    // eraseBelow(): this {
    //     // TODO - remove widgets below
    //     this.buffer.fillRect(
    //         0,
    //         this.y + 1,
    //         this.width,
    //         this.height - this.y - 1,
    //         ' ',
    //         this._style.bg,
    //         this._style.bg
    //     );
    //     this._needsDraw = true;
    //     return this;
    // }

    // eraseAbove(): this {
    //     // TODO - remove widgets above
    //     this.buffer.fillRect(
    //         0,
    //         0,
    //         this.width,
    //         this.y - 1,
    //         ' ',
    //         this._style.bg,
    //         this._style.bg
    //     );
    //     this._needsDraw = true;
    //     return this;
    // }

    // eraseLine(n: number): this {
    //     if (n === undefined) {
    //         n = this.y;
    //     }
    //     if (n >= 0 && n < this.height) {
    //         // TODO - remove widgets on line
    //         this.buffer.fillRect(
    //             0,
    //             n,
    //             this.width,
    //             1,
    //             ' ',
    //             this._style.bg,
    //             this._style.bg
    //         );
    //     }
    //     this._needsDraw = true;
    //     return this;
    // }

    // eraseLineAbove(): this {
    //     return this.eraseLine(this.y - 1);
    // }

    // eraseLineBelow(): this {
    //     return this.eraseLine(this.y + 1);
    // }

    // GRID

    // erases/clears current grid information
    grid(): this {
        this._grid = new Grid(this.opts.x, this.opts.y);
        return this;
    }

    endGrid(): this {
        this._grid = null;
        return this;
    }

    cols(count: number, width: number): this;
    cols(widths: number[]): this;
    cols(...args: any[]): this {
        if (!this._grid) return this;
        this._grid.cols(args[0], args[1]);
        return this;
    }

    rows(count: number, width: number): this;
    rows(heights: number[]): this;
    rows(...args: any[]): this {
        if (!this._grid) return this;
        this._grid.rows(args[0], args[1]);
        return this;
    }

    startRow(n: number): this {
        if (!this._grid) return this;
        if (n !== undefined) {
            this._grid.row(n);
        } else {
            this._grid.nextRow();
        }
        this.pos(this._grid.x, this._grid.y);
        return this;
    }

    nextCol(): this {
        if (!this._grid) return this;
        this._grid.nextCol();
        this.pos(this._grid.x, this._grid.y);
        return this;
    }

    // new row height
    endRow(h?: number): this {
        if (!this._grid) return this;
        if (h !== undefined && h > 0) {
            this._grid.setRowHeight(h);
        }
        return this;
    }

    // moves to specific column
    col(n: number): this {
        if (!this._grid) return this;
        this._grid.col(n);
        this.pos(this._grid.x, this._grid.y);
        return this;
    }

    // moves to specific row
    row(n: number): this {
        if (!this._grid) return this;
        this._grid.row(n);
        this.pos(this._grid.x, this._grid.y);
        return this;
    }

    // WIDGETS

    addWidget(w: Widget.Widget): this {
        const index = this.allWidgets.findIndex((aw) => aw.depth <= w.depth);
        if (index < 0) {
            this.allWidgets.push(w);
        } else {
            this.allWidgets.splice(index, 0, w);
        }
        if (!w.parent) {
            this.body.addChild(w);
        }
        this.needsDraw = true;
        return this;
    }

    removeWidget(w: Widget.Widget): this {
        // GWU.arrayDelete(this.widgets, w);
        GWU.arrayDelete(this.allWidgets, w);
        this.needsDraw = true;
        if (w.parent) {
            w.parent.removeChild(w);
        }
        return this;
    }

    widgetAt(x: number, y: number): Widget.Widget | null;
    widgetAt(xy: GWU.xy.XY): Widget.Widget | null;
    widgetAt(...args: any[]): Widget.Widget | null {
        return (
            this.allWidgets.find(
                (w) => w.contains(args[0], args[1]) && !w.hidden
            ) || null
        );
    }

    text(text: string, opts: Text.TextOptions = {}): Text.Text {
        // TODO - if in a grid cell, adjust width and height based on grid
        // opts.style = opts.style || this._style;

        const _opts = Object.assign({}, this.opts, opts);
        const widget = new Text.Text(this, text, _opts);
        this.addWidget(widget);
        this._needsDraw = true;
        return widget;
    }

    table(opts: Table.TableOptions): Table.Table {
        // TODO - if in a grid cell, adjust width and height based on grid
        // opts.style = opts.style || this._style;
        const _opts = Object.assign({}, this.opts, opts);
        const widget = new Table.Table(this, _opts);
        this.addWidget(widget);
        this._needsDraw = true;
        return widget;
    }

    menu(opts: Menu.MenuOptions): Menu.Menu {
        const _opts = Object.assign({}, this.opts, opts);

        const widget = new Menu.Menu(this, _opts);
        this.addWidget(widget);
        this._needsDraw = true;
        return widget;
    }

    button(opts: Button.ButtonOptions): Button.Button {
        const _opts = Object.assign({}, this.opts, opts);

        const widget = new Button.Button(this, _opts);
        this.addWidget(widget);
        this._needsDraw = true;
        return widget;
    }

    border(opts: Border.BorderOptions): Border.Border {
        const _opts = Object.assign({}, this.opts, opts);

        const widget = new Border.Border(this, _opts);
        this.addWidget(widget);
        this._needsDraw = true;
        return widget;
    }

    // CONTROL

    render(): this {
        this.draw();
        return this;
    }

    // EVENTS

    on(event: string, cb: Widget.EventCb): this {
        let handlers = this.events[event];
        if (!handlers) {
            handlers = this.events[event] = [];
        }
        if (!handlers.includes(cb)) {
            handlers.push(cb);
        }
        return this;
    }

    off(event: string, cb?: Widget.EventCb): this {
        let handlers = this.events[event];
        if (!handlers) return this;
        if (cb) {
            GWU.arrayDelete(handlers, cb);
        } else {
            handlers.length = 0; // clear all handlers
        }
        return this;
    }

    fireEvent(
        name: string,
        source: Widget.Widget | null,
        e?: Partial<GWU.io.Event>
    ): boolean {
        if (!e || !e.type) {
            e = GWU.io.makeCustomEvent(name, e);
        }
        const handlers = this.events[name] || [];
        let handled = handlers.reduce(
            (out, h) => h(name, source, e as GWU.io.Event) || out,
            false
        );
        return handled;
    }

    mousemove(e: GWU.io.Event): boolean {
        this.allWidgets.forEach((w) => {
            w.mousemove(e);
        });

        return false; // TODO - this._done
    }

    click(e: GWU.io.Event): boolean {
        const w = this.widgetAt(e);
        if (w) {
            w.click(e);
        } else {
            this.fireEvent('click', null, e);
        }

        return false; // TODO - this._done
    }

    draw() {
        if (this.styles.dirty) {
            this._needsDraw = true;
            this.allWidgets.forEach((w) => w._updateStyle());
            this.styles.dirty = false;
        }
        if (!this._needsDraw) return;
        this._needsDraw = false;

        if (!this._buffer) {
            this.show();
        }

        this.ui.resetLayerBuffer();

        // draw from low depth to high depth
        for (let i = this.allWidgets.length - 1; i >= 0; --i) {
            const w = this.allWidgets[i];
            w.draw(this._buffer!);
        }
        console.log('draw');
        this.ui.render();
    }
}
