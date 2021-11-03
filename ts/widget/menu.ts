import * as GWU from 'gw-utils';
import * as Widget from './widget';
// import * as Button from './button';
import * as Text from './text';
import { Layer } from '../layer';
import { installWidget } from './make';

export interface Rec<T> {
    [keys: string]: T;
}
export type DropdownConfig = Rec<ButtonConfig>;
export type ActionConfig = string;
export type ButtonConfig = ActionConfig | DropdownConfig;

export interface MenuOptions extends Widget.WidgetOptions {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
    minWidth?: number;
    marker?: string;
}

export class Menu extends Widget.Widget {
    static default = {
        tag: 'menu',
        class: '',
        buttonClass: '',
        buttonTag: 'mi',
        marker: ' \u25b6',
        minWidth: 4,
    };

    constructor(layer: Layer, opts: MenuOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || Menu.default.tag;
                opts.class = opts.class || Menu.default.class;
                return opts;
            })()
        );

        if (Array.isArray(opts.buttonClass)) {
            this.attr('buttonClass', opts.buttonClass.join(' '));
        } else {
            this.attr(
                'buttonClass',
                opts.buttonClass || Menu.default.buttonClass
            );
        }
        this.attr('buttonTag', opts.buttonTag || Menu.default.buttonTag);
        this.attr('marker', opts.marker || Menu.default.marker);

        this._initButtons(opts);
        this.bounds.height = this.children.length;

        this.on('mouseenter', (_n, _w, e) => {
            this.children.forEach((c) => {
                if (!c.contains(e)) {
                    (<MenuButton>c).collapse();
                } else {
                    (<MenuButton>c).expand();
                }
            });
            return true;
        });
    }

    _initButtons(opts: MenuOptions) {
        this.children = [];
        const buttons = opts.buttons;

        const marker = this._attrStr('marker');
        const entries = Object.entries(buttons);
        if (this.bounds.width <= 0) {
            this.bounds.width = Math.max(
                opts.minWidth || 0,
                entries.reduce((out, [key, value]) => {
                    const textLen =
                        GWU.text.length(key) +
                        (typeof value === 'string' ? 0 : marker.length);
                    return Math.max(out, textLen);
                }, 0)
            );
        }
        entries.forEach(([key, value], i) => {
            const opts: MenuButtonOptions = {
                x: this.bounds.x,
                y: this.bounds.y + i,
                class: this._attrStr('buttonClass'),
                tag: this._attrStr('buttonTag'),
                width: this.bounds.width,
                height: 1,
                depth: this.depth + 1,
                buttons: value,
                text: key,
            };

            if (typeof value === 'string') {
                opts.action = value;
            } else {
                opts.text =
                    GWU.text.padEnd(
                        key,
                        this.bounds.width - marker.length,
                        ' '
                    ) + marker;
            }
            const menuItem = new MenuButton(this.layer, opts);
            menuItem.setParent(this);
            menuItem.on('mouseenter', () => {
                this._bubbleEvent('change', menuItem);
                return false;
            });
            menuItem.setParent(this);
        });
    }

    collapse(): this {
        this.children.forEach((c) => {
            (<MenuButton>c).collapse();
        });
        return this;
    }
}

export interface MenuButtonOptions extends Widget.WidgetOptions {
    text: string;
    buttons: ButtonConfig;
}

export class MenuButton extends Text.Text {
    menu: Menu | null = null;

    constructor(layer: Layer, opts: MenuButtonOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'mi';
                return opts;
            })()
        );

        this.tag = opts.tag || 'mi';

        if (typeof opts.buttons !== 'string') {
            this.menu = this._initMenu(opts);

            this.on('mouseenter', () => {
                this.menu!.hidden = false;
                this.menu!._bubbleEvent('change', this);
                return true;
            });
            this.on('mouseleave', (_n, _w, e) => {
                if (this.parent?.contains(e)) {
                    this.menu!.hidden = true;
                    return true;
                }
                return false;
            });
            this.on('click', () => {
                return true; // eat clicks
            });
        }
    }

    collapse(): this {
        if (this.menu) {
            this.menu.collapse();
            this.menu.hidden = true;
        }
        return this;
    }

    expand(): this {
        if (this.menu) {
            this.menu.hidden = false;
        }
        return this;
    }

    _setMenuPos(xy: GWU.xy.XY, opts: MenuButtonOptions) {
        xy.x = this.bounds.x + this.bounds.width;
        xy.y = this.bounds.y;
        const height = Object.keys(opts.buttons).length;
        if (xy.y + height >= this.layer.height) {
            xy.y = this.layer.height - height - 1;
        }
    }

    _initMenu(opts: MenuButtonOptions): Menu | null {
        if (typeof opts.buttons === 'string') return null;

        const menuOpts = {
            x: this.bounds.x + this.bounds.width,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'mi',
            buttons: opts.buttons,
            depth: this.depth + 1,
        };
        this._setMenuPos(menuOpts, opts);
        const menu = new Menu(this.layer, menuOpts);
        menu.hidden = true;
        menu.setParent(this);
        return menu;
    }
}

installWidget('menu', (l, opts) => new Menu(l, opts));

// extend Layer

export type AddMenuOptions = MenuOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        menu(opts: AddMenuOptions): Menu;
    }
}
Layer.prototype.menu = function (opts: AddMenuOptions): Menu {
    const options = Object.assign({}, this._opts, opts);
    const list = new Menu(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
