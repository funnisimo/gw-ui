// import * as GWU from 'gw-utils';
import * as Widget from './widget';
import * as Menu from './menu';
import * as Text from './text';
import { Term } from './term';

export interface SelectOptions extends Widget.WidgetOptions {
    text: string;
    buttons: Menu.DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
}

export class Select extends Widget.WidgetGroup {
    dropdown!: Text.Text;
    menu!: Menu.Menu;

    constructor(term: Term, opts: SelectOptions) {
        super(term, opts);

        this.tag = opts.tag || 'select';
        this._initText(opts);
        this._initMenu(opts);
        this.bounds.height = 1; // just the text component
    }

    _initText(opts: SelectOptions) {
        this.dropdown = this.term
            .text(opts.text + ' \u25bc', {
                x: this.bounds.x,
                y: this.bounds.y,
                class: opts.class,
                tag: opts.tag || 'select',
                width: this.bounds.width,
                height: 1,
                depth: this.depth + 1,
                parent: this,
            })
            .on('click', () => {
                this.menu.toggleProp('hidden');
                return false;
            });
        this.addChild(this.dropdown, 0);
    }

    _initMenu(opts: SelectOptions) {
        this.menu = this.term
            .menu({
                x: this.bounds.x,
                y: this.bounds.y + 1,
                class: opts.buttonClass,
                tag: opts.buttonTag || 'select',
                width: opts.width,
                minWidth: this.dropdown.bounds.width,
                height: opts.height,
                buttons: opts.buttons,
                depth: this.depth + 1,
                parent: this,
            })
            .on('click', () => {
                this.menu.hidden = true;
                return false;
            });
        this.menu.hidden = true;
        this.addChild(this.menu);
    }
}
