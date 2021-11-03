import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Widget from './widget';

export interface OrderedListOptions extends Widget.WidgetOptions {
    pad?: number;
}

export class OrderedList extends Widget.Widget {
    static default = {
        pad: 1,
    };

    _fixedWidth = false;
    _fixedHeight = false;

    constructor(layer: Layer, opts: OrderedListOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'ol';
                return opts;
            })()
        );
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;

        this.prop('pad', opts.pad || OrderedList.default.pad);
    }

    _addChild(w: Widget.Widget, opts: Widget.SetParentOptions = {}): this {
        w.bounds.x = this.bounds.x + 2;
        if (!this._fixedHeight) {
            w.bounds.y = this.bounds.bottom - 2;
            this.bounds.height += w.bounds.height;
        }
        if (this._fixedWidth) {
            w.bounds.width = Math.min(w.bounds.width, this.bounds.width - 4);
        } else if (w.bounds.width > this.bounds.width - 4) {
            this.bounds.width = w.bounds.width + 4;
        }

        return super._addChild(w, opts);
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        this._drawFill(buffer);

        this.children.forEach((c, i) => {
            this._drawBulletFor(c, buffer, i);
        });

        return true;
    }

    _getBullet(index: number): string {
        return '' + (index + 1);
    }

    _drawBulletFor(
        widget: Widget.Widget,
        buffer: GWU.canvas.DataBuffer,
        index: number
    ): void {
        const bullet = this._getBullet(index);
        const size = this._attrInt('pad') + bullet.length;
        const x = widget.bounds.x - size;
        const y = widget.bounds.y;

        buffer.drawText(x, y, bullet, widget._used.fg, widget._used.bg, size);
    }
}

// UNORDERED LIST

export interface UnorderedListOptions extends OrderedListOptions {
    bullet?: string;
}

export class UnorderedList extends OrderedList {
    static default = {
        bullet: '\u2022', // bullet
        pad: 1,
    };

    constructor(layer: Layer, opts: UnorderedListOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'ul';
                return opts;
            })()
        );

        this.prop('bullet', opts.bullet || UnorderedList.default.bullet);
        this.prop('pad', opts.pad || UnorderedList.default.pad);
    }

    _getBullet(_index: number): string {
        return this._attrStr('bullet');
    }
}

// extend Layer

export type AddOrderedListOptions = OrderedListOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

export type AddUnorderedListOptions = UnorderedListOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        ol(opts?: AddOrderedListOptions): OrderedList;
        ul(opts?: AddUnorderedListOptions): UnorderedList;
    }
}

Layer.prototype.ol = function (opts: AddOrderedListOptions = {}): OrderedList {
    const options = Object.assign({}, this._opts, opts) as OrderedListOptions;
    const widget = new OrderedList(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

Layer.prototype.ul = function (
    opts: AddUnorderedListOptions = {}
): UnorderedList {
    const options = Object.assign({}, this._opts, opts) as UnorderedListOptions;
    const widget = new UnorderedList(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
