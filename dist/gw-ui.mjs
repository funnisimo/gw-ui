import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

class Selector {
    constructor(text) {
        this.priority = 0;
        if (text.startsWith(':') || text.startsWith('.')) {
            text = '*' + text;
        }
        this.text = text;
        this.matchFn = this._parse(text);
    }
    _parse(text) {
        const parts = text.split(/ +/g).map((p) => p.trim());
        const matches = [];
        for (let i = 0; i < parts.length; ++i) {
            let p = parts[i];
            if (p === '>') {
                matches.push(this._parentMatch());
                ++i;
                p = parts[i];
            }
            else if (i > 0) {
                matches.push(this._ancestorMatch());
            }
            matches.push(this._matchElement(p));
        }
        return matches.reduce((out, fn) => fn.bind(undefined, out), GWU.TRUE);
    }
    _parentMatch() {
        return function parentM(next, e) {
            // console.log('parent', e.parent);
            if (!e.parent)
                return false;
            return next(e.parent);
        };
    }
    _ancestorMatch() {
        return function ancestorM(next, e) {
            let current = e.parent;
            while (current) {
                if (next(current))
                    return true;
            }
            return false;
        };
    }
    _matchElement(text) {
        const CSS_RE = /(?:(\w+|\*|\$)|#(\w+)|\.([^\.: ]+))|(?::(?:(?:not\(\.([^\)]+)\))|(?:not\(:([^\)]+)\))|([^\.: ]+)))/g;
        const parts = [];
        const re = new RegExp(CSS_RE, 'g');
        let match = re.exec(text);
        while (match) {
            if (match[1]) {
                const fn = this._matchTag(match[1]);
                if (fn) {
                    parts.push(fn);
                }
            }
            else if (match[2]) {
                parts.push(this._matchId(match[2]));
            }
            else if (match[3]) {
                parts.push(this._matchClass(match[3]));
            }
            else if (match[4]) {
                parts.push(this._matchNot(this._matchClass(match[4])));
            }
            else if (match[5]) {
                parts.push(this._matchNot(this._matchProp(match[5])));
            }
            else {
                parts.push(this._matchProp(match[6]));
            }
            match = re.exec(text);
        }
        return (next, e) => {
            if (!parts.every((fn) => fn(e)))
                return false;
            return next(e);
        };
    }
    _matchTag(tag) {
        if (tag === '*')
            return null;
        if (tag === '$') {
            this.priority += 10000;
            return null;
        }
        this.priority += 10;
        return (el) => el.tag === tag;
    }
    _matchClass(cls) {
        this.priority += 100;
        return (el) => el.classes.includes(cls);
    }
    _matchProp(prop) {
        if (prop.startsWith('first')) {
            return this._matchFirst();
        }
        else if (prop.startsWith('last')) {
            return this._matchLast();
        }
        else if (prop === 'invalid') {
            return this._matchNot(this._matchProp('valid'));
        }
        else if (prop === 'optional') {
            return this._matchNot(this._matchProp('required'));
        }
        else if (prop === 'enabled') {
            return this._matchNot(this._matchProp('disabled'));
        }
        else if (prop === 'unchecked') {
            return this._matchNot(this._matchProp('checked'));
        }
        this.priority += 1; // prop
        return (el) => !!el.prop(prop);
    }
    _matchId(id) {
        this.priority += 1000;
        return (el) => el.attr('id') === id;
    }
    _matchFirst() {
        this.priority += 1; // prop
        return (el) => !!el.parent && !!el.parent.children && el.parent.children[0] === el;
    }
    _matchLast() {
        this.priority += 1; // prop
        return (el) => {
            if (!el.parent)
                return false;
            if (!el.parent.children)
                return false;
            return el.parent.children[el.parent.children.length - 1] === el;
        };
    }
    _matchNot(fn) {
        return (el) => !fn(el);
    }
    matches(obj) {
        return this.matchFn(obj);
    }
}

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
class Style {
    constructor(selector = '$', init) {
        this._dirty = false;
        this.selector = new Selector(selector);
        if (init) {
            this.set(init);
        }
        this._dirty = false;
    }
    get dirty() {
        return this._dirty;
    }
    set dirty(v) {
        this._dirty = v;
    }
    get fg() {
        return this._fg;
    }
    get bg() {
        return this._bg;
    }
    // get border(): GWU.color.ColorBase | undefined {
    //     return this._border;
    // }
    dim(pct = 25, fg = true, bg = false) {
        if (fg) {
            this._fg = GWU.color.from(this._fg).darken(pct);
        }
        if (bg) {
            this._bg = GWU.color.from(this._bg).darken(pct);
        }
        return this;
    }
    bright(pct = 25, fg = true, bg = false) {
        if (fg) {
            this._fg = GWU.color.from(this._fg).lighten(pct);
        }
        if (bg) {
            this._bg = GWU.color.from(this._bg).lighten(pct);
        }
        return this;
    }
    invert() {
        [this._fg, this._bg] = [this._bg, this._fg];
        return this;
    }
    get align() {
        return this._align;
    }
    get valign() {
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
    get(key) {
        const id = ('_' + key);
        return this[id];
    }
    set(key, value, setDirty = true) {
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
                }
                else if (value === 'true') {
                    value = true;
                }
                else if (value === 'false') {
                    value = false;
                }
            }
            this[field] = value;
            // }
        }
        else if (key instanceof Style) {
            setDirty = value || value === undefined ? true : false;
            Object.entries(key).forEach(([name, value]) => {
                if (name === 'selector' || name === '_dirty')
                    return;
                if (value !== undefined && value !== null) {
                    this[name] = value;
                }
                else if (value === null) {
                    this.unset(name);
                }
            });
        }
        else {
            setDirty = value || value === undefined ? true : false;
            Object.entries(key).forEach(([name, value]) => {
                if (value === null) {
                    this.unset(name);
                }
                else {
                    this.set(name, value, setDirty);
                }
            });
        }
        this.dirty || (this.dirty = setDirty);
        return this;
    }
    unset(key) {
        const field = key.startsWith('_') ? key : '_' + key;
        delete this[field];
        this.dirty = true;
        return this;
    }
    clone() {
        const other = new this.constructor();
        other.copy(this);
        return other;
    }
    copy(other) {
        Object.assign(this, other);
        return this;
    }
}
function makeStyle(style, selector = '$') {
    const opts = {};
    const parts = style
        .trim()
        .split(';')
        .map((p) => p.trim());
    parts.forEach((p) => {
        const [name, base] = p.split(':').map((p) => p.trim());
        if (!name)
            return;
        const baseParts = base.split(/ +/g);
        if (baseParts.length == 1) {
            // @ts-ignore
            opts[name] = base;
        }
        else {
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
class ComputedStyle extends Style {
    // constructor(source: Stylable, sources?: Style[]) {
    constructor(sources) {
        super();
        // obj: Stylable;
        this.sources = [];
        // this.obj = source;
        if (sources) {
            // sort low to high priority (highest should be this.obj._style, lowest = global default:'*')
            sources.sort((a, b) => a.selector.priority - b.selector.priority);
            this.sources = sources;
        }
        this.sources.forEach((s) => super.set(s));
        this._dirty = false; // As far as I know I reflect all of the current source values.
    }
    get dirty() {
        return this._dirty || this.sources.some((s) => s.dirty);
    }
    set dirty(v) {
        this._dirty = v;
    }
}
class Sheet {
    constructor(parentSheet) {
        this.rules = [];
        this._dirty = true;
        if (parentSheet === undefined) {
            parentSheet = defaultStyle;
        }
        if (parentSheet) {
            this.rules = parentSheet.rules.slice();
        }
    }
    get dirty() {
        return this._dirty;
    }
    set dirty(v) {
        this._dirty = v;
        if (!this._dirty) {
            this.rules.forEach((r) => (r.dirty = false));
        }
    }
    add(selector, props) {
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
        let rule = new Style(selector, props);
        const existing = this.rules.findIndex((s) => s.selector.text === rule.selector.text);
        if (existing > -1) {
            const current = this.rules[existing];
            current.set(rule);
            rule = current;
        }
        else {
            this.rules.push(rule);
        }
        // rulesChanged = true;
        this.dirty = true;
        return this;
    }
    get(selector) {
        return this.rules.find((s) => s.selector.text === selector) || null;
    }
    remove(selector) {
        const existing = this.rules.findIndex((s) => s.selector.text === selector);
        if (existing > -1) {
            this.rules.splice(existing, 1);
            this.dirty = true;
        }
    }
    computeFor(widget) {
        const sources = this.rules.filter((r) => r.selector.matches(widget));
        const widgetStyle = widget.style();
        if (widgetStyle) {
            sources.push(widgetStyle);
        }
        widgetStyle.dirty = false;
        return new ComputedStyle(sources);
    }
}
const defaultStyle = new Sheet(null);

defaultStyle.add('*', {
    fg: 'white',
    bg: -1,
    align: 'left',
    valign: 'top',
});
class Widget {
    constructor(term, opts = {}) {
        this.tag = 'text';
        this.bounds = new GWU.xy.Bounds(0, 0, 0, 1);
        this._depth = 0;
        this.events = {};
        // action: string = '';
        this.children = [];
        this._style = new Style();
        this._parent = null;
        this.classes = [];
        this._props = {};
        this._attrs = {};
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
            if (typeof opts.class === 'string') {
                opts.class = opts.class.split(/ +/g);
            }
            this.classes = opts.class.map((c) => c.trim());
        }
        if (opts.tabStop) {
            this.prop('tabStop', true);
        }
        if (opts.action) ;
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
    }
    get depth() {
        return this._depth;
    }
    set depth(v) {
        this._depth = v;
        this.layer.sortWidgets();
    }
    get parent() {
        return this._parent;
    }
    set parent(v) {
        this.setParent(v);
    }
    setParent(v, opts = {}) {
        if (this._parent) {
            this._parent._removeChild(this);
        }
        this._parent = v;
        if (this._parent) {
            this.depth = this._depth || this._parent.depth + 1;
            this._parent._addChild(this, opts);
        }
    }
    text(v) {
        if (v === undefined)
            return this._attrStr('text');
        this.attr('text', v);
        return this;
    }
    attr(name, v) {
        if (v === undefined)
            return this._attrs[name];
        this._attrs[name] = v;
        return this;
    }
    _attrInt(name) {
        const n = this._attrs[name] || 0;
        if (typeof n === 'number')
            return n;
        if (typeof n === 'string')
            return Number.parseInt(n);
        return n ? 1 : 0;
    }
    _attrStr(name) {
        const n = this._attrs[name] || '';
        if (typeof n === 'string')
            return n;
        if (typeof n === 'number')
            return '' + n;
        return n ? 'true' : 'false';
    }
    _attrBool(name) {
        return !!this._attrs[name];
    }
    prop(name, v) {
        if (v === undefined)
            return this._props[name];
        const current = this._props[name];
        if (current !== v) {
            this._setProp(name, v);
        }
        return this;
    }
    _setProp(name, v) {
        this._props[name] = v;
        // console.log(`${this.tag}.${name}=${v}`);
        this.updateStyle();
    }
    _propInt(name) {
        const n = this._props[name] || 0;
        if (typeof n === 'number')
            return n;
        if (typeof n === 'string')
            return Number.parseInt(n);
        return n ? 1 : 0;
    }
    _propStr(name) {
        const n = this._props[name] || '';
        if (typeof n === 'string')
            return n;
        if (typeof n === 'number')
            return '' + n;
        return n ? 'true' : 'false';
    }
    _propBool(name) {
        return !!this._props[name];
    }
    toggleProp(name) {
        const current = !!this._props[name];
        this.prop(name, !current);
        return this;
    }
    incProp(name, n = 1) {
        let current = this.prop(name) || 0;
        if (typeof current === 'boolean') {
            current = current ? 1 : 0;
        }
        else if (typeof current === 'string') {
            current = Number.parseInt(current) || 0;
        }
        current += n;
        this.prop(name, current);
        return this;
    }
    contains(...args) {
        return this.bounds.contains(args[0], args[1]);
    }
    style(opts) {
        if (opts === undefined)
            return this._style;
        this._style.set(opts);
        this.updateStyle();
        return this;
    }
    addClass(c) {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            if (this.classes.includes(a))
                return;
            this.classes.push(a);
        });
        return this;
    }
    removeClass(c) {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            GWU.arrayDelete(this.classes, a);
        });
        return this;
    }
    hasClass(c) {
        const all = c.split(/ +/g);
        return GWU.arrayIncludesAll(this.classes, all);
    }
    toggleClass(c) {
        const all = c.split(/ +/g);
        all.forEach((a) => {
            if (this.classes.includes(a)) {
                GWU.arrayDelete(this.classes, a);
            }
            else {
                this.classes.push(a);
            }
        });
        return this;
    }
    get focused() {
        return !!this.prop('focus');
    }
    // @return true to stop the focus change event
    focus(reverse = false) {
        if (this.prop('focus'))
            return true;
        this.prop('focus', true);
        return this._fireEvent('focus', this, { reverse });
    }
    // @return true to stop the focus change event
    blur(reverse = false) {
        if (!this.prop('focus'))
            return false;
        this.prop('focus', false);
        return this._fireEvent('blur', this, { reverse });
    }
    get hovered() {
        return !!this.prop('hover');
    }
    set hovered(v) {
        this.prop('hover', v);
    }
    get hidden() {
        let current = this;
        while (current) {
            if (current.prop('hidden'))
                return true;
            current = current.parent;
        }
        return false;
    }
    set hidden(v) {
        this.prop('hidden', v);
    }
    updateStyle() {
        this._used = this.layer.styles.computeFor(this);
        this.layer.needsDraw = true; // changed style or state
    }
    draw(buffer) {
        if (this.hidden)
            return false;
        return this._draw(buffer);
    }
    _draw(buffer) {
        this._drawFill(buffer);
        return true;
    }
    _drawFill(buffer) {
        buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this._used.bg, this._used.bg);
    }
    childAt(...args) {
        return this.children.find((c) => c.contains(args[0], args[1])) || null;
    }
    _addChild(w, opts) {
        let beforeIndex = -1;
        if (opts && opts.beforeIndex !== undefined) {
            beforeIndex = opts.beforeIndex;
        }
        if (w._parent && w._parent !== this)
            throw new Error('Trying to add child that already has a parent.');
        if (!this.children.includes(w)) {
            if (beforeIndex < 0 || beforeIndex >= this.children.length) {
                this.children.push(w);
            }
            else {
                this.children.splice(beforeIndex, 0, w);
            }
        }
        w._parent = this;
        return this;
    }
    _removeChild(w) {
        if (!w._parent || w._parent !== this)
            throw new Error('Removing child that does not have this widget as parent.');
        w._parent = null;
        GWU.arrayDelete(this.children, w);
        return this;
    }
    resize(w, h) {
        this.bounds.width = w || this.bounds.width;
        this.bounds.height = h || this.bounds.height;
        this.layer.needsDraw = true;
        return this;
    }
    // Events
    mouseenter(e) {
        if (!this.contains(e))
            return;
        if (this.hovered)
            return;
        this.hovered = true;
        this._fireEvent('mouseenter', this, e);
        if (this._parent) {
            this._parent.mouseenter(e);
        }
    }
    mousemove(e) {
        if (this.contains(e) && !e.defaultPrevented && !this.hidden) {
            this.mouseenter(e);
            this._bubbleEvent('mousemove', this, e);
            e.preventDefault();
        }
        else {
            this.mouseleave(e);
        }
        return false;
    }
    mouseleave(e) {
        if (this.contains(e))
            return;
        if (!this.hovered)
            return;
        this.hovered = false;
        this._fireEvent('mouseleave', this, e);
        if (this._parent) {
            this._parent.mouseleave(e);
        }
    }
    click(e) {
        if (this.hidden)
            return false;
        return this._bubbleEvent('click', this, e);
    }
    keypress(e) {
        return this._bubbleEvent('keypress', this, e);
    }
    dir(e) {
        return this._bubbleEvent('dir', this, e);
    }
    tick(e) {
        return this._fireEvent('tick', this, e);
    }
    on(event, cb) {
        let handlers = this.events[event];
        if (!handlers) {
            handlers = this.events[event] = [];
        }
        if (!handlers.includes(cb)) {
            handlers.push(cb);
        }
        return this;
    }
    off(event, cb) {
        let handlers = this.events[event];
        if (!handlers)
            return this;
        if (cb) {
            GWU.arrayDelete(handlers, cb);
        }
        else {
            handlers.length = 0; // clear all handlers
        }
        return this;
    }
    _fireEvent(name, source, args) {
        const handlers = this.events[name] || [];
        let handled = handlers.reduce((out, h) => h(name, source || this, args) || out, false);
        return handled;
    }
    _bubbleEvent(name, source, args) {
        let current = this;
        while (current) {
            if (current._fireEvent(name, source, args))
                return true;
            current = current.parent;
        }
        return false;
    }
}

