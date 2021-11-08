import * as GWU from 'gw-utils';
import { Widget, WidgetOptions, SetParentOptions } from './widget';
import { installWidget } from './make';
import { Layer } from '../layer';

export interface TextOptions extends WidgetOptions {
    text: string;
}

export class Text extends Widget {
    _text = '';
    _lines: string[] = [];
    _fixedWidth = false;
    _fixedHeight = false;

    constructor(layer: Layer, opts: TextOptions) {
        super(layer, opts);
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
        this.bounds.width = opts.width || 0;
        this.bounds.height = opts.height || 1;

        this.text(opts.text);
    }

    text(): string;
    text(v: string): this;
    text(v?: string): this | string {
        if (v === undefined) return this._text;

        this._text = v;
        let w = this._fixedWidth ? this.bounds.width : 100;
        this._lines = GWU.text.splitIntoLines(this._text, w);
        if (!this._fixedWidth) {
            this.bounds.width = this._lines.reduce(
                (out, line) => Math.max(out, GWU.text.length(line)),
                0
            );
        }
        if (this._fixedHeight) {
            if (this._lines.length > this.bounds.height) {
                this._lines.length = this.bounds.height;
            }
        } else {
            this.bounds.height = Math.max(1, this._lines.length);
        }

        this.layer.needsDraw = true;
        return this;
    }

    resize(w: number, h: number): this {
        super.resize(w, h);
        this._fixedWidth = w > 0;
        this._fixedHeight = h > 0;
        this.text(this._text);
        return this;
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        this._drawFill(buffer);

        let vOffset = 0;
        if (this._used.valign === 'bottom') {
            vOffset = this.bounds.height - this._lines.length;
        } else if (this._used.valign === 'middle') {
            vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
        }

        this._lines.forEach((line, i) => {
            buffer.drawText(
                this.bounds.x,
                this.bounds.y + i + vOffset,
                line,
                this._used.fg,
                -1,
                this.bounds.width,
                this._used.align
            );
        });
        return true;
    }
}

installWidget('text', (l, opts) => new Text(l, opts));

// extend Layer

export type AddTextOptions = Omit<TextOptions, 'text'> &
    SetParentOptions & { parent?: Widget };

declare module '../layer' {
    interface Layer {
        text(text: string, opts?: AddTextOptions): Text;
    }
}
Layer.prototype.text = function (
    text: string,
    opts: AddTextOptions = {}
): Text {
    const options: TextOptions = Object.assign({}, this._opts, opts, { text });
    const list = new Text(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    this.pos(list.bounds.x, list.bounds.bottom);
    return list;
};
