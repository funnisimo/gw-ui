import * as GWU from 'gw-utils';
import * as Style from './style';
import { Term } from './term';

export interface WidgetOptions {
    width?: number;
    height?: number;

    style?: Style.StyleOptions;
    classes?: string | string[];
}

Style.defaultStyle.add('*', {
    fg: 'white',
    bg: -1,
    align: 'left',
    valign: 'top',
});

export abstract class Widget implements Style.Stylable {
    tag: string = 'text';
    term: Term;
    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 1);

    _style = new Style.Style();
    _used!: Style.ComputedStyle;

    parent: Widget | null = null;
    classes: string[] = [];
    _props: Record<string, boolean> = {};
    _attrs: Record<string, string> = {};
    _needsDraw = true;

    constructor(term: Term, opts: WidgetOptions = {}) {
        this.term = term;
        this.bounds.x = term.x;
        this.bounds.y = term.y;

        if (opts.style) {
            this._style.set(opts.style);
        }
        if (opts.classes) {
            if (typeof opts.classes === 'string') {
                opts.classes = opts.classes.split(/ +/g);
            }
            this.classes = opts.classes.map((c) => c.trim());
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

    prop(name: string): boolean;
    prop(name: string, v: boolean): this;
    prop(name: string, v?: boolean): this | boolean {
        if (v === undefined) return this._props[name] || false;
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
        return this.prop('focus');
    }
    set focused(v: boolean) {
        this.prop('focus', v);
    }

    get hovered(): boolean {
        return this.prop('hover');
    }
    set hovered(v: boolean) {
        this.prop('hover', v);
    }

    protected _updateStyle() {
        this._used = this.term.styles.computeFor(this);
        this.needsDraw = true; // changed style or state
    }

    abstract draw(
        buffer: GWU.canvas.DataBuffer,
        parentX?: number,
        parentY?: number
    ): void;

    mousemove(e: GWU.io.Event, _term: Term): boolean {
        this.hovered = this.contains(e);
        return false;
    }
}

export class WidgetGroup extends Widget {
    widgets: Widget[] = [];

    constructor(term: Term, opts: WidgetOptions = {}) {
        super(term, opts);
    }

    get needsDraw(): boolean {
        return this._needsDraw || this.widgets.some((w) => w.needsDraw);
    }
    set needsDraw(v: boolean) {
        this._needsDraw = v;
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.widgets.some((w) => w.contains(args[0], args[1]));
    }

    widgetAt(e: GWU.xy.XY): Widget | null;
    widgetAt(x: number, y: number): Widget | null;
    widgetAt(...args: any[]): Widget | null {
        return this.widgets.find((w) => w.contains(args[0], args[1])) || null;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        if (!this.needsDraw) return;
        this.widgets.forEach((w) => w.draw(buffer));
        this.needsDraw = false;
    }

    mousemove(e: GWU.io.Event, term: Term): boolean {
        let handled = false;
        this.widgets.forEach((w) => {
            if (w.mousemove(e, term)) {
                handled = true;
            }
        });
        return super.mousemove(e, term) || handled;
    }
}
