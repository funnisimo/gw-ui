import * as GWU from 'gw-utils';
import * as Style from '../ui//style';
import { StyleOptions, PropType, UIStylable } from '../ui/types';
import { Layer } from '../ui/layer';

// return true if you want to stop the event from propagating
export type EventCb = (
    name: string,
    widget: Widget | null,
    args?: any
) => boolean; // | Promise<boolean>;

export interface WidgetOptions extends StyleOptions {
    id?: string;
    disabled?: boolean;
    hidden?: boolean;
    opacity?: number;

    x?: number;
    y?: number;
    width?: number;
    height?: number;

    class?: string;
    tag?: string;

    tabStop?: boolean;
    action?: string;
    depth?: number;
}

export interface SetParentOptions {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;

    beforeIndex?: number;
}

Style.defaultStyle.add('*', {
    fg: 'white',
    bg: -1,
    align: 'left',
    valign: 'top',
});

export class Widget implements UIStylable {
    tag: string = 'text';
    layer: Layer;
    bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 1);
    _depth = 0;
    events: Record<string, EventCb[]> = {};
    // action: string = '';
    children: Widget[] = [];

    _style = new Style.Style();
    _used!: Style.ComputedStyle;

    _parent: Widget | null = null;
    classes: string[] = [];
    _props: Record<string, PropType> = {};
    _attrs: Record<string, PropType> = {};

    constructor(term: Layer, opts: WidgetOptions = {}) {
        this.layer = term;
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
            this.attr('action', opts.id);
        }
        if (opts.depth !== undefined) {
            this._depth = opts.depth;
        }
        this._style.set(opts);
        if (opts.class) {
            this.classes = opts.class.split(/ +/g).map((c) => c.trim());
        }
        if (opts.tabStop) {
            this.prop('tabStop', true);
        }
        if (opts.action) {
        }
        if (opts.disabled) {
            this.prop('disabled', true);
        }
        if (opts.hidden) {
            this.prop('hidden', true);
        }

        if (opts.action) {
            this.attr('action', opts.action);
        }
        if (this.attr('action')) {
            this.on('click', (_n, w, e) => {
                const action = this._attrStr('action');
                if (action) {
                    this._bubbleEvent(action, w, e);
                }
                return false; // keep bubbling
            });
        }

        this.layer.attach(this);
        this.updateStyle();
        if (opts.opacity !== undefined) {
            this._used.opacity = opts.opacity;
        }
    }

    get depth(): number {
        return this._depth;
    }
    set depth(v: number) {
        this._depth = v;
        this.layer.sortWidgets();
    }

    get parent(): Widget | null {
        return this._parent;
    }
    set parent(v: Widget | null) {
        this.setParent(v);
    }
    setParent(v: Widget | null, opts: SetParentOptions = {}) {
        if (this._parent) {
            this._parent._removeChild(this);
        }
        this._parent = v;
        if (this._parent) {
            this.depth = this._depth || this._parent.depth + 1;
            this._parent._addChild(this, opts);
        }
    }

    //////////////////////////////////////////

    pos(): GWU.xy.XY;
    pos(xy: GWU.xy.XY): this;
    pos(x: number, y: number): this;
    pos(x?: number | GWU.xy.XY, y?: number): this | GWU.xy.XY {
        if (x === undefined) return this.bounds;

        if (typeof x === 'number') {
            this.bounds.x = x;
            this.bounds.y = y || 0;
        } else {
            this.bounds.x = x.x;
            this.bounds.y = x.y;
        }
        this.layer.needsDraw = true;

        return this;
    }

    center(bounds?: GWU.xy.Bounds): this {
        return this.centerX(bounds).centerY(bounds);
    }

    centerX(bounds?: GWU.xy.Bounds): this {
        bounds = bounds || this.layer.body.bounds;
        const w = this.bounds.width;
        const mid = Math.round((bounds.width - w) / 2);
        this.bounds.x = bounds.x + mid;
        return this;
    }

    centerY(bounds?: GWU.xy.Bounds): this {
        bounds = bounds || this.layer.body.bounds;
        const h = this.bounds.height;
        const mid = Math.round((bounds.height - h) / 2);
        this.bounds.y = bounds.y + mid;
        return this;
    }

    //////////////////////////////////////////

    text(): string;
    text(v: string): this;
    text(v?: string): this | string {
        if (v === undefined) return this._attrStr('text');
        this.attr('text', v);
        return this;
    }

    attr(name: string): PropType;
    attr(name: string, v: PropType): this;
    attr(name: string, v?: PropType): PropType | this {
        if (v === undefined) return this._attrs[name];
        this._attrs[name] = v;
        return this;
    }

    _attrInt(name: string): number {
        const n = this._attrs[name] || 0;
        if (typeof n === 'number') return n;
        if (typeof n === 'string') return Number.parseInt(n);
        return n ? 1 : 0;
    }

    _attrStr(name: string): string {
        const n = this._attrs[name] || '';
        if (typeof n === 'string') return n;
        if (typeof n === 'number') return '' + n;
        return n ? 'true' : 'false';
    }

    _attrBool(name: string): boolean {
        return !!this._attrs[name];
    }

    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    prop(name: string, v?: PropType): this | PropType | undefined {
        if (v === undefined) return this._props[name];
        const current = this._props[name];
        if (current !== v) {
            this._setProp(name, v);
        }
        return this;
    }

    _setProp(name: string, v: PropType): void {
        this._props[name] = v;
        // console.log(`${this.tag}.${name}=${v}`);
        this.updateStyle();
    }

    _propInt(name: string): number {
        const n = this._props[name] || 0;
        if (typeof n === 'number') return n;
        if (typeof n === 'string') return Number.parseInt(n);
        return n ? 1 : 0;
    }

    _propStr(name: string): string {
        const n = this._props[name] || '';
        if (typeof n === 'string') return n;
        if (typeof n === 'number') return '' + n;
        return n ? 'true' : 'false';
    }

    _propBool(name: string): boolean {
        return !!this._props[name];
    }

    toggleProp(name: string): this {
        const current = !!this._props[name];
        this.prop(name, !current);
        return this;
    }

    incProp(name: string, n = 1): this {
        let current = this.prop(name) || 0;
        if (typeof current === 'boolean') {
            current = current ? 1 : 0;
        } else if (typeof current === 'string') {
            current = Number.parseInt(current) || 0;
        }
        current += n;
        this.prop(name, current);
        return this;
    }

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(...args: any[]): boolean {
        return this.bounds.contains(args[0], args[1]);
    }

    style(): Style.Style;
    style(opts: StyleOptions): this;
    style(opts?: StyleOptions): this | Style.Style {
        if (opts === undefined) return this._style;

        this._style.set(opts);
        this.updateStyle();
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

    // @return true to stop the focus change event
    focus(reverse = false): boolean {
        if (this.prop('focus')) return true;

        this.prop('focus', true);
        return this._fireEvent('focus', this, { reverse });
    }

    // @return true to stop the focus change event
    blur(reverse = false): boolean {
        if (!this.prop('focus')) return false;
        this.prop('focus', false);
        return this._fireEvent('blur', this, { reverse });
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
        if (!v && this._used.opacity == 0) {
            this._used.opacity = 100;
        }
    }

    get opacity(): number {
        let opacity = 100;
        let current: Widget | null = this;
        while (current) {
            if (current._used) {
                opacity = Math.min(opacity, current._used.opacity); // TODO - opacity = Math.floor(opacity * current._used.opacity / 100);
            }
            current = current.parent;
        }
        return opacity;
    }

    set opacity(v: number) {
        if (v !== this._used.opacity) {
            this._used.opacity = v;
            this.hidden = this._used.opacity == 0;
            this.layer.needsDraw = true;
        }
    }

    updateStyle() {
        this._used = this.layer.styles.computeFor(this);
        this.layer.needsDraw = true; // changed style or state
    }

    draw(buffer: GWU.buffer.Buffer): boolean {
        if (this.hidden) return false;
        return this._draw(buffer);
    }

    // Animation

    fadeIn(ms: number): this {
        return this.fadeTo(100, ms);
    }

    fadeOut(ms: number): this {
        return this.fadeTo(0, ms);
    }

    fadeTo(opacity: number, ms: number): this {
        const tween = GWU.tween
            .make({ pct: this._used.opacity })
            .to({ pct: opacity })
            .duration(ms)
            .onUpdate((info) => {
                this.opacity = info.pct;
            });
        this.layer.animate(tween);

        return this;
    }

    fadeToggle(ms: number): this {
        return this.fadeTo(this._used.opacity ? 0 : 100, ms);
    }

    // Draw

    protected _draw(buffer: GWU.buffer.Buffer): boolean {
        this._drawFill(buffer);
        return true;
    }

    protected _drawFill(buffer: GWU.buffer.Buffer): void {
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

    // Children
    childAt(xy: GWU.xy.XY): Widget | null;
    childAt(x: number, y: number): Widget | null;
    childAt(...args: any[]): Widget | null {
        return this.children.find((c) => c.contains(args[0], args[1])) || null;
    }

    _addChild(w: Widget, opts?: SetParentOptions): this {
        let beforeIndex = -1;
        if (opts && opts.beforeIndex !== undefined) {
            beforeIndex = opts.beforeIndex;
        }

        if (w._parent && w._parent !== this)
            throw new Error('Trying to add child that already has a parent.');
        if (!this.children.includes(w)) {
            if (beforeIndex < 0 || beforeIndex >= this.children.length) {
                this.children.push(w);
            } else {
                this.children.splice(beforeIndex, 0, w);
            }
        }
        w._parent = this;
        return this;
    }

    _removeChild(w: Widget): this {
        if (!w._parent || w._parent !== this)
            throw new Error(
                'Removing child that does not have this widget as parent.'
            );

        w._parent = null;
        GWU.arrayDelete(this.children, w);
        return this;
    }

    resize(w: number, h: number): this {
        this.bounds.width = w || this.bounds.width;
        this.bounds.height = h || this.bounds.height;
        this.layer.needsDraw = true;
        return this;
    }

    // Events

    mouseenter(e: GWU.io.Event, over: Widget): void {
        if (!this.contains(e)) return;
        if (this.hovered) return;
        this.hovered = true;
        this._fireEvent('mouseenter', this, e);
        if (this._parent) {
            this._parent.mouseenter(e, over);
        }
    }

    mousemove(e: GWU.io.Event): boolean {
        if (this.contains(e) && !e.defaultPrevented && !this.hidden) {
            this._fireEvent('mousemove', this, e);
            // e.preventDefault();
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
        // if (this._parent) {
        //     this._parent.mouseleave(e);
        // }
    }

    click(e: GWU.io.Event): boolean {
        if (this.hidden) return false;
        return this._fireEvent('click', this, e);
    }

    keypress(e: GWU.io.Event): boolean {
        return this._fireEvent('keypress', this, e);
    }
    dir(e: GWU.io.Event): boolean {
        return this._fireEvent('dir', this, e);
    }
    tick(e: GWU.io.Event): boolean {
        return this._fireEvent('tick', this, e);
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

    _fireEvent(name: string, source: Widget | null, args?: any): boolean {
        const handlers = this.events[name] || [];
        let handled = handlers.reduce(
            (out, h) => h(name, source || this, args) || out,
            false
        );
        return handled;
    }

    _bubbleEvent(name: string, source: Widget | null, args?: any): boolean {
        let current: Widget | null = this;
        while (current) {
            if (current._fireEvent(name, source, args)) return true;
            current = current.parent;
        }
        return false;
    }
}
