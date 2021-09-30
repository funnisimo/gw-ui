import * as GWU from 'gw-utils';
import { UICore } from '.';

export type ButtonFn = (button: Button) => Promise<boolean>;

export interface ButtonOptions {
    text: string;
    fn: ButtonFn;
}

export class Button {
    menu: Menu;
    text: string;
    fn: ButtonFn;
    x = -1;
    hovered = false;

    constructor(menu: Menu, opts: ButtonOptions) {
        this.menu = menu;
        this.text = opts.text;
        this.fn = opts.fn || GWU.NOOP;
    }

    contains(_e: GWU.io.Event): boolean {
        return false;
    }

    handleMouse(_e: GWU.io.Event): boolean {
        return false;
    }

    async click() {
        await this.fn(this);
    }

    draw(buffer: GWU.canvas.DataBuffer, x: number, y: number): number {
        const color = this.hovered ? this.menu.hoverFg : this.menu.fg;
        const len = GWU.text.length(this.text);
        buffer.drawText(x, y, this.text, color);
        return x + len;
    }
}

export interface MenuOptions {
    ui: UICore;

    x: number;
    y: number;
    width: number;
    // height = 1;

    separator?: string;
    lead?: string;

    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;

    buttons?:
        | ButtonOptions[]
        | Record<string, ButtonFn | Omit<ButtonOptions, 'text'>>;
}

export class Menu {
    bounds: GWU.xy.Bounds;
    buttons: Button[] = [];
    ui: UICore;

    separator = ' | ';
    lead = ' ';

    fg: GWU.color.Color;
    bg: GWU.color.Color;
    hoverFg: GWU.color.Color;
    hoverBg: GWU.color.Color;

    needsRedraw = false;

    constructor(opts: MenuOptions) {
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, 1);
        this.ui = opts.ui;
        this.needsRedraw = true;

        this.fg = GWU.color.from(opts.fg || 'white');
        this.bg = GWU.color.from(opts.bg || 'black');
        this.hoverFg = GWU.color.from(opts.hoverFg || 'teal');
        this.hoverBg = GWU.color.from(opts.hoverBg || 'black');

        if (opts.buttons) {
            if (Array.isArray(opts.buttons)) {
                opts.buttons.forEach((b) => this.addButton(b));
            } else {
                Object.entries(opts.buttons).forEach(([text, opts]) => {
                    if (typeof opts === 'function') {
                        opts = { fn: opts };
                    }
                    (<ButtonOptions>opts).text = text;
                    this.addButton(opts as ButtonOptions);
                });
            }
        }
        if (opts.separator) {
            this.separator = opts.separator;
        }
        if (opts.lead !== undefined) {
            this.lead = opts.lead ? opts.lead : '';
        }
    }

    contains(e: GWU.io.Event): boolean {
        if (this.bounds.contains(e.x, e.y)) return true;
        return this.buttons.some((b) => b.contains(e));
    }

    handleMouse(e: GWU.io.Event): boolean {
        if (this.bounds.contains(e.x, e.y)) {
            this.needsRedraw = true;
            let hovered: Button | null = null;
            this.buttons.forEach((b) => {
                b.hovered = false;
                if (b.x < e.x) {
                    hovered = b;
                }
            });

            if (hovered) {
                // @ts-ignore
                hovered.hovered = true;
            }
            return true;
        }

        for (let b of this.buttons) {
            if (b.contains(e)) {
                return b.handleMouse(e);
            }
        }
        this.buttons.forEach((b: Button) => {
            if (b.hovered) {
                this.needsRedraw = true;
                b.hovered = false;
            }
        });
        return false;
    }

    async handleClick(e: GWU.io.Event): Promise<boolean> {
        if (this.bounds.contains(e.x, e.y)) {
            let clicked: Button | null = null;
            this.buttons.forEach((b) => {
                if (b.x < e.x) {
                    clicked = b;
                }
            });

            this.needsRedraw = true;
            if (clicked) {
                // @ts-ignore
                await clicked.click();
                return true;
            }
        }
        return false;
    }

    addButton(opts: ButtonOptions) {
        this.needsRedraw = true;

        const length = this.buttons.reduce(
            (len, button) => len + button.text.length + 2,
            0
        );
        if (length + opts.text.length + 2 > this.bounds.width) {
            throw new Error('Button makes menu too wide :' + opts.text);
        }
        const button = new Button(this, opts);
        this.buttons.push(button);
    }

    draw(): boolean {
        if (!this.needsRedraw) return false;
        this.needsRedraw = false;

        const buffer = this.ui.buffer;
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            1,
            0,
            0,
            0
        );

        let x = this.bounds.x;
        const y = this.bounds.y;
        buffer.drawText(x, y, this.lead, this.fg);
        x += this.lead.length;

        this.buttons.forEach((b) => {
            b.x = x;
            x = b.draw(buffer, x, y);
            buffer.drawText(x, y, this.separator, this.fg);
            x += this.separator.length;
        });
        return true;
    }
}
