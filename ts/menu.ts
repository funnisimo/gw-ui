import * as GWU from 'gw-utils';
import { UICore } from '.';

export type ActionFn = (button: ActionButton) => boolean | Promise<boolean>;

interface Rec<T> {
    [keys: string]: T;
}
type DropdownConfig = Rec<ButtonConfig>;
type ActionConfig = ActionFn;
type ButtonConfig = ActionConfig | DropdownConfig;

export class Button {
    text: string;
    hovered = false;
    x = 999;

    constructor(text: string) {
        this.text = text;
    }

    get width() {
        return this.text.length;
    }
}

export class ActionButton extends Button {
    fn: ActionFn;

    constructor(text: string, fn: ActionFn) {
        super(text);
        this.fn = fn;
    }

    activate(): any {
        return this.fn(this);
    }
}

export class DropDownButton extends Button {
    bounds: GWU.xy.Bounds;
    buttons: Button[] = [];
    menu: Menu;
    parent: DropDownButton | null = null;

    constructor(
        menu: Menu,
        parent: DropDownButton | null,
        text: string,
        buttons: ButtonConfig
    ) {
        super(text);
        this.menu = menu;
        this.parent = parent;
        this.text = text;

        this.bounds = new GWU.xy.Bounds(0, 0, 0, 0);
        Object.entries(buttons).forEach(([text, opts]) => {
            this.addButton(text, opts);
        });
        this.buttons.forEach((b, i) => {
            if (b instanceof DropDownButton) {
                b.setBounds(
                    this.bounds.x,
                    this.bounds.y + i,
                    this.bounds.width
                );
            }
        });
    }

    addButton(text: string, config: ButtonConfig) {
        if (this.buttons.length >= this.menu.ui.buffer.height - 1) {
            throw new Error('Too many menu options.');
        }
        let button: Button;
        if (typeof config === 'function') {
            button = new ActionButton(text, config);
        } else {
            button = new DropDownButton(this.menu, this, text, config);
        }
        this.buttons.push(button);

        ++this.bounds.height;
        this.bounds.width = Math.max(this.bounds.width, text.length + 2);
    }

    setBounds(px: number, py: number, pwidth: number) {
        const right = px + pwidth;
        const left = px;

        const totalWidth = this.menu.ui.buffer.width;
        if (this.bounds.width < totalWidth - right) {
            this.bounds.x = right;
        } else if (this.bounds.width < left) {
            this.bounds.x = left - this.bounds.width;
        } else {
            throw new Error('Menu does not fit - too wide.');
        }

        const totalHeight = this.menu.ui.buffer.height;
        if (this.bounds.height <= totalHeight - py) {
            this.bounds.y = py;
        } else if (this.bounds.height < totalHeight) {
            this.bounds.y = totalHeight - this.bounds.height - 1;
        } else {
            throw new Error('Menu does not fit - too tall.');
        }
    }

    contains(e: GWU.io.Event) {
        return this.bounds.contains(e.x, e.y);
    }

    buttonAt(e: GWU.io.Event): Button | null {
        const index = e.y - this.bounds.y;
        return this.buttons[index] || null;
    }

    drawInto(buffer: GWU.canvas.DataBuffer) {
        const width = this.bounds.width;
        const height = this.bounds.height;
        const x = this.bounds.x;
        let y = this.bounds.y;

        buffer.fillRect(x, y, width, height, 0, 0, this.menu.hoverBg);

        // Now draw the individual buttons...
        this.buttons.forEach((b) => {
            buffer.drawText(
                x,
                y,
                b.text,
                b.hovered ? this.menu.hoverFg : this.menu.fg
            );
            ++y;
        });

        if (this.parent) {
            this.parent.drawInto(buffer);
        }
    }
}

