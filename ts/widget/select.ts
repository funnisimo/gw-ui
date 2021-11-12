// import * as GWU from 'gw-utils';
import * as Widget from './widget';
import * as Menu from './menu';
import * as Text from './text';
import { Layer } from '../ui/layer';
import { installWidget } from './make';

export interface SelectOptions extends Widget.WidgetOptions {
    text: string;
    buttons: Menu.DropdownConfig;
    buttonClass?: string;
    buttonTag?: string;
}

export class Select extends Widget.Widget {
    dropdown!: Text.Text;
    menu!: Menu.Menu;

    constructor(layer: Layer, opts: SelectOptions) {
        super(layer, opts);

        this.tag = opts.tag || 'select';
        this._initText(opts);
        this._initMenu(opts);
        this.bounds.height = 1; // just the text component
    }

    _initText(opts: SelectOptions) {
        this.dropdown = new Text.Text(this.layer, {
            text: opts.text + ' \u25bc',
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'select',
            width: this.bounds.width,
            height: 1,
            depth: this.depth + 1,
        }).on('click', () => {
            this.menu.toggleProp('hidden');
            return false;
        });
        this.dropdown.setParent(this, { beforeIndex: 0 });
    }

    _initMenu(opts: SelectOptions) {
        this.menu = new Menu.Menu(this.layer, {
            x: this.bounds.x,
            y: this.bounds.y + 1,
            class: opts.buttonClass,
            tag: opts.buttonTag || 'select',
            width: opts.width,
            minWidth: this.dropdown.bounds.width,
            height: opts.height,
            buttons: opts.buttons,
            depth: this.depth + 1,
        }).on('click', () => {
            this.menu.hidden = true;
            return false;
        });
        this.menu.hidden = true;
        this.menu.setParent(this);
    }
}
installWidget('select', (l, opts) => new Select(l, opts));

// extend Layer

export type AddSelectOptions = SelectOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../ui/layer' {
    interface Layer {
        select(opts: AddSelectOptions): Select;
    }
}
Layer.prototype.select = function (opts: AddSelectOptions): Select {
    const options: SelectOptions = Object.assign({}, this._opts, opts);
    const list = new Select(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
