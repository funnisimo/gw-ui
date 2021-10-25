import * as GWU from 'gw-utils';
import * as Style from './style';
import { Term } from './term';

export interface WidgetOptions {
    id?: string;

    width?: number;
    height?: number;

    style?: Style.StyleOptions;
    class?: string | string[];
    tag?: string;
}

Style.defaultStyle.add('*', {
    fg: 'white',
    bg: -1,
    align: 'left',
    valign: 'top',
});

export type PropType = boolean | number | string;

export abstract class Widget implements Style.Stylable {
    tag: string = 'text';
    term: Term;
    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 1);

    _style = new Style.Style();
    _used!: Style.ComputedStyle;

    parent: Widget | null = null;
    classes: string[] = [];
    _props: Record<string, PropType> = {};
    _attrs: Record<string, string> = {};
    _needsDraw = true;

    constructor(term: Term, opts: WidgetOptions = {}) {
        this.term = term;
        this.bounds.x = term.x;
        this.bounds.y = term.y;

        if (opts.tag) {
            this.tag = opts.tag;
        }
        if (opts.id) {
            this.attr('id', opts.id);
        }
        if (opts.style) {
            this._style.set(opts.style);
        }
        if (opts.class) {
            if (typeof opts.class === 'string') {
                opts.class = opts.class.split(/ +/g);
            }
            this.classes = opts.class.map((c) => c.trim());
        }

        this._updateStyle();
    }

    get needsDraw(): boolean {
        return this._needsDraw;
    }
    set needsDraw(v: boolean) {
        this._needsDraw = v;
    }

    attr(name: string): string;
    attr(name: string, v: string): this;
    attr(name: string, v?: string): string | this {
        if (v === undefined) return this._attrs[name];
        this._attrs[name] = v;
        return this;
    }

    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    prop(name: string, v?: PropType): this | PropType | undefined {
        if (v === undefined) return this._props[name];
        this._props[name] = v;
        this._updateStyle();
        return this;
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.bounds.contains(args[0], args[1]);
    }

    style(): Style.Style;
    style(opts: Style.StyleOptions): this;
    style(opts?: Style.StyleOptions): this | Style.Style {
        if (opts === undefined) return this._style;

        this._style.set(opts);
        this._updateStyle();
        return this;
    }

    get focused(): boolean {
        return !!this.prop('focus');
    }
    set focused(v: boolean) {
        this.prop('focus', v);
    }

    get hovered(): boolean {
        return !!this.prop('hover');
    }
    set hovered(v: boolean) {
        this.prop('hover', v);
    }

    _updateStyle() {
        this._used = this.term.styles.computeFor(this);
        this.needsDraw = true; // changed style or state
    }

    abstract draw(buffer: GWU.canvas.DataBuffer): void;

    protected _drawFill(buffer: GWU.canvas.DataBuffer): this {
        if (this._used.bg !== undefined && this._used.bg !== -1) {
            buffer.fillRect(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height,
                ' ',
                this._used.bg,
                this._used.bg
            );
        }
        return this;
    }

    mousemove(e: GWU.io.Event, _term: Term): boolean {
        this.hovered = this.contains(e);
        return false;
    }
}

export class WidgetGroup extends Widget {
    children: Widget[] = [];

    constructor(term: Term, opts: WidgetOptions = {}) {
        super(term, opts);
    }

    get needsDraw(): boolean {
        return this._needsDraw || this.children.some((w) => w.needsDraw);
    }
    set needsDraw(v: boolean) {
        this._needsDraw = v;
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.children.some((w) => w.contains(args[0], args[1]));
    }

    widgetAt(e: GWU.xy.XY): Widget | null;
    widgetAt(x: number, y: number): Widget | null;
    widgetAt(...args: any[]): Widget | null {
        return this.children.find((w) => w.contains(args[0], args[1])) || null;
    }

    _updateStyle() {
        super._updateStyle();
        if (this.children) {
            this.children.forEach((c) => c._updateStyle());
        }
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        if (!this.needsDraw) return;
        this.children.forEach((w) => w.draw(buffer));
        this.needsDraw = false;
    }

    mousemove(e: GWU.io.Event, term: Term): boolean {
        let handled = false;
        this.children.forEach((w) => {
            if (w.mousemove(e, term)) {
                handled = true;
            }
        });
        return super.mousemove(e, term) || handled;
    }
}