export async function showDropDown(menu: Menu, button: DropDownButton) {
    const ui: UICore = button.menu.ui;

    // Start dialog
    const dialog = ui.startDialog();

    let activeButton: DropDownButton | null = button;
    await ui.loop.run({
        // @ts-ignore
        mousemove: (e: GWU.io.Event) => {
            if (!activeButton) return true; // we are done (should not happen)

            let newActive: DropDownButton | null = activeButton;
            while (newActive && !newActive.contains(e)) {
                newActive = newActive.parent;
            }
            if (newActive) {
                activeButton = newActive;
                const selected = activeButton.buttonAt(e);
                if (selected) {
                    activeButton.buttons.forEach((b) => {
                        b.hovered = false;
                    });
                    selected.hovered = true;
                }
            } else {
                if (menu.contains(e)) {
                    menu.needsRedraw = true;
                    const button = menu.getButtonAt(e.x, e.y);
                    if (button instanceof DropDownButton) {
                        activeButton.hovered = false;
                        activeButton = button;
                        activeButton.hovered = true;
                    } else {
                        activeButton = null; // done.
                        if (button) button.hovered = true;
                    }
                }
            }

            return !activeButton; // if no active button we are done (should not happen)
        },

        // @ts-ignore
        click: async (e: GWU.io.Event) => {
            if (!activeButton) return true; // we are done (should not happen)

            if (!activeButton.contains(e)) {
                return true; // we are done
            }

            const actionButton = activeButton.buttonAt(e);
            if (!actionButton) {
                return true; // weird, but we are done.
            }

            if (actionButton instanceof ActionButton) {
                return actionButton.activate(); // actions return true if they want to close the menu (otherwise the menu stays open)
            }
        },

        // @ts-ignore
        draw: () => {
            if (!activeButton) return;
            ui.resetDialogBuffer(dialog);
            activeButton.drawInto(dialog);
            menu.drawInto(dialog);
            dialog.render();
        },
    });

    ui.finishDialog();
    menu.needsRedraw = true;
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

    buttons: ButtonConfig;
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

        Object.entries(opts.buttons).forEach(([text, opts]) => {
            this.addButton(text, opts);
        });

        if (opts.separator) {
            this.separator = opts.separator;
        }
        if (opts.lead !== undefined) {
            this.lead = opts.lead ? opts.lead : '';
        }
    }

    contains(e: GWU.io.Event): boolean {
        return this.bounds.contains(e);
    }

    handleMouse(e: GWU.io.Event): boolean {
        // turn off all the hovers
        this.buttons.forEach((b: Button) => {
            if (b.hovered) {
                this.needsRedraw = true;
                b.hovered = false;
            }
        });

        // highlight one of them...
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
            return true; // we handled the message
        }

        return false;
    }

    getButtonAt(x: number, _y: number): Button | null {
        return GWU.arrayFindRight(this.buttons, (b) => b.x < x) || null;
    }

    async handleClick(e: GWU.io.Event): Promise<boolean> {
        if (this.bounds.contains(e.x, e.y)) {
            // get active button
            let activeButton = this.getButtonAt(e.x, e.y);
            if (!activeButton) return false;

            if (activeButton instanceof DropDownButton) {
                await showDropDown(this, activeButton);
            } else if (activeButton instanceof ActionButton) {
                await activeButton.activate();
            }

            return true;
        }
        return false;
    }

    addButton(text: string, config: ButtonConfig) {
        this.needsRedraw = true;

        const x = this.buttons.reduce(
            (len, button) => len + button.text.length + this.separator.length,
            this.lead.length + this.bounds.x
        );
        if (x + text.length + 2 > this.bounds.width) {
            throw new Error('Button makes menu too wide :' + text);
        }

        let button: Button;
        if (typeof config === 'function') {
            button = new ActionButton(text, config);
        } else {
            button = new DropDownButton(this, null, text, config);
            (<DropDownButton>button).setBounds(
                x,
                this.bounds.y ? this.bounds.y - 1 : 1,
                0
            );
        }
        button.x = x;
        this.buttons.push(button);
    }

    draw(force = false): boolean {
        if (!this.needsRedraw && !force) return false;
        const buffer = this.ui.buffer;
        return this.drawInto(buffer);
    }

    drawInto(buffer: GWU.canvas.DataBuffer): boolean {
        this.needsRedraw = false;

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

        this.buttons.forEach((b) => {
            const color = b.hovered ? this.hoverFg : this.fg;
            buffer.drawText(b.x, y, b.text, color);
            x = b.x + b.text.length;
            buffer.drawText(x, y, this.separator, this.fg);
        });

        return true;
    }
}