class Layer {
    constructor(ui) {
        this.needsDraw = true;
        this.result = undefined;
        this._attachOrder = [];
        this._depthOrder = [];
        this._focusWidget = null;
        this._hasTabStop = false;
        this.timers = {};
        this._opts = {};
        this.ui = ui;
        this.buffer = ui.canvas.buffer.clone();
        this.styles = new Sheet(ui.styles);
        this.body = new Widget(this, {
            tag: 'body',
            id: 'BODY',
            depth: -1,
            width: this.buffer.width,
            height: this.buffer.height,
        });
    }
    get width() {
        return this.ui.width;
    }
    get height() {
        return this.ui.height;
    }
    // Style and Opts
    reset() {
        this._opts = { x: 0, y: 0 };
        return this;
    }
    fg(v) {
        this._opts.fg = v;
        return this;
    }
    bg(v) {
        this._opts.bg = v;
        return this;
    }
    dim(pct = 25, fg = true, bg = false) {
        if (fg) {
            this._opts.fg = GWU.color
                .from(this._opts.fg || 'white')
                .darken(pct);
        }
        if (bg) {
            this._opts.bg = GWU.color
                .from(this._opts.bg || 'black')
                .darken(pct);
        }
        return this;
    }
    bright(pct = 25, fg = true, bg = false) {
        if (fg) {
            this._opts.fg = GWU.color
                .from(this._opts.fg || 'white')
                .lighten(pct);
        }
        if (bg) {
            this._opts.bg = GWU.color
                .from(this._opts.bg || 'black')
                .lighten(pct);
        }
        return this;
    }
    invert() {
        [this._opts.fg, this._opts.bg] = [this._opts.bg, this._opts.fg];
        return this;
    }
    // STYLE
    style(opts) {
        Object.assign(this._opts, opts);
        return this;
    }
    // POSITION
    pos(x, y) {
        this._opts.x = GWU.clamp(x, 0, this.width);
        this._opts.y = GWU.clamp(y, 0, this.height);
        return this;
    }
    moveTo(x, y) {
        return this.pos(x, y);
    }
    move(dx, dy) {
        this._opts.x = GWU.clamp(this._opts.x + dx, 0, this.width);
        this._opts.y = GWU.clamp(this._opts.y + dy, 0, this.height);
        return this;
    }
    up(n = 1) {
        return this.move(0, -n);
    }
    down(n = 1) {
        return this.move(0, n);
    }
    left(n = 1) {
        return this.move(-n, 0);
    }
    right(n = 1) {
        return this.move(n, 0);
    }
    nextLine(n = 1) {
        return this.pos(0, this._opts.y + n);
    }
    prevLine(n = 1) {
        return this.pos(0, this._opts.y - n);
    }
    // EDIT
    // erase and move back to top left
    clear(color) {
        this.body.children = [];
        this._depthOrder = [this.body];
        if (color) {
            this.body.style().set('bg', color);
        }
        else {
            this.body.style().unset('bg');
        }
        return this;
    }
    // Effects
    fadeTo(_color, _duration) {
        throw new Error('Method not implemented.');
    }
    // Widgets
    // create(tag: string, opts: any): UIWidget {
    //     const options = Object.assign({ tag }, this._opts, opts);
    //     const widget = createWidget(tag, this, options);
    //     this.addWidget(widget);
    //     return widget;
    // }
    sortWidgets() {
        this._depthOrder.sort((a, b) => b.depth - a.depth);
        return this;
    }
    attach(w) {
        if (!this._attachOrder.includes(w)) {
            const index = this._depthOrder.findIndex((aw) => aw.depth <= w.depth);
            if (index < 0) {
                this._depthOrder.push(w);
            }
            else {
                this._depthOrder.splice(index, 0, w);
            }
            this._attachOrder.push(w);
            this.needsDraw = true;
        }
        if (!w.parent && w !== this.body && this.body) {
            w.setParent(this.body);
            this.needsDraw = true;
        }
        this._hasTabStop = this._hasTabStop || w._propBool('tabStop');
        return this;
    }
    detach(w) {
        // GWU.arrayDelete(this.widgets, w);
        w.setParent(null);
        GWU.arrayDelete(this._depthOrder, w);
        GWU.arrayDelete(this._attachOrder, w);
        if (this._focusWidget === w) {
            this._hasTabStop = this.nextTabStop();
        }
        this.needsDraw = true;
        return this;
    }
    widgetAt(...args) {
        return (this._depthOrder.find((w) => w.contains(args[0], args[1]) && !w.hidden) || this.body);
    }
    get focusWidget() {
        return this._focusWidget;
    }
    setFocusWidget(w, reverse = false) {
        if (w === this._focusWidget)
            return;
        if (this._focusWidget && this._focusWidget.blur(reverse))
            return;
        if (w && w.focus(reverse))
            return;
        this._focusWidget = w;
    }
    getWidget(id) {
        return this._depthOrder.find((w) => w.attr('id') === id) || null;
    }
    nextTabStop() {
        if (!this.focusWidget) {
            this.setFocusWidget(this._attachOrder.find((w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden) || null);
            return !!this.focusWidget;
        }
        const next = GWU.arrayNext(this._attachOrder, this.focusWidget, (w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden);
        if (next) {
            this.setFocusWidget(next);
            return true;
        }
        return false;
    }
    prevTabStop() {
        if (!this.focusWidget) {
            this.setFocusWidget(this._attachOrder.find((w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden) || null);
            return !!this.focusWidget;
        }
        const prev = GWU.arrayPrev(this._attachOrder, this.focusWidget, (w) => !!w.prop('tabStop') && !w.prop('disabled') && !w.hidden);
        if (prev) {
            this.setFocusWidget(prev, true);
            return true;
        }
        return false;
    }
    // EVENTS
    on(event, cb) {
        this.body.on(event, cb);
        return this;
    }
    off(event, cb) {
        this.body.off(event, cb);
        return this;
    }
    mousemove(e) {
        this._depthOrder.forEach((w) => {
            w.mousemove(e);
        });
        return false; // TODO - this._done
    }
    click(e) {
        const w = this.widgetAt(e);
        if (w.prop('tabStop') && !w.prop('disabled')) {
            this.setFocusWidget(w);
        }
        w.click(e);
        return false; // TODO - this._done
    }
    keypress(e) {
        if (!e.key)
            return false;
        if (this.focusWidget) {
            if (this.focusWidget.keypress(e)) {
                return false;
            }
        }
        //         const fn =
        //             this.eventHandlers[e.key] ||
        //             this.eventHandlers[e.code] ||
        //             this.eventHandlers.keypress;
        //         if (fn) {
        //             if (await fn(e, this, this.focusWidget)) {
        //                 return this.done;
        //             }
        //         }
        if (e.key === 'Tab') {
            // Next widget
            this.nextTabStop();
            return false; // not done
        }
        else if (e.key === 'TAB') {
            // Prev Widget
            this.prevTabStop();
            return false; // not done
        }
        //         return this.done;
        return false;
    }
    dir(e) {
        const target = this.focusWidget || this.body;
        target.dir(e);
        // return this.done;
        return false;
    }
    tick(e) {
        const dt = e.dt;
        let promises = [];
        Object.entries(this.timers).forEach(([action, time]) => {
            time -= dt;
            if (time <= 0) {
                delete this.timers[action];
                promises.push(this.body._fireEvent(action, this.body));
            }
            else {
                this.timers[action] = time;
            }
        });
        for (let w of this._depthOrder) {
            w.tick(e);
        }
        //         return this.done;
        return false;
    }
    draw() {
        if (this._hasTabStop && !this._focusWidget) {
            this.nextTabStop();
        }
        if (this.styles.dirty) {
            this.needsDraw = true;
            this._depthOrder.forEach((w) => w.updateStyle());
            this.styles.dirty = false;
        }
        if (!this.needsDraw)
            return;
        this.needsDraw = false;
        this.ui.copyUIBuffer(this.buffer);
        // draw from low depth to high depth
        for (let i = this._depthOrder.length - 1; i >= 0; --i) {
            const w = this._depthOrder[i];
            w.draw(this.buffer);
        }
        console.log('draw');
        this.buffer.render();
    }
    // LOOP
    setTimeout(action, time) {
        this.timers[action] = time;
    }
    clearTimeout(action) {
        delete this.timers[action];
    }
    finish(result) {
        this.result = result;
        this.ui.finishLayer(this);
    }
}

// export interface AlertOptions extends Widget.WidgetOptions {
//     duration?: number;
//     waitForAck?: boolean;
//     pad?: number;
//     padX?: number;
//     padY?: number;
//     box?: Widget.BoxOptions;
// }
// export interface ConfirmOptions extends Widget.WidgetOptions {
//     allowCancel?: boolean;
//     pad?: number;
//     padX?: number;
//     padY?: number;
//     buttons?: Widget.ButtonOptions;
//     ok?: string | Widget.ButtonOptions;
//     cancel?: string | Widget.ButtonOptions;
//     box?: Widget.BoxOptions;
// }
// export interface InputBoxOptions extends ConfirmOptions {
//     prompt?: string | Widget.TextOptions;
//     input?: Widget.InputOptions;
// }
class UI {
    constructor(opts = {}) {
        this.layer = null;
        this.layers = [];
        // inDialog = false;
        this._done = false;
        this._promise = null;
        if (!opts.canvas)
            throw new Error('Need a canvas.');
        this.canvas = opts.canvas;
        this.loop = opts.loop || GWU.loop;
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    get styles() {
        return defaultStyle;
    }
    // render() {
    //     this.buffer.render();
    // }
    // get baseBuffer(): GWU.canvas.Buffer {
    //     return this.layers[this.layers.length - 1] || this.canvas.buffer;
    // }
    // get canvasBuffer(): GWU.canvas.Buffer {
    //     return this.canvas.buffer;
    // }
    startNewLayer() {
        const layer = new Layer(this);
        if (!this.layer) {
            this._promise = this.loop.run(this);
        }
        else {
            this.layers.push(this.layer);
        }
        this.layer = layer;
        return layer;
    }
    copyUIBuffer(dest) {
        const base = this.canvas.buffer;
        dest.copy(base);
        dest.changed = false; // So you have to draw something to make the canvas render...
    }
    finishLayer(layer) {
        GWU.arrayDelete(this.layers, layer);
        if (this.layer === layer) {
            this.layer = this.layers.pop() || null;
            if (!this.layer) {
                this._done = true;
                this.loop.stop();
            }
        }
    }
    stop() {
        while (this.layer) {
            this.finishLayer(this.layer);
        }
        this._done = true;
        const p = this._promise;
        this._promise = null;
        return p;
    }
    // run(): Promise<void> {
    //     // this._done = false;
    //     return this.loop.run(this as unknown as GWU.io.IOMap);
    // }
    // stop() {
    //     this._done = true;
    //     if (this.layer) this.layer.stop();
    //     this.layers.forEach((l) => l.stop());
    //     this.layer = null;
    //     this.layers.length = 0;
    // }
    mousemove(e) {
        if (this.layer)
            this.layer.mousemove(e);
        return this._done;
    }
    click(e) {
        if (this.layer)
            this.layer.click(e);
        return this._done;
    }
    keypress(e) {
        if (this.layer)
            this.layer.keypress(e);
        return this._done;
    }
    dir(e) {
        if (this.layer)
            this.layer.dir(e);
        return this._done;
    }
    tick(e) {
        if (this.layer)
            this.layer.tick(e);
        return this._done;
    }
    draw() {
        if (this.layer)
            this.layer.draw();
    }
}

const widgets = {};
function installWidget(tag, fn) {
    widgets[tag] = fn;
}

class Text extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this._text = '';
        this._lines = [];
        this._fixedWidth = false;
        this._fixedHeight = false;
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
        this.bounds.width = opts.width || 0;
        this.bounds.height = opts.height || 1;
        this.text(opts.text);
    }
    text(v) {
        if (v === undefined)
            return this._text;
        this._text = v;
        let w = this._fixedWidth ? this.bounds.width : 100;
        this._lines = GWU.text.splitIntoLines(this._text, w);
        if (!this._fixedWidth) {
            this.bounds.width = this._lines.reduce((out, line) => Math.max(out, GWU.text.length(line)), 0);
        }
        if (this._fixedHeight) {
            if (this._lines.length > this.bounds.height) {
                this._lines.length = this.bounds.height;
            }
        }
        else {
            this.bounds.height = this._lines.length;
        }
        this.layer.needsDraw = true;
        return this;
    }
    resize(w, h) {
        super.resize(w, h);
        this._fixedWidth = w > 0;
        this._fixedHeight = h > 0;
        this.text(this._text);
        return this;
    }
    _draw(buffer) {
        this._drawFill(buffer);
        let vOffset = 0;
        if (this._used.valign === 'bottom') {
            vOffset = this.bounds.height - this._lines.length;
        }
        else if (this._used.valign === 'middle') {
            vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
        }
        this._lines.forEach((line, i) => {
            buffer.drawText(this.bounds.x, this.bounds.y + i + vOffset, line, this._used.fg, -1, this.bounds.width, this._used.align);
        });
        return true;
    }
}
installWidget('text', (l, opts) => new Text(l, opts));
Layer.prototype.text = function (text, opts = {}) {
    const options = Object.assign({}, this._opts, opts, { text });
    const list = new Text(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class Border extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this.ascii = false;
        if (opts.ascii) {
            this.ascii = true;
        }
        else if (opts.fg && opts.ascii !== false) {
            this.ascii = true;
        }
    }
    contains(..._args) {
        return false;
    }
    _draw(buffer) {
        const w = this.bounds.width;
        const h = this.bounds.height;
        const x = this.bounds.x;
        const y = this.bounds.y;
        const ascii = this.ascii;
        drawBorder(buffer, x, y, w, h, this._used, ascii);
        return true;
    }
}
installWidget('border', (l, opts) => new Border(l, opts));
Layer.prototype.border = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new Border(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
function drawBorder(buffer, x, y, w, h, style, ascii) {
    const fg = style.fg;
    const bg = style.bg;
    if (ascii) {
        for (let i = 1; i < w; ++i) {
            buffer.draw(x + i, y, '-', fg, bg);
            buffer.draw(x + i, y + h - 1, '-', fg, bg);
        }
        for (let j = 1; j < h; ++j) {
            buffer.draw(x, y + j, '|', fg, bg);
            buffer.draw(x + w - 1, y + j, '|', fg, bg);
        }
        buffer.draw(x, y, '+', fg, bg);
        buffer.draw(x + w - 1, y, '+', fg, bg);
        buffer.draw(x, y + h - 1, '+', fg, bg);
        buffer.draw(x + w - 1, y + h - 1, '+', fg, bg);
    }
    else {
        GWU.xy.forBorder(x, y, w, h, (x, y) => {
            buffer.draw(x, y, ' ', bg, bg);
        });
    }
}

class Button extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.text = opts.text || '';
            opts.action = opts.action || opts.id;
            opts.tag = opts.tag || 'button';
            return opts;
        })());
    }
    keypress(ev) {
        if (!ev.key)
            return false;
        if (ev.key === 'Enter') {
            const action = this._attrStr('action');
            if (action && action.length)
                this._bubbleEvent(action, this);
            return true;
        }
        return false;
    }
    click(ev) {
        if (!this.contains(ev))
            return false;
        const action = this._attrStr('action');
        if (action && action.length)
            this._bubbleEvent(action, this);
        return true;
    }
}
installWidget('button', (l, opts) => new Button(l, opts));

