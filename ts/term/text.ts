import * as GWU from 'gw-utils';
import { Widget, WidgetOptions } from './widget';
import { Term } from './term';

export interface TextOptions extends WidgetOptions {}

export class Text extends Widget {
    _text = '';
    _lines: string[] = [];
    _fixedWidth = false;
    _fixedHeight = false;

    constructor(term: Term, text: string, opts: TextOptions = {}) {
        super(term, opts);
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
        this.bounds.width = opts.width || 0;
        this.bounds.height = opts.height || 1;

        this.text(text);
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
            this.bounds.height = this._lines.length;
        }

        this.term.needsDraw = true;
        return this;
    }

    _draw(buffer: GWU.canvas.DataBuffer, _force = false): boolean {
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
