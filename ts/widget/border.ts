import * as GWU from 'gw-utils';
import { UIStyle } from '../ui/types';
import * as Widget from './widget';
import { Layer } from '../ui/layer';
import { installWidget } from './make';

export interface BorderOptions extends Widget.WidgetOptions {
    width: number;
    height: number;

    ascii?: boolean;
}

export class Border extends Widget.Widget {
    ascii = false;

    constructor(layer: Layer, opts: BorderOptions) {
        super(layer, opts);
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

    _draw(buffer: GWU.buffer.Buffer): boolean {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const x = this.bounds.x;
        const y = this.bounds.y;
        const ascii = this.ascii;

        drawBorder(buffer, x, y, w, h, this._used, ascii);
        return true;
    }
}

installWidget('border', (l, opts) => new Border(l, opts));

// extend Layer
export type AddBorderOptions = BorderOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../ui/layer' {
    interface Layer {
        border(opts: AddBorderOptions): Border;
    }
}
Layer.prototype.border = function (opts: AddBorderOptions): Border {
    const options = Object.assign({}, this._opts, opts);
    const list = new Border(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

export function drawBorder(
    buffer: GWU.buffer.Buffer,
    x: number,
    y: number,
    w: number,
    h: number,
    style: UIStyle,
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
