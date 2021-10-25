import * as GWU from 'gw-utils';
import * as Style from './style';
import { Term } from './term';

// return true if you want to stop the event from propagating
export type EventCb = (
    name: string,
    widget: Widget,
    io?: GWU.io.Event
) => boolean; // | Promise<boolean>;

export interface WidgetOptions {
    id?: string;
    parent?: Widget;

    x?: number;
    y?: number;
    width?: number;
    height?: number;

    style?: Style.StyleOptions;
    class?: string | string[];
    tag?: string;

    tabStop?: boolean;
    action?: string;
    depth?: number;
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
    depth = 0;
    events: Record<string, EventCb[]> = {};

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

        if (opts.x !== undefined) {
            this.bounds.x = opts.x;
        }
        if (opts.y !== undefined) {
            this.bounds.y = opts.y;
        }
        if (opts.tag) {
            this.tag = opts.tag;
        }
        if (opts.id) {
            this.attr('id', opts.id);
        }
        if (opts.parent) {
            this.parent = opts.parent;
        }
        if (opts.depth) {
            this.depth = opts.depth;
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
        if (opts.tabStop) {
            this.prop('tabStop', true);
        }
        if (opts.action) {
            this.attr('action', opts.action);
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
        const current = this._props[name];
        if (current !== v) {
            this._props[name] = v;
            this._updateStyle();
        }
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

    draw(_buffer: GWU.canvas.DataBuffer, _force = false): boolean {
        return false;
    }

    protected _drawFill(buffer: GWU.canvas.DataBuffer): boolean {
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
            return true;
        }
        return false;
    }

    // Events

    mousemove(e: GWU.io.Event): boolean {
        this.hovered = this.contains(e);
        if (this.hovered) {
            return this._fireEvent('mousemove', this, e);
        }
        return false;
    }

    click(e: GWU.io.Event): boolean {
        return this._bubbleEvent('click', this, e);
    }

    on(event: string, cb: EventCb): this {
        let handlers = this.events[event];
        if (!handlers) {
            handlers = this.events[event] = [];
        }
        if (!handlers.includes(cb)) {
            handlers.push(cb);
        }
        return this;
    }

    off(event: string, cb?: EventCb): this {
        let handlers = this.events[event];
        if (!handlers) return this;
        if (cb) {
            GWU.arrayDelete(handlers, cb);
        } else {
            handlers.length = 0; // clear all handlers
        }
        return this;
    }

    _fireEvent(
        name: string,
        source: Widget,
        e?: Partial<GWU.io.Event>
    ): boolean {
        if (!e || !e.type) {
            e = GWU.io.makeCustomEvent(name, e);
        }
        const handlers = this.events[name] || [];
        let handled = handlers.reduce(
            (out, h) => h(name, source, e as GWU.io.Event) || out,
            false
        );
        return handled;
    }

    _bubbleEvent(name: string, source: Widget, e?: GWU.io.Event): boolean {
        let current: Widget | null = this;
        while (current) {
            if (current._fireEvent(name, source, e)) return true;
            current = current.parent;
        }
        return this.term.fireEvent(name, source, e);
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

    draw(buffer: GWU.canvas.DataBuffer, force = false): boolean {
        this.needsDraw = false;
        return this._drawChildren(buffer, force);
    }

    _drawChildren(buffer: GWU.canvas.DataBuffer, force = false): boolean {
        let result = false;
        this.children.forEach((w) => {
            result = w.draw(buffer, force) || result;
        });
        return result;
    }

    mousemove(e: GWU.io.Event): boolean {
        let handled = false;
        this.children.forEach((w) => {
            if (w.mousemove(e)) {
                handled = true;
            }
        });
        return super.mousemove(e) || handled;
    }

    tick(_e: GWU.io.Event): void {}

    // returns true if click is handled by this widget (stopPropagation)
    click(_e: GWU.io.Event): boolean {
        return false;
    }
    // returns true if key is used by widget and you want to stopPropagation
    keypress(_e: GWU.io.Event): boolean {
        return false;
    }

    // returns true if key is used by widget and you want to stopPropagation
    dir(_e: GWU.io.Event): boolean {
        return false;
    }
}