class Fieldset extends Border {
    constructor(layer, opts) {
        super(layer, (() => {
            const bopts = Object.assign({}, opts);
            if (!bopts.height)
                bopts.height = 4;
            if (!bopts.width)
                bopts.width = 4;
            bopts.tag = bopts.tag || 'fieldset';
            return bopts;
        })());
        this._fixedWidth = false;
        this._fixedHeight = false;
        this.legend = null;
        this._addLegend(opts);
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
    }
    _addLegend(opts) {
        if (!opts.legend)
            return this;
        this.legend = new Text(this.layer, {
            text: opts.legend,
            x: this.bounds.x + 2,
            y: this.bounds.y,
            depth: this.depth + 1,
            tag: opts.legendTag || Fieldset.default.legendTag,
            class: opts.legendClass || Fieldset.default.legendClass,
        });
        if (this.bounds.width < this.legend.bounds.width + 4) {
            this.bounds.width = this.legend.bounds.width + 4;
        }
        this.legend.setParent(this);
        this.layer.attach(this.legend);
        return this;
    }
    _addChild(w, opts = {}) {
        if (w !== this.legend) {
            w.bounds.x = this.bounds.x + 2;
            if (!this._fixedHeight) {
                w.bounds.y = this.bounds.bottom - 2;
                this.bounds.height += w.bounds.height;
            }
            if (this._fixedWidth) {
                w.bounds.width = Math.min(w.bounds.width, this.bounds.width - 4);
            }
            else if (w.bounds.width > this.bounds.width - 4) {
                this.bounds.width = w.bounds.width + 4;
            }
        }
        return super._addChild(w, opts);
    }
}
Fieldset.default = {
    legendTag: 'legend',
    legendClass: 'legend',
};
Layer.prototype.fieldset = function (opts = {}) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new Fieldset(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

class OrderedList extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'ol';
            return opts;
        })());
        this._fixedWidth = false;
        this._fixedHeight = false;
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
        this.prop('pad', opts.pad || OrderedList.default.pad);
    }
    _addChild(w, opts = {}) {
        w.bounds.x = this.bounds.x + 2;
        if (!this._fixedHeight) {
            w.bounds.y = this.bounds.bottom - 2;
            this.bounds.height += w.bounds.height;
        }
        if (this._fixedWidth) {
            w.bounds.width = Math.min(w.bounds.width, this.bounds.width - 4);
        }
        else if (w.bounds.width > this.bounds.width - 4) {
            this.bounds.width = w.bounds.width + 4;
        }
        return super._addChild(w, opts);
    }
    _draw(buffer) {
        this._drawFill(buffer);
        this.children.forEach((c, i) => {
            this._drawBulletFor(c, buffer, i);
        });
        return true;
    }
    _getBullet(index) {
        return '' + (index + 1);
    }
    _drawBulletFor(widget, buffer, index) {
        const bullet = this._getBullet(index);
        const size = this._attrInt('pad') + bullet.length;
        const x = widget.bounds.x - size;
        const y = widget.bounds.y;
        buffer.drawText(x, y, bullet, widget._used.fg, widget._used.bg, size);
    }
}
OrderedList.default = {
    pad: 1,
};
class UnorderedList extends OrderedList {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'ul';
            return opts;
        })());
        this.prop('bullet', opts.bullet || UnorderedList.default.bullet);
        this.prop('pad', opts.pad || UnorderedList.default.pad);
    }
    _getBullet(_index) {
        return this._attrStr('bullet');
    }
}
UnorderedList.default = {
    bullet: '\u2022',
    pad: 1,
};
Layer.prototype.ol = function (opts = {}) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new OrderedList(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
Layer.prototype.ul = function (opts = {}) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new UnorderedList(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

class Input extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.text = opts.text || '';
            opts.tag = opts.tag || 'input';
            opts.action = opts.action || opts.id;
            opts.width =
                opts.width ||
                    opts.maxLength ||
                    Math.max(opts.minLength || 0, 10);
            return opts;
        })());
        this.placeholder = '';
        this.minLength = 0;
        this.maxLength = 0;
        this.numbersOnly = false;
        this.min = 0;
        this.max = 0;
        this.default = this._text;
        if (opts.placeholder)
            this.placeholder = opts.placeholder;
        if (opts.numbersOnly) {
            this.numbersOnly = true;
            this.min = opts.min || 0;
            this.max = opts.max || 0;
        }
        else {
            this.minLength = opts.minLength || 0;
            this.maxLength = opts.maxLength || 0;
        }
        if (opts.required) {
            this.attr('required', true);
            this.prop('required', true);
        }
        if (opts.disabled) {
            this.attr('disabled', true);
            this.prop('disabled', true);
        }
        this.prop('valid', this.isValid()); // redo b/c rules are now set
        this.on('blur', () => this._fireEvent('change', this));
    }
    reset() {
        this.text(this.default);
    }
    _setProp(name, v) {
        super._setProp(name, v);
        this._props.valid = this.isValid();
    }
    isValid() {
        const t = this._text || '';
        if (this.numbersOnly) {
            const val = Number.parseInt(t);
            if (this.min !== undefined && val < this.min)
                return false;
            if (this.max !== undefined && val > this.max)
                return false;
            return val > 0;
        }
        const minLength = Math.max(this.minLength, this.prop('required') ? 1 : 0);
        return (t.length >= minLength &&
            (!this.maxLength || t.length <= this.maxLength));
    }
    keypress(ev) {
        if (!ev.key)
            return false;
        const textEntryBounds = this.numbersOnly ? ['0', '9'] : [' ', '~'];
        if (ev.key === 'Enter' && this.isValid()) {
            const action = this._attrStr('action');
            if (action && action.length) {
                this._fireEvent(action, this);
            }
            else {
                this.layer.nextTabStop();
            }
            return true;
        }
        if (ev.key == 'Delete' || ev.key == 'Backspace') {
            if (this._text.length) {
                this.text(GWU.text.spliceRaw(this._text, this._text.length - 1, 1));
                this._fireEvent('input', this);
            }
            return true;
        }
        else if (ev.key.length > 1) {
            // ignore other special keys...
            return false;
        }
        // eat/use all other keys
        if (ev.key >= textEntryBounds[0] && ev.key <= textEntryBounds[1]) {
            // allow only permitted input
            if (!this.maxLength || this._text.length < this.maxLength) {
                this.text(this._text + ev.key);
                this._fireEvent('input', this);
            }
        }
        return true;
    }
    text(v) {
        if (v === undefined)
            return this._text;
        super.text(v);
        this.prop('empty', this._text.length === 0);
        this.prop('valid', this.isValid());
        return this;
    }
    _draw(buffer, _force = false) {
        this._drawFill(buffer);
        let vOffset = 0;
        if (this._used.valign === 'bottom') {
            vOffset = this.bounds.height - this._lines.length;
        }
        else if (this._used.valign === 'middle') {
            vOffset = Math.floor((this.bounds.height - this._lines.length) / 2);
        }
        let show = this._text;
        if (this._text.length > this.bounds.width) {
            show = this._text.slice(this._text.length - this.bounds.width);
        }
        buffer.drawText(this.bounds.x, this.bounds.y + vOffset, show, this._used.fg, -1, this.bounds.width, this._used.align);
        return true;
    }
}
installWidget('input', (l, opts) => new Input(l, opts));
Layer.prototype.input = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new Input(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class Column {
    constructor(opts) {
        this.format = GWU.IDENTITY;
        this.width = opts.width || DataTable.default.columnWidth;
        if (typeof opts.format === 'function') {
            this.format = opts.format;
        }
        else if (opts.format) {
            this.format = GWU.text.compile(opts.format);
        }
        this.header = opts.header || '';
        this.headerClass = opts.headerClass || DataTable.default.headerClass;
        this.empty = opts.empty || DataTable.default.empty;
        this.dataClass = opts.dataClass || DataTable.default.dataClass;
    }
    addHeader(table, x, y) {
        const t = new Text(table.layer, {
            x,
            y,
            class: this.headerClass,
            tag: table.headerTag,
            width: this.width,
            height: table.rowHeight,
            depth: table.depth + 1,
            text: this.header,
        });
        t.setParent(table);
        table.layer.attach(t);
        return t;
    }
    addData(table, data, x, y, col, row) {
        let text;
        if (Array.isArray(data)) {
            text = '' + (data[col] || this.empty);
        }
        else if (typeof data !== 'object') {
            text = '' + data;
        }
        else {
            text = this.format(data);
        }
        const widget = new Text(table.layer, {
            text,
            x,
            y,
            class: this.dataClass,
            tag: table.dataTag,
            width: this.width,
            height: table.rowHeight,
            depth: table.depth + 1,
        });
        widget.prop(row % 2 == 0 ? 'even' : 'odd', true);
        widget.prop('row', row);
        widget.prop('col', col);
        widget.setParent(table);
        table.layer.attach(widget);
        return widget;
    }
    addEmpty(table, x, y, col, row) {
        return this.addData(table, [], x, y, col, row);
    }
}
class DataTable extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this._data = [];
        this.columns = [];
        this.showHeader = false;
        this.headerTag = 'th';
        this.dataTag = 'td';
        this.prefix = 'none';
        this.select = 'cell';
        this.rowHeight = 1;
        this.border = 'none';
        this.tag = 'table';
        this.size = opts.size || layer.height;
        this.bounds.width = 0;
        opts.columns.forEach((o) => {
            const col = new Column(o);
            this.columns.push(col);
            this.bounds.width += col.width;
        });
        if (opts.border) {
            if (opts.border === true)
                opts.border = 'ascii';
            this.border = opts.border;
        }
        this.rowHeight = opts.rowHeight || 1;
        this.bounds.height = 1;
        if (opts.header) {
            this.showHeader = true;
        }
        this.headerTag = opts.headerTag || DataTable.default.headerTag;
        this.dataTag = opts.dataTag || DataTable.default.dataTag;
        this.prefix = opts.prefix || DataTable.default.prefix;
        this.select = opts.select || DataTable.default.select;
        this.data(opts.data || []);
    }
    data(data) {
        if (!data)
            return this._data;
        this._data = data;
        for (let i = this.children.length - 1; i >= 0; --i) {
            const c = this.children[i];
            if (c.tag !== this.headerTag) {
                this.layer.detach(c);
            }
        }
        const borderAdj = this.border !== 'none' ? 1 : 0;
        let x = this.bounds.x + borderAdj;
        let y = this.bounds.y + borderAdj;
        if (this.showHeader) {
            this.columns.forEach((col) => {
                col.addHeader(this, x, y);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        }
        this._data.forEach((obj, j) => {
            if (j >= this.size)
                return;
            x = this.bounds.x + borderAdj;
            this.columns.forEach((col, i) => {
                col.addData(this, obj, x, y, i, j);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        });
        if (this._data.length == 0) {
            x = this.bounds.x + borderAdj;
            this.columns.forEach((col, i) => {
                col.addEmpty(this, x, y, i, 0);
                x += col.width + borderAdj;
            });
            y += 1;
        }
        this.bounds.height = y - this.bounds.y;
        this.bounds.width = x - this.bounds.x;
        this.updateStyle(); // sets this.needsDraw
        return this;
    }
    _draw(buffer) {
        this._drawFill(buffer);
        this.children.forEach((w) => {
            if (w.prop('row') >= this.size)
                return;
            if (this.border !== 'none') {
                drawBorder(buffer, w.bounds.x - 1, w.bounds.y - 1, w.bounds.width + 2, w.bounds.height + 2, this._used, this.border == 'ascii');
            }
        });
        return true;
    }
    mousemove(e) {
        const active = (this.hovered = this.contains(e));
        if (!active) {
            this.children.forEach((c) => (c.hovered = false));
            return false;
        }
        const hovered = this.children.find((c) => c.contains(e));
        if (hovered) {
            if (this.select === 'none') {
                this.children.forEach((c) => (c.hovered = false));
            }
            else if (this.select === 'row') {
                this.children.forEach((c) => (c.hovered = hovered.prop('row') == c.prop('row')));
            }
            else if (this.select === 'column') {
                this.children.forEach((c) => (c.hovered = hovered.prop('col') == c.prop('col')));
            }
        }
        return true;
    }
}
DataTable.default = {
    columnWidth: 10,
    empty: '-',
    headerClass: 'header',
    headerTag: 'th',
    dataClass: 'data',
    dataTag: 'td',
    select: 'cell',
    prefix: 'none',
};
installWidget('datatable', (l, opts) => new DataTable(l, opts));
Layer.prototype.datatable = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataTable(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class DataList extends DataTable {
    constructor(layer, opts) {
        super(layer, (() => {
            // @ts-ignore
            const tableOpts = opts;
            tableOpts.columns = [opts];
            return tableOpts;
        })());
    }
}
installWidget('list', (l, opts) => new DataList(l, opts));
Layer.prototype.datalist = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataList(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class Menu extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || Menu.default.tag;
            opts.class = opts.class || Menu.default.class;
            return opts;
        })());
        if (Array.isArray(opts.buttonClass)) {
            this.attr('buttonClass', opts.buttonClass.join(' '));
        }
        else {
            this.attr('buttonClass', opts.buttonClass || Menu.default.buttonClass);
        }
        this.attr('buttonTag', opts.buttonTag || Menu.default.buttonTag);
        this.attr('marker', opts.marker || Menu.default.marker);
        this._initButtons(opts);
        this.bounds.height = this.children.length;
        this.on('mouseenter', (_n, _w, e) => {
            this.children.forEach((c) => {
                if (!c.contains(e)) {
                    c.collapse();
                }
                else {
                    c.expand();
                }
            });
            return true;
        });
    }
    _initButtons(opts) {
        this.children = [];
        const buttons = opts.buttons;
        const marker = this._attrStr('marker');
        const entries = Object.entries(buttons);
        if (this.bounds.width <= 0) {
            this.bounds.width = Math.max(opts.minWidth || 0, entries.reduce((out, [key, value]) => {
                const textLen = GWU.text.length(key) +
                    (typeof value === 'string' ? 0 : marker.length);
                return Math.max(out, textLen);
            }, 0));
        }
        entries.forEach(([key, value], i) => {
            const opts = {
                x: this.bounds.x,
                y: this.bounds.y + i,
                class: this._attrStr('buttonClass'),
                tag: this._attrStr('buttonTag'),
                width: this.bounds.width,
                height: 1,
                depth: this.depth + 1,
                buttons: value,
                text: key,
            };
            if (typeof value === 'string') {
                opts.action = value;
            }
            else {
                opts.text =
                    GWU.text.padEnd(key, this.bounds.width - marker.length, ' ') + marker;
            }
            const menuItem = new MenuButton(this.layer, opts);
            menuItem.setParent(this);
            menuItem.on('mouseenter', () => {
                this._bubbleEvent('change', menuItem);
                return false;
            });
            menuItem.setParent(this);
        });
    }
    collapse() {
        this.children.forEach((c) => {
            c.collapse();
        });
        return this;
    }
}
Menu.default = {
    tag: 'menu',
    class: '',
    buttonClass: '',
    buttonTag: 'mi',
    marker: ' \u25b6',
    minWidth: 4,
};
class MenuButton extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'mi';
            return opts;
        })());
        this.menu = null;
        this.tag = opts.tag || 'mi';
        if (typeof opts.buttons !== 'string') {
            this.menu = this._initMenu(opts);
            this.on('mouseenter', () => {
                this.menu.hidden = false;
                this.menu._bubbleEvent('change', this);
                return true;
            });
            this.on('mouseleave', (_n, _w, e) => {
                var _a;
                if ((_a = this.parent) === null || _a === void 0 ? void 0 : _a.contains(e)) {
                    this.menu.hidden = true;
                    return true;
                }
                return false;
            });
            this.on('click', () => {
                return true; // eat clicks
            });
        }
    }
    collapse() {
        if (this.menu) {
            this.menu.collapse();
            this.menu.hidden = true;
        }
        return this;
    }
    expand() {
        if (this.menu) {
            this.menu.hidden = false;
        }
        return this;
    }
    _setMenuPos(xy, opts) {
        xy.x = this.bounds.x + this.bounds.width;
        xy.y = this.bounds.y;
        const height = Object.keys(opts.buttons).length;
        if (xy.y + height >= this.layer.height) {
            xy.y = this.layer.height - height - 1;
        }
    }
    _initMenu(opts) {
        if (typeof opts.buttons === 'string')
            return null;
        const menuOpts = {
            x: this.bounds.x + this.bounds.width,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'mi',
            buttons: opts.buttons,
            depth: this.depth + 1,
        };
        this._setMenuPos(menuOpts, opts);
        const menu = new Menu(this.layer, menuOpts);
        menu.hidden = true;
        menu.setParent(this);
        return menu;
    }
}
installWidget('menu', (l, opts) => new Menu(l, opts));
Layer.prototype.menu = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new Menu(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class Menubar extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tabStop = true;
            opts.tag = opts.tag || 'menu';
            return opts;
        })());
        this._buttons = [];
        this._selectedIndex = -1;
        if (opts.buttonClass) {
            if (Array.isArray(opts.buttonClass)) {
                this.attr('buttonClass', opts.buttonClass.join(' '));
            }
            else {
                this.attr('buttonClass', opts.buttonClass);
            }
        }
        else {
            this.attr('buttonClass', Menubar.default.buttonClass);
        }
        this.attr('buttonTag', opts.buttonTag || Menubar.default.buttonTag);
        if (opts.menuClass) {
            if (Array.isArray(opts.menuClass)) {
                this.attr('menuClass', opts.menuClass.join(' '));
            }
            else {
                this.attr('menuClass', opts.menuClass);
            }
        }
        else {
            this.attr('menuClass', Menubar.default.menuClass);
        }
        this.attr('menuTag', opts.menuTag || Menubar.default.menuTag);
        this.attr('prefix', opts.prefix || Menubar.default.prefix);
        this.attr('separator', opts.separator || Menubar.default.separator);
        this._initButtons(opts);
        this.on('click', this._buttonClick.bind(this));
    }
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(v) {
        if (this._selectedIndex >= 0) {
            this._buttons[this._selectedIndex].prop('focus', false).collapse();
        }
        this._selectedIndex = v;
        if (v >= 0 && v < this._buttons.length) {
            this._buttons[v].prop('focus', true).expand();
        }
        else {
            this._selectedIndex = -1;
        }
    }
    get selectedButton() {
        return this._buttons[this._selectedIndex];
    }
    focus(reverse = false) {
        if (reverse) {
            this.selectedIndex = this._buttons.length - 1;
        }
        else {
            this.selectedIndex = 0;
        }
        return super.focus(reverse);
    }
    blur(reverse = false) {
        this.selectedIndex = -1;
        return super.blur(reverse);
    }
    collapse() {
        this._buttons.forEach((b) => b.collapse());
        return this;
    }
    keypress(e) {
        if (!e.key)
            return false;
        if (!this.focused)
            return false;
        if (e.key === 'Tab') {
            this.selectedIndex += 1;
            return this._selectedIndex >= 0;
        }
        else if (e.key === 'TAB') {
            this.selectedIndex -= 1;
            return this._selectedIndex >= 0;
        }
        return false;
    }
    mousemove(e) {
        if (!this.contains(e) || !this.focused)
            return super.mousemove(e);
        const active = this._buttons.findIndex((c) => c.contains(e));
        if (active < 0 || active === this._selectedIndex)
            return false;
        this.selectedIndex = active;
        return true;
    }
    _initButtons(opts) {
        this._config = opts.buttons;
        const entries = Object.entries(this._config);
        const buttonTag = this._attrStr('buttonTag');
        const buttonClass = this._attrStr('buttonClass');
        let x = this.bounds.x;
        const y = this.bounds.y;
        entries.forEach(([key, value], i) => {
            const prefix = i == 0 ? this._attrStr('prefix') : this._attrStr('separator');
            this.layer.text(prefix, { x, y, parent: this });
            x += prefix.length;
            const button = new MenubarButton(this.layer, {
                text: key,
                x,
                y,
                tag: buttonTag,
                class: buttonClass,
                depth: this.depth + 1,
                buttons: value,
                // data: value,
            });
            button.setParent(this);
            this._buttons.push(button);
            x += button.bounds.width;
        });
    }
    _buttonClick(_action, button) {
        if (!button)
            return false;
        this.layer.setFocusWidget(this);
        console.log('clicked = ' + button.text(), button._attrStr('action'));
        const barButton = button;
        this.selectedIndex = this._buttons.indexOf(barButton);
        if (barButton.menu) {
            barButton.expand();
        }
        else {
            this.collapse();
        }
        return true;
    }
}
Menubar.default = {
    buttonClass: '',
    buttonTag: 'mi',
    menuClass: '',
    menuTag: 'mi',
    prefix: ' ',
    separator: ' | ',
};
installWidget('menubar', (l, opts) => new Menubar(l, opts));
class MenubarButton extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'mi';
            if (typeof opts.buttons === 'string') {
                opts.action = opts.buttons;
            }
            return opts;
        })());
        this.menu = null;
        this.tag = opts.tag || 'mi';
        if (typeof opts.buttons !== 'string') {
            this.menu = this._initMenu(opts);
            this.on('mouseenter', () => {
                this.menu.hidden = false;
                this.menu._bubbleEvent('change', this);
                return true;
            });
            this.on('mouseleave', (_n, _w, e) => {
                var _a;
                if ((_a = this.parent) === null || _a === void 0 ? void 0 : _a.contains(e)) {
                    this.menu.hidden = true;
                    return true;
                }
                return false;
            });
            this.on('click', () => {
                return true; // eat clicks
            });
        }
    }
    collapse() {
        if (this.menu) {
            this.menu.collapse();
            this.menu.hidden = true;
        }
        return this;
    }
    expand() {
        if (this.menu) {
            this.menu.hidden = false;
        }
        return this;
    }
    _setMenuPos(xy, opts) {
        xy.x = this.bounds.x;
        const height = opts.height || Object.keys(opts.buttons).length;
        if (this.bounds.y < height) {
            xy.y = this.bounds.y + 1;
        }
        else {
            xy.y = this.bounds.top - height;
        }
    }
    _initMenu(opts) {
        if (typeof opts.buttons === 'string')
            return null;
        const menuOpts = {
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'mi',
            height: opts.height,
            buttons: opts.buttons,
            depth: this.depth + 1,
        };
        this._setMenuPos(menuOpts, opts);
        const menu = new Menu(this.layer, menuOpts);
        menu.hidden = true;
        menu.setParent(this);
        return menu;
    }
}
Layer.prototype.menubar = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const menubar = new Menubar(this, options);
    if (opts.parent) {
        menubar.setParent(opts.parent, opts);
    }
    return menubar;
};
// MENU
class MenuViewer extends Widget {
    constructor(menubar, buttons) {
        super(menubar.layer, {
            tabStop: true,
            x: 0,
            y: 0,
            width: menubar.layer.width,
            height: menubar.layer.height,
            // @ts-ignore
            tag: menubar.attr('menuTag'),
            // @ts-ignore
            class: menubar.attr('menuClass'),
        });
        this.menubar = menubar;
        this.mainMenu = this._initMenu(buttons);
    }
    contains() {
        return true;
    }
    finish() {
        this.layer.finish();
    }
    _initMenu(buttons) {
        return new Menu(this.layer, {
            buttonTag: this.menubar._attrStr('buttonTag'),
            buttonClass: this.menubar._attrStr('buttonClass'),
            minWidth: this.menubar.selectedButton.bounds.width,
            buttons,
        });
    }
    keypress(e) {
        if (!e.key)
            return false;
        if (e.key === 'Escape') {
            this.finish();
            return true;
        }
        else if (e.key === 'Tab') {
            this.finish();
            this.menubar.keypress(e);
            return true;
        }
        else if (e.key === 'TAB') {
            this.finish();
            this.menubar.keypress(e);
            return true;
        }
        return false;
    }
}

