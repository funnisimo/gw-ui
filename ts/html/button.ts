import * as GWU from 'gw-utils';
import * as Style from './style';
import * as Element from './element';
import { Document } from './document';
import * as Parser from './parser';

Style.defaultStyle.add('button', {
    fg: 'black',
    bg: 'gray',
});

export class Button extends Element.Element {
    static default = {
        clickfocus: false,
    };

    constructor(tag: string, sheet?: Style.Sheet) {
        super(tag, sheet);
        this.on('keypress', this.keypress.bind(this));
        this.on('click', this.click.bind(this));
        this.prop('tabindex', true);

        Object.entries(Button.default).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                this.prop(key, value);
            } else {
                this.attr(key, value);
            }
        });
    }

    // ATTRIBUTES

    protected _setAttr(name: string, value: string) {
        this._attrs[name] = value;
        if (name === 'value') {
            this._setProp('value', value);
        }
    }

    // PROPERTIES

    // CONTENT

    // DRAWING

    // EVENTS

    keypress(
        document: Document,
        _element: Element.Element,
        e?: GWU.io.Event
    ): boolean {
        if (!e) return false;

        if (e.key === 'Enter' || e.key === ' ') {
            document._fireEvent(this, 'click', e);
            return true;
        }
        return false;
    }

    click(
        document: Document,
        _element: Element.Element,
        e?: GWU.io.Event
    ): boolean {
        if (!e) return false;
        if (!this.contains(e)) return false;

        if (this.prop('clickfocus')) {
            document.setActiveElement(this);
        }
        return true;
    }
}

Parser.installElement('button', (tag: string, sheet?: Style.Sheet) => {
    return new Button(tag, sheet);
});
