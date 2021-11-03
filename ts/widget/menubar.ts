import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { Layer } from '../layer';
import { installWidget } from './make';
import { DropdownConfig, Menu, ButtonConfig } from './menu';
import * as Text from './text';

export interface MenubarOptions extends Widget.WidgetOptions {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;

    menuClass?: string | string[];
    menuTag?: string;

    minWidth?: number;
    prefix?: string;
    separator?: string;
}

export class Menubar extends Widget.Widget {
    static default = {
        buttonClass: '',
        buttonTag: 'mi',

        menuClass: '',
        menuTag: 'mi',

        prefix: ' ',
        separator: ' | ',
    };

    _config!: DropdownConfig;
    _buttons: MenubarButton[] = [];
    _selectedIndex = -1;

    constructor(layer: Layer, opts: MenubarOptions) {
        super(
            layer,
            (() => {
                opts.tabStop = true;
                opts.tag = opts.tag || 'menu';
                return opts;
            })()
        );
        if (opts.buttonClass) {
            if (Array.isArray(opts.buttonClass)) {
                this.attr('buttonClass', opts.buttonClass.join(' '));
            } else {
                this.attr('buttonClass', opts.buttonClass);
            }
        } else {
            this.attr('buttonClass', Menubar.default.buttonClass);
        }
        this.attr('buttonTag', opts.buttonTag || Menubar.default.buttonTag);

        if (opts.menuClass) {
            if (Array.isArray(opts.menuClass)) {
                this.attr('menuClass', opts.menuClass.join(' '));
            } else {
                this.attr('menuClass', opts.menuClass);
            }
        } else {
            this.attr('menuClass', Menubar.default.menuClass);
        }
        this.attr('menuTag', opts.menuTag || Menubar.default.menuTag);

        this.attr('prefix', opts.prefix || Menubar.default.prefix);
        this.attr('separator', opts.separator || Menubar.default.separator);

        this._initButtons(opts);
        this.on('click', this._buttonClick.bind(this));
    }

    get selectedIndex(): number {
        return this._selectedIndex;
    }
    set selectedIndex(v: number) {
        if (this._selectedIndex >= 0) {
            this._buttons[this._selectedIndex].prop('focus', false).collapse();
        }
        this._selectedIndex = v;
        if (v >= 0 && v < this._buttons.length) {
            this._buttons[v].prop('focus', true).expand();
        } else {
            this._selectedIndex = -1;
        }
    }

    get selectedButton(): Widget.Widget {
        return this._buttons[this._selectedIndex];
    }

    focus(reverse = false): boolean {
        if (reverse) {
            this.selectedIndex = this._buttons.length - 1;
        } else {
            this.selectedIndex = 0;
        }
        return super.focus(reverse);
    }

    blur(reverse = false): boolean {
        this.selectedIndex = -1;
        return super.blur(reverse);
    }

    collapse(): this {
        this._buttons.forEach((b) => b.collapse());
        return this;
    }

    keypress(e: GWU.io.Event): boolean {
        if (!e.key) return false;
        if (!this.focused) return false;

        if (e.key === 'Tab') {
            this.selectedIndex += 1;
            return this._selectedIndex >= 0;
        } else if (e.key === 'TAB') {
            this.selectedIndex -= 1;
            return this._selectedIndex >= 0;
        }
        return false;
    }

    mousemove(e: GWU.io.Event): boolean {
        if (!this.contains(e) || !this.focused) return super.mousemove(e);
        const active = this._buttons.findIndex((c) => c.contains(e));
        if (active < 0 || active === this._selectedIndex) return false;
        this.selectedIndex = active;
        return true;
    }

    _initButtons(opts: MenubarOptions) {
        this._config = opts.buttons;

        const entries = Object.entries(this._config);

        const buttonTag = this._attrStr('buttonTag');
        const buttonClass = this._attrStr('buttonClass');
        let x = this.bounds.x;
        const y = this.bounds.y;
        entries.forEach(([key, value], i) => {
            const prefix =
                i == 0 ? this._attrStr('prefix') : this._attrStr('separator');
            this.layer.text(prefix, { x, y, parent: this });
            x += prefix.length;

            const button = new MenubarButton(this.layer, {
                text: key,
                x,
                y,
                tag: buttonTag,
                class: buttonClass,
                depth: this.depth + 1,
                buttons: value,
                // data: value,
            });
            button.setParent(this);
            this._buttons.push(button);
            x += button.bounds.width;
        });
    }

    _buttonClick(_action: string, button: Widget.Widget | null): boolean {
        if (!button) return false;
        this.layer.setFocusWidget(this);
        console.log('clicked = ' + button.text(), button._attrStr('action'));

        const barButton = button as MenubarButton;
        this.selectedIndex = this._buttons.indexOf(barButton);
        if (barButton.menu) {
            barButton.expand();
        } else {
            this.collapse();
        }
        return true;
    }
}

installWidget('menubar', (l, opts) => new Menubar(l, opts));

export interface MenubarButtonOptions extends Widget.WidgetOptions {
    text: string;
    buttons: ButtonConfig;
}

export class MenubarButton extends Text.Text {
    menu: Menu | null = null;

    constructor(layer: Layer, opts: MenubarButtonOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'mi';
                if (typeof opts.buttons === 'string') {
                    opts.action = opts.buttons;
                }
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

    _setMenuPos(xy: GWU.xy.XY, opts: MenubarButtonOptions) {
        xy.x = this.bounds.x;
        const height = opts.height || Object.keys(opts.buttons).length;
        if (this.bounds.y < height) {
            xy.y = this.bounds.y + 1;
        } else {
            xy.y = this.bounds.top - height;
        }
    }

    _initMenu(opts: MenubarButtonOptions): Menu | null {
        if (typeof opts.buttons === 'string') return null;

        const menuOpts = {
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'mi',
            height: opts.height,
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

// extend Layer

export type AddMenubarOptions = MenubarOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        menubar(opts?: AddMenubarOptions): Menubar;
    }
}
Layer.prototype.menubar = function (opts: AddMenubarOptions): Menubar {
    const options: MenubarOptions = Object.assign({}, this._opts, opts);
    const menubar = new Menubar(this, options);
    if (opts.parent) {
        menubar.setParent(opts.parent, opts);
    }
    return menubar;
};

// MENU

export class MenuViewer extends Widget.Widget {
    menubar: Menubar;
    mainMenu: Menu;

    constructor(menubar: Menubar, buttons: DropdownConfig) {
        super(menubar.layer, {
            tabStop: true,
            x: 0,
            y: 0,
            width: menubar.layer.width,
            height: menubar.layer.height,
            // @ts-ignore
            tag: menubar.attr('menuTag'),
            // @ts-ignore
            class: menubar.attr('menuClass'),
        });
        this.menubar = menubar;
        this.mainMenu = this._initMenu(buttons);
    }
    contains(): boolean {
        return true;
    }

    finish() {
        this.layer.finish();
    }

    _initMenu(buttons: DropdownConfig): Menu {
        return new Menu(this.layer, {
            buttonTag: this.menubar._attrStr('buttonTag'),
            buttonClass: this.menubar._attrStr('buttonClass'),
            minWidth: this.menubar.selectedButton.bounds.width,
            buttons,
        });
    }

    keypress(e: GWU.io.Event): boolean {
        if (!e.key) return false;

        if (e.key === 'Escape') {
            this.finish();
            return true;
        } else if (e.key === 'Tab') {
            this.finish();
            this.menubar.keypress(e);
            return true;
        } else if (e.key === 'TAB') {
            this.finish();
            this.menubar.keypress(e);
            return true;
        }
        return false;
    }
}
