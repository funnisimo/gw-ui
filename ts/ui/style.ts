import * as GWU from 'gw-utils';
import { UIStyle, StyleOptions, UIStylable } from './types';
import { Selector } from './selector';

export type StyleType = string | StyleOptions;

// static - size/pos automatic (ignore TRBL)
// relative - size automatic, pos = automatic + TRBL
// fixed - size = self, pos = TRBL vs root
// absolute - size = self, pos = TRBL vs positioned parent (fixed, absolute)

// export interface Stylable {
//     tag: string;
//     classes: string[];

//     attr(name: string): string | undefined;
//     prop(name: string): PropType | undefined;
//     parent: UIWidget | null;
//     children?: UIWidget[];

//     style(): Style;
// }

// export interface StyleOptions {
//     fg?: GWU.color.ColorBase;
//     bg?: GWU.color.ColorBase;
//     // depth?: number;

//     align?: GWU.text.Align;
//     valign?: GWU.text.VAlign;

//     // minWidth?: number;
//     // maxWidth?: number;
//     // width?: number;

//     // minHeight?: number;
//     // maxHeight?: number;
//     // height?: number;

//     // left?: number;
//     // right?: number;

//     // top?: number;
//     // bottom?: number;

//     // //        all,     [t+b, l+r],        [t, r+l,b],               [t, r, b, l]
//     // padding?:
//     //     | number
//     //     | [number]
//     //     | [number, number]
//     //     | [number, number, number]
//     //     | [number, number, number, number];
//     // padLeft?: number;
//     // padRight?: number;
//     // padTop?: number;
//     // padBottom?: number;

//     // //        all,     [t+b, l+r],        [t, l+r, b],               [t, r, b, l]
//     // margin?:
//     //     | number
//     //     | [number]
//     //     | [number, number]
//     //     | [number, number, number]
//     //     | [number, number, number, number];
//     // marginLeft?: number;
//     // marginRight?: number;
//     // marginTop?: number;
//     // marginBottom?: number;

//     // border?: GWU.color.ColorBase;
// }

export class Style implements UIStyle {
    protected _fg?: GWU.color.ColorBase;
    protected _bg?: GWU.color.ColorBase;
    protected _border?: GWU.color.ColorBase;
    // protected _depth?: number;

    protected _align?: GWU.text.Align;
    protected _valign?: GWU.text.VAlign;
    // protected _position?: Position;

    // protected _minWidth?: number;
    // protected _maxWidth?: number;
    // protected _width?: number;

    // protected _minHeight?: number;
    // protected _maxHeight?: number;
    // protected _height?: number;

    // protected _x?: number;
    // protected _left?: number;
    // protected _right?: number;

    // protected _y?: number;
    // protected _top?: number;
    // protected _bottom?: number;

    // protected _padLeft?: number;
    // protected _padRight?: number;
    // protected _padTop?: number;
    // protected _padBottom?: number;

    // protected _marginLeft?: number;
    // protected _marginRight?: number;
    // protected _marginTop?: number;
    // protected _marginBottom?: number;

    selector: Selector;
    protected _dirty = false;

    constructor(selector = '$', init?: StyleOptions) {
        this.selector = new Selector(selector);
        if (init) {
            this.set(init);
        }
        this._dirty = false;
    }

    get dirty(): boolean {
        return this._dirty;
    }
    set dirty(v: boolean) {
        this._dirty = v;
    }

    get fg(): GWU.color.ColorBase | undefined {
        return this._fg;
    }
    get bg(): GWU.color.ColorBase | undefined {
        return this._bg;
    }
    // get border(): GWU.color.ColorBase | undefined {
    //     return this._border;
    // }

