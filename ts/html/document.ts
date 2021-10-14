import * as GWU from 'gw-utils';

import { UICore } from '../types';
import { Selector } from './selector';
import * as Style from './style';
import { Element } from './element';

// return true if you want to stop the event from propagating
export type EventCb = (
    e: GWU.io.Event,
    layer: Document,
    widget: Element
) => boolean | Promise<boolean>;

// TODO - fix
export type FxFn = () => void | Promise<void>;
export type Fx = number;

export type ElementCb = (element: Element) => any;

export type SelectType = string | Element | Element[] | Selection;

export class Document {
    ui: UICore;
    body: Element;
    children: Element[];
    stylesheet: Style.Sheet;

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
        if (tag.startsWith('<')) {
            if (!tag.endsWith('>'))
                throw new Error('Need brackets around new tag - e.g. "<tag>"');
            tag = tag.substring(1, tag.length - 1);
        }
        return new Element(tag, this.stylesheet);
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
}

export class Selection {
    layer: Document;
    selected: Element[];

    constructor(layer: Document, widgets: Element[] = []) {
        this.layer = layer;
        this.selected = widgets.slice();
    }

    get(index: number): Element {
        return this.selected[index];
    }

    length(): number {
        return this.selected.length;
    }

    add(arg: SelectType): this {
        if (!(arg instanceof Selection)) {
            arg = this.layer.$(arg);
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
            content = this.layer.$(content);
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
                    this.layer._attach(toAdd);
                }
            });
        });

        return this;
    }

    append(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.layer.$(content);
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
                    this.layer._attach(toAppend);
                }
            });
        });

        return this;
    }

    appendTo(dest: SelectType): this {
        if (!(dest instanceof Selection)) {
            dest = this.layer.$(dest);
        }

        dest.append(this);
        return this;
    }

    before(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.layer.$(content);
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
                    this.layer._attach(toAdd);
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
                this.layer._detach(w);
            }
        });
        return this;
    }

    empty(): this {
        this.selected.forEach((w) => {
            const oldChildren = w.empty();
            this.layer._detach(oldChildren);
        });
        return this;
    }

    insertAfter(target: SelectType): this {
        if (!(target instanceof Selection)) {
            target = this.layer.$(target);
        }

        target.after(this);
        return this;
    }

    insertBefore(target: SelectType): this {
        if (!(target instanceof Selection)) {
            target = this.layer.$(target);
        }

        target.before(this);
        return this;
    }

    prepend(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.layer.$(content);
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
                    this.layer._attach(toAppend);
                }
            });
        });

        return this;
    }

    prependTo(dest: SelectType): this {
        if (!(dest instanceof Selection)) {
            dest = this.layer.$(dest);
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
            target = this.layer.$(target);
        }

        target.before(this);
        target.detach();
        return this;
    }

    replaceWith(content: SelectType): this {
        if (!(content instanceof Selection)) {
            content = this.layer.$(content);
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
            return this.selected[0]?.text();
        }
        this.selected.forEach((w) => w.text(t));
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

    on(_event: string, _cb: EventCb): this {
        return this;
    }
    off(_event: string): this {
        return this;
    }

    click(cb: EventCb): this;
    click(e: GWU.io.Event): this;
    click(_arg: EventCb | GWU.io.Event): this {
        return this;
    }

    keypress(cb: EventCb): this;
    keypress(e: GWU.io.Event): this;
    keypress(_arg: EventCb | GWU.io.Event): this {
        return this;
    }

    dir(cb: EventCb): this;
    dir(e: GWU.io.Event): this;
    dir(_arg: EventCb | GWU.io.Event): this {
        return this;
    }

    mouseenter(cb: EventCb): this;
    mouseenter(e: GWU.io.Event): this;
    mouseenter(_arg: EventCb | GWU.io.Event): this {
        return this;
    }

    mouseleave(cb: EventCb): this;
    mouseleave(e: GWU.io.Event): this;
    mouseleave(_arg: EventCb | GWU.io.Event): this {
        return this;
    }

    mousemove(cb: EventCb): this;
    mousemove(e: GWU.io.Event): this;
    mousemove(_arg: EventCb | GWU.io.Event): this {
        return this;
    }
}
