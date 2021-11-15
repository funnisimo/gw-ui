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
    _fg?: GWU.color.ColorBase;
    _bg?: GWU.color.ColorBase;
    _border?: GWU.color.ColorBase;
    //  _depth?: number;

    _align?: GWU.text.Align;
    _valign?: GWU.text.VAlign;

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
    _opacity = 100;
    _baseFg: GWU.color.Color | null = null;
    _baseBg: GWU.color.Color | null = null;

    // constructor(source: Stylable, sources?: Style[]) {
    constructor(sources?: UIStyle[], opacity = 100) {
        super();
        // this.obj = source;
        if (sources) {
            // sort low to high priority (highest should be this.obj._style, lowest = global default:'*')
            sources.sort((a, b) => a.selector.priority - b.selector.priority);
            this.sources = sources;
        }

        this.sources.forEach((s) => super.set(s));
        this.opacity = opacity;
        this._dirty = false; // As far as I know I reflect all of the current source values.
    }

    get opacity() {
        return this._opacity;
    }
    set opacity(v: number) {
        v = GWU.clamp(v, 0, 100);
        if (v === 100) {
            this._fg = this._baseFg || this._fg;
            this._bg = this._baseBg || this._bg;
            return;
        }

        if (this._fg !== undefined) {
            this._baseFg = this._baseFg || GWU.color.from(this._fg);
            this._fg = this._baseFg.alpha(v);
        }
        if (this._bg !== undefined) {
            this._baseBg = this._baseBg || GWU.color.from(this._bg);
            this._bg = this._baseBg.alpha(v);
        }
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

    computeFor(widget: UIStylable): ComputedStyle {
        const sources = this.rules.filter((r) => r.selector.matches(widget));
        const widgetStyle = widget.style();
        if (widgetStyle) {
            sources.push(widgetStyle);
        }
        widgetStyle.dirty = false;
        return new ComputedStyle(sources, widget.opacity);
    }
}

export const defaultStyle = new Sheet(null);