    dim(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._fg = GWU.color.from(this._fg).darken(pct);
        }
        if (bg) {
            this._bg = GWU.color.from(this._bg).darken(pct);
        }
        return this;
    }

    bright(pct = 25, fg = true, bg = false): this {
        if (fg) {
            this._fg = GWU.color.from(this._fg).lighten(pct);
        }
        if (bg) {
            this._bg = GWU.color.from(this._bg).lighten(pct);
        }
        return this;
    }

    invert(): this {
        [this._fg, this._bg] = [this._bg, this._fg];
        return this;
    }

    get align(): GWU.text.Align | undefined {
        return this._align;
    }
    get valign(): GWU.text.VAlign | undefined {
        return this._valign;
    }
    // get position(): Position | undefined {
    //     return this._position;
    // }

    // get minWidth(): number | undefined {
    //     return this._minWidth;
    // }
    // get maxWidth(): number | undefined {
    //     return this._maxWidth;
    // }
    // get width(): number | undefined {
    //     return this._width;
    // }

    // get minHeight(): number | undefined {
    //     return this._minHeight;
    // }
    // get maxHeight(): number | undefined {
    //     return this._maxHeight;
    // }
    // get height(): number | undefined {
    //     return this._height;
    // }

    // get x(): number | undefined {
    //     return this._x;
    // }
    // get left(): number | undefined {
    //     return this._left;
    // }
    // get right(): number | undefined {
    //     return this._right;
    // }

    // get y(): number | undefined {
    //     return this._y;
    // }
    // get top(): number | undefined {
    //     return this._top;
    // }
    // get bottom(): number | undefined {
    //     return this._bottom;
    // }

    // get padLeft(): number | undefined {
    //     return this._padLeft;
    // }
    // get padRight(): number | undefined {
    //     return this._padRight;
    // }
    // get padTop(): number | undefined {
    //     return this._padTop;
    // }
    // get padBottom(): number | undefined {
    //     return this._padBottom;
    // }

    // get marginLeft(): number | undefined {
    //     return this._marginLeft;
    // }
    // get marginRight(): number | undefined {
    //     return this._marginRight;
    // }
    // get marginTop(): number | undefined {
    //     return this._marginTop;
    // }
    // get marginBottom(): number | undefined {
    //     return this._marginBottom;
    // }

    get(key: keyof Style): any {
        const id = ('_' + key) as keyof this;
        return this[id];
    }

    set(opts: StyleOptions, setDirty?: boolean): this;
    set(key: keyof StyleOptions, value: any, setDirty?: boolean): this;
    set(
        key: keyof StyleOptions | StyleOptions | Style,
        value?: any,
        setDirty = true
    ): this {
        if (typeof key === 'string') {
            // if (key === 'padding') {
            //     if (typeof value === 'number') {
            //         value = [value];
            //     } else if (typeof value === 'string') {
            //         value = value.split(' ');
            //     }
            //     value = value.map((v: string | number) => {
            //         if (typeof v === 'string') return Number.parseInt(v);
            //         return v;
            //     });

            //     if (value.length == 1) {
            //         this._padLeft =
            //             this._padRight =
            //             this._padTop =
            //             this._padBottom =
            //                 value[0];
            //     } else if (value.length == 2) {
            //         this._padLeft = this._padRight = value[1];
            //         this._padTop = this._padBottom = value[0];
            //     } else if (value.length == 3) {
            //         this._padTop = value[0];
            //         this._padRight = value[1];
            //         this._padBottom = value[2];
            //         this._padLeft = value[1];
            //     } else if (value.length == 4) {
            //         this._padTop = value[0];
            //         this._padRight = value[1];
            //         this._padBottom = value[2];
            //         this._padLeft = value[3];
            //     }
            // } else if (key === 'margin') {
            //     if (typeof value === 'number') {
            //         value = [value];
            //     } else if (typeof value === 'string') {
            //         value = value.split(' ');
            //     }
            //     value = value.map((v: string | number) => {
            //         if (typeof v === 'string') return Number.parseInt(v);
            //         return v;
            //     });

            //     if (value.length == 1) {
            //         this._marginLeft =
            //             this._marginRight =
            //             this._marginTop =
            //             this._marginBottom =
            //                 value[0];
            //     } else if (value.length == 2) {
            //         this._marginLeft = this._marginRight = value[1];
            //         this._marginTop = this._marginBottom = value[0];
            //     } else if (value.length == 3) {
            //         this._marginTop = value[0];
            //         this._marginRight = value[1];
            //         this._marginBottom = value[2];
            //         this._marginLeft = value[1];
            //     } else if (value.length == 4) {
            //         this._marginTop = value[0];
            //         this._marginRight = value[1];
            //         this._marginBottom = value[2];
            //         this._marginLeft = value[3];
            //     }
            // } else {
            const field = '_' + key;
            if (typeof value === 'string') {
                if (value.match(/^[+-]?\d+$/)) {
                    value = Number.parseInt(value);
                } else if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                }
            }
            this[field as keyof this] = value;
            // }
        } else if (key instanceof Style) {
            setDirty = value || value === undefined ? true : false;
            Object.entries(key).forEach(([name, value]) => {
                if (name === 'selector' || name === '_dirty') return;
                if (value !== undefined && value !== null) {
                    this[name as keyof this] = value;
                } else if (value === null) {
                    this.unset(name as keyof Style);
                }
            });
        } else {
            setDirty = value || value === undefined ? true : false;
            Object.entries(key).forEach(([name, value]) => {
                if (value === null) {
                    this.unset(name as keyof Style);
                } else {
                    this.set(name as keyof StyleOptions, value, setDirty);
                }
            });
        }

        this.dirty ||= setDirty;
        return this;
    }

    unset(key: keyof Style): this {
        const field = key.startsWith('_') ? key : '_' + key;
        delete this[field as keyof this];
        this.dirty = true;
        return this;
    }

    clone(): this {
        const other = new (<new () => this>this.constructor)();
        other.copy(this);
        return other;
    }

    copy(other: Style): this {
        Object.assign(this, other);
        return this;
    }
}