// import * as GWU from 'gw-utils';
class Select extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this.tag = opts.tag || 'select';
        this._initText(opts);
        this._initMenu(opts);
        this.bounds.height = 1; // just the text component
    }
    _initText(opts) {
        this.dropdown = new Text(this.layer, {
            text: opts.text + ' \u25bc',
            x: this.bounds.x,
            y: this.bounds.y,
            class: opts.class,
            tag: opts.tag || 'select',
            width: this.bounds.width,
            height: 1,
            depth: this.depth + 1,
        }).on('click', () => {
            this.menu.toggleProp('hidden');
            return false;
        });
        this.dropdown.setParent(this, { beforeIndex: 0 });
    }
    _initMenu(opts) {
        this.menu = new Menu(this.layer, {
            x: this.bounds.x,
            y: this.bounds.y + 1,
            class: opts.buttonClass,
            tag: opts.buttonTag || 'select',
            width: opts.width,
            minWidth: this.dropdown.bounds.width,
            height: opts.height,
            buttons: opts.buttons,
            depth: this.depth + 1,
        }).on('click', () => {
            this.menu.hidden = true;
            return false;
        });
        this.menu.hidden = true;
        this.menu.setParent(this);
    }
}
installWidget('select', (l, opts) => new Select(l, opts));
Layer.prototype.select = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const list = new Select(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};

