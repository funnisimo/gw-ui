import * as GWU from 'gw-utils';
import { UICore } from '../types';
import { Grid } from './grid';
import { Text } from './text';
import { Style, StyleOptions } from './style';
import { Widget } from './widget';

export class Term {
    static default: Style = {
        fg: 'white',
        bg: 'black',
        align: 'left',
        valign: 'top',
    };

    ui: UICore;
    x = 0;
    y = 0;

    widgets: Widget[] = [];
    _currentWidget: Widget | null = null;

    _style!: Style;
    _hoverStyle!: StyleOptions;
    _focusStyle!: StyleOptions;

    _grid: Grid | null = null;

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
        this._style = Object.assign({}, Term.default);
        this._focusStyle = {};
        this._hoverStyle = {};
        return this;
    }

    fg(v: GWU.color.ColorBase): this {
        this._style.fg = v;
        return this;
    }

    bg(v: GWU.color.ColorBase): this {
        this._style.bg = v;
        return this;
    }

    dim(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._style.fg = GWU.color.from(this._style.fg).darken(pct);
        }
        if (bg) {
            this._style.bg = GWU.color.from(this._style.bg).darken(pct);
        }
        return this;
    }

    bright(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._style.fg = GWU.color.from(this._style.fg).lighten(pct);
        }
        if (bg) {
            this._style.bg = GWU.color.from(this._style.bg).lighten(pct);
        }
        return this;
    }

    invert(): this {
        [this._style.fg, this._style.bg] = [this._style.bg, this._style.fg];
        return this;
    }

    style(opts: StyleOptions): this {
        this._style = Object.assign({}, Term.default, opts);
        return this;
    }

    focusStyle(opts: StyleOptions): this {
        this._focusStyle = opts;
        return this;
    }

    hoverStyle(opts: StyleOptions): this {
        this._hoverStyle = opts;
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
        const widget = new Text(this.x, this.y, text, { width });
        widget.style(this._style);
        widget.draw(this.buffer);
        return this;
    }

    border(
        w: number,
        h: number,
        bg?: GWU.color.ColorBase,
        ascii = false
    ): this {
        bg = bg || this._style.fg;
        const buf = this.buffer;
        if (ascii) {
            for (let i = 1; i < w; ++i) {
                buf.draw(this.x + i, this.y, '-', bg, -1);
                buf.draw(this.x + i, this.y + h - 1, '-', bg, -1);
            }
            for (let j = 1; j < h; ++j) {
                buf.draw(this.x, this.y + j, '|', bg, -1);
                buf.draw(this.x + w - 1, this.y + j, '|', bg, -1);
            }
            buf.draw(this.x, this.y, '+', bg);
            buf.draw(this.x + w - 1, this.y, '+', bg);
            buf.draw(this.x, this.y + h - 1, '+', bg);
            buf.draw(this.x + w - 1, this.y + h - 1, '+', bg);
        } else {
            GWU.xy.forBorder(this.x, this.y, w, h, (x, y) => {
                buf.draw(x, y, ' ', bg, bg);
            });
        }
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

    text(text: string, width?: number, _align?: GWU.text.Align): Text {
        // TODO - if in a grid cell, adjust width and height based on grid

        const widget = new Text(this.x, this.y, text, { width });
        widget.style(this._style);
        widget.hoverStyle(this._hoverStyle);
        widget.focusStyle(this._focusStyle);
        widget.draw(this.buffer);
        this._currentWidget = widget;
        this.widgets.push(widget);
        return widget;
    }

    // CONTROL

    render(): this {
        this.ui.render();
        return this;
    }

    // EVENTS

    mousemove(e: GWU.io.Event): boolean {
        let handled = false;
        this.widgets.forEach((w) => {
            if (w.mousemove(e, this)) {
                handled = true;
            }
        });

        return handled;
    }

    draw() {
        this.widgets.forEach((w) => w.draw(this.buffer));
        this.render();
    }
}
