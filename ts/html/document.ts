import * as GWU from 'gw-utils';

import { UICore } from '../types';
import { Selector } from './selector';
import * as Style from './style';
import { Element, PosOptions, makeElement } from './element';

// return true if you want to stop the event from propagating
export type EventCb = (
    document: Document,
    element: Element,
    io?: GWU.io.Event
) => boolean; // | Promise<boolean>;

// TODO - fix
export type FxFn = () => void; // | Promise<void>;
export type Fx = number;

export type ElementCb = (element: Element) => any;
export type ElementMatch = (element: Element) => boolean;

export type SelectType = string | Element | Element[] | Selection;

export class Document {
    ui: UICore;
    body: Element;
    _activeElement: Element | null = null;
    children: Element[];
    stylesheet: Style.Sheet;
    _done = false;

    constructor(ui: UICore, rootTag = 'body') {
        this.ui = ui;
        this.stylesheet = new Style.Sheet();

        this.body = new Element(rootTag);
        this.body.style({
            width: ui.buffer.width,
            maxWidth: ui.buffer.width,
            height: ui.buffer.height,
            maxHeight: ui.buffer.height,
            position: 'fixed',
            top: 0,
            left: 0,
        });
        this.body._attached = true; // attached as the root of the layer

        this.children = [this.body];
    }

    $(id?: SelectType): Selection {
        return this.select(id);
    }

    select(id?: SelectType): Selection {
        let selected: Element[];
        if (id === undefined) {
            selected = [this.body];
        } else if (id instanceof Selection) {
            return id;
        } else if (typeof id === 'string') {
            if (id.startsWith('<')) {
                selected = [this.createElement(id)];
            } else {
                if (id === 'document') {
                    selected = [this.body]; // convenience
                } else {
                    const s = new Selector(id);
                    selected = this.children.filter((w) => s.matches(w));
                }
            }
        } else if (Array.isArray(id)) {
            selected = id;
        } else {
            selected = [id];
        }
        return new Selection(this, selected);
    }

    createElement(tag: string): Element {
        return makeElement(tag, this.stylesheet);
    }

    create(tag: string): Selection {
        return this.select(this.createElement(tag));
    }

    rule(info: Record<string, Style.StyleOptions>): this;
    rule(rule: string): Style.Style;
    rule(rule: string, style: Style.StyleOptions): this;
    rule(
        rule: string | Record<string, Style.StyleOptions>,
        style?: Style.StyleOptions
    ): this | Style.Style {
        if (typeof rule === 'string') {
            if (style) {
                this.stylesheet.add(rule, style);
                return this;
            }

            let out = this.stylesheet.get(rule);
            if (out) return out;

            return this.stylesheet.add(rule, {});
        }

        Object.entries(rule).forEach(([name, value]) => {
            this.stylesheet.add(name, value);
        });
        return this;
    }

    removeRule(rule: string): this {
        this.stylesheet.remove(rule);
        return this;
    }

    _attach(w: Element | Element[]): this {
        if (Array.isArray(w)) {
            w.forEach((x) => this._attach(x));
            return this;
        }
        if (this.children.includes(w)) return this;
        this.children.push(w);
        w._attached = true;
        w.children.forEach((c) => this._attach(c));
        return this;
    }

    _detach(w: Element | Element[]): this {
        if (Array.isArray(w)) {
            w.forEach((x) => this._detach(x));
            return this;
        }
        if (w === this.body) throw new Error('Cannot detach root widget.');

        GWU.arrayDelete(this.children, w);
        w._attached = false;
        w.children.forEach((c) => this._detach(c));
        return this;
    }

    computeStyles() {
        this.children.forEach((w) => {
            if (w.used().dirty || this.stylesheet.dirty) {
                w.used(this.stylesheet.computeFor(w));
            }
        });

        this.stylesheet.dirty = false;
    }

    updateLayout(widget?: Element) {
        widget = widget || this.body;
        widget.updateLayout();
    }

    draw(buffer?: GWU.canvas.Buffer) {
        this.computeStyles();
        this.updateLayout();
        buffer = buffer || this.ui.buffer;
        this.body.draw(buffer);
        buffer.render();
    }

    // activeElement

    get activeElement(): Element | null {
        return this._activeElement;
    }

