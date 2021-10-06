import * as GWU from 'gw-utils';
import { UICore } from './types';
import * as Widget from './widget';

export type ActionFn = (
    e: GWU.io.Event,
    ui: UICore,
    button: Button
) => boolean | Promise<boolean>;

interface Rec<T> {
    [keys: string]: T;
}
type DropdownConfig = Rec<ButtonConfig>;
type ActionConfig = ActionFn | string;
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

    activate(e: GWU.io.Event, ui: UICore): any {
        return this.fn(e, ui, this);
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
    }

    addButton(text: string, config: ButtonConfig) {
        // if (this.buttons.length >= this.menu.bounds.height - 1) {
        //     throw new Error('Too many menu options.');
        // }
        let button: Button;
        if (typeof config === 'function') {
            button = new ActionButton(text, config);
        } else if (typeof config === 'string') {
            button = new ActionButton(text, () => {
                const r = this.menu.parent.fireAction(config, this.menu);
                if (r && r.then) {
                    return r.then(() => true);
                }
                return true;
            });
        } else {
            button = new DropDownButton(this.menu, this, text, config);
        }
        this.buttons.push(button);

        ++this.bounds.height;
        this.bounds.width = Math.max(this.bounds.width, text.length + 2);
    }

    setBounds(
        buffer: GWU.canvas.DataBuffer,
        px: number,
        py: number,
        pw: number
    ) {
        // vertical reveal
        const right = px + pw;
        const totalWidth = buffer.width;
        if (this.bounds.width < totalWidth - right) {
            this.bounds.x = right;
        } else if (this.bounds.width < px) {
            this.bounds.x = px - this.bounds.width;
        } else {
            throw new Error('Menu does not fit - too wide.');
        }

        const totalHeight = buffer.height;
        if (this.bounds.height <= totalHeight - py) {
            this.bounds.y = py;
        } else if (this.bounds.height < totalHeight) {
            this.bounds.y = totalHeight - this.bounds.height - 1;
        } else {
            throw new Error('Menu does not fit - too tall.');
        }

        // this.buttons.forEach((b) => {
        //     if (b instanceof DropDownButton) {
        //         b.setBounds(buffer);
        //     }
        // });
    }

    contains(e: GWU.io.Event) {
        return this.bounds.contains(e);
    }

    buttonAt(e: GWU.io.Event): Button | null {
        const index = e.y - this.bounds.y;
        return this.buttons[index] || null;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        const width = this.bounds.width;
        const height = this.bounds.height;
        const x = this.bounds.x;
        let y = this.bounds.y;

        buffer.fillRect(x, y, width, height, 0, 0, this.menu.dropBg);

        // Now draw the individual buttons...
        this.buttons.forEach((b) => {
            buffer.drawText(
                x + 1,
                y,
                b.text,
                b.hovered ? this.menu.activeFg : this.menu.dropFg,
                b.hovered ? this.menu.activeBg : this.menu.dropBg
            );
            ++y;
        });

        if (this.parent) {
            this.parent.draw(buffer);
        }
    }
}

export async function showDropDown(
    menu: Menu,
    button: DropDownButton,
    ui: UICore
) {
    // Start dialog
    const dialog = ui.startLayer();

    let activeButton: DropDownButton | null = button;
    await ui.loop.run({
        Escape() {
            return true;
        },

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
                    if (selected instanceof DropDownButton) {
                        selected.buttons.forEach((b) => {
                            b.hovered = false;
                        });
                        selected.setBounds(
                            ui.buffer,
                            activeButton.bounds.x,
                            e.y,
                            activeButton.bounds.width
                        );
                        activeButton = selected;
                    }
                }
            } else {
                if (menu.contains(e)) {
                    if (menu.parent) menu.parent.requestRedraw();
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

        click: async (e: GWU.io.Event) => {
            if (!activeButton) return true; // we are done (should not happen)

            if (!activeButton.contains(e)) {
                menu.clearHighlight();
                return true; // we are done
            }

            const actionButton = activeButton.buttonAt(e);
            if (!actionButton) {
                return true; // weird, but we are done.
            }

            if (actionButton instanceof ActionButton) {
                return actionButton.activate(e, ui); // actions return true if they want to close the menu (otherwise the menu stays open)
            }
        },

        draw: () => {
            if (!activeButton) return;
            ui.resetLayerBuffer(dialog);
            activeButton.draw(dialog);
            menu.draw(dialog);
            dialog.render();
        },
    });

    ui.finishLayer();
    menu.clearHighlight();
}

