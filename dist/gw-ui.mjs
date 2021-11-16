import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

class Grid {
    constructor(target) {
        this._left = 0;
        this._top = 0;
        this._colWidths = [];
        this._rowHeights = [];
        this._col = 0;
        this._row = -1;
        this.target = target;
        const pos = target.pos();
        this._left = pos.x;
        this._top = pos.y;
    }
    cols(...args) {
        if (args.length === 0)
            return this._colWidths;
        if (args.length == 2) {
            args[0] = new Array(args[0]).fill(args[1]);
        }
        if (Array.isArray(args[0])) {
            this._colWidths = args[0];
        }
        return this;
    }
    rows(...args) {
        if (args.length === 0)
            return this._rowHeights;
        if (typeof args[0] === 'number') {
            args[0] = new Array(args[0]).fill(args[1] || 1);
        }
        if (Array.isArray(args[0])) {
            this._rowHeights = args[0];
        }
        return this;
    }
    col(n) {
        if (n === undefined)
            n = this._col;
        this._col = GWU.clamp(n, 0, this._colWidths.length - 1);
        return this._setPos(); // move back to top of our current row
    }
    nextCol() {
        return this.col(this._col + 1);
    }
    row(n) {
        if (n === undefined)
            n = this._row;
        this._row = GWU.clamp(n, 0, this._rowHeights.length - 1);
        return this._setPos(); // move back to beginning of current column
    }
    nextRow() {
        return this.row(this._row + 1).col(0);
    }
    endRow(h) {
        if (h <= 0)
            return this;
        this._rowHeights[this._row] = h;
        return this;
    }
    _setPos() {
        let x = this._left;
        for (let i = 0; i < this._col; ++i) {
            x += this._colWidths[i];
        }
        let y = this._top;
        for (let i = 0; i < this._row; ++i) {
            y += this._rowHeights[i];
        }
        this.target.pos(x, y);
        return this;
    }
}

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
function compile(text) {
    return new Selector(text);
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
    get(key) {
        const id = ('_' + key);
        return this[id];
    }
    set(key, value, setDirty = true) {
        if (typeof key === 'string') {
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
    constructor(sources, opacity = 100) {
        super();
        // obj: Stylable;
        this.sources = [];
        this._opacity = 100;
        this._baseFg = null;
        this._baseBg = null;
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
    set opacity(v) {
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
        return new ComputedStyle(sources, widget.opacity);
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
            this.classes = opts.class.split(/ +/g).map((c) => c.trim());
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
        if (opts.opacity !== undefined) {
            this._used.opacity = opts.opacity;
        }
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
    pos(x, y) {
        if (x === undefined)
            return this.bounds;
        if (typeof x === 'number') {
            this.bounds.x = x;
            this.bounds.y = y || 0;
        }
        else {
            this.bounds.x = x.x;
            this.bounds.y = x.y;
        }
        this.layer.needsDraw = true;
        return this;
    }
    center(bounds) {
        return this.centerX(bounds).centerY(bounds);
    }
    centerX(bounds) {
        bounds = bounds || this.layer.body.bounds;
        const w = this.bounds.width;
        const mid = Math.round((bounds.width - w) / 2);
        this.bounds.x = bounds.x + mid;
        return this;
    }
    centerY(bounds) {
        bounds = bounds || this.layer.body.bounds;
        const h = this.bounds.height;
        const mid = Math.round((bounds.height - h) / 2);
        this.bounds.y = bounds.y + mid;
        return this;
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
        if (!v && this._used.opacity == 0) {
            this._used.opacity = 100;
        }
    }
    get opacity() {
        let opacity = 100;
        let current = this;
        while (current) {
            if (current._used) {
                opacity = Math.min(opacity, current._used.opacity); // TODO - opacity = Math.floor(opacity * current._used.opacity / 100);
            }
            current = current.parent;
        }
        return opacity;
    }
    set opacity(v) {
        this._used.opacity = v;
        this.hidden = this._used.opacity == 0;
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
    mouseenter(e, over) {
        if (!this.contains(e))
            return;
        if (this.hovered)
            return;
        this.hovered = true;
        this._fireEvent('mouseenter', this, e);
        if (this._parent) {
            this._parent.mouseenter(e, over);
        }
    }
    mousemove(e) {
        if (this.contains(e) && !e.defaultPrevented && !this.hidden) {
            this._fireEvent('mousemove', this, e);
            // e.preventDefault();
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
        // if (this._parent) {
        //     this._parent.mouseleave(e);
        // }
    }
    click(e) {
        if (this.hidden)
            return false;
        return this._fireEvent('click', this, e);
    }
    keypress(e) {
        return this._fireEvent('keypress', this, e);
    }
    dir(e) {
        return this._fireEvent('dir', this, e);
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

class Body extends Widget {
    constructor(layer) {
        super(layer, {
            tag: 'body',
            id: 'BODY',
            depth: -1,
            width: layer.width,
            height: layer.height,
        });
    }
    _drawFill(buffer) {
        buffer.blend(this._used.bg);
    }
}

class Layer {
    constructor(ui, opts = {}) {
        this.needsDraw = true;
        this.result = undefined;
        this._attachOrder = [];
        this._depthOrder = [];
        this._focusWidget = null;
        this._hasTabStop = false;
        this.timers = [];
        this._tweens = [];
        this._done = null;
        this._opts = { x: 0, y: 0 };
        this.ui = ui;
        this.buffer = ui.canvas.buffer.clone();
        this.styles = new Sheet(opts.styles || ui.styles);
        this.body = new Body(this);
        this.promise = new Promise((resolve) => {
            this._done = resolve;
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
    class(c) {
        this._opts.class = this._opts.class || '';
        this._opts.class += ' ' + c;
        return this;
    }
    pos(x, y) {
        if (x === undefined)
            return this._opts;
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
    grid() {
        return new Grid(this);
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
        const over = this.widgetAt(e);
        over.mouseenter(e, over);
        this._depthOrder.forEach((w) => {
            w.mousemove(e); // handles mouseleave
        });
        return false; // TODO - this._done
    }
    click(e) {
        let w = this.widgetAt(e);
        let setFocus = false;
        while (w) {
            if (!setFocus && w.prop('tabStop') && !w.prop('disabled')) {
                this.setFocusWidget(w);
                setFocus = true;
            }
            if (w.click(e))
                return false;
            w = w.parent;
        }
        return false; // TODO - this._done
    }
    keypress(e) {
        if (!e.key)
            return false;
        let w = this.focusWidget || this.body;
        while (w) {
            if (w.keypress(e))
                return false;
            w = w.parent;
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
        if (e.defaultPrevented)
            return false;
        if (e.key === 'Tab') {
            // Next widget
            this.nextTabStop();
        }
        else if (e.key === 'TAB') {
            // Prev Widget
            this.prevTabStop();
        }
        //         return this.done;
        return false;
    }
    dir(e) {
        let target = this.focusWidget || this.body;
        while (target) {
            if (target.dir(e))
                return false;
            target = target.parent;
        }
        // return this.done;
        return false;
    }
    tick(e) {
        const dt = e.dt;
        // fire animations
        this._tweens.forEach((tw) => tw.tick(dt));
        this._tweens = this._tweens.filter((tw) => tw.isRunning());
        this.timers.forEach((timer) => {
            if (timer.time <= 0)
                return; // ignore fired timers
            timer.time -= dt;
            if (timer.time <= 0) {
                if (typeof timer.action === 'string') {
                    this.body._fireEvent(timer.action, this.body);
                }
                else {
                    timer.action();
                }
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
        const slot = this.timers.findIndex((t) => t.time <= 0);
        if (slot < 0) {
            this.timers.push({ action, time });
        }
        else {
            this.timers[slot] = { action, time };
        }
    }
    clearTimeout(action) {
        const timer = this.timers.find((t) => t.action === action);
        if (timer) {
            timer.time = -1;
        }
    }
    animate(tween) {
        if (!tween.isRunning())
            tween.start();
        this._tweens.push(tween);
        return this;
    }
    finish(result) {
        this.result = result;
        this.ui.finishLayer(this);
    }
    _finish() {
        if (!this._done)
            return;
        this.body._fireEvent('finish', this.body, this.result);
        this._done(this.result);
        this._done = null;
    }
}

Layer.prototype.alert = function (opts, text, args) {
    if (typeof opts === 'number') {
        opts = { duration: opts };
    }
    if (args) {
        text = GWU.text.apply(text, args);
    }
    opts.class = opts.class || 'alert';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;
    const layer = this.ui.startNewLayer();
    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));
    // create the text widget
    const textWidget = layer
        .text(text, {
        id: 'TEXT',
        class: opts.textClass || opts.class,
        width: opts.width,
        height: opts.height,
    })
        .center();
    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height,
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
        id: 'DIALOG',
    });
    const dialog = layer.dialog(opts);
    textWidget.setParent(dialog);
    layer.on('click', () => {
        layer.finish(true);
        return true;
    });
    layer.on('keypress', () => {
        layer.finish(true);
        return true;
    });
    layer.setTimeout(() => {
        layer.finish(false);
    }, opts.duration || 3000);
    return layer;
};

// Effects
Layer.prototype.fadeTo = function (color = 0, time = 1000) {
    const layer = this.ui.startNewLayer();
    let elapsed = 0;
    layer.on('tick', (_n, _w, e) => {
        elapsed += e.dt;
        const pct = GWU.clamp(Math.round((100 * elapsed) / time), 0, 100);
        this.ui.copyUIBuffer(layer.buffer);
        layer.buffer.mix(color, pct);
        layer.buffer.render();
        // layer.needsDraw = true;
        if (pct >= 100) {
            layer.finish();
        }
        return true;
    });
    return layer;
};

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
            this.bounds.height = Math.max(1, this._lines.length);
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
    this.pos(list.bounds.x, list.bounds.bottom);
    return list;
};

class Button extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.text = opts.text || '';
            opts.action = opts.action || opts.id;
            opts.tag = opts.tag || 'button';
            if (!opts.text && !opts.width)
                throw new Error('Buttons must have text or width.');
            return opts;
        })());
    }
    keypress(ev) {
        if (!ev.key)
            return false;
        if (this._fireEvent('keypress', this, ev))
            return true;
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
        if (this._fireEvent('click', this, ev))
            return true;
        const action = this._attrStr('action');
        if (action && action.length)
            return this._bubbleEvent(action, this);
        return false;
    }
}
installWidget('button', (l, opts) => new Button(l, opts));
Layer.prototype.button = function (text, opts) {
    const options = Object.assign({}, this._opts, opts, {
        text,
    });
    const widget = new Button(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    this.pos(widget.bounds.x, widget.bounds.bottom);
    return widget;
};

Layer.prototype.confirm = function (opts, text, args) {
    if (typeof opts === 'string') {
        args = text;
        text = opts;
        opts = {};
    }
    if (args) {
        text = GWU.text.apply(text, args);
    }
    opts.class = opts.class || 'confirm';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;
    const layer = this.ui.startNewLayer();
    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));
    if (opts.cancel === undefined) {
        opts.cancel = 'Cancel';
    }
    else if (opts.cancel === true) {
        opts.cancel = 'Cancel';
    }
    else if (!opts.cancel) {
        opts.cancel = '';
    }
    opts.ok = opts.ok || 'Ok';
    let buttonWidth = opts.buttonWidth || 0;
    if (!buttonWidth) {
        buttonWidth = Math.max(opts.ok.length, opts.cancel.length);
    }
    const width = Math.max(opts.width || 0, buttonWidth * 2 + 2);
    // create the text widget
    const textWidget = layer
        .text(text, {
        class: opts.textClass || opts.class,
        width: width,
        height: opts.height,
    })
        .center();
    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height + 2,
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
        tag: 'confirm',
    });
    const dialog = layer.dialog(opts);
    textWidget.setParent(dialog);
    layer
        .button(opts.ok, {
        class: opts.okClass || opts.class,
        width: buttonWidth,
        id: 'OK',
        parent: dialog,
        x: dialog._innerLeft + dialog._innerWidth - buttonWidth,
        y: dialog._innerTop + dialog._innerHeight - 1,
    })
        .on('click', () => {
        layer.finish(true);
        return true;
    });
    if (opts.cancel.length) {
        layer
            .button(opts.cancel, {
            class: opts.cancelClass || opts.class,
            width: buttonWidth,
            id: 'CANCEL',
            parent: dialog,
            x: dialog._innerLeft,
            y: dialog._innerTop + dialog._innerHeight - 1,
        })
            .on('click', () => {
            layer.finish(false);
            return true;
        });
    }
    layer.on('keypress', (_n, _w, e) => {
        if (e.key === 'Escape') {
            layer.finish(false);
        }
        else if (e.key === 'Enter') {
            layer.finish(true);
        }
        return true;
    });
    return layer;
};

Layer.prototype.inputbox = function (opts, text, args) {
    if (typeof opts === 'string') {
        args = text;
        text = opts;
        opts = {};
    }
    if (args) {
        text = GWU.text.apply(text, args);
    }
    opts.class = opts.class || 'confirm';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;
    const layer = this.ui.startNewLayer();
    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));
    // create the text widget
    const textWidget = layer
        .text(text, {
        class: opts.textClass || opts.class,
        width: opts.width,
        height: opts.height,
    })
        .center();
    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height + 2,
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
        tag: 'inputbox',
    });
    const dialog = layer.dialog(opts);
    textWidget.setParent(dialog);
    let width = dialog._innerWidth;
    let x = dialog._innerLeft;
    if (opts.label) {
        const label = layer.text(opts.label, {
            class: opts.labelClass || opts.class,
            tag: 'label',
            parent: dialog,
            x,
            y: dialog._innerTop + dialog._innerHeight - 1,
        });
        x += label.bounds.width + 1;
        width -= label.bounds.width + 1;
    }
    layer
        .input({
        class: opts.inputClass || opts.class,
        width,
        id: 'INPUT',
        parent: dialog,
        x,
        y: dialog._innerTop + dialog._innerHeight - 1,
    })
        .on('INPUT', (_n, w, _e) => {
        w && layer.finish(w.text());
        return true;
    });
    layer.on('keypress', (_n, _w, e) => {
        if (e.key === 'Escape') {
            layer.finish(null);
            return true;
        }
        return false;
    });
    return layer;
};

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
    get baseBuffer() {
        const layer = this.layers[this.layers.length - 2] || null;
        return layer ? layer.buffer : this.canvas.buffer;
    }
    get canvasBuffer() {
        return this.canvas.buffer;
    }
    get buffer() {
        return this.layer ? this.layer.buffer : this.canvas.buffer;
    }
    startNewLayer() {
        const layer = new Layer(this, {
            styles: this.layer ? this.layer.styles : this.styles,
        });
        this.layers.push(layer);
        if (!this._promise) {
            this._promise = this.loop.run(this);
        }
        this.layer = layer;
        return layer;
    }
    copyUIBuffer(dest) {
        const base = this.baseBuffer;
        dest.copy(base);
        dest.changed = false; // So you have to draw something to make the canvas render...
    }
    finishLayer(layer) {
        layer._finish();
        GWU.arrayDelete(this.layers, layer);
        if (this.layer === layer) {
            this.layer = this.layers[this.layers.length - 1] || null;
            this.layer && (this.layer.needsDraw = true);
        }
    }
    stop() {
        this._done = true;
        while (this.layer) {
            this.finishLayer(this.layer);
        }
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

function toPadArray(pad) {
    if (!pad)
        return [0, 0, 0, 0];
    if (pad === true) {
        return [1, 1, 1, 1];
    }
    else if (typeof pad === 'number') {
        return [pad, pad, pad, pad];
    }
    else if (pad.length == 1) {
        const p = pad[0];
        return [p, p, p, p];
    }
    else if (pad.length == 2) {
        const [pv, ph] = pad;
        return [pv, ph, pv, ph];
    }
    throw new Error('Invalid pad: ' + pad);
}
class Dialog extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || Dialog.default.tag;
            return opts;
        })());
        this.legend = null;
        let border = opts.border || Dialog.default.border;
        this.attr('border', border);
        const pad = toPadArray(opts.pad || Dialog.default.pad);
        this.attr('padTop', pad[0]);
        this.attr('padRight', pad[1]);
        this.attr('padBottom', pad[2]);
        this.attr('padLeft', pad[3]);
        if (border !== 'none') {
            for (let i = 0; i < 4; ++i) {
                pad[i] += 1;
            }
        }
        this._adjustBounds(pad);
        this.attr('legendTag', opts.legendTag || Dialog.default.legendTag);
        this.attr('legendClass', opts.legendClass || opts.class || Dialog.default.legendClass);
        this.attr('legendAlign', opts.legendAlign || Dialog.default.legendAlign);
        this._addLegend(opts);
    }
    _adjustBounds(pad) {
        // adjust w,h,x,y for border/pad
        this.bounds.width += pad[1] + pad[3];
        this.bounds.height += pad[0] + pad[2];
        this.bounds.x -= pad[3];
        this.bounds.y -= pad[0];
        return this;
    }
    get _innerLeft() {
        const border = this._attrStr('border');
        const padLeft = this._attrInt('padLeft');
        return this.bounds.x + padLeft + (border === 'none' ? 0 : 1);
    }
    get _innerWidth() {
        const border = this._attrStr('border');
        const padSize = this._attrInt('padLeft') + this._attrInt('padRight');
        return this.bounds.width - padSize - (border === 'none' ? 0 : 2);
    }
    get _innerTop() {
        const border = this._attrStr('border');
        const padTop = this._attrInt('padTop');
        return this.bounds.y + padTop + (border === 'none' ? 0 : 1);
    }
    get _innerHeight() {
        const border = this._attrStr('border');
        const padSize = this._attrInt('padTop') + this._attrInt('padBottom');
        return this.bounds.height - padSize - (border === 'none' ? 0 : 2);
    }
    _addLegend(opts) {
        if (!opts.legend) {
            if (this._attrStr('border') === 'none') {
                this.bounds.height = 0;
            }
            return this;
        }
        const border = this._attrStr('border') !== 'none';
        const textWidth = GWU.text.length(opts.legend);
        const width = this.bounds.width - (border ? 4 : 0);
        const align = this._attrStr('legendAlign');
        let x = this.bounds.x + (border ? 2 : 0);
        if (align === 'center') {
            x += Math.floor((width - textWidth) / 2);
        }
        else if (align === 'right') {
            x += width - textWidth;
        }
        this.legend = new Text(this.layer, {
            text: opts.legend,
            x,
            y: this.bounds.y,
            depth: this.depth + 1,
            tag: this._attrStr('legendTag'),
            class: this._attrStr('legendClass'),
        });
        // if (this.bounds.width < this.legend.bounds.width + 4) {
        //     this.bounds.width = this.legend.bounds.width + 4;
        // }
        // this.bounds.height +=
        //     this._attrInt('padTop') + this._attrInt('padBottom');
        this.legend.setParent(this);
        return this;
    }
    _draw(buffer) {
        this._drawFill(buffer);
        const border = this._attrStr('border');
        if (border === 'none')
            return false;
        drawBorder(buffer, this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this._used, border === 'ascii');
        return true;
    }
}
Dialog.default = {
    tag: 'dialog',
    border: 'none',
    pad: false,
    legendTag: 'legend',
    legendClass: '',
    legendAlign: 'left',
};
Layer.prototype.dialog = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new Dialog(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

class Fieldset extends Dialog {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || Fieldset.default.tag;
            opts.border = opts.border || Fieldset.default.border;
            opts.legendTag = opts.legendTag || Fieldset.default.legendTag;
            opts.legendClass =
                opts.legendClass || Fieldset.default.legendClass;
            opts.legendAlign =
                opts.legendAlign || Fieldset.default.legendAlign;
            opts.width = opts.width || 0;
            opts.height = opts.height || 0;
            return opts;
        })());
        this.fields = [];
        this.attr('separator', opts.separator || Fieldset.default.separator);
        this.attr('dataTag', opts.dataTag || Fieldset.default.dataTag);
        this.attr('dataClass', opts.dataClass || Fieldset.default.dataClass);
        this.attr('dataWidth', opts.dataWidth);
        this.attr('labelTag', opts.labelTag || Fieldset.default.labelTag);
        this.attr('labelClass', opts.labelClass || Fieldset.default.labelClass);
        this.attr('labelWidth', this._innerWidth - opts.dataWidth);
        this._addLegend(opts);
    }
    _adjustBounds(pad) {
        this.bounds.width = Math.max(this.bounds.width, pad[1] + pad[3]);
        this.bounds.height = Math.max(this.bounds.height, pad[0] + pad[2]);
        return this;
    }
    get _labelLeft() {
        const border = this._attrStr('border');
        const padLeft = this._attrInt('padLeft');
        return this.bounds.x + padLeft + (border === 'none' ? 0 : 1);
    }
    get _dataLeft() {
        return this._labelLeft + this._attrInt('labelWidth');
    }
    get _nextY() {
        const border = this._attrStr('border');
        const padBottom = this._attrInt('padBottom');
        return this.bounds.bottom - (border === 'none' ? 0 : 1) - padBottom;
    }
    add(label, format) {
        const sep = this._attrStr('separator');
        const labelText = GWU.text.padEnd(label, this._attrInt('labelWidth') - sep.length, ' ') + sep;
        this.layer.text(labelText, {
            x: this._labelLeft,
            y: this._nextY,
            width: this._attrInt('labelWidth'),
            tag: this._attrStr('labelTag'),
            class: this._attrStr('labelClass'),
        });
        if (typeof format === 'string') {
            format = { format };
        }
        format.x = this._dataLeft;
        format.y = this._nextY;
        format.width = this._attrInt('dataWidth');
        format.tag = format.tag || this._attrStr('dataTag');
        format.class = format.class || this._attrStr('dataClass');
        const field = new Field(this.layer, format);
        field.setParent(this);
        this.bounds.height += 1;
        this.fields.push(field);
        return this;
    }
    data(d) {
        this.fields.forEach((f) => f.data(d));
        this.layer.needsDraw = true;
        return this;
    }
}
Fieldset.default = {
    tag: 'fieldset',
    border: 'none',
    separator: ' : ',
    pad: false,
    legendTag: 'legend',
    legendClass: 'legend',
    legendAlign: 'left',
    labelTag: 'label',
    labelClass: '',
    dataTag: 'field',
    dataClass: '',
};
Layer.prototype.fieldset = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new Fieldset(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
class Field extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            // @ts-ignore
            const topts = opts;
            topts.tag = topts.tag || 'field';
            topts.text = '';
            return topts;
        })());
        if (typeof opts.format === 'string') {
            this._format = GWU.text.compile(opts.format);
        }
        else {
            this._format = opts.format;
        }
    }
    data(v) {
        const t = this._format(v) || '';
        return this.text(t);
    }
}

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

