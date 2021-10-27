import * as GWU from 'gw-utils';
import * as Style from './style';
import { Term } from './term';

// return true if you want to stop the event from propagating
export type EventCb = (
    name: string,
    widget: Widget | null,
    io?: GWU.io.Event
) => boolean; // | Promise<boolean>;

export interface WidgetOptions extends Style.StyleOptions {
    id?: string;
    parent?: WidgetGroup;

    x?: number;
    y?: number;
    width?: number;
    height?: number;

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

export class Widget implements Style.Stylable {
    tag: string = 'text';
    term: Term;
    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 1);
    depth = 0;
    events: Record<string, EventCb[]> = {};
    action: string = '';

    _style = new Style.Style();
    _used!: Style.ComputedStyle;

    parent: WidgetGroup | null = null;
    classes: string[] = [];
    _props: Record<string, PropType> = {};
    _attrs: Record<string, string> = {};

    constructor(term: Term, opts: WidgetOptions = {}) {
        this.term = term;
        // this.bounds.x = term.x;
        // this.bounds.y = term.y;

        this.bounds.x = opts.x || 0;
        this.bounds.y = opts.y || 0;
        this.bounds.width = opts.width || 0;
        this.bounds.height = opts.height || 1;

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
        this._style.set(opts);
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

        if (opts.action) {
            this.action = opts.action;
            this.on('click', (_n, w, e) => {
                if (this.action) {
                    this._bubbleEvent(this.action, w, e);
                }
                return false; // keep bubbling
            });
        }

        this._updateStyle();
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
            // console.log(`${this.tag}.${name}=${v}`);
            this._updateStyle();
        }
        return this;
    }

    toggleProp(name: string): this {
        const current = !!this._props[name];
        this.prop(name, !current);
        return this;
    }

    incProp(name: string): this {
        let current = this.prop(name) || 0;
        if (typeof current === 'boolean') {
            current = current ? 1 : 0;
        } else if (typeof current === 'string') {
            current = Number.parseInt(current) || 0;
        }
        ++current;
        this.prop(name, current);
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

    addClass(c: string): this {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            if (this.classes.includes(a)) return;
            this.classes.push(a);
        });
        return this;
    }

    removeClass(c: string): this {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            GWU.arrayDelete(this.classes, a);
        });
        return this;
    }

    hasClass(c: string): boolean {
        const all = c.split(/ +/g);
        return GWU.arrayIncludesAll(this.classes, all);
    }

    toggleClass(c: string): this {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            if (this.classes.includes(a)) {
                GWU.arrayDelete(this.classes, a);
            } else {
                this.classes.push(a);
            }
        });
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

    get hidden(): boolean {
        let current: Widget | null = this;
        while (current) {
            if (current.prop('hidden')) return true;
            current = current.parent;
        }
        return false;
    }
    set hidden(v: boolean) {
        this.prop('hidden', v);
    }

    _updateStyle() {
        this._used = this.term.styles.computeFor(this);
        this.term.needsDraw = true; // changed style or state
    }

    draw(buffer: GWU.canvas.DataBuffer): boolean {
        if (this.hidden) return false;
        return this._draw(buffer);
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        this._drawFill(buffer);
        return true;
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

    mouseenter(e: GWU.io.Event): void {
        if (!this.contains(e)) return;
        if (this.hovered) return;
        this.hovered = true;
        this._fireEvent('mouseenter', this, e);
        if (this.parent) {
            this.parent.mouseenter(e);
        }
    }

    mousemove(e: GWU.io.Event): boolean {
        if (this.hidden) return false;

        if (this.contains(e) && !e.defaultPrevented) {
            this.mouseenter(e);
            this._fireEvent('mousemove', this, e);
            e.preventDefault();
        } else {
            this.mouseleave(e);
        }
        return false;
    }

    mouseleave(e: GWU.io.Event): void {
        if (this.contains(e)) return;
        if (!this.hovered) return;
        this.hovered = false;
        this._fireEvent('mouseleave', this, e);
        if (this.parent) {
            this.parent.mouseleave(e);
        }
    }

    click(e: GWU.io.Event): boolean {
        if (this.hidden) return false;
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
        source: Widget | null,
        e?: Partial<GWU.io.Event>
    ): boolean {
        if (!e || !e.type) {
            e = GWU.io.makeCustomEvent(name, e);
        }
        const handlers = this.events[name] || [];
        let handled = handlers.reduce(
            (out, h) => h(name, source || this, e as GWU.io.Event) || out,
            false
        );
        return handled;
    }

    _bubbleEvent(
        name: string,
        source: Widget | null,
        e?: GWU.io.Event
    ): boolean {
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

    // contains(e: GWU.xy.XY): boolean;
    // contains(x: number, y: number): boolean;
    // contains(...args: any[]): boolean {
    //     return this.children.some((w) => w.contains(args[0], args[1]));
    // }

    // widgetAt(e: GWU.xy.XY): Widget | null;
    // widgetAt(x: number, y: number): Widget | null;
    // widgetAt(...args: any[]): Widget | null {
    //     return this.children.find((w) => w.contains(args[0], args[1])) || null;
    // }

    // _updateStyle() {
    //     super._updateStyle();
    //     if (this.children) {
    //         this.children.forEach((c) => c._updateStyle());
    //     }
    // }

    addChild(w: Widget, beforeIndex = -1): this {
        if (w.parent && w.parent !== this)
            throw new Error('Trying to add child that already has a parent.');
        if (!this.children.includes(w)) {
            if (beforeIndex < 0 || beforeIndex >= this.children.length) {
                this.children.push(w);
            } else {
                this.children.splice(beforeIndex, 0, w);
            }
        }
        w.parent = this;
        return this;
    }

    removeChild(w: Widget): this {
        if (!w.parent || w.parent !== this)
            throw new Error(
                'Removing child that does not have this widget as parent.'
            );
        GWU.arrayDelete(this.children, w);
        w.parent = null;
        return this;
    }

    // draw(buffer: GWU.canvas.DataBuffer): boolean {
    //     if (this.prop('hidden')) return false;
    //     return this._drawChildren(buffer);
    // }

    // _drawChildren(buffer: GWU.canvas.DataBuffer): boolean {
    //     let result = false;
    //     this.children.forEach((w) => {
    //         result = w.draw(buffer) || result;
    //     });
    //     return result;
    // }

    // mousemove(e: GWU.io.Event): boolean {
    //     let handled = false;
    //     this.children.forEach((w) => {
    //         if (w.mousemove(e)) {
    //             handled = true;
    //         }
    //     });
    //     return super.mousemove(e) || handled;
    // }

    // tick(_e: GWU.io.Event): void {}

    // // returns true if click is handled by this widget (stopPropagation)
    // click(_e: GWU.io.Event): boolean {
    //     return false;
    // }
    // // returns true if key is used by widget and you want to stopPropagation
    // keypress(_e: GWU.io.Event): boolean {
    //     return false;
    // }

    // // returns true if key is used by widget and you want to stopPropagation
    // dir(_e: GWU.io.Event): boolean {
    //     return false;
    // }
}
