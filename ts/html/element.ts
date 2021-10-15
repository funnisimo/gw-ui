import * as GWU from 'gw-utils';
import { EventCb, Position } from '.';
import { Selectable } from './selector';
import * as Style from './style';

export interface PosOptions {
    x?: number;
    y?: number;
    right?: number;
    left?: number;
    bottom?: number;
    top?: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface SizeOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export class Element implements Selectable {
    id = '';
    tag: string;
    parent: Element | null = null;
    _props: Record<string, boolean> = {};
    classes: string[] = [];
    children: Element[] = [];
    events: Record<string, EventCb[]> = {};

    _bounds: GWU.xy.Bounds = new GWU.xy.Bounds(0, 0, 0, 0);
    _text: string = '';
    _lines: string[] = [];
    _dirty = false;
    _attached = false;

    _style: Style.Style | null = null;
    _usedStyle: Style.ComputedStyle;
    // hovered: Style.Style = {};
    // active: Style.Style = {};

    constructor(tag: string, styles?: Style.Sheet) {
        this.tag = tag;
        this._usedStyle = styles
            ? styles.computeFor(this)
            : new Style.ComputedStyle();
    }

    contains(xy: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    contains(x: GWU.xy.XY | number, y?: number): boolean {
        if (typeof x === 'number') return this._bounds.contains(x, y!);
        return this._bounds.contains(x);
    }

    clone(): this {
        if (this._attached && !this.parent)
            throw new Error('Cannot clone a root widget.');

        const other = new (<new (tag: string) => this>this.constructor)(
            this.tag
        );
        Object.assign(other._props, this._props);
        other.classes = this.classes.slice();

        other._text = this._text;
        if (this._style) {
            other._style = this._style.clone();
        }

        other.parent = null; // The root cloned widget will not have a parent anymore
        other._attached = false;
        other.dirty = true;

        // First we clone the children, then we set their parent to us
        other.children = this.children.map((c) => c.clone());
        other.children.forEach((c) => (c.parent = other));

        return other;
    }

    get dirty(): boolean {
        return this._dirty || this._usedStyle.dirty;
    }
    set dirty(v: boolean) {
        this._dirty = v;
        if (this.parent) {
            const position = this.used('position');
            if (position === 'static' || position === 'relative') {
                this.parent.dirty = true;
            }
        }
    }

    // PROPS

    prop(name: string): boolean;
    prop(name: string, value: boolean): this;
    prop(name: string, value?: boolean): this | boolean {
        if (value === undefined) return this._props[name];
        this._props[name] = value;
        this._usedStyle.dirty = true; // Need to reload styles
        return this;
    }

    toggleProp(name: string): this {
        const v = this._props[name] || false;
        this._props[name] = !v;
        this._usedStyle.dirty = true; // Need to reload styles
        return this;
    }

    // CHILDREN

    addChild(child: Element, beforeIndex = -1): this {
        if (child.parent) {
            if (child.parent === this) return this; // ok

            throw new Error(
                'Cannot add a currently attached child to another element.  Detach it first.'
            );
        }
        if (beforeIndex == 0) {
            this.children.unshift(child);
        } else if (beforeIndex > 0 && beforeIndex <= this.children.length - 1) {
            this.children.splice(beforeIndex, 0, child);
        } else {
            this.children.push(child);
        }
        child.parent = this;
        child.dirty = true;
        this.dirty = true;
        return this;
    }

    removeChild(child: Element): this {
        if (!child.parent) return this; // not attached, silently ignore
        if (child.parent !== this) {
            throw new Error(
                'Cannot remove child that is not attached to this widget.'
            );
        }

        if (GWU.arrayDelete(this.children, child)) {
            child.parent = null;
            child.dirty = true;
            this.dirty = true;
        }
        return this;
    }

    empty(): Element[] {
        this.text(''); // clear the text

        // clear the children
        const old = this.children;
        this.children = []; // no more children
        old.forEach((c) => {
            c.parent = null;
            c.dirty = true;
        });

        this.dirty = true;
        // return the children for cleanup
        return old;
    }

    root(): Element | null {
        let current: Element = this;
        while (current.parent) {
            current = current.parent;
        }
        return current !== this ? current : null;
    }

    positionedParent(): Element | null {
        let parent = this.parent;
        if (parent) {
            // for absolute position, position is relative to closest ancestor that is positioned
            while (parent && !parent.isPositioned()) {
                parent = parent.parent;
            }
        }
        if (!parent) {
            return this.root(); // no positioned parent so we act fixed.
        }
        return parent;
    }

    // BOUNDS

    get bounds(): GWU.xy.Bounds {
        // this._update();
        return this._bounds;
    }

    get innerLeft(): number {
        return this._bounds.left + (this._usedStyle.padLeft || 0);
    }

    get innerRight(): number {
        return this._bounds.right - (this._usedStyle.padRight || 0);
    }

    get innerWidth(): number {
        return (
            this._bounds.width -
            (this._usedStyle.padLeft || 0) -
            (this._usedStyle.padRight || 0)
        );
    }

    get innerHeight(): number {
        return (
            this._bounds.height -
            (this._usedStyle.padTop || 0) -
            (this._usedStyle.padBottom || 0)
        );
    }

    get innerTop(): number {
        return this._bounds.top + (this._usedStyle.padTop || 0);
    }

    get innerBottom(): number {
        return this._bounds.bottom + (this._usedStyle.padBottom || 0);
    }

    updateLayout(): this {
        if (!this.dirty) {
            this.children.forEach((c) => c.updateLayout());
            return this;
        }

        const position = this._usedStyle.position || 'static';

        if (position === 'fixed') {
            this._updateLayoutFixed();
        } else if (position === 'relative') {
            this._updateLayoutRelative();
        } else if (position === 'absolute') {
            this._updateLayoutAbsolute();
        } else {
            this._updateLayoutStatic();
        }
        return this;
    }

    _updateWidth(parentWidth = 0): this {
        const used = this.used();
        const bounds = this.bounds;

        let width = used.width || parentWidth;
        if (!width) {
            this._lines = GWU.text.splitIntoLines(
                this._text,
                (used.maxWidth || 999) -
                    (used.padLeft || 0) -
                    (used.padRight || 0)
            );
            width = this.contentWidth() || GWU.text.length(this._text);
            width += used.padLeft || 0;
            width += used.padRight || 0;
        }

        const maxW = used.maxWidth || width;
        const minW = used.minWidth || width;
        bounds.width = GWU.clamp(width, minW, maxW);

        if (this._text.length) {
            if (bounds.width) {
                this._lines = GWU.text.splitIntoLines(
                    this._text,
                    bounds.width - (used.padLeft || 0) - (used.padRight || 0)
                );
            } else if (GWU.text.length(this._text)) {
                this._lines = [this._text];
            }
        } else {
            this._lines = [];
        }

        return this;
    }

    _updateLeft(parentLeft = 0, parentWidth = 0): this {
        const used = this._usedStyle;

        let left = parentLeft;
        if (used.position !== 'static') {
            if (used.left) {
                left += used.left;
            } else if (used.right) {
                const parentRight = parentLeft + parentWidth;

                left = parentRight - used.right - this.bounds.width;
            }
        }

        this.bounds.left = left;
        return this;
    }

    _updateTop(parentBottom = 0): this {
        this.bounds.top = parentBottom;
        return this;
    }

    _updateHeight(): this {
        const used = this._usedStyle;
        const bounds = this.bounds;

        bounds.height = this._lines.length + (used.padTop || 0);

        // update children...
        this.children.forEach((c) => {
            c.updateLayout();
            const cpos = c.used('position');
            if (!['absolute', 'fixed'].includes(cpos)) {
                bounds.height += c.bounds.height;
            }
        });

        // add padding
        bounds.height += used.padBottom || 0;

        if (used.height) {
            bounds.height = used.height;
        }

        const maxH = used.maxHeight || bounds.height;
        const minH = used.minHeight || bounds.height;
        bounds.height = GWU.clamp(bounds.height, minH, maxH);

        if (bounds.height < this._lines.length) {
            this._lines.length = bounds.height;
        }

        return this;
    }

    applyLayoutOffset(): this {
        const used = this._usedStyle;
        const position = used.position || 'static';
        if (position !== 'static') {
            let parent: Element | null = this;
            if (used.position === 'fixed') {
                const root = this.root();
                if (root) parent = root;
            } else if (used.position === 'absolute') {
                const pos = this.positionedParent();
                if (pos) parent = pos;
            }

            if (used.top) {
                this.bounds.top = parent.innerTop + used.top;
            } else if (used.bottom) {
                this.bounds.bottom = parent.innerBottom - used.bottom;
            }
        }

        this.children.forEach((c) => c.applyLayoutOffset());
        return this;
    }

    _updateLayoutStatic() {
        const parent = this.parent;
        this._updateWidth(parent ? parent.innerWidth : 0);
        this._updateLeft(
            parent ? parent.innerLeft : 0,
            parent ? parent.innerWidth : 0
        );
        this._updateTop(parent ? parent.bounds.bottom : 0);
        this._updateHeight();

        this.dirty = false;
        return this;
    }

    _updateLayoutRelative() {
        this._updateLayoutStatic();
        this.applyLayoutOffset();
    }

    _updateLayoutFixed() {
        const parent = this.root();
        this._updateWidth(0); // width comes from content
        this._updateHeight();

        this.bounds.left = 0;
        if (this._usedStyle.left !== undefined) {
            this.bounds.left = this._usedStyle.left;
        } else if (this._usedStyle.right && parent) {
            this.bounds.right = parent.bounds.right - this._usedStyle.right;
        }

        this.bounds.top = 0;
        if (this._usedStyle.top !== undefined) {
            this.bounds.top = this._usedStyle.top;
        } else if (this._usedStyle.bottom && parent) {
            this.bounds.bottom =
                parent.bounds.height - this._usedStyle.bottom - 1;
        }

        this.dirty = false;
        return this;
    }

    _updateLayoutAbsolute() {
        let parent = this.positionedParent();

        this._updateWidth(0); // width comes from content
        this._updateHeight();

        this.bounds.left = 0;
        if (this._usedStyle.left !== undefined) {
            this.bounds.left =
                this._usedStyle.left + (parent ? parent.bounds.left : 0);
        } else if (this._usedStyle.right && parent) {
            this.bounds.right = parent.bounds.right - this._usedStyle.right;
        }

        this.bounds.top = 0;
        if (this._usedStyle.top !== undefined) {
            this.bounds.top =
                this._usedStyle.top + (parent ? parent.bounds.top : 0);
        } else if (this._usedStyle.bottom && parent) {
            this.bounds.bottom =
                parent.bounds.height - this._usedStyle.bottom - 1;
        }

        this.dirty = false;
        return this;
    }

    // STYLE + CLASS

    style(): Style.Style;
    style(id: keyof Style.Style): any;
    style(props: Style.StyleOptions): this;
    style(id: keyof Style.StyleOptions, val: any): this;
    style(...args: any[]): this | Style.Style | any {
        if (!this._style) {
            this._style = new Style.Style();
        }
        if (args.length === 0) return this._style;

        if (args.length === 1) {
            const v = args[0];
            if (typeof v === 'string') {
                return this._style.get(v as keyof Style.Style);
            } else {
                this._style.set(args[0], false); // do not set the dirty flag
                this._usedStyle.set(args[0], false); // do not set the dirty flag
                this.dirty = true; // Need layout update
            }
        } else {
            this._style.set(args[0], args[1], false); // do not set dirty flag
            this._usedStyle.set(args[0], args[1], false); // do not set dirty flag
            this.dirty = true; // Need layout update
        }

        return this;
    }

    removeStyle(id: keyof Style.Style): this {
        if (!this._style) return this;
        this._style.unset(id);
        this._usedStyle.dirty = true;
        return this;
    }

    used(): Style.Style;
    used(style: Style.ComputedStyle): this;
    used(id: keyof Style.Style): any;
    used(id?: keyof Style.Style | Style.ComputedStyle): any | Style.Style {
        if (!id) return this._usedStyle;
        if (id instanceof Style.ComputedStyle) {
            this._usedStyle = id;
            this.dirty = true;
            return this;
        }
        return this._usedStyle.get(id);
    }

    addClass(id: string): this {
        const items = id.split(' ');
        items.forEach((cls) => {
            if (cls.length == 0) return;
            if (this.classes.includes(cls)) return;
            this._usedStyle.dirty = true; // It needs to get styles for this class
            this.classes.push(cls);
        });
        return this;
    }

    removeClass(id: string): this {
        const items = id.split(' ');
        items.forEach((cls) => {
            if (cls.length == 0) return;
            if (!GWU.arrayDelete(this.classes, cls)) return;
            this._usedStyle.dirty = true; // It may need to remove some styles
        });
        return this;
    }

    toggleClass(id: string): this {
        const items = id.split(' ');
        items.forEach((cls) => {
            if (cls.length == 0) return;
            if (!GWU.arrayDelete(this.classes, cls)) {
                this.classes.push(cls);
            }
            this._usedStyle.dirty = true;
        });
        return this;
    }

    // POSITION

    pos(): GWU.xy.XY;
    pos(
        left: number,
        top: number,
        position?: Omit<Style.Position, 'static'>
    ): this;
    pos(xy: PosOptions, position?: Omit<Style.Position, 'static'>): this;
    pos(...args: any[]): this | GWU.xy.XY {
        if (args.length === 0) return this.bounds;

        let pos: PosOptions;
        let wantStyle: Position = 'fixed';
        if (typeof args[0] === 'number') {
            pos = { left: args.shift(), top: args.shift() };
        } else {
            pos = args.shift();
        }

        // update style if necessary
        if (args[0] && args[0].length) {
            wantStyle = args[0];
            this.style('position', wantStyle);
        } else if (!this.isPositioned()) {
            this.style('position', 'fixed'); // convert to fixed
        }

        if (pos.right !== undefined) {
            this.style('right', pos.right);
        }
        if (pos.left !== undefined) {
            this.style('left', pos.left);
        }

        if (pos.top !== undefined) {
            this.style('top', pos.top);
        }
        if (pos.bottom !== undefined) {
            this.style('bottom', pos.bottom);
        }

        return this;
    }

    isPositioned(): boolean {
        const pos = this._usedStyle.position;
        return !!pos && pos !== 'static';
    }

    // SIZE

    size(): Size;
    size(width: number, height: number): this;
    size(size: SizeOptions): this;
    size(size?: SizeOptions | number, height?: number): this | Size {
        if (size === undefined) return this.bounds;
        if (typeof size === 'number') {
            size = { width: size, height } as SizeOptions;
        }

        if (size.minWidth !== undefined) this.style('minWidth', size.minWidth);
        if (size.minHeight !== undefined)
            this.style('minHeight', size.minHeight);
        if (size.maxWidth !== undefined) this.style('maxWidth', size.maxWidth);
        if (size.maxHeight !== undefined)
            this.style('maxHeight', size.maxHeight);

        if (size.width !== undefined) this.style('width', size.width);
        if (size.height !== undefined) this.style('height', size.height);

        // this._update();

        return this;
    }

    // TEXT

    text(): string;
    text(v: string): this;
    text(v?: string): this | string {
        if (v === undefined) return this._text;
        this._text = v;
        // if (this.bounds.width) {
        //     this._lines = GWU.text.splitIntoLines(v, this.bounds.width);
        // } else {
        //     this._lines = GWU.text.splitIntoLines(v);
        //     this.bounds.width = this.contentWidth();
        // }
        this.dirty = true;
        return this;
    }

    contentWidth(): number {
        return this._lines.reduce((out, line) => Math.max(out, line.length), 0);
    }

    // DRAWING

    draw(buffer: GWU.canvas.DataBuffer): boolean {
        const bg = this.used('bg');
        const bounds = this.bounds;

        buffer.fillRect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height,
            ' ',
            bg,
            bg
        );

        if (this.children.length) {
            // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/Stacking_without_z-index
            this.children.forEach((c) => {
                if (!c.isPositioned()) c.draw(buffer);
            });
            this.children.forEach((c) => {
                if (c.isPositioned()) c.draw(buffer);
            });
        } else if (this._lines.length) {
            const fg = this.used('fg') || 'white';
            const top = this.innerTop;
            const width = this.innerWidth;
            const left = this.innerLeft;
            const align = this.used('align');
            this._lines.forEach((line, i) => {
                buffer.drawText(left, top + i, line, fg, -1, width, align);
            });
        }

        return true;
    }

    // Events

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

    elementFromPoint(x: number, y: number): Element | null {
        let result: Element | null = null;

        // positioned elements
        for (let w of this.children) {
            if (w.isPositioned() && w.contains(x, y)) {
                result = w.elementFromPoint(x, y) || result;
            }
        }
        if (result) return result;

        // static elements
        for (let w of this.children) {
            if (!w.isPositioned() && w.contains(x, y)) {
                result = w.elementFromPoint(x, y) || result;
            }
        }
        if (result) return result;

        if (!result && this.contains(x, y)) {
            result = this;
        }

        return result;
    }
}