    setActiveElement(w: Element | null, reverse = false): boolean {
        if (w === this._activeElement) return true;

        const opts: Partial<GWU.io.Event> = {
            target: w,
            dir: [reverse ? -1 : 1, 0],
        };
        if (
            this._activeElement &&
            this._fireEvent(this._activeElement, 'blur', opts)
        ) {
            return false;
        }
        if (w && this._fireEvent(w, 'focus', opts)) return false;

        if (this._activeElement) this._activeElement.onblur();
        this._activeElement = w;
        if (this._activeElement) this._activeElement.onfocus(reverse);

        return true;
    }

    nextTabStop() {
        if (!this._activeElement) {
            this.setActiveElement(
                this.children.find(
                    (w) => !w.prop('disabled') && w.prop('tabindex')
                ) || null
            );
            return !!this._activeElement;
        }

        const next = GWU.arrayNext(
            this.children,
            this._activeElement,
            (w) => !!w.prop('tabindex') && !w.prop('disabled')
        );
        if (next) {
            this.setActiveElement(next);
            return true;
        }
        return false;
    }

    prevTabStop() {
        if (!this._activeElement) {
            this.setActiveElement(
                this.children.find(
                    (w) => !w.prop('disabled') && w.prop('tabindex')
                ) || null
            );
            return !!this._activeElement;
        }

        const prev = GWU.arrayPrev(
            this.children,
            this._activeElement,
            (w) => !!w.prop('tabindex') && !w.prop('disabled')
        );
        if (prev) {
            this.setActiveElement(prev, true);
            return true;
        }
        return false;
    }

    // events

    // return topmost element under point
    elementFromPoint(x: number, y: number): Element {
        return this.body.elementFromPoint(x, y) || this.body;
    }

    _fireEvent(
        element: Element,
        name: string,
        e?: Partial<GWU.io.Event>
    ): boolean {
        if (!e || !e.type) {
            e = GWU.io.makeCustomEvent(name, e);
        }
        const handlers = element.events[name] || [];
        let handled = handlers.reduce(
            (out, h) => h(this, element, e as GWU.io.Event) || out,
            false
        );
        return handled;
    }

    _bubbleEvent(element: Element, name: string, e: GWU.io.Event): boolean {
        let current: Element | null = element;
        while (current) {
            const handlers = current.events[name] || [];
            let handled = handlers.reduce(
                (out, h) => h(this, current!, e) || out,
                false
            );
            if (handled) return true;
            current = current.parent;
        }
        return false;
    }

    click(e: GWU.io.Event): boolean {
        let element: Element | null = this.elementFromPoint(e.x, e.y);
        if (!element) return false;

        if (this._bubbleEvent(element, 'click', e)) return this._done;

        if (element.prop('tabindex')) {
            this.setActiveElement(element);
        }
        return false;
    }

    mousemove(e: GWU.io.Event): boolean {
        this.children.forEach((w) => w.prop('hover', false));
        let element: Element | null = this.elementFromPoint(e.x, e.y);

        let current: Element | null = element;
        while (current) {
            current.prop('hover', true);
            current = current.parent;
        }

        if (element && this._bubbleEvent(element, 'mousemove', e))
            return this._done;
        return false;
    }

    // dir
    dir(e: GWU.io.Event): boolean {
        const element = this.activeElement || this.body;
        if (element && this._bubbleEvent(element, 'dir', e)) return this._done;
        return false;
    }

    // keypress
    keypress(e: GWU.io.Event): boolean {
        const element = this.activeElement || this.body;
        if (element && this._bubbleEvent(element, 'keypress', e))
            return this._done;

        if (e.key === 'Tab') {
            this.nextTabStop();
        } else if (e.key === 'TAB') {
            this.prevTabStop();
        }

        return false;
    }
}

// TODO - look at cheerio
export class Selection {
    document: Document;
    selected: Element[];

    constructor(document: Document, widgets: Element[] = []) {
        this.document = document;
        this.selected = widgets.slice();
    }

    get(): Element[];
    get(index: number): Element;
    get(index?: number): Element | Element[] {
        if (index === undefined) return this.selected;
        if (index < 0) return this.selected[this.selected.length + index];
        return this.selected[index];
    }

    length(): number {
        return this.selected.length;
    }

    slice(start: number, end?: number): Selection {
        return new Selection(this.document, this.selected.slice(start, end));
    }

    add(arg: SelectType): this {
        if (!(arg instanceof Selection)) {
            arg = this.document.$(arg);
        }

        arg.forEach((w) => {
            if (!this.selected.includes(w)) {
                this.selected.push(w);
            }
        });
        return this;
    }