export interface MenuOptions extends Widget.WidgetOptions {
    separator?: string;
    lead?: string;

    dropFg?: GWU.color.ColorBase;
    dropBg?: GWU.color.ColorBase;

    buttons: ButtonConfig;
}

export class Menu extends Widget.Widget {
    buttons!: Button[];

    separator!: string;
    lead!: string;

    dropFg!: GWU.color.Color;
    dropBg!: GWU.color.Color;

    constructor(id: string, opts?: MenuOptions) {
        super(id, opts);
    }

    init(opts: MenuOptions) {
        opts.fg = opts.fg ?? 'black';
        opts.bg = opts.bg ?? 'light_gray';
        opts.height = opts.height || 1;

        super.init(opts);

        this.dropFg = GWU.color.from(opts.dropFg || this.fg);
        this.dropBg = GWU.color.from(opts.dropBg || this.bg);

        this.buttons = [];
        this.separator = opts.separator || ' | ';
        this.lead = opts.lead || ' ';

        Object.entries(opts.buttons).forEach(([text, opts]) => {
            this._addButton(text, opts);
        });

        if (opts.separator) {
            this.separator = opts.separator;
        }
        if (opts.lead !== undefined) {
            this.lead = opts.lead ? opts.lead : '';
        }
    }

    mousemove(e: GWU.io.Event): boolean {
        // turn off all the hovers
        this.buttons.forEach((b: Button) => {
            if (b.hovered) {
                b.hovered = false;
            }
        });

        // highlight one of them...
        if (this.bounds.contains(e)) {
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
            if (this.parent) this.parent.requestRedraw();
            return true; // we handled the message
        }

        return false;
    }

    clearHighlight() {
        this.buttons.forEach((b) => {
            b.hovered = false;
        });
        if (this.parent) this.parent.requestRedraw();
    }

    getButtonAt(x: number, _y: number): Button | null {
        return GWU.arrayFindRight(this.buttons, (b) => b.x < x) || null;
    }

    async click(e: GWU.io.Event, ui: UICore): Promise<boolean> {
        if (this.bounds.contains(e)) {
            // get active button
            let activeButton = this.getButtonAt(e.x, e.y);
            if (!activeButton) return false;

            if (activeButton instanceof DropDownButton) {
                await showDropDown(this, activeButton, ui);
            } else if (activeButton instanceof ActionButton) {
                await activeButton.activate(e, ui);
            }

            return true;
        }
        return false;
    }

    protected _addButton(text: string, config: ButtonConfig) {
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
            const dropdown = new DropDownButton(this, null, text, config);
            dropdown.bounds.x = x;
            if (this.bounds.y) {
                dropdown.bounds.y = this.bounds.y - dropdown.bounds.height;
            } else {
                dropdown.bounds.y = this.bounds.y + 1;
            }
            button = dropdown;
        }
        button.x = x;
        this.buttons.push(button);
    }

    draw(buffer: GWU.canvas.DataBuffer): boolean {
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            1,
            0,
            0,
            this.bg
        );

        let x = this.bounds.x;
        const y = this.bounds.y;
        buffer.drawText(x, y, this.lead, this.fg);

        this.buttons.forEach((b) => {
            const color = b.hovered ? this.activeFg : this.fg;
            const bgColor = b.hovered ? this.activeBg : this.bg;
            buffer.drawText(b.x, y, b.text, color, bgColor);
            x = b.x + b.text.length;
            buffer.drawText(x, y, this.separator, this.fg);
        });

        return true;
    }
}
