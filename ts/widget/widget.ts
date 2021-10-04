import * as GWU from 'gw-utils';

export type Align = 'left' | 'center' | 'right';
export type VAlign = 'top' | 'middle' | 'bottom';

export interface WidgetContainer {
    fireAction(action: string, widget: Widget): void | Promise<void>;
}

export interface WidgetOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;

    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;

    activeFg?: GWU.color.ColorBase;
    activeBg?: GWU.color.ColorBase;

    text?: string;

    align?: Align;
    valign?: VAlign;

    tabStop?: boolean;
    action?: string;
}

export abstract class Widget {
    bounds: GWU.xy.Bounds;
    active = false;
    tabStop = false;

    fg: GWU.color.ColorBase = 0xfff;
    bg: GWU.color.ColorBase = -1;

    activeFg: GWU.color.ColorBase = 0xfff;
    activeBg: GWU.color.ColorBase = -1;

    id: string;
    text: string = '';

    align: Align = 'left';
    valign: VAlign = 'middle';

    parent!: WidgetContainer;
    action!: string;

    constructor(id: string, opts?: WidgetOptions) {
        this.bounds = new GWU.xy.Bounds(0, 0, 0, 0);
        this.id = id;
        if (opts) this.init(opts);
        this.reset();
    }

    init(opts: WidgetOptions) {
        if (opts.x !== undefined) this.bounds.x = opts.x;
        if (opts.y !== undefined) this.bounds.y = opts.y;
        if (opts.width !== undefined) this.bounds.width = opts.width;
        if (opts.height !== undefined) this.bounds.height = opts.height;

        if (opts.text) {
            this.text = opts.text;
            if (!this.bounds.width) this.bounds.width = opts.text.length;
            if (!this.bounds.height) this.bounds.height = 1;
        }
        if (opts.fg !== undefined) {
            this.fg = opts.fg;
            this.activeFg = opts.fg;
        }
        if (opts.bg !== undefined) {
            this.bg = opts.bg;
            this.activeBg = opts.bg;
        }
        if (opts.activeFg !== undefined) this.activeFg = opts.activeFg;
        if (opts.activeBg !== undefined) this.activeBg = opts.activeBg;

        if (opts.tabStop !== undefined) this.tabStop = opts.tabStop;
        this.action = opts.action || this.id;
    }

    reset() {}

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(x: GWU.xy.XY | number, y?: number): boolean {
        if (arguments.length == 1) return this.bounds.contains(x as GWU.xy.XY);
        return this.bounds.contains(x as number, y!);
    }

    // returns true if mouse is over this widget
    mousemove(x: number, y: number): boolean | Promise<boolean> {
        this.active = this.contains(x, y);
        return this.active;
    }

    tick(_e: GWU.io.Event): void | Promise<void> {}

    // returns true if click is handled by this widget (stopPropagation)
    click(_e: GWU.io.Event): boolean | Promise<boolean> {
        return false;
    }

    // returns true if key is used by widget and you want to stopPropagation
    keypress(_e: GWU.io.Event): boolean | Promise<boolean> {
        return false;
    }

    draw(buffer: GWU.canvas.DataBuffer, offsetX = 0, offsetY = 0): void {
        const fg = this.active ? this.activeFg : this.fg;
        const bg = this.active ? this.activeBg : this.bg;
        const textLen = GWU.text.length(this.text);

        if (this.bounds.width > textLen || this.bounds.height > 1) {
            buffer.fillRect(
                this.bounds.x + offsetX,
                this.bounds.y + offsetY,
                this.bounds.width,
                this.bounds.height,
                ' ',
                fg,
                bg
            );
        }

        let x = this.bounds.x;
        if (this.align == 'center') {
            x += Math.floor((this.bounds.width - textLen) / 2);
        } else if (this.align == 'right') {
            x += this.bounds.width - textLen;
        }

        let y = this.bounds.y; // 'top'
        if (this.bounds.height > 1) {
            if (this.valign == 'middle') {
                y += Math.floor(this.bounds.height / 2);
            } else if (this.valign == 'bottom') {
                y += this.bounds.height - 1;
            }
        }

        buffer.drawText(x + offsetX, y + offsetX, this.text, fg, bg);
    }
}
