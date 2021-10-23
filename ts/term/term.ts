import * as GWU from 'gw-utils';
import { UICore } from '../types';

export class Term {
    ui: UICore;
    x = 0;
    y = 0;
    _defaultFg!: GWU.color.ColorBase;
    _defaultBg!: GWU.color.ColorBase;
    _fg!: GWU.color.Color;
    _bg!: GWU.color.Color;

    constructor(ui: UICore) {
        this.ui = ui;
        this.default('white', 'black');
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

    default(fg: GWU.color.ColorBase, bg: GWU.color.ColorBase): this {
        this._defaultFg = fg;
        this._defaultBg = bg;
        this._fg = GWU.color.make(fg);
        this._bg = GWU.color.make(bg);
        return this;
    }

    fg(v: GWU.color.ColorBase): this {
        this._fg.set(v);
        return this;
    }

    bg(v: GWU.color.ColorBase): this {
        this._bg.set(v);
        return this;
    }

    dim(pct = 25): this {
        this._fg.darken(pct);
        return this;
    }

    bright(pct = 25): this {
        this._fg.lighten(pct);
        return this;
    }

    inverse(): this {
        [this._fg, this._bg] = [this._bg, this._fg];
        return this;
    }

    reset(): this {
        this._fg.set(this._defaultFg);
        this._bg.set(this._defaultBg);
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

    col(n: number): this {
        return this.pos(n, this.y);
    }
    row(n: number): this {
        return this.pos(this.x, n);
    }

    // EDIT

    // erase and move back to top left
    clear(newDefaultBg?: GWU.color.ColorBase): this {
        return this.erase(newDefaultBg).pos(0, 0);
    }

    erase(newDefaultBg?: GWU.color.ColorBase): this {
        if (newDefaultBg !== undefined) {
            this._defaultBg = newDefaultBg;
            this._bg.set(newDefaultBg);
        }
        this.buffer.fill(' ', this._bg, this._bg);
        return this;
    }

    eraseBelow(): this {
        this.buffer.fillRect(
            0,
            this.y + 1,
            this.width,
            this.height - this.y - 1,
            ' ',
            this._bg,
            this._bg
        );
        return this;
    }

    eraseAbove(): this {
        this.buffer.fillRect(
            0,
            0,
            this.width,
            this.y - 1,
            ' ',
            this._bg,
            this._bg
        );
        return this;
    }

    eraseLine(): this {
        this.buffer.fillRect(0, this.y, this.width, 1, ' ', this._bg, this._bg);
        return this;
    }

    eraseLineAbove(): this {
        this.buffer.fillRect(
            0,
            this.y - 1,
            this.width,
            1,
            ' ',
            this._bg,
            this._bg
        );
        return this;
    }

    eraseLineBelow(): this {
        this.buffer.fillRect(
            0,
            this.y + 1,
            this.width,
            1,
            ' ',
            this._bg,
            this._bg
        );
        return this;
    }

    // DRAW

    text(text: string, width?: number, align?: GWU.text.Align): this {
        this.x += this.buffer.drawText(
            this.x,
            this.y,
            text,
            this._fg,
            this._bg,
            width,
            align
        );
        return this;
    }

    border(w: number, h: number, bg?: GWU.color.ColorBase): this {
        const c = bg || this._fg;
        const buf = this.buffer;
        GWU.xy.forBorder(this.x, this.y, w, h, (x, y) => {
            buf.draw(x, y, ' ', c, c);
        });
        return this;
    }

    // CONTROL

    render(): this {
        this.ui.render();
        return this;
    }
}
