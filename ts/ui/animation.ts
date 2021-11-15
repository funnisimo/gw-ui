import * as GWU from 'gw-utils';
import * as Widget from '../widget';

export interface AnimateOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;

    hidden?: boolean;

    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}

class WidgetProxy {
    _widget: Widget.Widget;
    constructor(widget: Widget.Widget) {
        this._widget = widget;
    }

    get x() {
        return this._widget.bounds.x;
    }
    set x(v: number) {
        this._widget.bounds.x = v;
    }

    get y() {
        return this._widget.bounds.y;
    }
    set y(v: number) {
        this._widget.bounds.y = v;
    }

    get width() {
        return this._widget.bounds.width;
    }
    set width(v: number) {
        this._widget.bounds.width = v;
    }

    get height() {
        return this._widget.bounds.height;
    }
    set height(v: number) {
        this._widget.bounds.height = v;
    }

    get hidden() {
        return this._widget.hidden;
    }
    set hidden(v: boolean) {
        this._widget.hidden = v;
    }

    get fg(): GWU.color.Color {
        return GWU.color.from(this._widget._used.fg || GWU.color.BLACK);
    }
    set fg(v: GWU.color.Color) {
        this._widget._used._fg = v;
    }

    get bg(): GWU.color.Color {
        return GWU.color.from(this._widget._used.bg || GWU.color.BLACK);
    }
    set bg(v: GWU.color.Color) {
        this._widget._used._bg = v;
    }

    get align(): GWU.text.Align {
        return this._widget._used.align || 'left';
    }
    set align(v: GWU.text.Align) {
        this._widget._used._align = v;
    }

    get valign(): GWU.text.VAlign {
        return this._widget._used.valign || 'top';
    }
    set valign(v: GWU.text.VAlign) {
        this._widget._used._valign = v;
    }

    get text(): string {
        return this._widget.text();
    }
    set text(v: string) {
        this._widget.text(v);
    }
}

export class Animation extends GWU.tween.Tween {
    constructor(widget: Widget.Widget) {
        super(new WidgetProxy(widget));
    }
}