class Messages extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'messages';
            return opts;
        })());
        if (!this.bounds.height)
            throw new Error('Must provde a height for messages widget.');
        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: opts.length || 40,
            match: (_x, _y) => {
                this.layer.needsDraw = true;
                return true;
            },
        });
    }
    click(e) {
        if (!this.contains(e))
            return false;
        this.showArchive();
        return true;
    }
    draw(buffer) {
        const isOnTop = this.bounds.y < 10;
        // black out the message area
        buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this._used.bg, this._used.bg);
        this.cache.forEach((line, confirmed, i) => {
            if (i >= this.bounds.height)
                return;
            const localY = isOnTop ? this.bounds.height - i - 1 : i;
            const y = localY + this.bounds.y;
            buffer.drawText(this.bounds.x, y, line, this._used.fg);
            if (confirmed && this._used.bg) {
                buffer.mix(this._used.bg, 50, this.bounds.x, y, this.bounds.width, 1);
            }
        });
        return true;
    }
    showArchive() {
        if (this.cache.length <= this.bounds.height)
            return;
        const layer = this.layer.ui.startNewLayer();
        // @ts-ignore
        new MessageArchive(layer, this);
    }
}
class MessageArchive extends Widget {
    constructor(layer, source) {
        super(layer, {
            id: 'ARCHIVE',
            tag: 'messages',
            class: source.classes.concat('archive'),
            height: source.bounds.height,
            width: source.bounds.width,
            x: 0,
            y: 0,
            tabStop: true,
            depth: 100, // I'm on top
        });
        this.mode = 'forward';
        this.source = source;
        this.isOnTop = this.source.bounds.y < 10;
        this.bounds.height = this.isOnTop
            ? layer.height - source.bounds.y
            : source.bounds.bottom;
        this.totalCount = Math.min(source.cache.length, this.isOnTop
            ? layer.height - this.source.bounds.top
            : this.source.bounds.bottom);
        this.shown = source.bounds.height;
        this.layer.on('FORWARD', this._forward.bind(this));
        this.layer.on('REVERSE', this._reverse.bind(this));
        this.layer.setTimeout('FORWARD', 16);
    }
    contains() {
        return true; // Eat all mouse activity
    }
    finish() {
        this.source.cache.confirmAll();
        this.layer.finish();
    }
    keypress(e) {
        if (this.mode === 'ack') {
            if (e.key === 'Enter' || e.key === ' ') {
                this.mode = 'reverse';
                this.layer.needsDraw = true;
                this.layer.setTimeout('REVERSE', 16);
            }
        }
        else if (this.mode === 'reverse') {
            this.finish();
            return true;
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            this.layer.needsDraw = true;
        }
        return false;
    }
    click(_e) {
        if (this.mode === 'ack') {
            this.mode = 'reverse';
            this.layer.needsDraw = true;
            this.layer.setTimeout('REVERSE', 16);
        }
        else if (this.mode === 'reverse') {
            this.finish();
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            this.layer.needsDraw = true;
        }
        return false;
    }
    _forward() {
        ++this.shown;
        this.layer.needsDraw = true;
        if (this.shown < this.totalCount) {
            this.layer.setTimeout('FORWARD', 16);
        }
        else {
            this.mode = 'ack';
        }
        return true;
    }
    _reverse() {
        --this.shown;
        if (this.shown <= this.source.bounds.height) {
            this.finish();
        }
        else {
            this.layer.needsDraw = true;
            this.layer.setTimeout('REVERSE', 16);
        }
        return true;
    }
    _draw(buffer) {
        let fadePercent = 0;
        // let reverse = this.mode === 'reverse';
        // Count the number of lines in the archive.
        // let totalMessageCount = this.totalCount;
        const isOnTop = this.isOnTop;
        const dbuf = buffer;
        const fg = GWU.color.from(this.source._used.fg);
        // const dM = reverse ? -1 : 1;
        // const startM = reverse ? totalMessageCount : this.bounds.height;
        // const endM = reverse
        //     ? this.bounds.height + dM + 1
        //     : totalMessageCount + dM;
        const startY = isOnTop
            ? this.shown - 1
            : this.bounds.bottom - this.shown;
        const endY = isOnTop ? 0 : this.bounds.bottom - 1;
        const dy = isOnTop ? -1 : 1;
        dbuf.fillRect(this.source.bounds.x, Math.min(startY, endY), this.bounds.width, this.shown, ' ', this._used.bg, this._used.bg);
        this.source.cache.forEach((line, _confirmed, j) => {
            const y = startY + j * dy;
            if (isOnTop) {
                if (y < endY)
                    return;
            }
            else if (y > endY)
                return;
            fadePercent = Math.floor((50 * j) / this.shown);
            const fgColor = fg.clone().mix(this._used.bg, fadePercent);
            dbuf.drawText(this.source.bounds.x, y, line, fgColor, this._used.bg);
        });
        if (this.mode === 'ack') {
            const y = this.isOnTop ? 0 : dbuf.height - 1;
            const x = this.source.bounds.x > 8
                ? this.source.bounds.x - 8 // to left of box
                : Math.min(this.source.bounds.x + this.bounds.width, // just to right of box
                dbuf.width - 8 // But definitely on the screen - overwrite some text if necessary
                );
            dbuf.wrapText(x, y, 8, '--DONE--', this._used.bg, this._used.fg);
        }
        return true;
    }
}

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);
class Flavor extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || 'flavor';
            opts.text = '';
            return opts;
        })());
        this.overflow = opts.overflow || false;
        this.isPrompt = false;
    }
    showText(text) {
        this.text(text);
        this.removeClass('prompt');
        return this;
    }
    clear() {
        this.text('');
        this.removeClass('prompt');
        return this;
    }
    showPrompt(text) {
        this.showText(text);
        this.addClass('prompt');
        return this;
    }
    getFlavorText(map, x, y, fov) {
        const cell = map.cell(x, y); // KNOWLEDGE / MEMORY !!!
        let buf;
        // let magicItem;
        // let standsInTerrain;
        // let subjectMoving;
        // let prepositionLocked = false;
        // let subject;
        // let verb;
        // let preposition;
        let object = '';
        // let adjective;
        const isAnyKindOfVisible = fov ? fov.isAnyKindOfVisible(x, y) : true;
        const isDirectlyVisible = fov ? fov.isDirectlyVisible(x, y) : true;
        const isRemembered = fov ? fov.isRevealed(x, y) : false;
        const isMapped = fov ? fov.isMagicMapped(x, y) : false;
        let intro;
        if (isDirectlyVisible) {
            intro = 'you see';
        }
        else if (isAnyKindOfVisible) {
            intro = 'you sense';
        }
        else if (isRemembered) {
            intro = 'you remember';
        }
        else if (isMapped) {
            intro = 'you expect to see';
        }
        else {
            return '';
        }
        const actor = cell.hasActor() ? map.actorAt(x, y) : null;
        // const player = actor?.isPlayer() ? actor : null;
        const theItem = cell.hasItem() ? map.itemAt(x, y) : null;
        const standsInTile = cell.hasTileFlag(GWM.flags.Tile.T_STAND_IN_TILE);
        let needObjectArticle = false;
        if (actor) {
            object = actor.getFlavor({
                color: false,
                article: true,
                action: true,
            });
            needObjectArticle = true;
        }
        else if (theItem) {
            object = theItem.getFlavor({ color: false, article: true });
            needObjectArticle = true;
        }
        let article = standsInTile ? ' in ' : ' on ';
        const groundTile = cell.depthTile(GWM.flags.Depth.GROUND) || GWM.tile.tiles.NULL;
        const surfaceTile = cell.depthTile(GWM.flags.Depth.SURFACE);
        const liquidTile = cell.depthTile(GWM.flags.Depth.LIQUID);
        // const gasTile = cell.depthTile(GWM.flags.Depth.GAS);
        let surface = '';
        if (surfaceTile) {
            const tile = surfaceTile;
            if (needObjectArticle) {
                needObjectArticle = false;
                object += ' on ';
            }
            if (tile.hasTileFlag(GWM.flags.Tile.T_BRIDGE)) {
                article = ' over ';
            }
            surface = surfaceTile.getFlavor() + article;
        }
        let liquid = '';
        if (liquidTile) {
            liquid = liquidTile.getFlavor() + ' covering ';
            if (needObjectArticle) {
                needObjectArticle = false;
                object += ' in ';
            }
        }
        if (needObjectArticle) {
            needObjectArticle = false;
            object += ' on ';
        }
        let ground = groundTile.getFlavor({ article: true });
        buf = GWU.text.apply('§intro§ §text§.', {
            intro,
            text: object + surface + liquid + ground,
        });
        return buf;
    }
}

