import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { Term } from './term';

interface Rec<T> {
    [keys: string]: T;
}
type DropdownConfig = Rec<ButtonConfig>;
type ActionConfig = string;
type ButtonConfig = ActionConfig | DropdownConfig;

export interface MenuOptions extends Widget.WidgetOptions {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
}

export class Menu extends Widget.WidgetGroup {
    buttonClass: string | string[];
    buttonTag: string;

    constructor(term: Term, opts: MenuOptions) {
        super(term, opts);

        this.tag = opts.tag || 'menu';
        this.buttonClass = opts.buttonClass || '';
        this.buttonTag = opts.buttonTag || 'mi';
        this._initButtons(opts.buttons);
    }

    _initButtons(buttons: DropdownConfig) {
        this.children = [];

        const entries = Object.entries(buttons);
        if (this.bounds.width <= 0) {
            this.bounds.width = entries.reduce(
                (out, [key]) => Math.max(out, GWU.text.length(key)),
                0
            );
        }
        entries.forEach(([key, value], i) => {
            if (typeof value === 'string') {
                const menu = this.term
                    .text(key, {
                        x: this.bounds.x,
                        y: this.bounds.y + i,
                        class: this.buttonClass,
                        tag: this.buttonTag,
                        width: this.bounds.width,
                        height: 1,
                        depth: this.depth + 1,
                    })
                    .on('click', (_n, w, e) => {
                        return this._bubbleEvent(value, w, e);
                    });
                this.children.push(menu);
            }
        });
    }
}
