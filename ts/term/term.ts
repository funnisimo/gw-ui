import * as GWU from 'gw-utils';
import { UICore } from '../types';
import { Grid } from './grid';
import * as Text from './text';
import * as Style from './style';
import { Widget } from './widget';
import * as Table from './table';

export class Term {
    ui: UICore;
    x = 0;
    y = 0;

    widgets: Widget[] = [];
    styles = new Style.Sheet();
    _currentWidget: Widget | null = null;

    _style = new Style.Style();

    _grid: Grid | null = null;
    _needsRender = false;

    constructor(ui: UICore) {
        this.ui = ui;
        this.reset();
    }

    get buffer(): GWU.canvas.DataBuffer {
        return this.ui.buffer;
    }
    get width(): number {
        return this.ui.width;
    }
    get height(): number {
        return this.ui.height;
    }

    // COLOR

    reset(): this {
        this._style.copy(this.styles.get('*')!);
        return this;
    }

    fg(v: GWU.color.ColorBase): this {
        this._style.set('fg', v);
        return this;
    }

    bg(v: GWU.color.ColorBase): this {
        this._style.set('bg', v);
        return this;
    }

    dim(pct = 25, fg = true, bg = false): this {
        this._style.dim(pct, fg, bg);
        return this;
    }

    bright(pct = 25, fg = true, bg = false): this {
        this._style.bright(pct, fg, bg);
        return this;
    }

    invert(): this {
        this._style.invert();
        return this;
    }

    // STYLE

    loadStyle(name: string): this {
        const s = this.styles.get(name);
        if (s) {
            this._style.copy(s);
        }
        return this;
    }

    style(opts: Style.StyleOptions): this {
        this._style.set(opts);
        return this;
    }

    // POSITION

    pos(x: number, y: number): this {
        this.x = GWU.clamp(x, 0, this.width);
        this.y = GWU.clamp(y, 0, this.height);
        return this;
    }

    moveTo(x: number, y: number): this {
        return this.pos(x, y);
    }

    move(dx: number, dy: number): this {
        this.x = GWU.clamp(this.x + dx, 0, this.width);
        this.y = GWU.clamp(this.y + dy, 0, this.height);
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
        return this.pos(0, this.y + n);
    }

    prevLine(n = 1): this {
        return this.pos(0, this.y - n);
    }

    // EDIT

    // erase and move back to top left
    clear(color?: GWU.color.ColorBase): this {
        return this.erase(color).pos(0, 0);
    }

    // just erase screen
    erase(color?: GWU.color.ColorBase): this {
        // remove all widgets
        this._needsRender = true;

        if (color === undefined) {
            color = this._style.bg;
        }
        this.buffer.fill(' ', color, color);
        return this;
    }

    eraseBelow(): this {
        // TODO - remove widgets below
        this.buffer.fillRect(
            0,
            this.y + 1,
            this.width,
            this.height - this.y - 1,
            ' ',
            this._style.bg,
            this._style.bg
        );
        this._needsRender = true;
        return this;
    }

    eraseAbove(): this {
        // TODO - remove widgets above
        this.buffer.fillRect(
            0,
            0,
            this.width,
            this.y - 1,
            ' ',
            this._style.bg,
            this._style.bg
        );
        this._needsRender = true;
        return this;
    }

    eraseLine(n: number): this {
        if (n === undefined) {
            n = this.y;
        }
        if (n >= 0 && n < this.height) {
            // TODO - remove widgets on line
            this.buffer.fillRect(
                0,
                n,
                this.width,
                1,
                ' ',
                this._style.bg,
                this._style.bg
            );
        }
        this._needsRender = true;
        return this;
    }

    eraseLineAbove(): this {
        return this.eraseLine(this.y - 1);
    }

    eraseLineBelow(): this {
        return this.eraseLine(this.y + 1);
    }

    // GRID

    // erases/clears current grid information
    grid(): this {
        this._grid = new Grid(this.x, this.y);
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

    // DRAW

    drawText(text: string, width?: number, _align?: GWU.text.Align): this {
        const widget = new Text.Text(this, text, {
            width,
            style: this._style,
        });
        widget.draw(this.buffer);
        this._needsRender = true;
        return this;
    }

    border(
        w: number,
        h: number,
        color?: GWU.color.ColorBase,
        ascii = false
    ): this {
        color = color || this._style.fg;
        const buf = this.buffer;
        if (ascii) {
            for (let i = 1; i < w; ++i) {
                buf.draw(this.x + i, this.y, '-', color, -1);
                buf.draw(this.x + i, this.y + h - 1, '-', color, -1);
            }
            for (let j = 1; j < h; ++j) {
                buf.draw(this.x, this.y + j, '|', color, -1);
                buf.draw(this.x + w - 1, this.y + j, '|', color, -1);
            }
            buf.draw(this.x, this.y, '+', color);
            buf.draw(this.x + w - 1, this.y, '+', color);
            buf.draw(this.x, this.y + h - 1, '+', color);
            buf.draw(this.x + w - 1, this.y + h - 1, '+', color);
        } else {
            GWU.xy.forBorder(this.x, this.y, w, h, (x, y) => {
                buf.draw(x, y, ' ', color, color);
            });
        }
        this._needsRender = true;
        return this;
    }

    // WIDGETS

    get(): Widget | null {
        return this._currentWidget;
    }

    widgetAt(x: number, y: number): Widget | null;
    widgetAt(xy: GWU.xy.XY): Widget | null;
    widgetAt(...args: any[]): Widget | null {
        return this.widgets.find((w) => w.contains(args[0], args[1])) || null;
    }

    text(text: string, opts: Text.TextOptions = {}): Text.Text {
        // TODO - if in a grid cell, adjust width and height based on grid
        // opts.style = opts.style || this._style;
        const widget = new Text.Text(this, text, opts);
        // widget.draw(this.buffer);
        this._currentWidget = widget;
        this.widgets.push(widget);
        this._needsRender = true;
        return widget;
    }

    table(opts: Table.TableOptions): Table.Table {
        // TODO - if in a grid cell, adjust width and height based on grid
        // opts.style = opts.style || this._style;
        const widget = new Table.Table(this, opts);
        // widget.draw(this.buffer);
        this._currentWidget = widget;
        this.widgets.push(widget);
        this._needsRender = true;
        return widget;
    }

    // CONTROL

    render(): this {
        if (this._needsRender) {
            this.draw();
        }
        return this;
    }

    // EVENTS

    mousemove(e: GWU.io.Event): boolean {
        this.widgets.forEach((w) => {
            w.mousemove(e, this);
        });

        return false;
    }

    draw() {
        let didSomething = this._needsRender;
        this.widgets.forEach((w) => {
            didSomething = w.draw(this.buffer) || didSomething;
        });
        if (didSomething) {
            console.log('draw');
            this.ui.render();
            this._needsRender = false;
        }
    }
}