GWU.color.install('blueBar', 15, 10, 50);
GWU.color.install('redBar', 45, 10, 15);
GWU.color.install('purpleBar', 50, 0, 50);
GWU.color.install('greenBar', 10, 50, 10);
class EntryBase {
    constructor() {
        this.dist = 0;
        this.priority = 0;
        this.changed = false;
        this.sidebarY = -1;
    }
    draw(_buffer, _bounds) {
        return 0;
    }
}
class ActorEntry extends EntryBase {
    constructor(actor) {
        super();
        this.actor = actor;
    }
    get x() {
        return this.actor.x;
    }
    get y() {
        return this.actor.y;
    }
    draw(buffer, bounds) {
        return this.actor.drawStatus(buffer, bounds);
    }
}
class ItemEntry extends EntryBase {
    constructor(item) {
        super();
        this.item = item;
    }
    get x() {
        return this.item.x;
    }
    get y() {
        return this.item.y;
    }
    draw(buffer, bounds) {
        return this.item.drawStatus(buffer, bounds);
    }
}
class CellEntry extends EntryBase {
    constructor(cell) {
        super();
        this.cell = cell;
    }
    get x() {
        return this.cell.x;
    }
    get y() {
        return this.cell.y;
    }
    draw(buffer, bounds) {
        return this.cell.drawStatus(buffer, bounds);
    }
}
class Sidebar extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this.cellCache = [];
        this.lastX = -1;
        this.lastY = -1;
        this.lastMap = null;
        this.entries = [];
        this.subject = null;
        this.highlight = null;
    }
    reset() {
        this.lastMap = null;
        this.lastX = -1;
        this.lastY = -1;
    }
    entryAt(e) {
        return (this.entries.find((entry) => {
            return entry.sidebarY <= e.y && entry.sidebarY !== -1;
        }) || null);
    }
    mousemove(e) {
        super.mousemove(e);
        if (this.contains(e)) {
            return this.highlightRow(e.y);
        }
        return this.clearHighlight();
    }
    highlightRow(y) {
        const last = this.highlight;
        this.highlight = null;
        // processed in ascending y order
        this.entries.forEach((e) => {
            if (e.sidebarY <= y && e.sidebarY !== -1) {
                this.highlight = e;
            }
        });
        return this.highlight !== last;
    }
    clearHighlight() {
        const result = !!this.highlight;
        this.highlight = null;
        return result;
    }
    updateCellCache(map) {
        if (this.lastMap &&
            map === this.lastMap &&
            !map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)) {
            return;
        }
        this.lastMap = null; // Force us to regather the entries, even if at same location
        this.cellCache.length = 0;
        GWU.xy.forRect(map.width, map.height, (x, y) => {
            const info = map.cell(x, y);
            if (info.hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)) {
                this.cellCache.push(info);
            }
        });
        map.clearMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED);
    }
    _makeActorEntry(actor) {
        return new ActorEntry(actor);
    }
    _makeItemEntry(item) {
        return new ItemEntry(item);
    }
    _makeCellEntry(cell) {
        return new CellEntry(cell);
    }
    _getPriority(map, x, y, fov) {
        if (!fov) {
            return map.cell(x, y).hasCellFlag(GWM.flags.Cell.STABLE_MEMORY)
                ? 3
                : 1;
        }
        if (fov.isDirectlyVisible(x, y)) {
            return 1;
        }
        else if (fov.isAnyKindOfVisible(x, y)) {
            return 2;
        }
        else if (fov.isRevealed(x, y)) {
            return 3;
        }
        return -1; // not visible, or revealed
    }
    _isDim(entry) {
        if (entry === this.highlight)
            return false;
        return entry.priority > 2 || !!this.highlight;
    }
    _addActorEntry(actor, map, x, y, fov) {
        const priority = this._getPriority(map, actor.x, actor.y, fov);
        if (priority < 0)
            return false;
        const entry = this._makeActorEntry(actor);
        entry.dist = GWU.xy.distanceBetween(x, y, actor.x, actor.y);
        entry.priority = actor.isPlayer() ? 0 : priority;
        this.entries.push(entry);
        return true;
    }
    _addItemEntry(item, map, x, y, fov) {
        const priority = this._getPriority(map, item.x, item.y, fov);
        if (priority < 0)
            return false;
        const entry = this._makeItemEntry(item);
        entry.dist = GWU.xy.distanceBetween(x, y, item.x, item.y);
        entry.priority = priority;
        this.entries.push(entry);
        return true;
    }
    _addCellEntry(cell, map, x, y, fov) {
        const priority = this._getPriority(map, cell.x, cell.y, fov);
        if (priority < 0)
            return false;
        const entry = this._makeCellEntry(cell);
        entry.dist = GWU.xy.distanceBetween(x, y, cell.x, cell.y);
        entry.priority = priority;
        this.entries.push(entry);
        return true;
    }
    findEntries(map, cx, cy, fov) {
        if (map === this.lastMap && cx === this.lastX && cy === this.lastY)
            return;
        this.clearHighlight(); // If we are moving around the map, then turn off the highlight
        this.lastMap = map;
        this.lastX = cx;
        this.lastY = cy;
        this.entries.length = 0;
        const done = GWU.grid.alloc(map.width, map.height);
        map.eachActor((a) => {
            const x = a.x;
            const y = a.y;
            if (done[x][y])
                return;
            if (this._addActorEntry(a, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });
        map.eachItem((i) => {
            const x = i.x;
            const y = i.y;
            if (done[x][y])
                return;
            if (this._addItemEntry(i, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });
        this.cellCache.forEach((c) => {
            if (done[c.x][c.y])
                return;
            if (this._addCellEntry(c, map, cx, cy, fov)) {
                done[c.x][c.y] = 1;
            }
        });
        this.entries.sort((a, b) => {
            if (a.priority != b.priority) {
                return a.priority - b.priority;
            }
            return a.dist - b.dist;
        });
        GWU.grid.free(done);
    }
    update() {
        if (!this.subject) {
            throw new Error('Update requires a subject to follow.');
        }
        return this.updateFor(this.subject);
    }
    updateFor(subject) {
        return this.updateAt(subject.memory || subject.map, subject.x, subject.y, subject.fov);
    }
    updateAt(map, cx, cy, fov) {
        this.updateCellCache(map);
        this.findEntries(map, cx, cy, fov);
        return true;
    }
    draw(buffer) {
        buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, 0, 0, this._used.bg);
        // clear the row information
        this.entries.forEach((e) => (e.sidebarY = -1));
        const drawBounds = this.bounds.clone();
        let currentEntry;
        for (let i = 0; i < this.entries.length && drawBounds.height > 0; ++i) {
            currentEntry = this.entries[i];
            currentEntry.sidebarY = drawBounds.y;
            let usedLines = currentEntry.draw(buffer, drawBounds);
            if (this._isDim(currentEntry) && this._used.bg) {
                buffer.mix(this._used.bg, 50, drawBounds.x, drawBounds.y, drawBounds.width, usedLines);
            }
            if (usedLines) {
                ++usedLines; // skip a space
                drawBounds.y += usedLines;
                drawBounds.height -= usedLines;
            }
        }
        return true;
    }
}

class Viewport extends Widget {
    constructor(layer, opts) {
        super(layer, opts);
        this.offsetX = 0;
        this.offsetY = 0;
        this._subject = null;
        this.snap = opts.snap || false;
        this.center = opts.center || false;
        this.filter = opts.filter || null;
        if (opts.lock) {
            this.lockX = true;
            this.lockY = true;
        }
        else {
            if (opts.lockX) {
                this.lockX = true;
            }
            if (opts.lockY) {
                this.lockY = true;
            }
        }
    }
    get subject() {
        return this._subject;
    }
    set subject(subject) {
        this.center = !!subject;
        if (subject) {
            this.offsetX = subject.x - this.halfWidth();
            this.offsetY = subject.y - this.halfHeight();
        }
        this._subject = subject;
    }
    set lock(v) {
        this.lockX = v;
        this.lockY = v;
    }
    toMapX(x) {
        return x + this.offsetX - this.bounds.x;
    }
    toMapY(y) {
        return y + this.offsetY - this.bounds.y;
    }
    toInnerX(x) {
        return x - this.bounds.x;
    }
    toInnerY(y) {
        return y - this.bounds.y;
    }
    halfWidth() {
        return Math.floor(this.bounds.width / 2);
    }
    halfHeight() {
        return Math.floor(this.bounds.height / 2);
    }
    centerOn(map, x, y) {
        this.center = true;
        this.subject = { x, y, map };
    }
    showMap(map, x = 0, y = 0) {
        this.subject = { x, y, map };
        this.offsetX = x;
        this.offsetY = y;
        this.center = false;
        this.snap = false;
    }
    updateOffset() {
        if (!this._subject) {
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }
        const subject = this._subject;
        const map = subject.memory || subject.map;
        const bounds = map;
        if (subject && map.hasXY(subject.x, subject.y)) {
            if (this.snap) {
                let left = this.offsetX;
                let right = this.offsetX + this.bounds.width;
                let top = this.offsetY;
                let bottom = this.offsetY + this.bounds.height;
                // auto center if outside the viewport
                if (subject.x < left || subject.x > right) {
                    left = this.offsetX = subject.x - this.halfWidth();
                    right = left + this.bounds.width;
                }
                if (subject.y < top || subject.y > bottom) {
                    top = this.offsetY = subject.y - this.halfHeight();
                    bottom = top + this.bounds.height;
                }
                const edgeX = Math.floor(this.bounds.width / 5);
                const edgeY = Math.floor(this.bounds.height / 5);
                const thirdW = Math.floor(this.bounds.width / 3);
                if (left + edgeX >= subject.x) {
                    this.offsetX = Math.max(0, subject.x + thirdW - this.bounds.width);
                }
                else if (right - edgeX <= subject.x) {
                    this.offsetX = Math.min(subject.x - thirdW, bounds.width - this.bounds.width);
                }
                const thirdH = Math.floor(this.bounds.height / 3);
                if (top + edgeY >= subject.y) {
                    this.offsetY = Math.max(0, subject.y + thirdH - this.bounds.height);
                }
                else if (bottom - edgeY <= subject.y) {
                    this.offsetY = Math.min(subject.y - thirdH, bounds.height - this.bounds.height);
                }
            }
            else if (this.center) {
                this.offsetX = subject.x - this.halfWidth();
                this.offsetY = subject.y - this.halfHeight();
            }
            else {
                this.offsetX = subject.x;
                this.offsetY = subject.y;
            }
        }
        if (this.lockX && map) {
            this.offsetX = GWU.clamp(this.offsetX, 0, map.width - this.bounds.width);
        }
        if (this.lockY && map) {
            this.offsetY = GWU.clamp(this.offsetY, 0, map.height - this.bounds.height);
        }
    }
    draw(buffer) {
        buffer.blackOutRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this._used.bg);
        if (!this._subject) {
            return false;
        }
        this.updateOffset();
        const map = this._subject.memory || this._subject.map;
        const fov = this._subject.fov;
        const mixer = new GWU.sprite.Mixer();
        for (let x = 0; x < this.bounds.width; ++x) {
            for (let y = 0; y < this.bounds.height; ++y) {
                const mapX = x + this.offsetX;
                const mapY = y + this.offsetY;
                if (map.hasXY(mapX, mapY)) {
                    const cell = map.cell(mapX, mapY);
                    map.drawer.drawCell(mixer, cell, fov);
                }
                else {
                    mixer.draw(' ', this._used.bg, this._used.bg); // blackOut
                }
                if (this.filter) {
                    this.filter(mixer, mapX, mapY, map);
                }
                buffer.drawSprite(x + this.bounds.x, y + this.bounds.y, mixer);
            }
        }
        // map.clearMapFlag(GWM.flags.Map.MAP_CHANGED);
        return true;
    }
}

export { ActorEntry, Border, Button, CellEntry, Column, ComputedStyle, DataList, DataTable, EntryBase, Fieldset, Flavor, Input, ItemEntry, Layer, Menu, MenuButton, MenuViewer, Menubar, MenubarButton, MessageArchive, Messages, OrderedList, Select, Sheet, Sidebar, Style, Text, UI, UnorderedList, Viewport, Widget, defaultStyle, drawBorder, makeStyle };
