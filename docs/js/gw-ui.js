(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gw-utils'), require('gw-map')) :
    typeof define === 'function' && define.amd ? define(['exports', 'gw-utils', 'gw-map'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GWI = {}, global.GWU, global.GWM));
}(this, (function (exports, GWU, GWM) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var GWU__namespace = /*#__PURE__*/_interopNamespace(GWU);
    var GWM__namespace = /*#__PURE__*/_interopNamespace(GWM);

    class Widget {
        constructor(id, opts) {
            this.active = false;
            this.hovered = false;
            this.tabStop = false;
            this.depth = 0;
            this.fg = 0xfff;
            this.bg = -1;
            this.activeFg = 0xfff;
            this.activeBg = -1;
            this.hoverFg = 0xfff;
            this.hoverBg = -1;
            this.text = '';
            this.align = 'left';
            this.valign = 'middle';
            this.bounds = new GWU__namespace.xy.Bounds(-1, -1, -1, -1); // nothing set
            this.id = id;
            if (opts)
                this.init(opts);
            this.reset();
        }
        init(opts) {
            if (opts.x !== undefined)
                this.bounds.x = opts.x;
            if (opts.y !== undefined)
                this.bounds.y = opts.y;
            if (opts.width !== undefined)
                this.bounds.width = opts.width;
            if (opts.height !== undefined)
                this.bounds.height = opts.height;
            if (opts.depth !== undefined)
                this.depth = opts.depth;
            if (opts.text) {
                this.text = opts.text;
                if (this.bounds.width <= 0)
                    this.bounds.width = opts.text.length;
                if (this.bounds.height <= 0)
                    this.bounds.height = 1;
            }
            if (this.bounds.height <= 0)
                this.bounds.height = 1;
            if (opts.fg !== undefined) {
                this.fg = opts.fg;
                this.activeFg = opts.fg;
                this.hoverFg = opts.fg;
            }
            if (opts.bg !== undefined) {
                this.bg = opts.bg;
                this.activeBg = opts.bg;
                this.hoverBg = opts.bg;
            }
            if (opts.activeFg !== undefined) {
                this.activeFg = opts.activeFg;
                this.hoverFg = opts.activeFg;
            }
            if (opts.activeBg !== undefined) {
                this.activeBg = opts.activeBg;
                this.hoverBg = opts.activeBg;
            }
            if (opts.hoverFg !== undefined)
                this.hoverFg = opts.hoverFg;
            if (opts.hoverBg !== undefined)
                this.hoverBg = opts.hoverBg;
            if (opts.tabStop !== undefined)
                this.tabStop = opts.tabStop;
            this.action = opts.action || this.id;
        }
        reset() { }
        activate(_reverse = false) {
            this.active = true;
        }
        deactivate() {
            this.active = false;
        }
        contains(x, y) {
            if (arguments.length == 1)
                return this.bounds.contains(x);
            return this.bounds.contains(x, y);
        }
        // EVENTS
        // returns true if mouse is over this widget
        mousemove(e, _dialog) {
            this.hovered = this.contains(e);
            return this.hovered;
        }
        tick(_e, _dialog) { }
        // returns true if click is handled by this widget (stopPropagation)
        click(_e, _dialog) {
            return false;
        }
        // returns true if key is used by widget and you want to stopPropagation
        keypress(_e, _dialog) {
            return false;
        }
        // returns true if key is used by widget and you want to stopPropagation
        dir(_e, _dialog) {
            return false;
        }
        // DRAW
        draw(buffer) {
            const fg = this.active
                ? this.activeFg
                : this.hovered
                    ? this.hoverFg
                    : this.fg;
            const bg = this.active
                ? this.activeBg
                : this.hovered
                    ? this.hoverBg
                    : this.bg;
            const textLen = GWU__namespace.text.length(this.text);
            if (this.bounds.width > textLen || this.bounds.height > 1) {
                buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', fg, bg);
            }
            let x = this.bounds.x;
            if (this.align == 'center') {
                x += Math.floor((this.bounds.width - textLen) / 2);
            }
            else if (this.align == 'right') {
                x += this.bounds.width - textLen;
            }
            let y = this.bounds.y; // 'top'
            if (this.bounds.height > 1) {
                if (this.valign == 'middle') {
                    y += Math.floor(this.bounds.height / 2);
                }
                else if (this.valign == 'bottom') {
                    y += this.bounds.height - 1;
                }
            }
            buffer.drawText(x, y, this.text, fg, bg);
        }
    }

    class Text extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            // if (!opts.text)
            //     throw new Error(
            //         'Must have text value in config for Text widget - ' + this.id
            //     );
            this.text = opts.text || '';
            if (opts.wrap) {
                this.wrap = true;
                opts.width = opts.wrap;
                this.lines = GWU__namespace.text.splitIntoLines(this.text, 
                // @ts-ignore
                opts.width);
            }
            else {
                const textLen = GWU__namespace.text.length(this.text);
                opts.width = opts.width || textLen || 10;
                if (opts.width < textLen) {
                    opts.text = GWU__namespace.text.truncate(this.text, opts.width);
                }
                this.lines = [this.text];
            }
            opts.height = Math.max(this.lines.length, opts.height || 1);
            super.init(opts);
        }
        setText(text) {
            this.text = text;
            if (this.wrap) {
                this.lines = GWU__namespace.text.splitIntoLines(this.text, this.bounds.width);
            }
            else {
                const textLen = GWU__namespace.text.length(this.text);
                if (textLen > this.bounds.width) {
                    this.text = GWU__namespace.text.truncate(this.text, this.bounds.width);
                }
                this.lines = [this.text];
            }
        }
        // TODO - get text() {}, set text(v:string) { // do lines stuff }
        draw(buffer) {
            const fg = this.active ? this.activeFg : this.fg;
            const bg = this.active ? this.activeBg : this.bg;
            this.lines.forEach((line, i) => {
                buffer.drawText(this.bounds.x, this.bounds.y + i, line, fg, bg, this.bounds.width);
            });
        }
    }

    class Button extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            if (!opts.text)
                throw new Error('Must have text value in config for Button widget - ' + this.id);
            opts.tabStop = GWU__namespace.first(opts.tabStop, true); // Can receive input (Enter)
            super.init(opts);
        }
        async click(ev, dialog) {
            if (!this.contains(ev))
                return false;
            await dialog.fireAction(this.action, this);
            return true;
        }
        async keypress(ev, dialog) {
            if (!ev.key)
                return false;
            if (ev.key === 'Enter') {
                await dialog.fireAction(this.action, this);
                return true;
            }
            return false;
        }
    }

    class Input$1 extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            this.minLength = opts.minLength || 1;
            if (!opts.width) {
                opts.width = Math.max(this.minLength, 10);
            }
            opts.tabStop = GWU__namespace.first(opts.tabStop, true); // Need to receive input
            super.init(opts);
            this.default = opts.default || '';
            this.errorFg = opts.errorFg || this.fg;
            this.hint = opts.hint || '';
            this.hintFg = opts.hintFg || this.errorFg;
            this.numbersOnly = opts.numbersOnly || false;
            this.min = GWU__namespace.first(opts.min, Number.MIN_SAFE_INTEGER);
            this.max = GWU__namespace.first(opts.max, Number.MAX_SAFE_INTEGER);
            if (this.bounds.width <= 0) {
                if (this.hint)
                    this.bounds.width = this.hint.length;
                if (this.default)
                    this.bounds.width = this.default.length;
            }
            if (this.bounds.height <= 0) {
                this.bounds.height = 1;
            }
            this.reset();
        }
        reset() {
            this.text = this.default;
        }
        isValid() {
            if (this.numbersOnly) {
                const val = Number.parseInt(this.text);
                if (this.min !== undefined && val < this.min)
                    return false;
                if (this.max !== undefined && val > this.max)
                    return false;
                return val > 0;
            }
            return this.text.length >= this.minLength;
        }
        get value() {
            if (this.numbersOnly)
                return Number.parseInt(this.text);
            return this.text;
        }
        keypress(ev, dialog) {
            const textEntryBounds = this.numbersOnly ? ['0', '9'] : [' ', '~'];
            if (!ev.key)
                return false;
            if (ev.key === 'Enter' && this.isValid()) {
                const r = dialog.fireAction(this.action, this);
                if (r)
                    return r.then(() => true);
                return true;
            }
            if (ev.key == 'Delete' || ev.key == 'Backspace') {
                if (this.text.length) {
                    this.text = GWU__namespace.text.spliceRaw(this.text, this.text.length - 1, 1);
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
                if (this.text.length < this.bounds.width) {
                    this.text += ev.key;
                }
            }
            return true;
        }
        draw(buffer) {
            const x = this.bounds.x;
            const y = this.bounds.y;
            const fg = this.active
                ? this.activeFg
                : this.hovered
                    ? this.hoverFg
                    : this.fg;
            const bg = this.active
                ? this.activeBg
                : this.hovered
                    ? this.hoverBg
                    : this.bg;
            buffer.fillRect(x, y, this.bounds.width, 1, ' ', fg, bg);
            if (!this.text.length && this.hint && this.hint.length) {
                buffer.drawText(x, y, this.hint, this.hintFg);
            }
            else {
                const color = this.isValid() ? fg : this.errorFg;
                buffer.drawText(x, y, this.text, color);
            }
        }
    }

    class Column {
        constructor(opts) {
            this.active = false;
            this.hovered = false;
            this.fg = null;
            this.bg = null;
            this.activeFg = null;
            this.activeBg = null;
            this.hoverFg = null;
            this.hoverBg = null;
            this.align = 'left';
            this.header = '';
            this.empty = '';
            this._value = GWU__namespace.IDENTITY;
            // align: Widget.Align = 'left';
            // valign: Widget.VAlign = 'middle';
            // hover: HoverType = 'cell';
            this.x = -1;
            this.width = -1;
            this.index = -1;
            GWU__namespace.object.assignOmitting('value', this, opts);
            if (this.width <= 0) {
                this.width = this.header.length || 1;
            }
            if (typeof opts.value === 'string') {
                this._value = GWU__namespace.text.compile(opts.value);
            }
            else {
                this._value = opts.value || GWU__namespace.IDENTITY;
            }
            if (opts.align)
                this.align = opts.align;
        }
        value(data, index) {
            const v = this._value(data, index);
            return GWU__namespace.text.truncate(v, this.width);
        }
    }
    class Table extends Widget {
        constructor(id, opts) {
            super(id, opts);
            this.data = null;
            this.selectedColumn = null;
            this.selectedIndex = -1;
        }
        init(opts) {
            if (!opts.height)
                throw new Error('Height is required.');
            if (!opts.columns || opts.columns.length == 0)
                throw new Error('Must have at least 1 column.');
            opts.tabStop = GWU__namespace.first(opts.tabStop, true);
            super.init(opts);
            this.headers = GWU__namespace.first(opts.headers, true);
            this.letters = GWU__namespace.first(opts.letters, true);
            this.columns = [];
            this.hoverType = opts.hover || 'row';
            this.wrapColumns = GWU__namespace.first(opts.wrapColumns, opts.wrap, true);
            this.wrapRows = GWU__namespace.first(opts.wrapRows, opts.wrap, true);
            this.headerFg = opts.headerFg || this.fg;
            this.headerBg = opts.headerBg || this.bg;
            let columnWidth = 0;
            if (opts.letters) {
                this.columns.push(new Column({
                    width: 2,
                    value: (_data, index) => {
                        const letter = String.fromCharCode(97 + index);
                        return letter + ')';
                    },
                }));
                columnWidth += 2;
            }
            if (opts.columns) {
                opts.columns.forEach((c) => {
                    const col = new Column(c);
                    this.columns.push(col);
                    columnWidth += col.width;
                });
            }
            this.columns.forEach((c, i) => (c.index = i));
            // scrolling?  paging?  fixed columns/headers?
            this.bounds.width =
                this.bounds.width > 0 ? this.bounds.width : columnWidth;
        }
        setData(data) {
            this.data = data;
            this.selectedIndex = -1;
        }
        selectRow(index) {
            if (!this.data)
                return false;
            const len = Array.isArray(this.data)
                ? this.data.length
                : GWU__namespace.list.length(this.data);
            if (index >= len)
                return false;
            if (index < -1)
                return false;
            this.selectedIndex = index;
            return true;
        }
        selectNextRow(wrap = true) {
            if (!this.data)
                return -1;
            const len = Array.isArray(this.data)
                ? this.data.length
                : GWU__namespace.list.length(this.data);
            this.selectedIndex = GWU__namespace.nextIndex(this.selectedIndex, len, wrap);
            if (this.selectedIndex > -1 && !this.selectedColumn) {
                this.selectedColumn = this.columns[0];
            }
            return this.selectedIndex;
        }
        selectPrevRow(wrap = true) {
            if (!this.data)
                return -1;
            const len = Array.isArray(this.data)
                ? this.data.length
                : GWU__namespace.list.length(this.data);
            this.selectedIndex = GWU__namespace.prevIndex(this.selectedIndex, len, wrap);
            if (this.selectedIndex > -1 && !this.selectedColumn) {
                this.selectedColumn = this.columns[0];
            }
            return this.selectedIndex;
        }
        selectNextColumn(wrap = true) {
            if (!this.selectedColumn) {
                this.selectedColumn = this.columns[0];
            }
            else {
                let index = GWU__namespace.nextIndex(this.selectedColumn.index, this.columns.length, wrap);
                this.selectedColumn = this.columns[index] || null;
            }
            if (this.selectedColumn && this.selectedIndex < 0 && this.data) {
                this.selectedIndex = 0;
            }
            return this.selectedColumn;
        }
        selectPrevColumn(wrap = true) {
            if (!this.selectedColumn) {
                this.selectedColumn = this.columns[this.columns.length - 1]; // last column
            }
            else {
                let index = GWU__namespace.prevIndex(this.selectedColumn.index, this.columns.length, wrap);
                this.selectedColumn = this.columns[index] || null;
            }
            if (this.selectedColumn && this.selectedIndex < 0 && this.data) {
                this.selectedIndex = 0;
            }
            return this.selectedColumn;
        }
        get selectedData() {
            if (!this.data)
                return null;
            if (Array.isArray(this.data)) {
                return this.data[this.selectedIndex] || null;
            }
            else {
                return GWU__namespace.list.at(this.data, this.selectedIndex);
            }
        }
        draw(buffer) {
            const b = this.bounds;
            buffer.fillRect(b.x, b.y, b.width, b.height, ' ', this.bg, this.bg);
            let x = b.x;
            this.columns.forEach((col) => {
                this.drawColumn(buffer, col, x);
                x += col.width;
            });
        }
        drawColumn(buffer, column, x) {
            let y = this.bounds.y;
            if (column.header) {
                buffer.fillRect(x, y, column.width, 1, ' ', this.headerFg, this.headerBg);
                buffer.drawText(x, y, column.header, this.headerFg, this.headerBg, column.width, column.align);
                ++y;
            }
            if (!this.data)
                return;
            if (Array.isArray(this.data)) {
                this.data.forEach((item, index) => {
                    this.drawCell(buffer, column, item, index, x, y);
                    ++y;
                });
            }
            else {
                GWU__namespace.list.forEach(this.data, (item, index) => {
                    this.drawCell(buffer, column, item, index, x, y);
                    ++y;
                });
            }
        }
        drawCell(buffer, column, data, index, x, y) {
            if (y > this.bounds.bottom)
                return;
            let text = column._value(data, index);
            if (text.length == 0) {
                text = column.empty;
            }
            // pick color...
            let fg = this.fg;
            let bg = this.bg;
            if (this.hoverType === 'row') {
                if (index === this.selectedIndex) {
                    fg = this.hoverFg;
                    bg = this.hoverBg;
                }
            }
            else if (this.hoverType === 'column') {
                if (column === this.selectedColumn) {
                    fg = this.hoverFg;
                    bg = this.hoverBg;
                }
            }
            else if (this.hoverType === 'cell') {
                if (column === this.selectedColumn &&
                    index === this.selectedIndex) {
                    fg = this.hoverFg;
                    bg = this.hoverBg;
                }
            }
            buffer.fillRect(x, y, column.width, 1, ' ', bg, bg);
            buffer.drawText(x, y, text, fg, bg, column.width, column.align);
        }
        async mousemove(e, dialog) {
            if (!super.mousemove(e, dialog)) {
                return false;
            }
            const oldColumn = this.selectedColumn;
            const oldIndex = this.selectedIndex;
            let x = e.x - this.bounds.x;
            const column = (this.selectedColumn =
                this.columns.find((c) => {
                    if (c.width >= x)
                        return true;
                    x -= c.width;
                    return false;
                }) || null);
            let index = -1;
            if (this.data) {
                index = e.y - this.bounds.y - (this.headers ? 1 : 0);
                if (Array.isArray(this.data)) {
                    if (index >= this.data.length)
                        index = -1;
                }
            }
            this.selectedIndex = index;
            if (oldColumn !== column || oldIndex !== index) {
                dialog.fireAction(this.id + '_HOVER', this);
                dialog.requestRedraw();
            }
            return true;
        }
        dir(e) {
            if (!e.dir)
                return false;
            if (e.dir[0] > 0) {
                this.selectNextColumn(this.wrapColumns);
            }
            else if (e.dir[0] < 0) {
                this.selectPrevColumn(this.wrapColumns);
            }
            if (e.dir[1] > 0) {
                this.selectNextRow(this.wrapRows);
            }
            else if (e.dir[1] < 0) {
                this.selectPrevRow(this.wrapRows);
            }
            return true;
        }
    }
    function makeTable(id, opts) {
        return new Table(id, opts);
    }

    class List extends Table {
        constructor(id, opts) {
            super(id, (() => {
                // @ts-ignore
                const tableOpts = opts;
                tableOpts.columns = [opts];
                tableOpts.headers = opts.header ? true : false;
                tableOpts.hover = opts.hover === false ? 'none' : 'row';
                return tableOpts;
            })());
        }
    }

    class Box extends Widget {
        constructor(id, opts) {
            super(id, (() => {
                if (!opts)
                    return opts;
                if (opts.depth === undefined)
                    opts.depth = -10; // hide behind other widgets
                if (opts.title)
                    opts.text = opts.title;
                opts.bg = opts.bg || 'gray';
                return opts;
            })());
        }
        init(opts) {
            super.init(opts);
            this.borderBg = opts.borderBg || null;
        }
        // EVENTS
        // box is completely idle
        mousemove(_e, _dialog) {
            return false;
        }
        // DRAW
        draw(buffer) {
            const fg = this.active
                ? this.activeFg
                : this.hovered
                    ? this.hoverFg
                    : this.fg;
            const bg = this.active
                ? this.activeBg
                : this.hovered
                    ? this.hoverBg
                    : this.bg;
            // Draw dialog
            if (this.borderBg) {
                buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this.borderBg, this.borderBg);
                buffer.fillRect(this.bounds.x + 1, this.bounds.y + 1, this.bounds.width - 2, this.bounds.height - 2, ' ', bg, bg);
            }
            else {
                buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', bg, bg);
            }
            if (this.text) {
                buffer.drawText(this.bounds.x, this.bounds.y, this.text, fg, -1, this.bounds.width, 'center');
            }
        }
    }

    class Dialog {
        constructor(ui, id) {
            // bounds: GWU.xy.Bounds;
            this.widgets = [];
            this.eventHandlers = {};
            this._activeWidget = null;
            this.result = null;
            this.done = false;
            this.timers = {};
            this.needsRedraw = true;
            this.ui = ui;
            this.id = id || 'DIALOG';
            // this.bounds = new GWU.xy.Bounds(-1, -1, 0, 0);
            // if (opts) this.init(opts);
        }
        init() {
            // if (opts.id) this.id = opts.id;
            // if (opts.x !== undefined) this.bounds.x = opts.x;
            // if (opts.y !== undefined) this.bounds.y = opts.y;
            // if (opts.height !== undefined) this.bounds.height = opts.height;
            // if (opts.width !== undefined) this.bounds.width = opts.width;
            // if (opts.box) {
            //     let boxOpts: Box.BoxOptions = {
            //         fg: 'white',
            //         bg: 'gray',
            //         borderBg: 'dark_gray',
            //         width: this.bounds.width,
            //         height: this.bounds.height,
            //         x: this.bounds.x,
            //         y: this.bounds.y,
            //     };
            //     if (opts.box !== true) {
            //         Object.assign(boxOpts, opts.box);
            //     }
            //     const box = new Box.Box(this.id + '_BOX', boxOpts);
            //     this.widgets.push(box);
            // }
            // if (opts.widgets) {
            //     opts.widgets.forEach((w) => this.widgets.push(w));
            // }
            this.widgets.sort((a, b) => (a.depth < b.depth ? -1 : 1));
        }
        get activeWidget() {
            return this._activeWidget;
        }
        setActiveWidget(w, reverse = false) {
            if (w === this._activeWidget)
                return;
            if (this._activeWidget) {
                this._activeWidget.deactivate();
            }
            this._activeWidget = w;
            if (this._activeWidget) {
                this._activeWidget.activate(reverse);
            }
        }
        // contains(e: GWU.xy.XY): boolean {
        //     return this.bounds.contains(e);
        // }
        requestRedraw() {
            this.needsRedraw = true;
        }
        setTimeout(action, time) {
            this.timers[action] = time;
        }
        clearTimeout(action) {
            delete this.timers[action];
        }
        async fireAction(action, widget) {
            const handler = this.eventHandlers[action];
            if (handler) {
                await handler(action, this, widget);
            }
        }
        // Multiple calls result in adding more handlers
        setEventHandlers(map) {
            Object.assign(this.eventHandlers, map);
        }
        async show() {
            this.done = false;
            // reset any temp data...
            this.widgets.forEach((w) => w.reset());
            // first tabStop is the starting active Widget
            this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
            // start dialog
            const buffer = this.ui.startLayer();
            // run input loop
            await this.ui.loop.run({
                keypress: this.keypress.bind(this),
                dir: this.dir.bind(this),
                mousemove: this.mousemove.bind(this),
                click: this.click.bind(this),
                tick: this.tick.bind(this),
                draw: () => {
                    this.draw(buffer);
                    buffer.render();
                },
            }, 100);
            // stop dialog
            this.ui.finishLayer();
            return this.result;
        }
        close(returnValue) {
            this.result = returnValue;
            this.done = true;
        }
        widgetAt(x, y) {
            return (this.widgets.find((w) => w.contains(x, y) && w.depth >= 0) || null);
        }
        getWidget(id) {
            return this.widgets.find((w) => w.id === id) || null;
        }
        nextTabstop() {
            if (!this.activeWidget) {
                this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
                return !!this.activeWidget;
            }
            const next = GWU__namespace.arrayNext(this.widgets, this.activeWidget, (w) => w.tabStop);
            if (next) {
                this.setActiveWidget(next);
                return true;
            }
            return false;
        }
        prevTabstop() {
            if (!this.activeWidget) {
                this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
                return !!this.activeWidget;
            }
            const prev = GWU__namespace.arrayPrev(this.widgets, this.activeWidget, (w) => w.tabStop);
            if (prev) {
                this.setActiveWidget(prev, true);
                return true;
            }
            return false;
        }
        async tick(e) {
            const dt = e.dt;
            let promises = [];
            Object.entries(this.timers).forEach(([action, time]) => {
                time -= dt;
                if (time <= 0) {
                    delete this.timers[action];
                    promises.push(this.fireAction(action, null));
                }
                else {
                    this.timers[action] = time;
                }
            });
            for (let w of this.widgets) {
                promises.push(w.tick(e, this));
            }
            if (promises.length) {
                return Promise.all(promises).then(() => this.done);
            }
            return this.done;
        }
        // TODO - async - to allow animations or events on mouseover?
        async mousemove(e) {
            // this.setActiveWidget(null);
            await Promise.all(this.widgets.map(async (w) => {
                await w.mousemove(e, this);
                if (w.hovered && w.tabStop) {
                    this.setActiveWidget(w);
                }
            }));
            return this.done;
        }
        async click(e) {
            // this.mousemove(e); // make sure activeWidget is set correctly
            // if (!this.contains(e)) {
            //     return false;
            // }
            const widget = this.widgetAt(e.x, e.y);
            let fn = null;
            if (widget) {
                if (await widget.click(e, this)) {
                    return this.done;
                }
                fn = this.eventHandlers[widget.id];
            }
            fn = fn || this.eventHandlers[this.id] || this.eventHandlers.click;
            if (fn) {
                await fn(e, this, this.activeWidget);
            }
            return this.done;
        }
        async keypress(e) {
            if (!e.key)
                return false;
            if (this.activeWidget) {
                if (await this.activeWidget.keypress(e, this)) {
                    return this.done;
                }
            }
            const fn = this.eventHandlers[e.key] ||
                this.eventHandlers[e.code] ||
                this.eventHandlers.keypress;
            if (fn) {
                if (await fn(e, this, this.activeWidget)) {
                    return this.done;
                }
            }
            if (e.key === 'Tab') {
                // Next widget
                this.nextTabstop();
                return false; // not done
            }
            else if (e.key === 'TAB') {
                // Prev Widget
                this.prevTabstop();
                return false; // not done
            }
            return this.done;
        }
        async dir(e) {
            if (this.activeWidget) {
                if (await this.activeWidget.dir(e, this)) {
                    return this.done;
                }
            }
            const fn = this.eventHandlers.dir || this.eventHandlers.keypress;
            if (fn) {
                await fn(e, this, this.activeWidget);
            }
            return this.done;
        }
        draw(buffer, force = false) {
            if (!this.needsRedraw && !force)
                return;
            this.ui.resetLayerBuffer();
            this.widgets.forEach((w) => w.draw(buffer));
        }
    }
    class DialogBuilder {
        constructor(ui, width, height) {
            this.nextY = 0;
            this.box = null;
            this.nextY = 1;
            this.dialog = new Dialog(ui);
            this.bounds = new GWU__namespace.xy.Bounds(-1, -1, width, height);
        }
        with(widget, at) {
            // widget bounds are set relative to the dialog top left,
            // if we don't get any, help them out
            // TODO - Get rid of x, y
            const bounds = this.bounds;
            if (at) {
                if (at.right !== undefined) {
                    bounds.width = Math.max(bounds.width, widget.bounds.width + at.right);
                    widget.bounds.right = bounds.width - at.right - 1;
                }
                else {
                    widget.bounds.x = at.x || 0;
                    bounds.width = Math.max(bounds.width, widget.bounds.width + widget.bounds.x);
                }
                if (at.bottom !== undefined) {
                    bounds.height = Math.max(bounds.height, widget.bounds.height + at.bottom);
                    widget.bounds.bottom = bounds.height - at.bottom - 1;
                }
                else {
                    widget.bounds.y = at.y || 0;
                    bounds.height = Math.max(bounds.height, widget.bounds.height + widget.bounds.y);
                }
            }
            else {
                bounds.width = Math.max(bounds.width, widget.bounds.right);
                bounds.height = Math.max(bounds.height, widget.bounds.bottom);
            }
            this.dialog.widgets.push(widget);
            this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1);
            return this;
        }
        center() {
            const size = this.dialog.ui.buffer;
            const bounds = this.bounds;
            bounds.x = Math.floor((size.width - bounds.width) / 2);
            bounds.y = Math.floor((size.height - bounds.height) / 2);
            return this;
        }
        place(x, y) {
            const bounds = this.bounds;
            bounds.x = x;
            bounds.y = y;
            return this;
        }
        addBox(opts) {
            this.box = opts || {};
            return this;
        }
        done() {
            if (this.bounds.x < 0)
                this.bounds.x = 0;
            if (this.bounds.y < 0)
                this.bounds.y = 0;
            if (this.bounds.right > this.dialog.ui.buffer.width)
                throw new Error('Dialog is off screen!');
            if (this.bounds.bottom > this.dialog.ui.buffer.height)
                throw new Error('Dialog is off screen!');
            if (this.box) {
                const padX = this.box.padX || this.box.pad || 1;
                const padY = this.box.padY || this.box.pad || 1;
                this.box.x = 0;
                this.box.y = 0;
                this.box.width = this.bounds.width + 2 * padX;
                this.box.height = this.bounds.height + 2 * padY;
                const widget = new Box(this.dialog.id + '_BOX', this.box);
                this.dialog.widgets.forEach((w) => {
                    w.bounds.x += padX;
                    w.bounds.y += padY;
                });
                this.dialog.widgets.unshift(widget);
            }
            // lock in locations
            this.dialog.widgets.forEach((w) => {
                w.bounds.x += this.bounds.x;
                w.bounds.y += this.bounds.y;
            });
            return this.dialog;
        }
    }
    function buildDialog(ui, width = 0, height = 0) {
        return new DialogBuilder(ui, width, height);
    }

    class UI {
        constructor(opts = {}) {
            this.layers = [];
            this.freeBuffers = [];
            this.inDialog = false;
            if (!opts.canvas)
                throw new Error('Need a canvas.');
            this.canvas = opts.canvas;
            this.buffer = opts.canvas.buffer;
            this.loop = opts.loop || GWU__namespace.loop;
        }
        render() {
            this.buffer.render();
        }
        get baseBuffer() {
            return this.layers[this.layers.length - 1] || this.canvas.buffer;
        }
        get canvasBuffer() {
            return this.canvas.buffer;
        }
        startLayer() {
            this.inDialog = true;
            const base = this.buffer || this.canvas.buffer;
            this.layers.push(base);
            this.buffer = this.freeBuffers.pop() || this.canvas.buffer.clone();
            // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
            this.buffer.copy(base);
            this.buffer.changed = false;
            return this.buffer;
        }
        resetLayerBuffer() {
            const base = this.baseBuffer;
            this.buffer.copy(base);
            this.buffer.changed = false; // So you have to draw something to make the canvas render...
        }
        finishLayer() {
            if (!this.inDialog)
                return;
            if (this.buffer !== this.canvas.buffer) {
                this.freeBuffers.push(this.buffer);
            }
            this.buffer = this.layers.pop() || this.canvas.buffer;
            this.buffer.changed = true;
            this.buffer.render();
            this.inDialog = this.layers.length > 0;
        }
        // UTILITY FUNCTIONS
        async fadeTo(color = 'black', duration = 1000) {
            color = GWU__namespace.color.from(color);
            const buffer = this.startLayer();
            let pct = 0;
            let elapsed = 0;
            while (elapsed < duration) {
                elapsed += 32;
                if (await this.loop.pause(32)) {
                    elapsed = duration;
                }
                pct = Math.floor((100 * elapsed) / duration);
                this.resetLayerBuffer();
                buffer.mix(color, pct);
                buffer.render();
            }
            this.finishLayer();
        }
        async alert(opts, text, args) {
            if (typeof opts === 'number') {
                opts = { duration: opts };
            }
            if (args) {
                text = GWU__namespace.text.apply(text, args);
            }
            const width = opts.width || GWU__namespace.text.length(text);
            opts.box = opts.box || { bg: opts.bg };
            // opts.box.bg = opts.box.bg || 'gray';
            const textOpts = {
                fg: opts.fg,
                text,
                x: 0,
                y: 0,
                wrap: width,
            };
            const textWidget = new Text('TEXT', textOpts);
            const height = textWidget.bounds.height;
            const dlg = buildDialog(this, width, height)
                .with(textWidget, { x: 0, y: 0 })
                .addBox(opts.box)
                .center()
                .done();
            dlg.setEventHandlers({
                click: () => dlg.close(true),
                keypress: () => dlg.close(true),
                TIMEOUT: () => dlg.close(false),
            });
            if (!opts.waitForAck) {
                dlg.setTimeout('TIMEOUT', opts.duration || 3000);
            }
            return await dlg.show();
        }
        async confirm(...args) {
            let opts;
            let text;
            let textArgs = null;
            if (args.length <= 2 && typeof args[0] === 'string') {
                opts = {};
                text = args[0];
                textArgs = args[1] || null;
            }
            else {
                opts = args[0];
                text = args[1];
                textArgs = args[2] || null;
            }
            if (textArgs) {
                text = GWU__namespace.text.apply(text, textArgs);
            }
            const width = opts.width ||
                Math.min(Math.floor(this.buffer.width / 2), GWU__namespace.text.length(text));
            const textOpts = {
                fg: opts.fg,
                text,
                wrap: width,
            };
            const textWidget = new Text('TEXT', textOpts);
            const height = textWidget.bounds.height + 2;
            opts.allowCancel = opts.allowCancel !== false;
            opts.buttons = Object.assign({
                fg: 'white',
                activeFg: 'teal',
                bg: 'dark_gray',
                activeBg: 'darkest_gray',
            }, opts.buttons || {});
            if (typeof opts.ok === 'string') {
                opts.ok = { text: opts.ok };
            }
            if (typeof opts.cancel === 'string') {
                opts.cancel = { text: opts.cancel };
            }
            opts.ok = opts.ok || {};
            opts.cancel = opts.cancel || {};
            const okOpts = Object.assign({}, opts.buttons, { text: 'OK' }, opts.ok);
            const cancelOpts = Object.assign({}, opts.buttons, { text: 'CANCEL' }, opts.cancel);
            const builder = buildDialog(this, width, height)
                .with(textWidget, { x: 0, y: 0 })
                .with(new Button('OK', okOpts), { x: 0, bottom: 0 });
            if (opts.allowCancel) {
                builder.with(new Button('CANCEL', cancelOpts), {
                    right: 0,
                    bottom: 0,
                });
            }
            const dlg = builder.center().addBox(opts.box).done();
            dlg.setEventHandlers({
                OK() {
                    dlg.close(true);
                },
                CANCEL() {
                    dlg.close(false);
                },
                Escape() {
                    dlg.close(false);
                },
                Enter() {
                    dlg.close(true);
                },
            });
            return await dlg.show();
        }
        async showWidget(widget, keymap = {}) {
            const center = widget.bounds.x < 0 || widget.bounds.y < 0;
            const place = { x: widget.bounds.x, y: widget.bounds.y };
            const builder = buildDialog(this).with(widget, { x: 0, y: 0 });
            if (center) {
                builder.center();
            }
            else {
                builder.place(place.x, place.y);
            }
            const dlg = builder.done();
            keymap.Escape =
                keymap.Escape ||
                    (() => {
                        dlg.close(false);
                    });
            dlg.setEventHandlers(keymap);
            return await dlg.show();
        }
        // assumes you are in a dialog and give the buffer for that dialog
        async getInputAt(x, y, maxLength, opts = {}) {
            opts.width = maxLength;
            opts.x = x;
            opts.y = y;
            const widget = new Input$1('INPUT', opts);
            return this.showWidget(widget, {
                INPUT(_e, dlg) {
                    dlg.close(widget.text);
                },
                Escape(_e, dlg) {
                    dlg.close('');
                },
            });
        }
        async inputBox(opts, prompt, args) {
            if (args) {
                prompt = GWU__namespace.text.apply(prompt, args);
            }
            const width = opts.width ||
                Math.min(Math.floor(this.buffer.width / 2), GWU__namespace.text.length(prompt));
            const promptOpts = {
                fg: opts.fg,
                text: prompt,
                wrap: width,
            };
            const promptWidget = new Text('TEXT', promptOpts);
            const height = promptWidget.bounds.height +
                2 + // skip + input
                2; // skip + ok/cancel
            opts.allowCancel = opts.allowCancel !== false;
            opts.buttons = Object.assign({
                fg: 'white',
                activeFg: 'teal',
                bg: 'dark_gray',
                activeBg: 'darkest_gray',
            }, opts.buttons || {});
            if (typeof opts.ok === 'string') {
                opts.ok = { text: opts.ok };
            }
            if (typeof opts.cancel === 'string') {
                opts.cancel = { text: opts.cancel };
            }
            opts.ok = opts.ok || {};
            opts.cancel = opts.cancel || {};
            const okOpts = Object.assign({}, opts.buttons, { text: 'OK' }, opts.ok);
            const cancelOpts = Object.assign({}, opts.buttons, { text: 'CANCEL' }, opts.cancel);
            opts.input = opts.input || {};
            opts.input.width = opts.input.width || width;
            opts.input.bg = opts.input.bg || opts.fg;
            opts.input.fg = opts.input.fg || opts.bg;
            const inputWidget = new Input$1('INPUT', opts.input || {});
            const builder = buildDialog(this, width, height)
                .with(promptWidget, { x: 0, y: 0 })
                .with(inputWidget, { bottom: 2, x: 0 })
                .with(new Button('OK', okOpts), { bottom: 0, x: 0 })
                .addBox(opts.box);
            if (opts.allowCancel) {
                builder.with(new Button('CANCEL', cancelOpts), {
                    bottom: 0,
                    right: 0,
                });
            }
            const dlg = builder.center().done();
            dlg.setEventHandlers({
                OK() {
                    dlg.close(inputWidget.text);
                },
                CANCEL() {
                    dlg.close('');
                },
                Escape() {
                    dlg.close('');
                },
                INPUT() {
                    dlg.close(inputWidget.text);
                },
            });
            return await dlg.show();
        }
    }

    class Messages extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            opts.x = opts.x || 0;
            opts.y = opts.y || 0;
            super.init(opts);
            if (!this.bounds.height)
                throw new Error('Must provde a height for messages widget.');
            this.cache = new GWU__namespace.message.MessageCache({
                width: this.bounds.width,
                length: opts.length || 40,
                match: (_x, _y) => {
                    return true;
                },
            });
        }
        click(e, dialog) {
            if (!this.contains(e))
                return false;
            return this.showArchive(dialog).then(() => true);
        }
        draw(buffer) {
            const isOnTop = this.bounds.y < 10;
            // black out the message area
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this.bg, this.bg);
            this.cache.forEach((line, confirmed, i) => {
                if (i >= this.bounds.height)
                    return;
                const localY = isOnTop ? this.bounds.height - i - 1 : i;
                const y = localY + this.bounds.y;
                buffer.drawText(this.bounds.x, y, line, this.fg);
                if (confirmed) {
                    buffer.mix(this.bg, 50, this.bounds.x, y, this.bounds.width, 1);
                }
            });
            return true;
        }
        async showArchive(dialog) {
            let reverse, fadePercent = 0;
            let fastForward;
            const ui = dialog.ui;
            // Count the number of lines in the archive.
            let totalMessageCount = this.cache.length;
            if (totalMessageCount <= this.bounds.height)
                return false;
            const isOnTop = this.bounds.y < 10;
            const dbuf = ui.startLayer();
            const fg = GWU__namespace.color.from(this.fg);
            totalMessageCount = Math.min(totalMessageCount, isOnTop ? dbuf.height - this.bounds.top : this.bounds.bottom);
            // Pull-down/pull-up animation:
            for (reverse = 0; reverse <= 1; reverse++) {
                fastForward = false;
                const dM = reverse ? -1 : 1;
                const startM = reverse ? totalMessageCount : this.bounds.height;
                const endM = reverse
                    ? this.bounds.height + dM + 1
                    : totalMessageCount + dM;
                // console.log(
                //     `setting up draw - startM=${startM}, endM=${endM}, dM=${dM}`
                // );
                for (let currentM = startM; currentM != endM; currentM += dM) {
                    const startY = isOnTop
                        ? this.bounds.y + currentM - 1
                        : this.bounds.bottom - currentM;
                    const endY = isOnTop ? this.bounds.y : this.bounds.bottom;
                    const dy = isOnTop ? -1 : 1;
                    ui.resetLayerBuffer();
                    // console.log(
                    //     `draw archive - count=${i}, startY=${startY}, endY=${endY}, dy=${dy}`
                    // );
                    dbuf.fillRect(this.bounds.x, Math.min(startY, endY), this.bounds.width, currentM, ' ', this.bg, this.bg);
                    this.cache.forEach((line, _confirmed, j) => {
                        const y = startY + j * dy;
                        if (isOnTop) {
                            if (y < endY)
                                return;
                        }
                        else if (y > endY)
                            return;
                        fadePercent = Math.floor((50 * j) / currentM);
                        const fgColor = fg.clone().mix(this.bg, fadePercent);
                        dbuf.drawText(this.bounds.x, y, line, fgColor, this.bg);
                    });
                    dbuf.render();
                    if (!fastForward) {
                        if (await ui.loop.pause(reverse ? 15 : 45)) {
                            fastForward = true;
                            currentM = endM - 2 * dM; // skip to the end-1
                        }
                    }
                }
                if (!reverse) {
                    const y = isOnTop ? 0 : dbuf.height - 1;
                    const x = this.bounds.x > 8
                        ? this.bounds.x - 8 // to left of box
                        : Math.min(this.bounds.x + this.bounds.width, // just to right of box
                        dbuf.width - 8 // But definitely on the screen - overwrite some text if necessary
                        );
                    dbuf.wrapText(x, y, 8, '--DONE--', this.bg, this.fg);
                    dbuf.render();
                    await ui.loop.waitForAck();
                }
            }
            ui.finishLayer();
            this.cache.confirmAll();
            dialog.requestRedraw(); // everything is confirmed
            return true;
        }
    }

    class Viewport extends Widget {
        constructor(id, opts) {
            super(id, opts);
            this.offsetX = 0;
            this.offsetY = 0;
            this._subject = null;
        }
        init(opts) {
            opts.bg = opts.bg || 'black';
            opts.x = opts.x || 0;
            opts.y = opts.y || 0;
            super.init(opts);
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
                this.offsetX = GWU__namespace.clamp(this.offsetX, 0, map.width - this.bounds.width);
            }
            if (this.lockY && map) {
                this.offsetY = GWU__namespace.clamp(this.offsetY, 0, map.height - this.bounds.height);
            }
        }
        draw(buffer) {
            buffer.blackOutRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, this.bg);
            if (!this._subject) {
                return false;
            }
            this.updateOffset();
            const map = this._subject.memory || this._subject.map;
            const fov = this._subject.fov;
            const mixer = new GWU__namespace.sprite.Mixer();
            for (let x = 0; x < this.bounds.width; ++x) {
                for (let y = 0; y < this.bounds.height; ++y) {
                    const mapX = x + this.offsetX;
                    const mapY = y + this.offsetY;
                    if (map.hasXY(mapX, mapY)) {
                        const cell = map.cell(mapX, mapY);
                        map.drawer.drawCell(mixer, cell, fov);
                    }
                    else {
                        mixer.draw(' ', this.bg, this.bg); // blackOut
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

    GWU__namespace.color.install('flavorText', 50, 40, 90);
    GWU__namespace.color.install('flavorPrompt', 100, 90, 20);
    class Flavor extends Text {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            opts.fg = opts.fg || 'flavorText';
            opts.bg = opts.bg || 'black';
            super.init(opts);
            this.promptFg = GWU__namespace.color.from(opts.promptFg || 'flavorPrompt');
            this.overflow = opts.overflow || false;
            this.isPrompt = false;
        }
        showText(text) {
            this.text = GWU__namespace.text.capitalize(text);
            const len = GWU__namespace.text.length(this.text);
            if (len > this.bounds.width) {
                this.lines = GWU__namespace.text.splitIntoLines(this.text, this.bounds.width);
                if (!this.overflow && this.lines.length > this.bounds.height) {
                    if (this.bounds.height == 1) {
                        this.text = GWU__namespace.text.truncate(this.text, this.bounds.width);
                        this.lines = [this.text];
                    }
                    else {
                        this.lines.length = this.bounds.height;
                    }
                }
            }
            else {
                this.lines = [this.text];
            }
            this.isPrompt = false;
        }
        clear() {
            this.text = '';
            this.lines = [''];
            this.isPrompt = false;
        }
        showPrompt(text) {
            this.showText(text);
            this.isPrompt = true;
        }
        draw(buffer) {
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this.bg, this.bg);
            super.draw(buffer);
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
            const standsInTile = cell.hasTileFlag(GWM__namespace.flags.Tile.T_STAND_IN_TILE);
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
            const groundTile = cell.depthTile(GWM__namespace.flags.Depth.GROUND) || GWM__namespace.tile.tiles.NULL;
            const surfaceTile = cell.depthTile(GWM__namespace.flags.Depth.SURFACE);
            const liquidTile = cell.depthTile(GWM__namespace.flags.Depth.LIQUID);
            // const gasTile = cell.depthTile(GWM.flags.Depth.GAS);
            let surface = '';
            if (surfaceTile) {
                const tile = surfaceTile;
                if (needObjectArticle) {
                    needObjectArticle = false;
                    object += ' on ';
                }
                if (tile.hasTileFlag(GWM__namespace.flags.Tile.T_BRIDGE)) {
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
            buf = GWU__namespace.text.apply('§intro§ §text§.', {
                intro,
                text: object + surface + liquid + ground,
            });
            return buf;
        }
    }

    GWU__namespace.color.install('blueBar', 15, 10, 50);
    GWU__namespace.color.install('redBar', 45, 10, 15);
    GWU__namespace.color.install('purpleBar', 50, 0, 50);
    GWU__namespace.color.install('greenBar', 10, 50, 10);
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
        constructor(id, opts) {
            super(id, opts);
            this.cellCache = [];
            this.lastX = -1;
            this.lastY = -1;
            this.lastMap = null;
            this.entries = [];
            this.subject = null;
            this.highlight = null;
        }
        init(opts) {
            opts.fg = opts.fg || 'purple';
            opts.bg = opts.bg || 'black';
            super.init(opts);
        }
        reset() {
            super.reset();
            this.lastMap = null;
            this.lastX = -1;
            this.lastY = -1;
        }
        entryAt(e) {
            return (this.entries.find((entry) => {
                return entry.sidebarY <= e.y && entry.sidebarY !== -1;
            }) || null);
        }
        mousemove(e, dialog) {
            super.mousemove(e, dialog);
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
                !map.hasMapFlag(GWM__namespace.flags.Map.MAP_SIDEBAR_TILES_CHANGED)) {
                return;
            }
            this.lastMap = null; // Force us to regather the entries, even if at same location
            this.cellCache.length = 0;
            GWU__namespace.xy.forRect(map.width, map.height, (x, y) => {
                const info = map.cell(x, y);
                if (info.hasEntityFlag(GWM__namespace.flags.Entity.L_LIST_IN_SIDEBAR)) {
                    this.cellCache.push(info);
                }
            });
            map.clearMapFlag(GWM__namespace.flags.Map.MAP_SIDEBAR_TILES_CHANGED);
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
                return map.cell(x, y).hasCellFlag(GWM__namespace.flags.Cell.STABLE_MEMORY)
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
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, actor.x, actor.y);
            entry.priority = actor.isPlayer() ? 0 : priority;
            this.entries.push(entry);
            return true;
        }
        _addItemEntry(item, map, x, y, fov) {
            const priority = this._getPriority(map, item.x, item.y, fov);
            if (priority < 0)
                return false;
            const entry = this._makeItemEntry(item);
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, item.x, item.y);
            entry.priority = priority;
            this.entries.push(entry);
            return true;
        }
        _addCellEntry(cell, map, x, y, fov) {
            const priority = this._getPriority(map, cell.x, cell.y, fov);
            if (priority < 0)
                return false;
            const entry = this._makeCellEntry(cell);
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, cell.x, cell.y);
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
            const done = GWU__namespace.grid.alloc(map.width, map.height);
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
            GWU__namespace.grid.free(done);
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
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, 0, 0, this.bg);
            // clear the row information
            this.entries.forEach((e) => (e.sidebarY = -1));
            const drawBounds = this.bounds.clone();
            let currentEntry;
            for (let i = 0; i < this.entries.length && drawBounds.height > 0; ++i) {
                currentEntry = this.entries[i];
                currentEntry.sidebarY = drawBounds.y;
                let usedLines = currentEntry.draw(buffer, drawBounds);
                if (this._isDim(currentEntry)) {
                    buffer.mix(this.bg, 50, drawBounds.x, drawBounds.y, drawBounds.width, usedLines);
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

    class MenuButton {
        constructor(text) {
            this.hovered = false;
            this.x = 999;
            this.text = text;
        }
        get width() {
            return this.text.length;
        }
    }
    class ActionButton extends MenuButton {
        constructor(text, action) {
            super(text);
            this.action = action;
        }
    }
    class DropDownButton extends MenuButton {
        constructor(menu, parent, text, buttons) {
            super(text);
            this.buttons = [];
            this.parent = null;
            this.menu = menu;
            this.parent = parent;
            this.text = text;
            this.bounds = new GWU__namespace.xy.Bounds(0, 0, 0, 0);
            Object.entries(buttons).forEach(([text, opts]) => {
                this.addButton(text, opts);
            });
        }
        addButton(text, config) {
            // if (this.buttons.length >= this.menu.bounds.height - 1) {
            //     throw new Error('Too many menu options.');
            // }
            let button;
            if (typeof config === 'string') {
                button = new ActionButton(text, config);
            }
            else {
                button = new DropDownButton(this.menu, this, text, config);
            }
            this.buttons.push(button);
            ++this.bounds.height;
            this.bounds.width = Math.max(this.bounds.width, text.length + 2);
        }
        setBounds(buffer, px, py, pw) {
            // vertical reveal
            const right = px + pw;
            const totalWidth = buffer.width;
            if (this.bounds.width < totalWidth - right) {
                this.bounds.x = right;
            }
            else if (this.bounds.width < px) {
                this.bounds.x = px - this.bounds.width;
            }
            else {
                throw new Error('Menu does not fit - too wide.');
            }
            const totalHeight = buffer.height;
            if (this.bounds.height <= totalHeight - py) {
                this.bounds.y = py;
            }
            else if (this.bounds.height < totalHeight) {
                this.bounds.y = totalHeight - this.bounds.height - 1;
            }
            else {
                throw new Error('Menu does not fit - too tall.');
            }
            // this.buttons.forEach((b) => {
            //     if (b instanceof DropDownButton) {
            //         b.setBounds(buffer);
            //     }
            // });
        }
        contains(e) {
            return this.bounds.contains(e);
        }
        buttonAt(e) {
            const index = e.y - this.bounds.y;
            return this.buttons[index] || null;
        }
        draw(buffer) {
            const width = this.bounds.width;
            const height = this.bounds.height;
            const x = this.bounds.x;
            let y = this.bounds.y;
            buffer.fillRect(x, y, width, height, 0, 0, this.menu.dropBg);
            // Now draw the individual buttons...
            this.buttons.forEach((b) => {
                buffer.drawText(x + 1, y, b.text, b.hovered ? this.menu.activeFg : this.menu.dropFg, b.hovered ? this.menu.activeBg : this.menu.dropBg);
                ++y;
            });
            if (this.parent) {
                this.parent.draw(buffer);
            }
        }
    }
    async function showDropDown(dialog, menu, button) {
        // Start dialog
        const ui = dialog.ui;
        const buffer = ui.startLayer();
        button.buttons.forEach((b) => (b.hovered = false));
        // button.buttons[0].hovered = true;
        let activeButton = button;
        await ui.loop.run({
            Escape() {
                return true;
            },
            // TODO - Tab
            Tab() {
                menu.activeIndex = (menu.activeIndex + 1) % menu.buttons.length;
                const button = menu.buttons[menu.activeIndex];
                if (button) {
                    button.hovered = true;
                }
                if (activeButton && button instanceof DropDownButton) {
                    activeButton.hovered = false;
                    activeButton = button;
                }
                else {
                    activeButton = null; // done.
                }
                dialog.requestRedraw();
                return !activeButton;
            },
            // TODO - TAB
            TAB() {
                menu.activeIndex =
                    (menu.buttons.length + menu.activeIndex - 1) %
                        menu.buttons.length;
                const button = menu.buttons[menu.activeIndex];
                if (button) {
                    button.hovered = true;
                }
                if (activeButton && button instanceof DropDownButton) {
                    activeButton.hovered = false;
                    activeButton = button;
                }
                else {
                    activeButton = null; // done.
                }
                dialog.requestRedraw();
                return !activeButton;
            },
            mousemove: (e) => {
                if (!activeButton)
                    return true; // we are done (should not happen)
                let newActive = activeButton;
                while (newActive && !newActive.contains(e)) {
                    newActive = newActive.parent;
                }
                if (newActive) {
                    activeButton = newActive;
                    const selected = activeButton.buttonAt(e);
                    if (selected) {
                        activeButton.buttons.forEach((b) => {
                            b.hovered = false;
                        });
                        selected.hovered = true;
                        if (selected instanceof DropDownButton) {
                            selected.buttons.forEach((b) => {
                                b.hovered = false;
                            });
                            selected.buttons[0].hovered = true;
                            selected.setBounds(ui.buffer, activeButton.bounds.x, e.y, activeButton.bounds.width);
                            activeButton = selected;
                        }
                    }
                }
                else {
                    if (menu.contains(e)) {
                        if (dialog)
                            dialog.requestRedraw();
                        const button = menu.getButtonAt(e.x, e.y);
                        if (button) {
                            button.hovered = true;
                            menu.activeIndex = menu.buttons.indexOf(button);
                        }
                        if (button instanceof DropDownButton) {
                            activeButton.hovered = false;
                            activeButton = button;
                        }
                        else {
                            activeButton = null; // done.
                        }
                        if (dialog)
                            dialog.requestRedraw();
                    }
                }
                return !activeButton; // if no active button we are done (should not happen)
            },
            click: async (e) => {
                if (!activeButton)
                    return true; // we are done (should not happen)
                if (!activeButton.contains(e)) {
                    menu.clearHighlight();
                    return true; // we are done
                }
                const actionButton = activeButton.buttonAt(e);
                if (!actionButton) {
                    return true; // weird, but we are done.
                }
                if (actionButton instanceof ActionButton) {
                    menu.actionButton = actionButton;
                    await dialog.fireAction(actionButton.action, menu);
                    return true;
                }
                return false;
            },
            dir: async (e) => {
                if (!activeButton)
                    return true; // should not happen
                if (!e.dir)
                    return;
                if (e.dir[1]) {
                    const current = activeButton.buttons.findIndex((b) => b.hovered);
                    if (current < 1 && e.dir[1] < 0) {
                        activeButton.buttons.forEach((b) => (b.hovered = false));
                        return true; // close me!
                    }
                    const index = GWU__namespace.clamp(current + e.dir[1], 0, activeButton.buttons.length - 1);
                    activeButton.buttons.forEach((b, i) => (b.hovered = i === index));
                    const selected = activeButton.buttons[index];
                    if (selected instanceof DropDownButton) {
                        selected.buttons.forEach((b) => {
                            b.hovered = false;
                        });
                        selected.buttons[0].hovered = true;
                        selected.setBounds(ui.buffer, activeButton.bounds.x, e.y, activeButton.bounds.width);
                        activeButton = selected;
                    }
                }
            },
            draw: () => {
                if (!activeButton)
                    return;
                ui.resetLayerBuffer();
                activeButton.draw(buffer);
                menu.draw(buffer);
                buffer.render();
            },
        });
        ui.finishLayer();
        menu.clearHighlight();
    }
    class Menu extends Widget {
        constructor(id, opts) {
            super(id, opts);
            this.activeIndex = -1;
            this.actionButton = null;
        }
        init(opts) {
            opts.fg = GWU__namespace.first(opts.fg, 'black');
            opts.bg = GWU__namespace.first(opts.bg, 'light_gray');
            opts.height = opts.height || 1;
            opts.tabStop = GWU__namespace.first(opts.tabStop, true);
            super.init(opts);
            this.dropFg = GWU__namespace.color.from(opts.dropFg || this.fg);
            this.dropBg = GWU__namespace.color.from(opts.dropBg || this.bg);
            this.buttons = [];
            this.separator = opts.separator || ' | ';
            this.lead = opts.lead || ' ';
            Object.entries(opts.buttons).forEach(([text, opts]) => {
                this._addButton(text, opts);
            });
            if (opts.separator) {
                this.separator = opts.separator;
            }
            if (opts.lead !== undefined) {
                this.lead = opts.lead ? opts.lead : '';
            }
        }
        reset() {
            super.reset();
            const onTop = this.bounds.y <= 10;
            this.buttons.forEach((b) => {
                if (b instanceof DropDownButton) {
                    if (onTop) {
                        b.bounds.top = this.bounds.bottom + 1;
                    }
                    else {
                        b.bounds.bottom = this.bounds.top - 1;
                    }
                }
            });
        }
        activate(reverse = false) {
            super.activate(reverse);
            if (this.activeIndex < 0)
                this.activeIndex = reverse ? this.buttons.length - 1 : 0;
        }
        deactivate() {
            super.deactivate();
            this.activeIndex = -1;
        }
        mousemove(e, dialog) {
            // turn off all the hovers
            this.buttons.forEach((b) => {
                if (b.hovered) {
                    b.hovered = false;
                }
            });
            if (!super.mousemove(e, dialog))
                return false;
            // highlight one of them...
            if (this.bounds.contains(e)) {
                let hovered = null;
                this.buttons.forEach((b) => {
                    b.hovered = false;
                    if (b.x < e.x) {
                        hovered = b;
                    }
                });
                if (hovered) {
                    // @ts-ignore
                    hovered.hovered = true;
                    this.activeIndex = this.buttons.indexOf(hovered);
                }
                if (dialog)
                    dialog.requestRedraw();
                return true; // we handled the message
            }
            return false;
        }
        clearHighlight() {
            this.buttons.forEach((b) => {
                b.hovered = false;
            });
        }
        getButtonAt(x, _y) {
            return GWU__namespace.arrayFindRight(this.buttons, (b) => b.x < x) || null;
        }
        async click(e, dialog) {
            if (this.bounds.contains(e)) {
                // get active button
                let activeButton = this.getButtonAt(e.x, e.y);
                if (!activeButton)
                    return false;
                this.activeIndex = this.buttons.indexOf(activeButton);
                if (activeButton instanceof DropDownButton) {
                    await showDropDown(dialog, this, activeButton);
                }
                else if (activeButton instanceof ActionButton) {
                    this.actionButton = activeButton;
                    await dialog.fireAction(activeButton.action, this);
                }
                return true;
            }
            return false;
        }
        async keypress(e, dialog) {
            if (this.active) {
                if (e.key === 'Tab') {
                    ++this.activeIndex;
                    if (this.activeIndex >= this.buttons.length) {
                        this.deactivate();
                        return false; // tabbing away from me, need to process in dialog
                    }
                    return true;
                }
                else if (e.key === 'TAB') {
                    --this.activeIndex;
                    if (this.activeIndex < 0) {
                        this.deactivate();
                        return false; // shift tabbing away from me, need to process in dialog
                    }
                    return true;
                }
                else if (e.key === 'Enter') {
                    const activeButton = this.buttons[this.activeIndex];
                    if (activeButton instanceof DropDownButton) {
                        await showDropDown(dialog, this, activeButton);
                    }
                    else if (activeButton instanceof ActionButton) {
                        this.actionButton = activeButton;
                        await dialog.fireAction(activeButton.action, this);
                    }
                    return true;
                }
            }
            return super.keypress(e, dialog);
        }
        _addButton(text, config) {
            const x = this.buttons.reduce((len, button) => len + button.text.length + this.separator.length, this.lead.length + this.bounds.x);
            if (x + text.length + this.separator.length > this.bounds.width) {
                throw new Error('Button makes menu too wide :' + text);
            }
            let button;
            if (typeof config === 'string') {
                button = new ActionButton(text, config);
            }
            else {
                const dropdown = new DropDownButton(this, null, text, config);
                dropdown.bounds.x = x - 1; // Hmmm...
                button = dropdown;
            }
            button.x = x;
            this.buttons.push(button);
        }
        draw(buffer) {
            const bg = this.active ? this.activeBg : this.bg;
            const fg = this.active ? this.activeFg : this.fg;
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, 1, 0, bg, bg);
            let x = this.bounds.x;
            const y = this.bounds.y;
            buffer.drawText(x, y, this.lead, fg);
            this.buttons.forEach((b, i) => {
                const hovered = i === this.activeIndex;
                const color = hovered ? this.hoverFg : fg;
                const bgColor = hovered ? this.hoverBg : bg;
                buffer.drawText(b.x, y, b.text, color, bgColor);
                x = b.x + b.text.length;
                buffer.drawText(x, y, this.separator, fg);
            });
            return true;
        }
    }

    class Callbacks {
        constructor(flags) {
            this._items = [];
            this._disabled = false;
            this._fired = false;
            this._once = false;
            // _memory = false;
            this._stopOnFalse = false;
            this._unique = false;
            const f = flags.split(' ');
            this._once = f.includes('once');
            // this._memory = f.includes('memory');
            this._stopOnFalse = f.includes('stopOnFalse');
            this._unique = f.includes('unique');
        }
        add(cb) {
            if (Array.isArray(cb)) {
                cb.forEach((c) => this.add(c));
            }
            else {
                if (!this._unique || !this._items.includes(cb)) {
                    this._items.push(cb);
                }
            }
            return this;
        }
        disable() {
            this._disabled = true;
            return this;
        }
        disabled() {
            return !this._disabled;
        }
        empty() {
            this._items.length = 0;
            return this;
        }
        async fire(...args) {
            if (this._disabled)
                return this;
            if (this._once && this._fired)
                return this;
            this._fired = true;
            for (let cb of this._items) {
                const r = await cb(...args);
                if (this._stopOnFalse && r === false) {
                    break;
                }
            }
            return this;
        }
        fired() {
            return this._fired;
        }
        async fireWith(obj, args) {
            if (this._disabled)
                return this;
            if (this._once && this._fired)
                return this;
            this._fired = true;
            for (let cb of this._items) {
                const r = await cb.apply(obj, args);
                if (this._stopOnFalse && r === false) {
                    break;
                }
            }
            return this;
        }
        has(cb) {
            return this._items.includes(cb);
        }
        // lock - I am not sure what this does or why it is there
        // locked
        remove(cb) {
            const index = this._items.indexOf(cb);
            if (index >= 0) {
                this._items.splice(index, 1);
            }
            return this;
        }
    }

    function isTruthy(v) {
        if (!v)
            return false;
        if (typeof v === 'string') {
            if (v === 'false' || v === '0')
                return false;
        }
        return true;
    }
    function matchTag(tag) {
        return (el) => el.tag === tag;
    }
    function matchClass(cls) {
        return (el) => el.classes.includes(cls);
    }
    function matchProp(prop) {
        if (prop.startsWith('first')) {
            return matchFirst();
        }
        else if (prop.startsWith('last')) {
            return matchLast();
        }
        return (el) => !!el.prop(prop);
    }
    function matchId(id) {
        return (el) => el.attr('id') === id;
    }
    function matchFirst() {
        return (el) => !!el.parent && el.parent.children[0] === el;
    }
    function matchLast() {
        return (el) => !!el.parent && el.parent.children[el.parent.children.length - 1] === el;
    }
    function matchNot(fn) {
        return (el) => !fn(el);
    }
    class Selector {
        constructor(text) {
            this.priority = 0;
            this.match = [];
            if (text.startsWith(':') || text.startsWith('.')) {
                text = '*' + text;
            }
            this.text = text;
            let nextIndex = 0;
            if (text.startsWith('*')) {
                // global
                nextIndex = 1;
            }
            else if (text.startsWith('#')) {
                // id
                this.priority += 1000;
                const match = text.match(/#([^\.:]+)/);
                if (!match)
                    throw new Error('Invalid selector - Failed to match ID: ' + text);
                nextIndex = match[0].length;
                // console.log('match ID - ', match[1], match);
                this.match.push(matchId(match[1]));
            }
            else if (text.startsWith('$')) {
                // self
                this.priority += 10000;
                nextIndex = 1;
            }
            else {
                // tag
                this.priority += 10;
                const match = text.match(/([^\.:]+)/);
                if (!match)
                    throw new Error('Invalid selector - Failed to match tag: ' + text);
                nextIndex = match[0].length;
                // console.log('match Tag - ', match[1], match);
                this.match.push(matchTag(match[1]));
            }
            // console.log(nextIndex);
            const filterExp = new RegExp(/(?:\.([^\.:]+))|(?::(?:(?:not\(\.([^\)]+)\))|(?:not\(:([^\)]+)\))|([^\.:]+)))/g);
            // const propExp = new RegExp(/:([^:]+)/g);
            filterExp.lastIndex = nextIndex;
            let match = filterExp.exec(text);
            while (match) {
                // console.log(match);
                let fn;
                if (match[1]) {
                    this.priority += 100;
                    fn = matchClass(match[1]);
                }
                else if (match[2]) {
                    this.priority += 100; // class
                    fn = matchNot(matchClass(match[2]));
                }
                else if (match[3]) {
                    this.priority += 1; // prop
                    fn = matchNot(matchProp(match[3]));
                }
                else {
                    this.priority += 1; // prop
                    fn = matchProp(match[4]);
                }
                this.match.push(fn);
                match = filterExp.exec(text);
            }
        }
        matches(obj) {
            return this.match.every((fn) => fn(obj));
            // if (this.tag.length && obj.tag !== this.tag) return false;
            // if (this.id.length && obj.id !== this.id) return false;
            // if (this.class.length && !obj.classes.includes(this.class))
            //     return false;
            // if (this.prop.length) {
            //     const v = obj.prop(this.prop) || false;
            //     if (!isTruthy(v)) return false;
            // }
            // return true;
        }
    }
    function selector(text) {
        return new Selector(text);
    }

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
        get border() {
            return this._border;
        }
        // get depth(): number | undefined {
        //     return this._depth;
        // }
        get align() {
            return this._align;
        }
        get valign() {
            return this._valign;
        }
        get position() {
            return this._position;
        }
        get minWidth() {
            return this._minWidth;
        }
        get maxWidth() {
            return this._maxWidth;
        }
        get width() {
            return this._width;
        }
        get minHeight() {
            return this._minHeight;
        }
        get maxHeight() {
            return this._maxHeight;
        }
        get height() {
            return this._height;
        }
        get x() {
            return this._x;
        }
        get left() {
            return this._left;
        }
        get right() {
            return this._right;
        }
        get y() {
            return this._y;
        }
        get top() {
            return this._top;
        }
        get bottom() {
            return this._bottom;
        }
        get padLeft() {
            return this._padLeft;
        }
        get padRight() {
            return this._padRight;
        }
        get padTop() {
            return this._padTop;
        }
        get padBottom() {
            return this._padBottom;
        }
        get marginLeft() {
            return this._marginLeft;
        }
        get marginRight() {
            return this._marginRight;
        }
        get marginTop() {
            return this._marginTop;
        }
        get marginBottom() {
            return this._marginBottom;
        }
        get(key) {
            const id = ('_' + key);
            return this[id];
        }
        set(key, value, setDirty = true) {
            if (typeof key === 'string') {
                if (key === 'padding') {
                    if (typeof value === 'number') {
                        value = [value];
                    }
                    else if (typeof value === 'string') {
                        value = value.split(' ').map((v) => Number.parseInt(v));
                    }
                    if (value.length == 1) {
                        this._padLeft =
                            this._padRight =
                                this._padTop =
                                    this._padBottom =
                                        value[0];
                    }
                    else if (value.length == 2) {
                        this._padLeft = this._padRight = value[1];
                        this._padTop = this._padBottom = value[0];
                    }
                    else if (value.length == 3) {
                        this._padTop = value[0];
                        this._padRight = value[1];
                        this._padBottom = value[2];
                        this._padLeft = value[1];
                    }
                    else if (value.length == 4) {
                        this._padTop = value[0];
                        this._padRight = value[1];
                        this._padBottom = value[2];
                        this._padLeft = value[3];
                    }
                }
                else if (key === 'margin') {
                    if (typeof value === 'number') {
                        value = [value];
                    }
                    else if (typeof value === 'string') {
                        value = value.split(' ').map((v) => Number.parseInt(v));
                    }
                    if (value.length == 1) {
                        this._marginLeft =
                            this._marginRight =
                                this._marginTop =
                                    this._marginBottom =
                                        value[0];
                    }
                    else if (value.length == 2) {
                        this._marginLeft = this._marginRight = value[1];
                        this._marginTop = this._marginBottom = value[0];
                    }
                    else if (value.length == 3) {
                        this._marginTop = value[0];
                        this._marginRight = value[1];
                        this._marginBottom = value[2];
                        this._marginLeft = value[1];
                    }
                    else if (value.length == 4) {
                        this._marginTop = value[0];
                        this._marginRight = value[1];
                        this._marginBottom = value[2];
                        this._marginLeft = value[3];
                    }
                }
                else {
                    const field = '_' + key;
                    this[field] = value;
                }
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
            if (parentSheet) {
                this.rules = parentSheet.rules.slice();
            }
            else {
                this.rules.push(new Style('*', {
                    fg: 'white',
                    bg: 'black',
                    align: 'left',
                    valign: 'top',
                    position: 'static',
                }));
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
                const parts = selector
                    .split(',')
                    .map((p) => p.trim())
                    .map((p) => this.add(p, props));
                return parts[parts.length - 1];
            }
            if (selector.includes(' '))
                throw new Error('Hierarchical selectors not supported.');
            // if 2 '.' - Error('Only single class rules supported.')
            // if '&' - Error('Not supported.')
            if (selector === '*')
                throw new Error('Cannot re-install global style.');
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
            return rule;
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

    class Element {
        // hovered: Style.Style = {};
        // active: Style.Style = {};
        constructor(tag, styles) {
            this.parent = null;
            this._props = {};
            this._attrs = {};
            this.classes = [];
            this.children = [];
            this.events = {};
            this._bounds = new GWU__namespace.xy.Bounds(0, 0, 0, 0);
            this._text = '';
            this._lines = [];
            this._dirty = false;
            this._attached = false;
            this._style = null;
            this.tag = tag;
            this._usedStyle = styles
                ? styles.computeFor(this)
                : new ComputedStyle();
        }
        contains(x, y) {
            if (typeof x === 'number')
                return this._bounds.contains(x, y);
            return this._bounds.contains(x);
        }
        clone() {
            if (this._attached && !this.parent)
                throw new Error('Cannot clone a root widget.');
            const other = new this.constructor(this.tag);
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
        get dirty() {
            return this._dirty || this._usedStyle.dirty;
        }
        set dirty(v) {
            this._dirty = v;
            if (this.parent && v) {
                const position = this.used('position');
                if (position === 'static' || position === 'relative') {
                    this.parent.dirty = true;
                }
            }
        }
        attr(name, value) {
            if (value === undefined)
                return this._attrs[name];
            this._setAttr(name, value);
            return this;
        }
        _setAttr(name, value) {
            this._attrs[name] = value;
        }
        prop(name, value) {
            if (value === undefined)
                return this._props[name];
            this._setProp(name, value);
            this._usedStyle.dirty = true; // Need to reload styles
            return this;
        }
        _setProp(name, value) {
            this._props[name] = value;
        }
        toggleProp(name) {
            const v = this._props[name] || false;
            this._props[name] = !v;
            this._usedStyle.dirty = true; // Need to reload styles
            return this;
        }
        val(v) {
            if (v === undefined)
                return this.prop('value');
            this._setProp('value', v);
            return this;
        }
        onblur() {
            this.prop('focus', false);
        }
        onfocus(_reverse) {
            this.prop('focus', true);
        }
        // CHILDREN
        addChild(child, beforeIndex = -1) {
            if (child.parent) {
                if (child.parent === this)
                    return this; // ok
                throw new Error('Cannot add a currently attached child to another element.  Detach it first.');
            }
            if (beforeIndex == 0) {
                this.children.unshift(child);
            }
            else if (beforeIndex > 0 && beforeIndex <= this.children.length - 1) {
                this.children.splice(beforeIndex, 0, child);
            }
            else {
                this.children.push(child);
            }
            child.parent = this;
            child.dirty = true;
            this.dirty = true;
            return this;
        }
        removeChild(child) {
            if (!child.parent)
                return this; // not attached, silently ignore
            if (child.parent !== this) {
                throw new Error('Cannot remove child that is not attached to this widget.');
            }
            if (GWU__namespace.arrayDelete(this.children, child)) {
                child.parent = null;
                child.dirty = true;
                this.dirty = true;
            }
            return this;
        }
        empty() {
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
        root() {
            let current = this;
            while (current.parent) {
                current = current.parent;
            }
            return current !== this ? current : null;
        }
        positionedParent() {
            const position = this._usedStyle.position || 'static';
            if (position === 'static')
                return null;
            if (position === 'relative')
                return this;
            if (position === 'fixed')
                return this.root();
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
        get bounds() {
            // this._update();
            return this._bounds;
        }
        get innerLeft() {
            return (this._bounds.left +
                (this._usedStyle.padLeft || 0) +
                (this._usedStyle.marginLeft || 0) +
                (this._usedStyle.border ? 1 : 0));
        }
        get innerRight() {
            return (this._bounds.right -
                (this._usedStyle.padRight || 0) -
                (this._usedStyle.marginRight || 0) -
                (this._usedStyle.border ? 1 : 0));
        }
        get innerWidth() {
            return Math.max(0, this._bounds.width -
                (this._usedStyle.padLeft || 0) -
                (this._usedStyle.padRight || 0) -
                (this._usedStyle.marginLeft || 0) -
                (this._usedStyle.marginRight || 0) -
                (this._usedStyle.border ? 2 : 0));
        }
        get innerHeight() {
            return Math.max(0, this._bounds.height -
                (this._usedStyle.padTop || 0) -
                (this._usedStyle.padBottom || 0) -
                (this._usedStyle.marginTop || 0) -
                (this._usedStyle.marginBottom || 0) -
                (this._usedStyle.border ? 2 : 0));
        }
        get innerTop() {
            return (this._bounds.top +
                (this._usedStyle.padTop || 0) +
                (this._usedStyle.marginTop || 0) +
                (this._usedStyle.border ? 1 : 0));
        }
        get innerBottom() {
            return (this._bounds.bottom -
                (this._usedStyle.padBottom || 0) -
                (this._usedStyle.marginBottom || 0) -
                (this._usedStyle.border ? 1 : 0));
        }
        updateLayout() {
            // if (!this.dirty) {
            //     this.children.forEach((c) => c.updateLayout());
            //     return this;
            // }
            this._updateWidth();
            this._updateHeight();
            this._updateLeft();
            this._updateTop();
            this.dirty = false;
            this.children.forEach((c) => (c.dirty = false));
            // const position = this._usedStyle.position || 'static';
            // if (position === 'fixed') {
            //     this._updateLayoutFixed();
            // } else if (position === 'relative') {
            //     this._updateLayoutRelative();
            // } else if (position === 'absolute') {
            //     this._updateLayoutAbsolute();
            // } else {
            //     this._updateLayoutStatic();
            // }
            return this;
        }
        // update bounds.width and return it
        _updateWidth() {
            const used = this._usedStyle;
            const bounds = this._bounds;
            bounds.width = used.width || 0;
            if (!bounds.width) {
                const position = used.position || 'static';
                if (['static', 'relative'].includes(position) && this.parent) {
                    bounds.width = this.parent.innerWidth || 0;
                }
                // compute internal width
                if (!bounds.width) {
                    bounds.width =
                        (used.padLeft || 0) +
                            (used.padRight || 0) +
                            (used.marginLeft || 0) +
                            (used.marginRight || 0) +
                            (used.border ? 2 : 0);
                    if (this.children.length) {
                        // my width comes from my children...
                        bounds.width += this.children.reduce((len, c) => Math.max(len, c._updateWidth()), 0);
                    }
                    else {
                        bounds.width += this._calcContentWidth();
                    }
                }
            }
            bounds.width = GWU__namespace.clamp(bounds.width, used.minWidth || bounds.width, used.maxWidth || bounds.width);
            this.children.forEach((c) => c._updateWidth());
            // These do not figure into parent with calculation
            const position = used.position || 'static';
            if (['fixed', 'absolute'].includes(position))
                return 0;
            return bounds.width;
        }
        _updateHeight() {
            const used = this._usedStyle;
            const bounds = this._bounds;
            let contentHeight = 0;
            bounds.height = used.height || 0;
            if (!bounds.height) {
                bounds.height =
                    (used.padTop || 0) +
                        (used.padBottom || 0) +
                        (used.marginTop || 0) +
                        (used.marginBottom || 0) +
                        (used.border ? 2 : 0);
                if (this.children.length) {
                    // my height comes from my children...
                    bounds.height += this.children.reduce((len, c) => len + c._updateHeight(), 0);
                }
                else {
                    contentHeight = this._calcContentHeight();
                    bounds.height += contentHeight;
                }
            }
            bounds.height = GWU__namespace.clamp(bounds.height, used.minHeight || bounds.height, used.maxHeight || bounds.height);
            if (contentHeight > this.innerHeight) {
                this._updateContentHeight();
            }
            this.children.forEach((c) => c._updateHeight());
            // These do not figure into parent height calculation
            const position = used.position || 'static';
            if (['fixed', 'absolute'].includes(position))
                return 0;
            return bounds.height;
        }
        _updateLeft() {
            const used = this._usedStyle;
            const bounds = this._bounds;
            const position = used.position || 'static';
            bounds.left = 0;
            if (position === 'static') {
                if (this.parent) {
                    bounds.left = this.parent.innerLeft;
                }
            }
            else {
                const root = this.positionedParent();
                if (used.left !== undefined) {
                    bounds.left = (root ? root.bounds.left : 0) + used.left;
                }
                else if (used.right !== undefined) {
                    if (root) {
                        bounds.right = root.bounds.right - used.right;
                    }
                }
                else {
                    bounds.left = root ? root.bounds.left : 0;
                }
            }
            this.children.forEach((c) => c._updateLeft());
        }
        _updateTop(parentBottom = 0) {
            const used = this._usedStyle;
            const bounds = this._bounds;
            const position = used.position || 'static';
            if (['fixed', 'absolute'].includes(position)) {
                const root = this.positionedParent();
                if (used.top !== undefined) {
                    bounds.top = (root ? root.bounds.top : 0) + used.top;
                }
                else if (used.bottom !== undefined) {
                    if (root) {
                        bounds.bottom = root.bounds.bottom - used.bottom;
                    }
                }
                else {
                    bounds.top = root ? root.bounds.top : 0;
                }
            }
            else {
                bounds.top = parentBottom;
                if (position === 'relative') {
                    if (used.top !== undefined) {
                        bounds.top += used.top;
                    }
                    else if (used.bottom !== undefined) {
                        bounds.top -= used.bottom;
                    }
                }
            }
            if (this.children.length) {
                let innerTop = this.innerTop;
                this.children.forEach((c) => {
                    innerTop += c._updateTop(innerTop);
                });
            }
            if (['fixed', 'absolute'].includes(position))
                return 0;
            return bounds.height;
        }
        style(...args) {
            if (!this._style) {
                this._style = new Style();
            }
            if (args.length === 0)
                return this._style;
            if (args.length === 1) {
                const v = args[0];
                if (typeof v === 'string') {
                    return this._style.get(v);
                }
                else {
                    this._style.set(args[0], false); // do not set the dirty flag
                    this._usedStyle.set(args[0], false); // do not set the dirty flag
                    this.dirty = true; // Need layout update
                }
            }
            else {
                this._style.set(args[0], args[1], false); // do not set dirty flag
                this._usedStyle.set(args[0], args[1], false); // do not set dirty flag
                this.dirty = true; // Need layout update
            }
            return this;
        }
        removeStyle(id) {
            if (!this._style)
                return this;
            this._style.unset(id);
            this._usedStyle.dirty = true;
            return this;
        }
        used(id) {
            if (!id)
                return this._usedStyle;
            if (id instanceof ComputedStyle) {
                this._usedStyle = id;
                this.dirty = true;
                return this;
            }
            return this._usedStyle.get(id);
        }
        addClass(id) {
            const items = id.split(' ');
            items.forEach((cls) => {
                if (cls.length == 0)
                    return;
                if (this.classes.includes(cls))
                    return;
                this._usedStyle.dirty = true; // It needs to get styles for this class
                this.classes.push(cls);
            });
            return this;
        }
        removeClass(id) {
            const items = id.split(' ');
            items.forEach((cls) => {
                if (cls.length == 0)
                    return;
                if (!GWU__namespace.arrayDelete(this.classes, cls))
                    return;
                this._usedStyle.dirty = true; // It may need to remove some styles
            });
            return this;
        }
        toggleClass(id) {
            const items = id.split(' ');
            items.forEach((cls) => {
                if (cls.length == 0)
                    return;
                if (!GWU__namespace.arrayDelete(this.classes, cls)) {
                    this.classes.push(cls);
                }
                this._usedStyle.dirty = true;
            });
            return this;
        }
        pos(...args) {
            if (args.length === 0)
                return this.bounds;
            let pos;
            let wantStyle = 'fixed';
            if (typeof args[0] === 'number') {
                pos = { left: args.shift(), top: args.shift() };
            }
            else {
                pos = args.shift();
            }
            // update style if necessary
            if (args[0] && args[0].length) {
                wantStyle = args[0];
                this.style('position', wantStyle);
            }
            else if (!this.isPositioned()) {
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
        isPositioned() {
            const pos = this._usedStyle.position;
            return !!pos && pos !== 'static';
        }
        size(size, height) {
            if (size === undefined)
                return this.bounds;
            if (typeof size === 'number') {
                size = { width: size, height };
            }
            if (size.minWidth !== undefined)
                this.style('minWidth', size.minWidth);
            if (size.minHeight !== undefined)
                this.style('minHeight', size.minHeight);
            if (size.maxWidth !== undefined)
                this.style('maxWidth', size.maxWidth);
            if (size.maxHeight !== undefined)
                this.style('maxHeight', size.maxHeight);
            if (size.width !== undefined)
                this.style('width', size.width);
            if (size.height !== undefined)
                this.style('height', size.height);
            // this._update();
            return this;
        }
        text(v) {
            if (v === undefined)
                return this._text;
            this._text = v;
            this.dirty = true;
            return this;
        }
        _calcContentWidth() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text);
            return this._lines.reduce((out, line) => Math.max(out, line.length), 0);
        }
        _calcContentHeight() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text, this.innerWidth);
            return this._lines.length;
        }
        _updateContentHeight() {
            this._lines.length = this.innerHeight;
        }
        // DRAWING
        draw(buffer) {
            const used = this._usedStyle;
            if (used.border) {
                this._drawBorder(buffer);
            }
            this._fill(buffer);
            if (this.children.length) {
                // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/Stacking_without_z-index
                this.children.forEach((c) => {
                    if (!c.isPositioned())
                        c.draw(buffer);
                });
                this.children.forEach((c) => {
                    if (c.isPositioned())
                        c.draw(buffer);
                });
            }
            else {
                this._drawContent(buffer);
            }
            return true;
        }
        _drawBorder(buffer) {
            const used = this._usedStyle;
            const bounds = this.bounds;
            GWU__namespace.xy.forBorder(bounds.x + (used.marginLeft || 0), bounds.y + (used.marginTop || 0), bounds.width - (used.marginLeft || 0) - (used.marginRight || 0), bounds.height - (used.marginTop || 0) - (used.marginBottom || 0), (x, y) => {
                buffer.draw(x, y, 0, used.border, used.border);
            });
        }
        _fill(buffer) {
            const used = this._usedStyle;
            const bg = used.bg;
            const bounds = this.bounds;
            buffer.fillRect(bounds.x + (used.marginLeft || 0) + (used.border ? 1 : 0), bounds.y + (used.marginTop || 0) + (used.border ? 1 : 0), bounds.width -
                (used.marginLeft || 0) -
                (used.marginRight || 0) -
                (used.border ? 2 : 0), bounds.height -
                (used.marginTop || 0) -
                (used.marginBottom || 0) -
                (used.border ? 2 : 0), ' ', bg, bg);
        }
        _drawContent(buffer) {
            if (this._lines.length) {
                const fg = this.used('fg') || 'white';
                const top = this.innerTop;
                const width = this.innerWidth;
                const left = this.innerLeft;
                const align = this.used('align');
                this._lines.forEach((line, i) => {
                    buffer.drawText(left, top + i, line, fg, -1, width, align);
                });
            }
        }
        // Events
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
                GWU__namespace.arrayDelete(handlers, cb);
            }
            else {
                handlers.length = 0; // clear all handlers
            }
            return this;
        }
        elementFromPoint(x, y) {
            let result = null;
            // positioned elements
            for (let w of this.children) {
                if (w.isPositioned() && w.contains(x, y)) {
                    result = w.elementFromPoint(x, y) || result;
                }
            }
            if (result)
                return result;
            // static elements
            for (let w of this.children) {
                if (!w.isPositioned() && w.contains(x, y)) {
                    result = w.elementFromPoint(x, y) || result;
                }
            }
            if (result)
                return result;
            if (!result && this.contains(x, y)) {
                result = this;
            }
            return result;
        }
    }
    const elements = {};
    function installElement(tag, fn) {
        elements[tag] = fn;
    }
    // TODO - Look at htmlparser2
    function makeElement(tag, stylesheet) {
        if (tag.startsWith('<')) {
            if (!tag.endsWith('>'))
                throw new Error('Need brackets around new tag - e.g. "<tag>"');
        }
        const fieldRE = /(\w+)( *= *(\'([^\']*)\'|\"([^\"]*)\"|(\w+)))?/;
        const endRE = / *>/;
        const textRE = /(.+?)(?=(<\/|$))/;
        const parts = {};
        const field_re = new RegExp(fieldRE, 'g');
        const end_re = new RegExp(endRE, 'g');
        const text_re = new RegExp(textRE, 'g');
        // console.log('PARSE', tag);
        let match = field_re.exec(tag);
        if (!match) {
            parts.tag = 'div';
        }
        else {
            parts.tag = match[1];
            match = field_re.exec(tag);
            while (match) {
                // console.log(match);
                parts[match[1]] = match[4] || match[5] || match[6] || true;
                end_re.lastIndex = field_re.lastIndex;
                const endM = end_re.exec(tag);
                if (endM && endM.index == field_re.lastIndex) {
                    // console.log('endM', endM);
                    text_re.lastIndex = end_re.lastIndex;
                    const tm = text_re.exec(tag);
                    // console.log(tm);
                    if (tm) {
                        parts.text = tm[1];
                    }
                    break;
                }
                match = field_re.exec(tag);
            }
            // console.log(parts);
        }
        const fn = elements[parts.tag];
        const e = fn
            ? fn(parts.tag, stylesheet)
            : new Element(parts.tag, stylesheet);
        Object.entries(parts).forEach(([key, value]) => {
            if (key === 'tag')
                return;
            else if (key === 'text') {
                e.text(value);
            }
            else if (key === 'id') {
                e.attr('id', value);
            }
            else if (key === 'style') {
                const style = value;
                // console.log('style=', style);
                style.split(';').forEach((s) => {
                    const parts = s.split('=').map((p) => p.trim());
                    parts.forEach((p) => {
                        const [k, v] = p.split(':').map((t) => t.trim());
                        // console.log(' - ', k, v);
                        if (k && v) {
                            e.style(k, v);
                        }
                    });
                });
            }
            else if (typeof value === 'string') {
                e.attr(key, value);
            }
            else {
                e.prop(key, value);
            }
        });
        return e;
    }

    class Input extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            this.on('keypress', this.keypress.bind(this));
            this.prop('tabindex', true);
        }
        // ATTRIBUTES
        _setAttr(name, value) {
            this._attrs[name] = value;
            if (name === 'value') {
                this._setProp('value', value);
            }
        }
        _setProp(name, value) {
            this._props[name] = value;
        }
        // CONTENT
        _calcContentWidth() {
            const size = this._attrs.size || '';
            if (size.length)
                return Number.parseInt(size);
            return 10; // default somewhere else?
        }
        _calcContentHeight() {
            return 1;
        }
        _updateContentHeight() { }
        // DRAWING
        _drawContent(buffer) {
            const fg = this.used('fg') || 'white';
            const top = this.innerTop;
            const width = this.innerWidth;
            const left = this.innerLeft;
            const align = this.used('align');
            buffer.drawText(left, top, this.prop('value'), fg, -1, width, align);
        }
        // EVENTS
        keypress(document, _element, e) {
            if (!e)
                return false;
            if (e.key === 'Enter') {
                document.nextTabStop();
                return true;
            }
            if (e.key === 'Escape') {
                this._setProp('value', '');
                return true;
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const v = this._props.value ? '' + this._props.value : '';
                this._setProp('value', v.substring(0, v.length - 1));
                return true;
            }
            if (e.key.length > 1) {
                return false;
            }
            let v = this._props.value ? this._props.value : '';
            this._setProp('value', v + e.key);
            return true;
        }
    }
    installElement('input', (tag, sheet) => {
        return new Input(tag, sheet);
    });

    class Document {
        constructor(ui, rootTag = 'body') {
            this._activeElement = null;
            this._done = false;
            this.ui = ui;
            this.stylesheet = new Sheet();
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
        $(id) {
            return this.select(id);
        }
        select(id) {
            let selected;
            if (id === undefined) {
                selected = [this.body];
            }
            else if (id instanceof Selection) {
                return id;
            }
            else if (typeof id === 'string') {
                if (id.startsWith('<')) {
                    selected = [this.createElement(id)];
                }
                else {
                    if (id === 'document') {
                        selected = [this.body]; // convenience
                    }
                    else {
                        const s = new Selector(id);
                        selected = this.children.filter((w) => s.matches(w));
                    }
                }
            }
            else if (Array.isArray(id)) {
                selected = id;
            }
            else {
                selected = [id];
            }
            return new Selection(this, selected);
        }
        createElement(tag) {
            return makeElement(tag, this.stylesheet);
        }
        create(tag) {
            return this.select(this.createElement(tag));
        }
        rule(rule, style) {
            if (typeof rule === 'string') {
                if (style) {
                    this.stylesheet.add(rule, style);
                    return this;
                }
                let out = this.stylesheet.get(rule);
                if (out)
                    return out;
                return this.stylesheet.add(rule, {});
            }
            Object.entries(rule).forEach(([name, value]) => {
                this.stylesheet.add(name, value);
            });
            return this;
        }
        removeRule(rule) {
            this.stylesheet.remove(rule);
            return this;
        }
        _attach(w) {
            if (Array.isArray(w)) {
                w.forEach((x) => this._attach(x));
                return this;
            }
            if (this.children.includes(w))
                return this;
            this.children.push(w);
            w._attached = true;
            w.children.forEach((c) => this._attach(c));
            return this;
        }
        _detach(w) {
            if (Array.isArray(w)) {
                w.forEach((x) => this._detach(x));
                return this;
            }
            if (w === this.body)
                throw new Error('Cannot detach root widget.');
            GWU__namespace.arrayDelete(this.children, w);
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
        updateLayout(widget) {
            widget = widget || this.body;
            widget.updateLayout();
        }
        draw(buffer) {
            this.computeStyles();
            this.updateLayout();
            buffer = buffer || this.ui.buffer;
            this.body.draw(buffer);
            buffer.render();
        }
        // activeElement
        get activeElement() {
            return this._activeElement;
        }
        setActiveElement(w, reverse = false) {
            if (w === this._activeElement)
                return true;
            const opts = {
                target: w,
                dir: [reverse ? -1 : 1, 0],
            };
            if (this._activeElement &&
                this._fireEvent(this._activeElement, 'blur', opts)) {
                return false;
            }
            if (w && this._fireEvent(w, 'focus', opts))
                return false;
            if (this._activeElement)
                this._activeElement.onblur();
            this._activeElement = w;
            if (this._activeElement)
                this._activeElement.onfocus(reverse);
            return true;
        }
        nextTabStop() {
            if (!this._activeElement) {
                this.setActiveElement(this.children.find((w) => !w.prop('disabled') && w.prop('tabindex')) || null);
                return !!this._activeElement;
            }
            const next = GWU__namespace.arrayNext(this.children, this._activeElement, (w) => !!w.prop('tabindex') && !w.prop('disabled'));
            if (next) {
                this.setActiveElement(next);
                return true;
            }
            return false;
        }
        prevTabStop() {
            if (!this._activeElement) {
                this.setActiveElement(this.children.find((w) => !w.prop('disabled') && w.prop('tabindex')) || null);
                return !!this._activeElement;
            }
            const prev = GWU__namespace.arrayPrev(this.children, this._activeElement, (w) => !!w.prop('tabindex') && !w.prop('disabled'));
            if (prev) {
                this.setActiveElement(prev, true);
                return true;
            }
            return false;
        }
        // events
        // return topmost element under point
        elementFromPoint(x, y) {
            return this.body.elementFromPoint(x, y) || this.body;
        }
        _fireEvent(element, name, e) {
            if (!e || !e.type) {
                e = GWU__namespace.io.makeCustomEvent(name, e);
            }
            const handlers = element.events[name] || [];
            let handled = handlers.reduce((out, h) => h(this, element, e) || out, false);
            return handled;
        }
        _bubbleEvent(element, name, e) {
            let current = element;
            while (current) {
                const handlers = current.events[name] || [];
                let handled = handlers.reduce((out, h) => h(this, current, e) || out, false);
                if (handled)
                    return true;
                current = current.parent;
            }
            return false;
        }
        click(e) {
            let element = this.elementFromPoint(e.x, e.y);
            if (!element)
                return false;
            if (this._bubbleEvent(element, 'click', e))
                return this._done;
            if (element.prop('tabindex')) {
                this.setActiveElement(element);
            }
            return false;
        }
        mousemove(e) {
            this.children.forEach((w) => w.prop('hover', false));
            let element = this.elementFromPoint(e.x, e.y);
            let current = element;
            while (current) {
                current.prop('hover', true);
                current = current.parent;
            }
            if (element && this._bubbleEvent(element, 'mousemove', e))
                return this._done;
            return false;
        }
        // dir
        dir(e) {
            const element = this.activeElement || this.body;
            if (element && this._bubbleEvent(element, 'dir', e))
                return this._done;
            return false;
        }
        // keypress
        keypress(e) {
            const element = this.activeElement || this.body;
            if (element) {
                if (this._bubbleEvent(element, e.key, e))
                    return this._done;
                if (this._bubbleEvent(element, e.code, e))
                    return this._done;
                if (this._bubbleEvent(element, 'keypress', e))
                    return this._done;
            }
            if (e.key === 'Tab') {
                this.nextTabStop();
            }
            else if (e.key === 'TAB') {
                this.prevTabStop();
            }
            return false;
        }
    }
    // TODO - look at cheerio
    class Selection {
        constructor(document, widgets = []) {
            this.document = document;
            this.selected = widgets.slice();
        }
        get(index) {
            if (index === undefined)
                return this.selected;
            if (index < 0)
                return this.selected[this.selected.length + index];
            return this.selected[index];
        }
        length() {
            return this.selected.length;
        }
        slice(start, end) {
            return new Selection(this.document, this.selected.slice(start, end));
        }
        add(arg) {
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
        clone() {
            this.selected = this.selected.map((w) => w.clone());
            return this;
        }
        // async ???
        forEach(cb) {
            this.selected.forEach(cb);
            return this;
        }
        // HIERARCHY
        after(content) {
            if (!(content instanceof Selection)) {
                content = this.document.$(content);
            }
            if (content.length() == 0)
                return this;
            content.detach();
            let current = content;
            const last = this.selected.length - 1;
            this.selected.forEach((next, i) => {
                if (!next.parent)
                    throw new Error('Cannot add after detached widgets.');
                current =
                    i < last ? content.clone() : content;
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
        append(content) {
            if (!(content instanceof Selection)) {
                content = this.document.$(content);
            }
            if (content.length() == 0)
                return this;
            content.detach(); // remove all items to be appended from the tree
            let current = content;
            const last = this.selected.length - 1;
            this.selected.forEach((dest, i) => {
                current =
                    i < last ? content.clone() : content;
                current.forEach((toAppend) => {
                    dest.addChild(toAppend);
                    if (dest._attached) {
                        this.document._attach(toAppend);
                    }
                });
            });
            return this;
        }
        appendTo(dest) {
            if (!(dest instanceof Selection)) {
                dest = this.document.$(dest);
            }
            dest.append(this);
            return this;
        }
        before(content) {
            if (!(content instanceof Selection)) {
                content = this.document.$(content);
            }
            if (content.length() == 0)
                return this;
            content.detach();
            let current = content;
            const last = this.selected.length - 1;
            this.selected.forEach((next, i) => {
                if (!next.parent)
                    throw new Error('Cannot add before detached widgets.');
                current =
                    i < last ? content.clone() : content;
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
        detach() {
            this.selected.forEach((w) => {
                if (w._attached) {
                    if (!w.parent)
                        throw new Error('Cannot detach root widget.');
                    w.parent.removeChild(w);
                    // remove from document.children
                    this.document._detach(w);
                }
            });
            return this;
        }
        empty() {
            this.selected.forEach((w) => {
                const oldChildren = w.empty();
                this.document._detach(oldChildren);
            });
            return this;
        }
        insertAfter(target) {
            if (!(target instanceof Selection)) {
                target = this.document.$(target);
            }
            target.after(this);
            return this;
        }
        insertBefore(target) {
            if (!(target instanceof Selection)) {
                target = this.document.$(target);
            }
            target.before(this);
            return this;
        }
        prepend(content) {
            if (!(content instanceof Selection)) {
                content = this.document.$(content);
            }
            if (content.length() == 0)
                return this;
            content.detach(); // remove all items to be prepended from the tree
            let current = content;
            const last = this.selected.length - 1;
            this.selected.forEach((dest, i) => {
                current =
                    i < last ? content.clone() : content;
                current.forEach((toAppend) => {
                    dest.addChild(toAppend, 0); // before first child
                    if (dest._attached) {
                        this.document._attach(toAppend);
                    }
                });
            });
            return this;
        }
        prependTo(dest) {
            if (!(dest instanceof Selection)) {
                dest = this.document.$(dest);
            }
            dest.prepend(this);
            return this;
        }
        remove(_sub) {
            // TODO - subselector
            // TODO - remove events
            return this.detach();
        }
        replaceAll(target) {
            if (!(target instanceof Selection)) {
                target = this.document.$(target);
            }
            target.before(this);
            target.detach();
            return this;
        }
        replaceWith(content) {
            if (!(content instanceof Selection)) {
                content = this.document.$(content);
            }
            content.replaceAll(this);
            return this;
        }
        text(t) {
            if (!t) {
                return this.selected.length ? this.selected[0].text() : '';
            }
            this.selected.forEach((w) => w.text(t));
            return this;
        }
        attr(id, value) {
            if (value === undefined) {
                if (this.selected.length == 0)
                    return undefined;
                return this.selected[0].attr(id);
            }
            this.selected.forEach((e) => e.attr(id, value));
            return this;
        }
        prop(id, value) {
            if (value === undefined) {
                if (this.selected.length == 0)
                    return undefined;
                return this.selected[0].prop(id);
            }
            this.selected.forEach((e) => e.prop(id, value));
            return this;
        }
        // STYLE
        addClass(id) {
            this.selected.forEach((w) => w.addClass(id));
            return this;
        }
        hasClass(id) {
            if (this.selected.length == 0)
                return false;
            return this.selected[0].classes.includes(id);
        }
        removeClass(id) {
            this.selected.forEach((w) => w.removeClass(id));
            return this;
        }
        toggleClass(id) {
            this.selected.forEach((w) => w.toggleClass(id));
            return this;
        }
        style(name, value) {
            if (!name)
                return this.selected[0].style();
            if (value === undefined) {
                if (typeof name === 'string') {
                    return this.selected[0].style(name);
                }
            }
            this.selected.forEach((w) => {
                if (typeof name === 'string') {
                    w.style(name, value);
                }
                else {
                    w.style(name);
                }
            });
            return this;
        }
        removeStyle(name) {
            this.selected.forEach((w) => w.removeStyle(name));
            return this;
        }
        pos(...args) {
            if (args.length == 0) {
                if (this.selected.length == 0)
                    return undefined;
                return this.selected[0].pos();
            }
            this.selected.forEach((w) => w.pos(args[0], args[1], args[2]));
            return this;
        }
        size(...args) {
            if (args.length == 0) {
                if (this.selected.length == 0)
                    return undefined;
                return this.selected[0].size();
            }
            this.selected.forEach((w) => w.size(args[0], args[1]));
            return this;
        }
        // ANIMATION
        animate(_props, _ms) {
            return this;
        }
        clearQueue(_name) {
            return this;
        }
        delay(_ms, _name) {
            return this;
        }
        dequeue() {
            return this;
        }
        fadeIn(_ms) {
            return this;
        }
        fadeOut(_ms) {
            return this;
        }
        fadeTo(_ms, _opacity) {
            return this;
        }
        fadeToggle(_ms) {
            return this;
        }
        finish(_name) {
            return this;
        }
        hide(_ms) {
            return this;
        }
        queue(..._args) {
            return [];
        }
        show(_ms) {
            return this;
        }
        slideDown(_ms) {
            return this;
        }
        slideToggle(_ms) {
            return this;
        }
        slideUp(_ms) {
            return this;
        }
        stop() {
            return this;
        }
        toggle(_arg) {
            return this;
        }
        // EVENTS
        on(event, cb) {
            this.selected.forEach((w) => {
                w.on(event, cb);
            });
            return this;
        }
        off(event, cb) {
            this.selected.forEach((w) => {
                w.off(event, cb);
            });
            return this;
        }
        fire(event, e) {
            if (!e) {
                e = GWU__namespace.io.makeCustomEvent(event);
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

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Callbacks: Callbacks,
        isTruthy: isTruthy,
        Selector: Selector,
        selector: selector,
        Style: Style,
        ComputedStyle: ComputedStyle,
        Sheet: Sheet,
        Element: Element,
        elements: elements,
        installElement: installElement,
        makeElement: makeElement,
        Input: Input,
        Document: Document,
        Selection: Selection
    });

    exports.ActionButton = ActionButton;
    exports.ActorEntry = ActorEntry;
    exports.Box = Box;
    exports.Button = Button;
    exports.CellEntry = CellEntry;
    exports.Column = Column;
    exports.Dialog = Dialog;
    exports.DialogBuilder = DialogBuilder;
    exports.DropDownButton = DropDownButton;
    exports.EntryBase = EntryBase;
    exports.Flavor = Flavor;
    exports.Input = Input$1;
    exports.ItemEntry = ItemEntry;
    exports.List = List;
    exports.Menu = Menu;
    exports.MenuButton = MenuButton;
    exports.Messages = Messages;
    exports.Sidebar = Sidebar;
    exports.Table = Table;
    exports.Text = Text;
    exports.UI = UI;
    exports.Viewport = Viewport;
    exports.Widget = Widget;
    exports.buildDialog = buildDialog;
    exports.html = index;
    exports.makeTable = makeTable;
    exports.showDropDown = showDropDown;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
