import * as GWU from 'gw-utils';
import * as Widget from './widget';

export interface TextOptions extends Widget.WidgetOptions {
    wrap?: number;
}

export class Text extends Widget.Widget {
    lines!: string[];
    wrap!: boolean;

    constructor(id: string, opts?: TextOptions) {
        super(id, opts);
    }

    init(opts: TextOptions) {
        // if (!opts.text)
        //     throw new Error(
        //         'Must have text value in config for Text widget - ' + this.id
        //     );

        this.text = opts.text || '';
        if (opts.wrap) {
            this.wrap = true;
            opts.width = opts.wrap;
            this.lines = GWU.text.splitIntoLines(
                this.text,
                // @ts-ignore
                opts.width
            );
        } else {
            const textLen = GWU.text.length(this.text);
            opts.width = opts.width || textLen || 10;
            if (opts.width < textLen) {
                opts.text = GWU.text.truncate(this.text, opts.width);
            }
            this.lines = [this.text];
        }

        opts.height = Math.max(this.lines.length, opts.height || 1);

        super.init(opts);
    }

    setText(text: string) {
        this.text = text;
        if (this.wrap) {
            this.lines = GWU.text.splitIntoLines(this.text, this.bounds.width);
        } else {
            const textLen = GWU.text.length(this.text);
            if (textLen > this.bounds.width) {
                this.text = GWU.text.truncate(this.text, this.bounds.width);
            }
            this.lines = [this.text];
        }
    }

    // TODO - get text() {}, set text(v:string) { // do lines stuff }

    draw(buffer: GWU.canvas.DataBuffer) {
        const fg = this.active ? this.activeFg : this.fg;
        const bg = this.active ? this.activeBg : this.bg;

        this.lines.forEach((line, i) => {
            buffer.drawText(
                this.bounds.x,
                this.bounds.y + i,
                line,
                fg,
                bg,
                this.bounds.width
            );
        });
    }
}
