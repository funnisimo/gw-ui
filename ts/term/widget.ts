import * as GWU from 'gw-utils';
import { Style, StyleOptions } from './style';
import { Term } from './term';

export interface WidgetOptions {
    width?: number;
    height?: number;

    style?: StyleOptions;
    hover?: StyleOptions;
    focus?: StyleOptions;
}

export abstract class Widget {
    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 1);
    activeStyle!: StyleOptions;
    _normalStyle: StyleOptions = {};
    _hoverStyle: StyleOptions = {};
    _focusStyle: StyleOptions = {};

    _focus = false;
    _hover = false;
    needsDraw = true;

    constructor(x: number, y: number, opts: WidgetOptions = {}) {
        this.bounds.x = x;
        this.bounds.y = y;

        if (opts.style) this._normalStyle = opts.style;
        if (opts.focus) this._focusStyle = opts.focus;
        if (opts.hover) this._hoverStyle = opts.hover;
        this._updateStyle();
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.bounds.contains(args[0], args[1]);
    }

    style(opts: StyleOptions) {
        this._normalStyle = opts;
        this._updateStyle();
    }

    hoverStyle(opts: StyleOptions) {
        this._hoverStyle = opts;
        this._updateStyle();
    }

    focusStyle(opts: StyleOptions) {
        this._focusStyle = opts;
        this._updateStyle();
    }

    get focused(): boolean {
        return this._focus;
    }
    set focused(v: boolean) {
        this._focus = v;
        this._updateStyle();
    }

    get hovered(): boolean {
        return this._hover;
    }
    set hovered(v: boolean) {
        this._hover = v;
        this._updateStyle();
    }

    protected _updateStyle() {
        this.activeStyle = Object.assign({}, this._normalStyle) as Style;
        if (this._focus) {
            Object.assign(this.activeStyle, this._focusStyle);
        } else if (this._hover) {
            Object.assign(this.activeStyle, this._hoverStyle);
        }
        this.needsDraw = true; // changed style or state
    }

    abstract draw(
        buffer: GWU.canvas.DataBuffer,
        parentX?: number,
        parentY?: number
    ): void;

    mousemove(_e: GWU.io.Event, _term: Term): boolean {
        return false;
    }
}

export class WidgetGroup extends Widget {
    widgets: Widget[] = [];

    constructor(x: number, y: number, opts: WidgetOptions = {}) {
        super(x, y, opts);
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.widgets.some((w) => w.bounds.contains(args[0], args[1]));
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        this.widgets.forEach((w) => w.draw(buffer));
    }

    mousemove(e: GWU.io.Event, term: Term): boolean {
        let handled = false;
        this.widgets.forEach((w) => {
            if (w.mousemove(e, term)) {
                handled = true;
            }
        });
        return handled;
    }
}