defaultStyle.add('input', {
    bg: 'light_gray',
    fg: 'black',
    align: 'left',
    valign: 'top',
});
defaultStyle.add('input:invalid', {
    fg: 'red',
});
defaultStyle.add('input:empty', {
    fg: 'darkest_green',
});
defaultStyle.add('input:focus', {
    bg: 'lighter_gray',
});
class Input extends Text {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.text = opts.text || '';
            opts.tag = opts.tag || 'input';
            opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
            opts.action = opts.action || opts.id;
            opts.width =
                opts.width ||
                    opts.maxLength ||
                    Math.max(opts.minLength || 0, 10);
            return opts;
        })());
        this.minLength = 0;
        this.maxLength = 0;
        this.numbersOnly = false;
        this.min = 0;
        this.max = 0;
        this.attr('default', this._text);
        this.attr('placeholder', opts.placeholder || Input.default.placeholder);
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
        this.reset();
    }
    reset() {
        this.text(this._attrStr('default'));
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
                this._draw(this.layer.buffer); // save some work?
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
                this._draw(this.layer.buffer); // save some work?
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
        if (show.length == 0) {
            show = this._attrStr('placeholder');
        }
        if (this._text.length > this.bounds.width) {
            show = this._text.slice(this._text.length - this.bounds.width);
        }
        buffer.drawText(this.bounds.x, this.bounds.y + vOffset, show, this._used.fg, -1, this.bounds.width, this._used.align);
        return true;
    }
}
Input.default = {
    tag: 'input',
    width: 10,
    placeholder: '',
};
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
        this.headerTag = opts.headerTag || DataTable.default.headerTag;
        this.empty = opts.empty || DataTable.default.empty;
        this.dataTag = opts.dataTag || DataTable.default.dataTag;
    }
    addHeader(table, x, y, col) {
        const t = new Text(table.layer, {
            x,
            y,
            class: table.classes.join(' '),
            tag: table._attrStr('headerTag'),
            width: this.width,
            height: table.rowHeight,
            depth: table.depth + 1,
            text: this.header,
        });
        t.prop('row', -1);
        t.prop('col', col);
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
        const widget = new TD(table.layer, {
            text,
            x,
            y,
            class: table.classes.join(' '),
            tag: table._attrStr('dataTag'),
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
Column.default = {
    select: 'row',
    hover: 'select',
    tag: 'datatable',
    headerTag: 'th',
    dataTag: 'td',
    border: 'ascii',
};
class DataTable extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || DataTable.default.tag;
            opts.tabStop = opts.tabStop === undefined ? true : opts.tabStop;
            return opts;
        })());
        this._data = [];
        this.columns = [];
        this.showHeader = false;
        this.rowHeight = 1;
        this.selectedRow = -1;
        this.selectedColumn = 0;
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
        }
        else if (opts.border === false) {
            opts.border = 'none';
        }
        this.attr('border', opts.border || DataTable.default.border);
        this.rowHeight = opts.rowHeight || 1;
        this.bounds.height = 1;
        this.attr('wrap', opts.wrap === undefined ? DataTable.default.wrap : opts.wrap);
        this.attr('header', opts.header === undefined ? DataTable.default.header : opts.header);
        this.attr('headerTag', opts.headerTag || DataTable.default.headerTag);
        this.attr('dataTag', opts.dataTag || DataTable.default.dataTag);
        this.attr('prefix', opts.prefix || DataTable.default.prefix);
        this.attr('select', opts.select || DataTable.default.select);
        this.attr('hover', opts.hover || DataTable.default.hover);
        this.data(opts.data || []);
    }
    get selectedData() {
        if (this.selectedRow < 0)
            return undefined;
        return this._data[this.selectedRow];
    }
    select(col, row) {
        if (!this._data || this._data.length == 0) {
            this.selectedRow = this.selectedColumn = 0;
            return this;
        }
        if (this.attr('wrap')) {
            if (col < 0 || col >= this.columns.length) {
                col += this.columns.length;
                col %= this.columns.length;
            }
            if (row < 0 || row >= this._data.length) {
                row += this._data.length;
                row %= this._data.length;
            }
        }
        col = this.selectedColumn = GWU.clamp(col, 0, this.columns.length - 1);
        row = this.selectedRow = GWU.clamp(row, 0, this._data.length - 1);
        const select = this._attrStr('select');
        if (select === 'none') {
            this.children.forEach((c) => {
                c.prop('selected', false);
            });
        }
        else if (select === 'row') {
            this.children.forEach((c) => {
                const active = row == c.prop('row');
                c.prop('selected', active);
            });
        }
        else if (select === 'column') {
            this.children.forEach((c) => {
                const active = col == c.prop('col');
                c.prop('selected', active);
            });
        }
        else if (select === 'cell') {
            this.children.forEach((c) => {
                const active = col == c.prop('col') && row == c.prop('row');
                c.prop('selected', active);
            });
        }
        this._bubbleEvent('input', this, { row, col, data: this.selectedData });
        return this;
    }
    selectNextRow() {
        return this.select(this.selectedColumn, this.selectedRow + 1);
    }
    selectPrevRow() {
        return this.select(this.selectedColumn, this.selectedRow - 1);
    }
    selectNextCol() {
        return this.select(this.selectedColumn + 1, this.selectedRow);
    }
    selectPrevCol() {
        return this.select(this.selectedColumn - 1, this.selectedRow);
    }
    blur(reverse) {
        this._bubbleEvent('change', this, {
            col: this.selectedColumn,
            row: this.selectedRow,
            data: this.selectedData,
        });
        return super.blur(reverse);
    }
    data(data) {
        if (!data)
            return this._data;
        this._data = data;
        for (let i = this.children.length - 1; i >= 0; --i) {
            const c = this.children[i];
            if (c.tag !== this.attr('headerTag')) {
                this.layer.detach(c);
            }
        }
        const borderAdj = this.attr('border') !== 'none' ? 1 : 0;
        let x = this.bounds.x + borderAdj;
        let y = this.bounds.y + borderAdj;
        if (this.attr('header')) {
            this.columns.forEach((col, i) => {
                col.addHeader(this, x, y, i);
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
            this.select(-1, -1);
        }
        else {
            this.select(0, 0);
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
            if (this.attr('border') !== 'none') {
                drawBorder(buffer, w.bounds.x - 1, w.bounds.y - 1, w.bounds.width + 2, w.bounds.height + 2, this._used, this.attr('border') == 'ascii');
            }
        });
        return true;
    }
    mouseenter(e, over) {
        super.mouseenter(e, over);
        if (!this.hovered)
            return;
        const hovered = this.children.find((c) => c.contains(e));
        if (hovered) {
            const col = hovered._propInt('col');
            const row = hovered._propInt('row');
            if (col !== this.selectedColumn || row !== this.selectedRow) {
                this.selectedColumn = col;
                this.selectedRow = row;
                let select = false;
                let hover = this._attrStr('hover');
                if (hover === 'select') {
                    hover = this._attrStr('select');
                    select = true;
                }
                if (hover === 'none') {
                    this.children.forEach((c) => {
                        c.hovered = false;
                        if (select)
                            c.prop('selected', false);
                    });
                }
                else if (hover === 'row') {
                    this.children.forEach((c) => {
                        const active = row == c.prop('row');
                        c.hovered = active;
                        if (select)
                            c.prop('selected', active);
                    });
                }
                else if (hover === 'column') {
                    this.children.forEach((c) => {
                        const active = col == c.prop('col');
                        c.hovered = active;
                        if (select)
                            c.prop('selected', active);
                    });
                }
                else if (hover === 'cell') {
                    this.children.forEach((c) => {
                        const active = col == c.prop('col') && row == c.prop('row');
                        c.hovered = active;
                        if (select)
                            c.prop('selected', active);
                    });
                }
                this._bubbleEvent('input', this, {
                    row,
                    col,
                    data: this.selectedData,
                });
            }
        }
    }
    click(e) {
        if (!this.contains(e))
            return false;
        this._bubbleEvent('change', this, {
            row: this.selectedRow,
            col: this.selectedColumn,
            data: this.selectedData,
        });
        return false;
    }
    keypress(e) {
        if (!e.key)
            return false;
        if (e.key === 'Enter') {
            this._bubbleEvent('change', this, {
                row: this.selectedRow,
                col: this.selectedColumn,
                data: this.selectedData,
            });
            return true;
        }
        return false;
    }
    dir(e) {
        if (!e.dir)
            return false;
        if (e.dir[1] == 1) {
            this.selectNextRow();
        }
        else if (e.dir[1] == -1) {
            this.selectPrevRow();
        }
        if (e.dir[0] == 1) {
            this.selectNextCol();
        }
        else if (e.dir[0] == -1) {
            this.selectPrevCol();
        }
        return true;
    }
}
DataTable.default = {
    columnWidth: 10,
    header: true,
    empty: '-',
    tag: 'datatable',
    headerTag: 'th',
    dataTag: 'td',
    select: 'cell',
    hover: 'select',
    prefix: 'none',
    border: 'ascii',
    wrap: true,
};
installWidget('datatable', (l, opts) => new DataTable(l, opts));
class TD extends Text {
    mouseleave(e) {
        super.mouseleave(e);
        if (this.parent) {
            const table = this.parent;
            if (table.attr('select') === 'row') {
                this.hovered = this._propInt('row') === table.selectedRow;
            }
            else if (table.attr('select') === 'column') {
                this.hovered = this._propInt('col') === table.selectedColumn;
            }
        }
    }
}
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
            if (opts.border !== 'none' && opts.width) {
                opts.width -= 2;
            }
            tableOpts.columns = [Object.assign({}, opts)];
            if (!opts.header || !opts.header.length) {
                tableOpts.header = false;
            }
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
        return this._buttons.reduce((out, b) => b.collapse() || out, false);
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
        if (!this.menu || this.menu.hidden)
            return false;
        this.menu.collapse();
        this.menu.hidden = true;
        return true;
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