    clone(): this {
        this.selected = this.selected.map((w) => w.clone());
        return this;
    }

    // async ???
    forEach(cb: ElementCb): this {
        this.selected.forEach(cb);
        return this;
    }

    // HIERARCHY

    after(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.document.$(content);
        }

        if (content.length() == 0) return this;
        content.detach();

        let current = content;
        const last = this.selected.length - 1;
        this.selected.forEach((next, i) => {
            if (!next.parent)
                throw new Error('Cannot add after detached widgets.');

            current =
                i < last ? (<Selection>content).clone() : <Selection>content;

            const parent = next.parent;
            let nextIndex = parent.children.indexOf(next) + 1;

            current.forEach((toAdd) => {
                parent.addChild(toAdd, nextIndex);
                if (parent._attached) {
                    this.document._attach(toAdd);
                }
            });
        });

        return this;
    }

    append(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.document.$(content);
        }

        if (content.length() == 0) return this;

        content.detach(); // remove all items to be appended from the tree

        let current = content;
        const last = this.selected.length - 1;
        this.selected.forEach((dest, i) => {
            current =
                i < last ? (<Selection>content).clone() : <Selection>content;
            current.forEach((toAppend) => {
                dest.addChild(toAppend);
                if (dest._attached) {
                    this.document._attach(toAppend);
                }
            });
        });

        return this;
    }

    appendTo(dest: SelectType): this {
        if (!(dest instanceof Selection)) {
            dest = this.document.$(dest);
        }

        dest.append(this);
        return this;
    }

    before(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.document.$(content);
        }

        if (content.length() == 0) return this;
        content.detach();

        let current = content;
        const last = this.selected.length - 1;
        this.selected.forEach((next, i) => {
            if (!next.parent)
                throw new Error('Cannot add before detached widgets.');

            current =
                i < last ? (<Selection>content).clone() : <Selection>content;

            const parent = next.parent;
            let nextIndex = parent.children.indexOf(next);

            current.forEach((toAdd) => {
                parent.addChild(toAdd, nextIndex++);
                if (parent._attached) {
                    this.document._attach(toAdd);
                }
            });
        });

        return this;
    }

    detach(): this {
        this.selected.forEach((w) => {
            if (w._attached) {
                if (!w.parent) throw new Error('Cannot detach root widget.');
                w.parent.removeChild(w);

                // remove from document.children
                this.document._detach(w);
            }
        });
        return this;
    }

    empty(): this {
        this.selected.forEach((w) => {
            const oldChildren = w.empty();
            this.document._detach(oldChildren);
        });
        return this;
    }

    insertAfter(target: SelectType): this {
        if (!(target instanceof Selection)) {
            target = this.document.$(target);
        }

        target.after(this);
        return this;
    }

    insertBefore(target: SelectType): this {
        if (!(target instanceof Selection)) {
            target = this.document.$(target);
        }

        target.before(this);
        return this;
    }

    prepend(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.document.$(content);
        }

        if (content.length() == 0) return this;

        content.detach(); // remove all items to be prepended from the tree

        let current = content;
        const last = this.selected.length - 1;
        this.selected.forEach((dest, i) => {
            current =
                i < last ? (<Selection>content).clone() : <Selection>content;
            current.forEach((toAppend) => {
                dest.addChild(toAppend, 0); // before first child
                if (dest._attached) {
                    this.document._attach(toAppend);
                }
            });
        });

        return this;
    }

    prependTo(dest: SelectType): this {
        if (!(dest instanceof Selection)) {
            dest = this.document.$(dest);
        }

        dest.prepend(this);
        return this;
    }

    remove(_sub?: string): this {
        // TODO - subselector
        // TODO - remove events
        return this.detach();
    }

    replaceAll(target: SelectType): this {
        if (!(target instanceof Selection)) {
            target = this.document.$(target);
        }

        target.before(this);
        target.detach();
        return this;
    }

    replaceWith(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.document.$(content);
        }

        content.replaceAll(this);
        return this;
    }

    // wrap
    // unwrap
    // wrapAll
    // wrapInner

    // Props

    text(): string;
    text(t: string): this;
    text(t?: string): this | string {
        if (!t) {
            return this.selected.length ? this.selected[0].text() : '';
        }
        this.selected.forEach((w) => w.text(t));
        return this;
    }

    id(): string;
    id(t: string): this;
    id(t?: string): this | string {
        if (!t) {
            return this.selected[0] ? this.selected[0].text() : '';
        }
        if (this.selected.length) {
            this.selected[0].id = t;
        }
        return this;
    }

    prop(id: string): boolean | number;
    prop(id: string, value: boolean | number): this;
    prop(id: string, value?: boolean | number): this | boolean | number {
        if (value === undefined) {
            if (this.selected.length == 0) return false;
            return this.selected[0].prop(id);
        }
        this.selected.forEach((e) => e.prop(id, value));
        return this;
    }

    // STYLE

    addClass(id: string): this {
        this.selected.forEach((w) => w.addClass(id));
        return this;
    }

    hasClass(id: string): boolean {
        if (this.selected.length == 0) return false;
        return this.selected[0].classes.includes(id);
    }

    removeClass(id: string): this {
        this.selected.forEach((w) => w.removeClass(id));
        return this;
    }

    toggleClass(id: string): this {
        this.selected.forEach((w) => w.toggleClass(id));
        return this;
    }

    style(): Style.Style;
    style(style: Style.StyleOptions): this;
    style(name: keyof Style.Style): any;
    style(name: keyof Style.StyleOptions, value: any): this;
    style(
        name?:
            | keyof Style.StyleOptions
            | keyof Style.Style
            | Style.StyleOptions,
        value?: any
    ): this | Style.Style | any {
        if (!name) return this.selected[0].style();
        if (value === undefined) {
            if (typeof name === 'string') {
                return this.selected[0].style(name as keyof Style.Style);
            }
        }

        this.selected.forEach((w) => {
            if (typeof name === 'string') {
                w.style(name as keyof Style.StyleOptions, value);
            } else {
                w.style(name as Style.StyleOptions);
            }
        });
        return this;
    }

    removeStyle(name: keyof Style.Style): this {
        this.selected.forEach((w) => w.removeStyle(name));
        return this;
    }

    pos(): GWU.xy.XY;
    pos(
        left: number,
        top: number,
        position?: Omit<Style.Position, 'static'>
    ): this;
    pos(xy: PosOptions, position?: Omit<Style.Position, 'static'>): this;
    pos(...args: any[]): this | GWU.xy.XY {
        if (this.selected.length == 0) return this;

        if (args.length == 0) {
            return this.selected[0].pos();
        }

        this.selected.forEach((w) => w.pos(args[0], args[1], args[2]));
        return this;
    }

    // ANIMATION

    animate(_props: any, _ms: number): this {
        return this;
    }
    clearQueue(_name?: string): this {
        return this;
    }
    delay(_ms: number, _name?: string): this {
        return this;
    }
    dequeue(): this {
        return this;
    }

    fadeIn(_ms: number): this {
        return this;
    }
    fadeOut(_ms: number): this {
        return this;
    }
    fadeTo(_ms: number, _opacity: number): this {
        return this;
    }
    fadeToggle(_ms: number): this {
        return this;
    }

    finish(_name?: string): this {
        return this;
    }

    hide(_ms?: number): this {
        return this;
    }

    queue(fn: FxFn): this;
    queue(name: string): Fx[];
    queue(name: string, fn: FxFn): this;
    queue(name: string, items: Fx[]): this;
    queue(..._args: any[]): Fx[] | this {
        return [];
    }

    show(_ms?: number): this {
        return this;
    }

    slideDown(_ms: number): this {
        return this;
    }
    slideToggle(_ms: number): this {
        return this;
    }
    slideUp(_ms: number): this {
        return this;
    }
    stop(): this {
        return this;
    }

    // toggle the visibility
    toggle(): this;
    toggle(ms: number): this;
    toggle(visible: boolean): this;
    toggle(_arg?: number | boolean): this {
        return this;
    }

    // EVENTS

    on(event: string, cb: EventCb): this {
        this.selected.forEach((w) => {
            w.on(event, cb);
        });
        return this;
    }
    off(event: string, cb?: EventCb): this {
        this.selected.forEach((w) => {
            w.off(event, cb);
        });
        return this;
    }

    fire(event: string, e?: GWU.io.Event): this {
        if (!e) {
            e = GWU.io.makeCustomEvent(event);
        }
        this.selected.forEach((w) => {
            const handlers = w.events[event];
            if (handlers) {
                handlers.forEach((cb) => cb(this.document, w, e));
            }
        });
        return this;
    }
}
