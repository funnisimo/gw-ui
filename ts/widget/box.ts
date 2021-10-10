import * as GWU from 'gw-utils';
import * as Widget from './widget';

export interface BoxOptions extends Omit<Widget.WidgetOptions, 'text'> {
    title?: string;
    borderBg?: GWU.color.ColorBase;

    pad?: number;
    padX?: number;
    padY?: number;
}

export class Box extends Widget.Widget {
    borderBg!: GWU.color.ColorBase | null;

    constructor(id: string, opts?: BoxOptions) {
        super(
            id,
            (() => {
                if (!opts) return opts;
                if (opts.depth === undefined) opts.depth = -10; // hide behind other widgets
                if (opts.title) (<Widget.WidgetOptions>opts).text = opts.title;
                opts.bg = opts.bg || 'gray';
                return opts;
            })()
        );
    }

    init(opts: BoxOptions) {
        super.init(opts);
        this.borderBg = opts.borderBg || null;
    }

    // EVENTS

    // box is completely idle
    mousemove(
        _e: GWU.io.Event,
        _dialog: Widget.WidgetRunner
    ): boolean | Promise<boolean> {
        return false;
    }

    // DRAW

    draw(buffer: GWU.canvas.DataBuffer): void {
        const fg = this.active
            ? this.activeFg
            : this.hovered
            ? this.hoverFg
            : this.fg;
        const bg = this.active
            ? this.activeBg
            : this.hovered
            ? this.hoverBg
            : this.bg;

        // Draw dialog
        if (this.borderBg) {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height,
                ' ',
                this.borderBg,
                this.borderBg
            );
            buffer.fillRect(
                this.bounds.x + 1,
                this.bounds.y + 1,
                this.bounds.width - 2,
                this.bounds.height - 2,
                ' ',
                bg,
                bg
            );
        } else {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height,
                ' ',
                bg,
                bg
            );
        }

        if (this.text) {
            buffer.drawText(
                this.bounds.x,
                this.bounds.y,
                this.text,
                fg,
                -1,
                this.bounds.width,
                'center'
            );
        }
    }
}