export function makeStyle(style: string, selector = '$'): Style {
    const opts: StyleOptions = {};

    const parts = style
        .trim()
        .split(';')
        .map((p) => p.trim());
    parts.forEach((p) => {
        const [name, base] = p.split(':').map((p) => p.trim());
        if (!name) return;
        const baseParts = base.split(/ +/g);
        if (baseParts.length == 1) {
            // @ts-ignore
            opts[name] = base;
        } else {
            // @ts-ignore
            opts[name] = baseParts;
        }
    });

    return new Style(selector, opts);
}

// const NO_BOUNDS = ['fg', 'bg', 'depth', 'align', 'valign'];

// export function affectsBounds(key: keyof StyleOptions): boolean {
//     return !NO_BOUNDS.includes(key);
// }

export class ComputedStyle extends Style {
    // obj: Stylable;
    sources: UIStyle[] = [];

    // constructor(source: Stylable, sources?: Style[]) {
    constructor(sources?: UIStyle[]) {
        super();
        // this.obj = source;
        if (sources) {
            // sort low to high priority (highest should be this.obj._style, lowest = global default:'*')
            sources.sort((a, b) => a.selector.priority - b.selector.priority);
            this.sources = sources;
        }

        this.sources.forEach((s) => super.set(s));
        this._dirty = false; // As far as I know I reflect all of the current source values.
    }

    get dirty(): boolean {
        return this._dirty || this.sources.some((s) => s.dirty);
    }
    set dirty(v: boolean) {
        this._dirty = v;
    }
}

export class Sheet {
    rules: UIStyle[] = [];
    _dirty = true;

    constructor(parentSheet?: Sheet | null) {
        if (parentSheet === undefined) {
            parentSheet = defaultStyle;
        }
        if (parentSheet) {
            this.rules = parentSheet.rules.slice();
        }
    }

    get dirty(): boolean {
        return this._dirty;
    }
    set dirty(v: boolean) {
        this._dirty = v;
        if (!this._dirty) {
            this.rules.forEach((r) => (r.dirty = false));
        }
    }

    add(selector: string, props: StyleOptions): this {
        if (selector.includes(',')) {
            selector
                .split(',')
                .map((p) => p.trim())
                .forEach((p) => this.add(p, props));
            return this;
        }

        if (selector.includes(' '))
            throw new Error('Hierarchical selectors not supported.');
        // if 2 '.' - Error('Only single class rules supported.')
        // if '&' - Error('Not supported.')

        let rule: UIStyle = new Style(selector, props);
        const existing = this.rules.findIndex(
            (s) => s.selector.text === rule.selector.text
        );

        if (existing > -1) {
            const current = this.rules[existing];
            current.set(rule);
            rule = current;
        } else {
            this.rules.push(rule);
        }
        // rulesChanged = true;
        this.dirty = true;
        return this;
    }

    get(selector: string): UIStyle | null {
        return this.rules.find((s) => s.selector.text === selector) || null;
    }

    remove(selector: string): void {
        const existing = this.rules.findIndex(
            (s) => s.selector.text === selector
        );

        if (existing > -1) {
            this.rules.splice(existing, 1);
            this.dirty = true;
        }
    }

    computeFor(widget: UIStylable): UIStyle {
        const sources = this.rules.filter((r) => r.selector.matches(widget));
        const widgetStyle = widget.style();
        if (widgetStyle) {
            sources.push(widgetStyle);
        }
        widgetStyle.dirty = false;
        return new ComputedStyle(sources);
    }
}

export const defaultStyle = new Sheet(null);