class Prompt {
    constructor(question, field = {}) {
        this._id = null;
        this._defaultNext = null;
        this.selection = -1;
        if (typeof field === 'string') {
            field = { field };
        }
        this._prompt = question;
        this._field = field.field || '';
        this._choices = [];
        this._infos = [];
        this._values = [];
        this._next = [];
        this._defaultNext = field.next || null;
        this._id = field.id || field.field || '';
    }
    reset() {
        this.selection = -1;
    }
    field(v) {
        if (v === undefined)
            return this._field;
        this._field = v;
        return this;
    }
    id(v) {
        if (v === undefined)
            return this._id;
        this._id = v;
        return this;
    }
    prompt(arg) {
        if (typeof this._prompt === 'string')
            return this._prompt;
        return this._prompt(arg);
    }
    next(v) {
        if (v === undefined)
            return this._next[this.selection] || this._defaultNext;
        this._defaultNext = v;
        return this;
    }
    choices(choice, info) {
        if (choice === undefined)
            return this._choices;
        if (!Array.isArray(choice)) {
            info = Object.values(choice);
            choice = Object.keys(choice);
        }
        else if (!Array.isArray(info)) {
            info = new Array(choice.length).fill('');
        }
        info = info.map((i) => {
            if (typeof i === 'string')
                return { info: i };
            return i;
        });
        if (choice.length !== info.length)
            throw new Error('Choices and Infos must have same length.');
        choice.forEach((c, i) => {
            this.choice(c, info[i]);
        });
        return this;
    }
    choice(choice, info = {}) {
        if (typeof info === 'string') {
            info = { info: info };
        }
        this._choices.push(choice);
        this._infos.push(info.info || '');
        this._next.push(info.next || null);
        this._values.push(info.value || choice);
        return this;
    }
    info(arg) {
        const i = this._infos[this.selection] || '';
        if (typeof i === 'string')
            return i;
        return i(arg);
    }
    choose(n) {
        this.selection = n;
        return this;
    }
    value() {
        return this._values[this.selection];
    }
    updateResult(res) {
        if (this.selection < 0)
            return this;
        res[this._field] = this.value();
        return this;
    }
}
class Choice extends Widget {
    constructor(layer, opts) {
        super(layer, (() => {
            opts.tag = opts.tag || Choice.default.tag;
            return opts;
        })());
        this._prompt = null;
        this._done = null;
        this.choiceWidth = opts.choiceWidth;
        this.attr('border', opts.border || Choice.default.border);
        this.attr('promptTag', opts.promptTag || Choice.default.promptTag);
        this.attr('promptClass', opts.promptClass || Choice.default.promptClass);
        this.attr('choiceTag', opts.choiceTag || Choice.default.choiceTag);
        this.attr('choiceClass', opts.choiceClass || Choice.default.choiceClass);
        this.attr('infoTag', opts.infoTag || Choice.default.infoTag);
        this.attr('infoClass', opts.infoClass || Choice.default.infoClass);
        this._addLegend();
        this._addList();
        this._addInfo();
        if (opts.prompt) {
            this.showPrompt(opts.prompt);
        }
    }
    showPrompt(prompt, arg) {
        this._prompt = prompt;
        prompt.choose(0);
        this.prompt.text(prompt.prompt(arg));
        this.list.data(prompt.choices());
        this.info.text(prompt.info(arg));
        this._bubbleEvent('input', this, this._prompt);
        return new Promise((resolve) => (this._done = resolve));
    }
    _addList() {
        this.list = new DataList(this.layer, {
            height: this.bounds.height - 2,
            x: this.bounds.x + 1,
            width: this.choiceWidth,
            y: this.bounds.y + 1,
            dataTag: this._attrStr('choiceTag'),
            dataClass: this._attrStr('choiceClass'),
            tabStop: true,
            border: 'none',
            hover: 'select',
        });
        this.list.setParent(this);
        this.list.on('input', () => {
            if (!this._prompt)
                return false;
            const p = this._prompt;
            const row = this.list.selectedRow;
            p.choose(row);
            this.info.text(p.info());
            this._bubbleEvent('input', this, p);
            return true; // I want to eat this event
        });
        this.list.on('change', () => {
            if (!this._prompt)
                return false;
            const p = this._prompt;
            p.choose(this.list.selectedRow);
            this._bubbleEvent('change', this, p);
            this._done(p.value());
            return true; // eat this event
        });
        return this;
    }
    _addInfo() {
        this.info = new Text(this.layer, {
            text: '',
            x: this.bounds.x + this.choiceWidth + 2,
            y: this.bounds.y + 1,
            width: this.bounds.width - this.choiceWidth - 3,
            height: this.bounds.height - 2,
            tag: this._attrStr('infoTag'),
            class: this._attrStr('infoClass'),
        });
        this.info.setParent(this);
        return this;
    }
    _addLegend() {
        this.prompt = new Text(this.layer, {
            text: '',
            width: this.bounds.width - 4,
            x: this.bounds.x + 2,
            y: this.bounds.y,
            tag: this._attrStr('promptTag'),
            class: this._attrStr('promptClass'),
        });
        this.prompt.setParent(this);
        return this;
    }
    _draw(buffer) {
        let w = this.choiceWidth + 2;
        const h = this.bounds.height;
        let x = this.bounds.x;
        const y = this.bounds.y;
        const ascii = this.attr('border') === 'ascii';
        drawBorder(buffer, x, y, w, h, this._used, ascii);
        w = this.bounds.width - this.choiceWidth - 1;
        x = this.bounds.x + this.choiceWidth + 1;
        drawBorder(buffer, x, y, w, h, this._used, ascii);
        return true;
    }
}
Choice.default = {
    tag: 'choice',
    border: 'ascii',
    promptTag: 'prompt',
    promptClass: '',
    choiceTag: 'ci',
    choiceClass: '',
    infoTag: 'info',
    infoClass: '',
};
Layer.prototype.choice = function (opts) {
    const options = Object.assign({}, this._opts, opts);
    const widget = new Choice(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
////////////////////////////////////////////////////////////////////////////////
// INQUIRY
class Inquiry {
    constructor(widget) {
        this._prompts = [];
        this.events = {};
        this._result = {};
        this._stack = [];
        this._current = null;
        this.widget = widget;
        this._keypress = this._keypress.bind(this);
        this._change = this._change.bind(this);
    }
    prompts(v, ...args) {
        if (Array.isArray(v)) {
            this._prompts = v.slice();
        }
        else {
            args.unshift(v);
            this._prompts = args;
        }
        return this;
    }
    _finish() {
        this.widget.off('keypress', this._keypress);
        this.widget.off('change', this._change);
        this._fireEvent('finish', this.widget, this._result);
    }
    _cancel() {
        this.widget.off('keypress', this._keypress);
        this.widget.off('change', this._change);
        this._fireEvent('cancel', this.widget);
    }
    start() {
        this._current = this._prompts[0];
        this._result = {};
        this.widget.on('keypress', this._keypress);
        this.widget.on('change', this._change);
        this.widget.showPrompt(this._current, this._result);
    }
    back() {
        this._current.reset();
        this._current = this._stack.pop() || null;
        if (!this._current) {
            this._cancel();
        }
        else {
            this._current.reset(); // also reset the one we are going back to
            this._result = {};
            this._prompts.forEach((p) => p.updateResult(this._result));
            this.widget.showPrompt(this._current, this._result);
        }
    }
    restart() {
        this._prompts.forEach((p) => p.reset());
        this._result = {};
        this._current = this._prompts[0];
        this.widget.showPrompt(this._current, this._result);
    }
    quit() {
        this._cancel();
    }
    _keypress(_n, _w, e) {
        if (!e.key)
            return false;
        if (e.key === 'Escape') {
            this.back();
            return true;
        }
        else if (e.key === 'R') {
            this.restart();
            return true;
        }
        else if (e.key === 'Q') {
            this.quit();
            return true;
        }
        return false;
    }
    _change(_n, _w, p) {
        p.updateResult(this._result);
        const next = p.next();
        if (next) {
            this._current = this._prompts.find((p) => p.id() === next) || null;
            if (this._current) {
                this._stack.push(p);
                this.widget.showPrompt(this._current, this._result);
                this._fireEvent('step', this.widget, {
                    prompt: this._current,
                    data: this._result,
                });
                return true;
            }
        }
        this._finish();
        return true;
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
        let handled = handlers.reduce((out, h) => h(name, source || this.widget, args) || out, false);
        if (!handled) {
            handled = this.widget._bubbleEvent(name, source || this.widget, args);
        }
        return handled;
    }
}

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Widget: Widget,
    Body: Body,
    Text: Text,
    Border: Border,
    drawBorder: drawBorder,
    Button: Button,
    toPadArray: toPadArray,
    Dialog: Dialog,
    Fieldset: Fieldset,
    Field: Field,
    OrderedList: OrderedList,
    UnorderedList: UnorderedList,
    Input: Input,
    Column: Column,
    DataTable: DataTable,
    TD: TD,
    DataList: DataList,
    Menu: Menu,
    MenuButton: MenuButton,
    Menubar: Menubar,
    MenubarButton: MenubarButton,
    MenuViewer: MenuViewer,
    Select: Select,
    Prompt: Prompt,
    Choice: Choice,
    Inquiry: Inquiry
});

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
            class: source.classes.concat('archive').join(' '),
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
        // confirm them as they are right now...
        this.source.cache.confirmAll();
    }
    contains() {
        return true; // Eat all mouse activity
    }
    finish() {
        this.layer.finish();
    }
    keypress(_e) {
        if (this.mode === 'ack') {
            this.mode = 'reverse';
            this.layer.needsDraw = true;
            this.layer.setTimeout('REVERSE', 16);
        }
        else if (this.mode === 'reverse') {
            this.finish();
            return true;
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            this.layer.clearTimeout('FORWARD');
            this.layer.needsDraw = true;
        }
        return true; // eat all events
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
        return true;
    }
    _forward() {
        ++this.shown;
        this.layer.needsDraw = true;
        if (this.shown < this.totalCount) {
            this.layer.setTimeout('FORWARD', 16);
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
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
            const fgColor = fg.mix(this._used.bg, fadePercent);
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
            intro = 'You see';
        }
        else if (isAnyKindOfVisible) {
            intro = 'You sense';
        }
        else if (isRemembered) {
            intro = 'You remember';
        }
        else if (isMapped) {
            intro = 'You expect to see';
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
        this.attr('snap', opts.snap || false);
        this.attr('center', opts.center || false);
        this.filter = opts.filter || null;
        this.attr('lockX', opts.lock || opts.lockX || false);
        this.attr('lockY', opts.lock || opts.lockY || false);
    }
    get subject() {
        return this._subject;
    }
    set subject(subject) {
        this.attr('center', !!subject);
        if (subject) {
            this.offsetX = subject.x - this.halfWidth();
            this.offsetY = subject.y - this.halfHeight();
        }
        this._subject = subject;
    }
    set lock(v) {
        this.attr('lockX', v);
        this.attr('lockY', v);
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
        this.attr('center', true);
        this.subject = { x, y, map };
    }
    showMap(map, x = 0, y = 0) {
        this.subject = { x, y, map };
        this.offsetX = x;
        this.offsetY = y;
        this.attr('center', false);
        this.attr('snap', false);
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
            if (this._attrBool('snap')) {
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
            else if (this._attrBool('center')) {
                this.offsetX = subject.x - this.halfWidth();
                this.offsetY = subject.y - this.halfHeight();
            }
            else {
                this.offsetX = subject.x;
                this.offsetY = subject.y;
            }
        }
        if (this._attrBool('lockX') && map) {
            this.offsetX = GWU.clamp(this.offsetX, 0, map.width - this.bounds.width);
        }
        if (this._attrBool('lockY') && map) {
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

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Messages: Messages,
    MessageArchive: MessageArchive,
    Flavor: Flavor,
    EntryBase: EntryBase,
    ActorEntry: ActorEntry,
    ItemEntry: ItemEntry,
    CellEntry: CellEntry,
    Sidebar: Sidebar,
    Viewport: Viewport
});

export { ComputedStyle, Grid, Layer, Selector, Sheet, Style, UI, compile, defaultStyle, index as game, makeStyle, index$1 as widget };
