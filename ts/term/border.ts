import * as GWU from 'gw-utils';
import { Term } from '.';
import { Style } from './style';
import * as Widget from './widget';

export interface BorderOptions extends Widget.WidgetOptions {
    width: number;
    height: number;

    ascii?: boolean;
}

export class Border extends Widget.Widget {
    ascii = false;

    constructor(term: Term, opts: BorderOptions) {
        super(term, opts);
        if (opts.ascii) {
            this.ascii = true;
        } else if (opts.fg && opts.ascii !== false) {
            this.ascii = true;
        }
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(..._args: any[]): boolean {
        return false;
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const x = this.bounds.x;
        const y = this.bounds.y;
        const ascii = this.ascii;

        drawBorder(buffer, x, y, w, h, this._used, ascii);
        return true;
    }
}

export function drawBorder(
    buffer: GWU.canvas.DataBuffer,
    x: number,
    y: number,
    w: number,
    h: number,
    style: Style,
    ascii: boolean
) {
    const fg = style.fg;
    const bg = style.bg;
    if (ascii) {
        for (let i = 1; i < w; ++i) {
            buffer.draw(x + i, y, '-', fg, bg);
            buffer.draw(x + i, y + h - 1, '-', fg, bg);
        }
        for (let j = 1; j < h; ++j) {
            buffer.draw(x, y + j, '|', fg, bg);
            buffer.draw(x + w - 1, y + j, '|', fg, bg);
        }
        buffer.draw(x, y, '+', fg, bg);
        buffer.draw(x + w - 1, y, '+', fg, bg);
        buffer.draw(x, y + h - 1, '+', fg, bg);
        buffer.draw(x + w - 1, y + h - 1, '+', fg, bg);
    } else {
        GWU.xy.forBorder(x, y, w, h, (x, y) => {
            buffer.draw(x, y, ' ', bg, bg);
        });
    }
}
