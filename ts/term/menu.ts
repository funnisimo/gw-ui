import * as GWU from 'gw-utils';
import * as Widget from './widget';
import * as Text from './text';
import { Term } from './term';

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
}

export class Menu extends Widget.WidgetGroup {
    buttonClass: string | string[];
    buttonTag: string;

    constructor(term: Term, opts: MenuOptions) {
        super(term, opts);

        this.tag = opts.tag || 'menu';
        this.buttonClass = opts.buttonClass || '';
        this.buttonTag = opts.buttonTag || 'mi';
        this._initButtons(opts);
        this.bounds.height = this.children.length;
    }

    _initButtons(opts: MenuOptions) {
        this.children = [];
        const buttons = opts.buttons;

        const entries = Object.entries(buttons);
        if (this.bounds.width <= 0) {
            this.bounds.width = Math.max(
                opts.minWidth || 0,
                entries.reduce((out, [key, value]) => {
                    const textLen =
                        GWU.text.length(key) +
                        (typeof value === 'string' ? 0 : 2);
                    return Math.max(out, textLen);
                }, 0)
            );
        }
        entries.forEach(([key, value], i) => {
            const opts: Widget.WidgetOptions = {
                x: this.bounds.x,
                y: this.bounds.y + i,
                class: this.buttonClass,
                tag: this.buttonTag,
                width: this.bounds.width,
                height: 1,
                depth: this.depth + 1,
                parent: this,
            };

            if (typeof value === 'string') {
                opts.action = value;
                const menuItem = this.term.text(key, opts);
                this.children.push(menuItem);
            } else {
                const menuOpts = opts as MenuButtonOptions;
                menuOpts.text = key;
                menuOpts.buttons = value;
                const menuItem = new MenuButton(this.term, menuOpts);
                this.term.addWidget(menuItem);
                this.children.push(menuItem);
            }
        });
    }
}

export interface MenuButtonOptions extends Widget.WidgetOptions {
    text: string;
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
}

export class MenuButton extends Widget.WidgetGroup {
    button!: Text.Text;
    menu!: Menu;

    constructor(term: Term, opts: MenuButtonOptions) {
        super(term, opts);

        this.tag = opts.tag || 'mi';
        this._initButton(opts);
        this._initMenu(opts);
        this.bounds.height = 1;
    }

    _initButton(opts: MenuButtonOptions) {
        this.button = this.term
            .text(opts.text + ' \u25b6', {
                x: this.bounds.x,
                y: this.bounds.y,
                class: opts.class,
                tag: opts.tag || 'mi',
                width: this.bounds.width,
                height: 1,
                depth: this.depth + 1,
                parent: this,
            })
            .on('mouseenter', () => {
                this.menu.hidden = false;
                return false;
            })
            .on('mouseleave', (_n, _w, e) => {
                if (!this.menu.contains(e!)) {
                    this.menu.hidden = true;
                }
                return false;
            });
        this.addChild(this.button, 0);
    }

    _initMenu(opts: MenuButtonOptions) {
        this.menu = this.term
            .menu({
                x: this.bounds.x + this.button.bounds.width,
                y: this.bounds.y,
                class: opts.buttonClass,
                tag: opts.buttonTag || 'select',
                height: opts.height,
                buttons: opts.buttons,
                depth: this.depth + 1,
                parent: this,
            })
            .on('click', () => {
                this.menu.hidden = true;
                return false;
            })
            .on('mouseleave', (_n, _w, e) => {
                if (!this.button.contains(e!)) {
                    this.menu.hidden = true;
                }
                return false;
            });
        this.menu.hidden = true;
        this.addChild(this.menu);
    }
}
