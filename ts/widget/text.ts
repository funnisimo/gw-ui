import * as GWU from 'gw-utils';
import * as Widget from './widget';

export interface TextOptions extends Widget.WidgetOptions {
    wrap?: number;
}

export class Text extends Widget.Widget {
    // @ts-ignore
    lines: string[];

    constructor(id: string, opts?: TextOptions) {
        super(id, opts);
    }

    init(opts: TextOptions) {
        if (!opts.text)
            throw new Error(
                'Must have text value in config for Text widget - ' + this.id
            );
        if (opts.wrap) {
            opts.width = opts.wrap;
            this.lines = GWU.text.splitIntoLines(
                opts.text,
                // @ts-ignore
                opts.width
            );
        } else {
            const textLen = GWU.text.length(opts.text);
            opts.width = opts.width || textLen;
            if (opts.width < textLen) {
                opts.text = GWU.text.truncate(opts.text, opts.width);
            }
            this.lines = [opts.text];
        }

        opts.height = Math.max(this.lines.length, opts.height || 1);

        super.init(opts);
    }

    draw(buffer: GWU.canvas.DataBuffer, offsetX = 0, offsetY = 0) {
        const fg = this.active ? this.activeFg : this.fg;
        const bg = this.active ? this.activeBg : this.bg;

        this.lines.forEach((line, i) => {
            buffer.drawText(
                this.bounds.x + offsetX,
                this.bounds.y + i + offsetY,
                line,
                fg,
                bg,
                this.bounds.width
            );
        });
    }
}
