import * as GWU from 'gw-utils';
import { Style, StyleOptions } from './style';

export interface WidgetOptions {
    width?: number;
    height?: number;

    style?: StyleOptions;
    hover?: StyleOptions;
    focus?: StyleOptions;
}

export abstract class Widget {
    static default: Style = {
        fg: 'white',
        bg: -1,
        align: 'left' as GWU.text.Align,
        valign: 'top' as GWU.text.VAlign,
    };

    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(-1, -1, 0, 1);
    activeStyle!: Style;
    _normalStyle: StyleOptions = {};
    _hoverStyle: StyleOptions = {};
    _focusStyle: StyleOptions = {};

    _focus = false;
    _hover = false;

    constructor(x: number, y: number, opts: WidgetOptions = {}) {
        this.activeStyle = {
            fg: 'white',
            bg: -1,
            align: 'left',
            valign: 'top',
        };

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

    normalStyle(opts: StyleOptions) {
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
        this.activeStyle = Object.assign(
            {},
            Widget.default,
            this._normalStyle
        ) as Style;
        if (this._focus) {
            Object.assign(this.activeStyle, this._focusStyle);
        } else if (this._hover) {
            Object.assign(this.activeStyle, this._hoverStyle);
        }
    }

    abstract draw(buffer: GWU.canvas.DataBuffer): void;
}
