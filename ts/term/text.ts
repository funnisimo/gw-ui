import * as GWU from 'gw-utils';
import { Widget, WidgetOptions } from './widget';
import { Term } from './term';

export interface TextOptions extends WidgetOptions {}

export class Text extends Widget {
    text = '';
    _lines: string[] = [];

    constructor(term: Term, text: string, opts: TextOptions = {}) {
        super(term, opts);
        this.text = text;
        this.bounds.width = opts.width || 0;

        this._lines = GWU.text.splitIntoLines(
            this.text,
            this.bounds.width > 0 ? this.bounds.width : 100
        );
        if (this.bounds.width <= 0) {
            this.bounds.width = this._lines.reduce(
                (out, line) => Math.max(out, line.length),
                0
            );
        }
        if (opts.height) {
            if (this._lines.length > opts.height) {
                this._lines.length = opts.height;
            }
        } else {
            this.bounds.height = this._lines.length;
        }
    }

    draw(buffer: GWU.canvas.DataBuffer, parentX = 0, parentY = 0) {
        if (!this.needsDraw) return;
        this.needsDraw = false;

        buffer.fillRect(
            this.bounds.x + parentX,
            this.bounds.y + parentY,
            this.bounds.width,
            this.bounds.height,
            ' ',
            this._used.bg,
            this._used.bg
        );
        this._lines.forEach((line, i) => {
            buffer.drawText(
                this.bounds.x + parentX,
                this.bounds.y + i + parentY,
                line,
                this._used.fg,
                -1,
                this.bounds.width,
                this._used.align
            );
        });
    }
}
