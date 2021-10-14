import * as GWU from 'gw-utils';
import { UICore } from '../types';

export type VAlign = 'top' | 'middle' | 'bottom';

export interface PosOptions {
    x?: number;
    y?: number;
    right?: number;
    bottom?: number;
}

export interface WidgetRunner {
    readonly ui: UICore;
    fireAction(action: string, widget: Widget): void | Promise<void>;
    requestRedraw(): void;
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

    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;

    text?: string;

    align?: GWU.text.Align;
    valign?: VAlign;

    tabStop?: boolean;
    action?: string;
    depth?: number;
}

export abstract class Widget {
    bounds: GWU.xy.Bounds;

    active = false;
    hovered = false;
    tabStop = false;

    depth = 0;

    fg: GWU.color.ColorBase = 0xfff;
    bg: GWU.color.ColorBase = -1;

    activeFg: GWU.color.ColorBase = 0xfff;
    activeBg: GWU.color.ColorBase = -1;

    hoverFg: GWU.color.ColorBase = 0xfff;
    hoverBg: GWU.color.ColorBase = -1;

    id: string;
    text: string = '';

    align: GWU.text.Align = 'left';
    valign: VAlign = 'middle';

    // parent!: WidgetContainer;
    action!: string;

    constructor(id: string, opts?: WidgetOptions) {
        this.bounds = new GWU.xy.Bounds(-1, -1, -1, -1); // nothing set
        this.id = id;
        if (opts) this.init(opts);
        this.reset();
    }

    init(opts: WidgetOptions) {
        if (opts.x !== undefined) this.bounds.x = opts.x;
        if (opts.y !== undefined) this.bounds.y = opts.y;
        if (opts.width !== undefined) this.bounds.width = opts.width;
        if (opts.height !== undefined) this.bounds.height = opts.height;
        if (opts.depth !== undefined) this.depth = opts.depth;

        if (opts.text) {
            this.text = opts.text;
            if (this.bounds.width <= 0) this.bounds.width = opts.text.length;
            if (this.bounds.height <= 0) this.bounds.height = 1;
        }
        if (this.bounds.height <= 0) this.bounds.height = 1;
        if (opts.fg !== undefined) {
            this.fg = opts.fg;
            this.activeFg = opts.fg;
            this.hoverFg = opts.fg;
        }
        if (opts.bg !== undefined) {
            this.bg = opts.bg;
            this.activeBg = opts.bg;
            this.hoverBg = opts.bg;
        }
        if (opts.activeFg !== undefined) {
            this.activeFg = opts.activeFg;
            this.hoverFg = opts.activeFg;
        }
        if (opts.activeBg !== undefined) {
            this.activeBg = opts.activeBg;
            this.hoverBg = opts.activeBg;
        }
        if (opts.hoverFg !== undefined) this.hoverFg = opts.hoverFg;
        if (opts.hoverBg !== undefined) this.hoverBg = opts.hoverBg;

        if (opts.tabStop !== undefined) this.tabStop = opts.tabStop;
        this.action = opts.action || this.id;
    }

    reset() {}

    activate(_reverse = false) {
        this.active = true;
    }
    deactivate() {
        this.active = false;
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(x: GWU.xy.XY | number, y?: number): boolean {
        if (arguments.length == 1) return this.bounds.contains(x as GWU.xy.XY);
        return this.bounds.contains(x as number, y!);
    }

    // EVENTS

    // returns true if mouse is over this widget
    mousemove(
        e: GWU.io.Event,
        _dialog: WidgetRunner
    ): boolean | Promise<boolean> {
        this.hovered = this.contains(e);
        return this.hovered;
    }

    tick(_e: GWU.io.Event, _dialog: WidgetRunner): void | Promise<void> {}

    // returns true if click is handled by this widget (stopPropagation)
    click(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean> {
        return false;
    }

    // returns true if key is used by widget and you want to stopPropagation
    keypress(
        _e: GWU.io.Event,
        _dialog: WidgetRunner
    ): boolean | Promise<boolean> {
        return false;
    }

    // returns true if key is used by widget and you want to stopPropagation
    dir(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean> {
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
        const textLen = GWU.text.length(this.text);

        if (this.bounds.width > textLen || this.bounds.height > 1) {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
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

        buffer.drawText(x, y, this.text, fg, bg);
    }
}
