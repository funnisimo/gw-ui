import * as GWU from 'gw-utils';

export type State = 'normal' | 'hover' | 'focus';

export interface TextOptions {
    text: string;

    x: number;
    y: number;
    width?: number;
    height?: number;

    style: Style;
    hover?: Style;
    focus?: Style;
}

export interface Style {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}

export class Text {
    static default = {
        fg: 'white',
        bg: -1,
        align: 'left' as GWU.text.Align,
        valign: 'top' as GWU.text.VAlign,
    };

    x = -1;
    y = -1;
    width = -1;
    height = 1;

    text = '';
    activeStyle: Style;
    normal: Style = { fg: Text.default.fg };
    hover?: Style;
    focus?: Style;

    state: State = 'normal';

    _lines: string[] = [];

    constructor(opts: TextOptions) {
        Object.assign(this, opts);

        this._lines = GWU.text.splitIntoLines(
            this.text,
            this.width > 0 ? this.width : 100
        );
        if (this.width <= 0) {
            this.width = this._lines.reduce(
                (out, line) => Math.max(out, line.length),
                0
            );
        }
        if (opts.height) {
            if (this._lines.length > opts.height) {
                this._lines.length = opts.height;
            }
        } else {
            this.height = this._lines.length;
        }

        this.activeStyle = this.normal;
    }

    contains(e: GWU.xy.XY): boolean {
        return (
            this.x <= e.x &&
            this.y <= e.y &&
            this.x + this.width > e.x &&
            this.y + this.height > e.y
        );
    }

    setState(state: State) {
        this.state = state;
        this.activeStyle = this[state] || this.normal;
    }

    fg(): GWU.color.ColorBase {
        return this.activeStyle.fg || this.normal.fg || Text.default.fg;
    }

    bg(): GWU.color.ColorBase {
        return this.activeStyle.bg || this.normal.bg || Text.default.bg;
    }

    align(): GWU.text.Align {
        return (
            this.activeStyle.align || this.normal.align || Text.default.align
        );
    }

    valign(): GWU.text.VAlign {
        return (
            this.activeStyle.valign || this.normal.valign || Text.default.valign
        );
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        buffer.fillRect(
            this.x,
            this.y,
            this.width,
            this.height,
            ' ',
            this.bg(),
            this.bg()
        );
        this._lines.forEach((line, i) => {
            buffer.drawText(
                this.x,
                this.y + i,
                line,
                this.fg(),
                -1,
                this.width,
                this.align()
            );
        });
    }
}
