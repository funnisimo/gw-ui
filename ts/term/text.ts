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
                (out, line) => Math.max(out, GWU.text.length(line)),
                0
            );
        }
        if (opts.height) {
            if (this._lines.length > opts.height) {
                this._lines.length = opts.height;
            }
            this.bounds.height = opts.height;
        } else {
            this.bounds.height = this._lines.length;
        }
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        if (!this.needsDraw) return;
        this.needsDraw = false;

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
    }
}
