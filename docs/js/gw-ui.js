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

    class Widget$1 {
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

    class Text$1 extends Widget$1 {
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

    class Button$1 extends Widget$1 {
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

    class Input$1 extends Widget$1 {
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
    class Table extends Widget$1 {
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

    class Box extends Widget$1 {
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
        get width() {
            return this.canvas.width;
        }
        get height() {
            return this.canvas.height;
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
            const textWidget = new Text$1('TEXT', textOpts);
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
            const textWidget = new Text$1('TEXT', textOpts);
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
                .with(new Button$1('OK', okOpts), { x: 0, bottom: 0 });
            if (opts.allowCancel) {
                builder.with(new Button$1('CANCEL', cancelOpts), {
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
            const promptWidget = new Text$1('TEXT', promptOpts);
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
                .with(new Button$1('OK', okOpts), { bottom: 0, x: 0 })
                .addBox(opts.box);
            if (opts.allowCancel) {
                builder.with(new Button$1('CANCEL', cancelOpts), {
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

    class Messages extends Widget$1 {
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

    class Viewport extends Widget$1 {
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
    class Flavor extends Text$1 {
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
    class Sidebar extends Widget$1 {
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
    class Menu extends Widget$1 {
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
            return matches.reduce((out, fn) => fn.bind(undefined, out), GWU__namespace.TRUE);
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

    class Style$1 {
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
                        value = value.split(' ');
                    }
                    value = value.map((v) => {
                        if (typeof v === 'string')
                            return Number.parseInt(v);
                        return v;
                    });
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
                        value = value.split(' ');
                    }
                    value = value.map((v) => {
                        if (typeof v === 'string')
                            return Number.parseInt(v);
                        return v;
                    });
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
                }
            }
            else if (key instanceof Style$1) {
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
        return new Style$1(selector, opts);
    }
    // const NO_BOUNDS = ['fg', 'bg', 'depth', 'align', 'valign'];
    // export function affectsBounds(key: keyof StyleOptions): boolean {
    //     return !NO_BOUNDS.includes(key);
    // }
    class ComputedStyle$1 extends Style$1 {
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
    class Sheet$1 {
        constructor(parentSheet) {
            this.rules = [];
            this._dirty = true;
            if (parentSheet === undefined) {
                parentSheet = defaultStyle$1;
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
            let rule = new Style$1(selector, props);
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
            return new ComputedStyle$1(sources);
        }
    }
    const defaultStyle$1 = new Sheet$1(null);

    defaultStyle$1.add('*', {
        fg: 'white',
        bg: -1,
        align: 'left',
        valign: 'top',
        position: 'static',
    });
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
            this._data = null;
            this._bounds = new GWU__namespace.xy.Bounds(0, 0, 0, 0);
            this._text = '';
            this._lines = [];
            this._dirty = false;
            this._attached = false;
            this._style = null;
            this.tag = tag;
            this._usedStyle = styles
                ? styles.computeFor(this)
                : new ComputedStyle$1();
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
            if (name === 'style') {
                this._style = makeStyle(value);
                this._usedStyle.dirty = true;
            }
        }
        _attrInt(name, def = 0) {
            let v = this._attrs[name];
            if (v === undefined)
                return def;
            if (typeof v === 'string') {
                return Number.parseInt(v);
            }
            else if (typeof v === 'boolean') {
                return v ? 1 : 0;
            }
            return v;
        }
        _attrString(name) {
            let v = this._attrs[name] || '';
            if (typeof v === 'string')
                return v;
            return '' + v;
        }
        _attrBool(name) {
            const v = this._attrs[name] || false;
            if (typeof v === 'boolean')
                return v;
            if (typeof v === 'number')
                return v != 0;
            return v.length > 0 && v !== 'false';
        }
        prop(name, value) {
            if (value === undefined)
                return this._props[name];
            this._setProp(name, value);
            return this;
        }
        _setProp(name, value) {
            if (this._props[name] === value)
                return;
            this._props[name] = value;
            this._usedStyle.dirty = true; // Need to reload styles
        }
        toggleProp(name) {
            const v = this._props[name] || false;
            this._setProp(name, !v);
            return this;
        }
        val(v) {
            if (v === undefined)
                return this.prop('value');
            this._setProp('value', v);
            return this;
        }
        data(doc, v) {
            if (doc === undefined) {
                return this._data;
            }
            this._setData(doc, v);
            return this;
        }
        _setData(_doc, v) {
            this._data = v;
        }
        onblur(_doc) {
            this.prop('focus', false);
        }
        onfocus(_doc, _reverse) {
            this.prop('focus', true);
        }
        _propInt(name, def = 0) {
            let v = this._props[name];
            if (v === undefined)
                return def;
            if (typeof v === 'string') {
                return Number.parseInt(v);
            }
            else if (typeof v === 'boolean') {
                return v ? 1 : 0;
            }
            return v;
        }
        _propString(name) {
            let v = this._props[name] || '';
            if (typeof v === 'string')
                return v;
            return '' + v;
        }
        _propBool(name) {
            const v = this._props[name] || false;
            return !!v;
        }
        // CHILDREN
        _isValidChild(_child) {
            return true;
        }
        appendChild(child, beforeIndex = -1) {
            if (!this._isValidChild(child)) {
                throw new Error(`Invalid child (tag=${child.tag}) for element (tag=${this.tag})`);
            }
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
                // TODO - fail silently?
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
            // this.dirty = false;
            // this.children.forEach((c) => (c.dirty = false));
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
                    bounds.height += this._calcChildHeight();
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
                this._style = new Style$1();
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
            if (id instanceof ComputedStyle$1) {
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
            this._setText(v);
            return this;
        }
        _setText(v) {
            this._text = v;
            this.dirty = true;
            this._usedStyle.dirty = true; // We need to re-layout the _lines (which possibly affects width+height)
        }
        _calcContentWidth() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text);
            return this._lines.reduce((out, line) => Math.max(out, line.length), 0);
        }
        _calcContentHeight() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text, this.innerWidth);
            return this._lines.length;
        }
        _calcChildHeight() {
            return this.children.reduce((len, c) => len + c._updateHeight(), 0);
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
            this._drawContent(buffer);
            this.dirty = false;
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
            if (this.children.length) {
                this._drawChildren(buffer);
            }
            else {
                this._drawText(buffer);
            }
        }
        _drawChildren(buffer) {
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
        _drawText(buffer) {
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

    const MARKUP_RE = /<!--[^]*?(?=-->)-->|<(\/?)(\w*)\s*([^>]*?)(\/?)>/g;
    const ATTR_RE = /(\w+)(?: *= *(?:(?:\'([^\']*)\')|(?:\"([^\"]*)\")|(\w+)))?/g;
    // var kAttributePattern = /\b(id|class)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/gi;
    const selfClosingTags = {
        meta: true,
        img: true,
        link: true,
        input: true,
        area: true,
        br: true,
        hr: true,
    };
    var tagsClosedByOpening = {
        li: { li: true },
        p: { p: true, div: true },
        td: { td: true, th: true },
        th: { td: true, th: true },
    };
    var tagsClosedByClosing = {
        li: { ul: true, ol: true },
        a: { div: true },
        b: { div: true },
        i: { div: true },
        p: { div: true },
        td: { tr: true, table: true },
        th: { tr: true, table: true },
    };
    const elements = {};
    function configureElement(tag, opts = {}) {
        if (opts.selfClosing) {
            selfClosingTags[tag] = true;
        }
        if (opts.openCloses && opts.openCloses.length) {
            const tcbo = (tagsClosedByOpening[tag] = {});
            opts.openCloses.forEach((t) => (tcbo[t] = true));
        }
        if (opts.closeCloses && opts.closeCloses.length) {
            const tcbc = (tagsClosedByClosing[tag] = {});
            opts.closeCloses.forEach((t) => (tcbc[t] = true));
        }
    }
    function installElement(tag, fn, opts = {}) {
        elements[tag] = fn;
        configureElement(tag, opts);
    }
    function createElement(tag, rawAttr, stylesheet) {
        const fn = elements[tag];
        const e = fn ? fn(tag, stylesheet) : new Element(tag, stylesheet);
        // TODO - Add attributs, properties, and styles
        if (rawAttr) {
            // console.log(tag, rawAttr);
            const re = new RegExp(ATTR_RE, 'g');
            let match = re.exec(rawAttr);
            while (match) {
                const name = match[1];
                const value = match[2] || match[3] || match[4] || true;
                // console.log('- attr', name, value);
                if (value === true) {
                    e.prop(name, value);
                }
                else {
                    e.attr(name, value);
                }
                match = re.exec(rawAttr);
            }
        }
        return e;
    }
    function back(arr) {
        return arr[arr.length - 1];
    }
    /**
     * Parse a chuck of HTML source.
     * @param  {string} data      html
     * @return {HTMLElement}      root element
     */
    function parse(data, options = {}) {
        if (options instanceof Sheet$1) {
            options = { stylesheet: options };
        }
        var root = createElement('dummy', '', options.stylesheet);
        var currentElement = root;
        var stack = [root];
        var lastTextPos = -1;
        options = options || {};
        const RE = new RegExp(MARKUP_RE, 'gi');
        var match, text;
        match = RE.exec(data);
        while (match) {
            if (lastTextPos > -1) {
                if (lastTextPos + match[0].length < RE.lastIndex) {
                    // if has content
                    text = data.substring(lastTextPos, RE.lastIndex - match[0].length);
                    currentElement.text(text); //.appendNode(new TextNode(text));
                }
            }
            lastTextPos = RE.lastIndex;
            if (match[0][1] == '!') {
                // this is a comment
                continue;
            }
            if (options.lowerCaseTagName)
                match[2] = match[2].toLowerCase();
            if (!match[1]) {
                // not </ tags
                // var attrs: Record<string, string> = {};
                // var attMatch;
                // attMatch = kAttributePattern.exec(match[3]);
                // while (attMatch) {
                //     attrs[attMatch[1]] = attMatch[3] || attMatch[4] || attMatch[5];
                //     attMatch = kAttributePattern.exec(match[3]);
                // }
                // console.log(attrs);
                if (!match[4] && tagsClosedByOpening[currentElement.tag]) {
                    if (tagsClosedByOpening[currentElement.tag][match[2]]) {
                        stack.pop();
                        currentElement = back(stack);
                    }
                }
                const child = createElement(match[2], match[3], options.stylesheet);
                stack.push(child);
                currentElement.appendChild(child);
                currentElement = child;
                // if (kBlockTextElements[match[2]]) {
                //   // a little test to find next </script> or </style> ...
                //   var closeMarkup = '</' + match[2] + '>';
                //   var index = data.indexOf(closeMarkup, kMarkupPattern.lastIndex);
                //   if (options[match[2]]) {
                //     if (index == -1) {
                //       // there is no matching ending for the text element.
                //       text = data.substr(kMarkupPattern.lastIndex);
                //     } else {
                //       text = data.substring(kMarkupPattern.lastIndex, index);
                //     }
                //     if (text.length > 0)
                //       currentParent.appendChild(new TextNode(text));
                //   }
                //   if (index == -1) {
                //     lastTextPos = kMarkupPattern.lastIndex = data.length + 1;
                //   } else {
                //     lastTextPos = kMarkupPattern.lastIndex = index + closeMarkup.length;
                //     match[1] = true;
                //   }
                // }
            }
            if (match[1] || match[4] || selfClosingTags[match[2]]) {
                // </ or /> or <br> etc.
                while (true) {
                    if (currentElement.tag == match[2]) {
                        stack.pop();
                        currentElement = back(stack);
                        break;
                    }
                    else {
                        // Trying to close current tag, and move on
                        if (tagsClosedByClosing[currentElement.tag]) {
                            if (tagsClosedByClosing[currentElement.tag][match[2]]) {
                                stack.pop();
                                currentElement = back(stack);
                                continue;
                            }
                        }
                        // Use aggressive strategy to handle unmatching markups.
                        break;
                    }
                }
            }
            match = RE.exec(data);
        }
        // in case you forget closing tag on something like : "<div>text"
        if (lastTextPos > -1) {
            if (lastTextPos < data.length) {
                // if has content
                text = data.substring(lastTextPos);
                currentElement.text(text); //.appendNode(new TextNode(text));
            }
        }
        const e = root.children[0]; // real root
        e.parent = null;
        return e;
    }
    // let t = parse('<div name="test" checked id=A>Test</div>');
    // console.log(t);

    defaultStyle$1.add('input', {
        fg: 'black',
        bg: 'gray',
    });
    class Input extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            this.on('keypress', this.keypress.bind(this));
            this.prop('tabindex', true);
            this.prop('value', '');
        }
        // reset() {
        //     this.prop('value', this._attrString('value'));
        // }
        // ATTRIBUTES
        _setAttr(name, value) {
            super._setAttr(name, value);
            if (name === 'value') {
                this._setProp('value', value);
            }
            super._setProp('valid', this.isValid());
        }
        _setProp(name, value) {
            if (name === 'value') {
                value = '' + value;
                const maxLength = this._attrInt('maxLength', 0);
                if (maxLength && value.length > maxLength) {
                    value = value.substring(0, maxLength);
                }
                super._setProp('empty', value.length == 0);
                this._props.value = value;
                this.dirty = true;
            }
            else {
                super._setProp(name, value);
            }
            super._setProp('valid', this.isValid());
        }
        get isTypeNumber() {
            return this._attrs.type === 'number';
        }
        // PROPERTIES
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
        isValid() {
            const v = this._propString('value');
            if (this.isTypeNumber) {
                const val = this._propInt('value');
                const min = this._attrInt('min', Number.MIN_SAFE_INTEGER);
                if (val < min)
                    return false;
                const max = this._attrInt('max', Number.MAX_SAFE_INTEGER);
                if (val > max)
                    return false;
                return v.length > 0;
            }
            const requiredLen = this._propInt('required', 0);
            // console.log(
            //     'required',
            //     this._attrs.required,
            //     requiredLen,
            //     v,
            //     v.length,
            //     this._attrInt('minLength', requiredLen)
            // );
            return (v.length >= this._attrInt('minLength', requiredLen) &&
                v.length <= this._attrInt('maxLength', Number.MAX_SAFE_INTEGER));
        }
        // DRAWING
        _drawText(buffer) {
            const fg = this.used('fg') || 'white';
            const top = this.innerTop;
            const width = this.innerWidth;
            const left = this.innerLeft;
            const align = this.used('align');
            let v = this._propString('value');
            if (v.length == 0) {
                v = this._attrString('placeholder');
            }
            buffer.drawText(left, top, v, fg, -1, width, align);
        }
        // EVENTS
        onblur(doc) {
            super.onblur(doc);
            if (this.val() !== this.attr('value')) {
                doc._fireEvent(this, 'change');
            }
        }
        keypress(document, _element, e) {
            if (!e)
                return false;
            if (e.key === 'Enter') {
                document.nextTabStop();
                return true;
            }
            if (e.key === 'Escape') {
                this._setProp('value', '');
                document._fireEvent(this, 'input', e);
                return true;
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const v = this._propString('value');
                this._setProp('value', v.substring(0, v.length - 1));
                document._fireEvent(this, 'input', e);
                return true;
            }
            if (e.key.length > 1) {
                return false;
            }
            const textEntryBounds = this.isTypeNumber ? ['0', '9'] : [' ', '~'];
            // eat/use all other keys
            if (e.key >= textEntryBounds[0] && e.key <= textEntryBounds[1]) {
                // allow only permitted input
                const v = this._propString('value');
                this._setProp('value', v + e.key);
                document._fireEvent(this, 'input', e);
            }
            return true;
        }
    }
    installElement('input', (tag, sheet) => {
        return new Input(tag, sheet);
    });

    class CheckBox extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            this.on('keypress', this.keypress.bind(this));
            this.on('click', this.click.bind(this));
            this.prop('tabindex', true);
            this.prop('checked', false);
            Object.entries(CheckBox.default).forEach(([key, value]) => this.attr(key, value));
        }
        // reset() {
        //     this.prop('value', this._attrString('value'));
        // }
        // ATTRIBUTES
        _setAttr(name, value) {
            this._attrs[name] = value;
            if (name === 'value') {
                this._setProp('value', value);
            }
        }
        // PROPERTIES
        // CONTENT
        _calcContentWidth() {
            return 2 + super._calcContentWidth();
        }
        _calcContentHeight() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text, this.innerWidth - 2);
            return Math.max(1, this._lines.length);
        }
        // DRAWING
        _drawText(buffer) {
            const fg = this.used('fg') || 'white';
            const top = this.innerTop;
            const width = this.innerWidth;
            const left = this.innerLeft;
            const align = this.used('align');
            const state = this.prop('checked') ? 'check' : 'uncheck';
            let v = this._attrs[state];
            buffer.drawText(left, top, v, fg, -1);
            this._lines.forEach((line, i) => {
                buffer.drawText(left + 2, top + i, line, fg, -1, width - 2, align);
            });
        }
        // EVENTS
        onblur(doc) {
            super.onblur(doc);
            doc._fireEvent(this, 'change');
        }
        keypress(document, _element, e) {
            if (!e)
                return false;
            if (e.key === 'Enter' || e.key === ' ') {
                this.toggleProp('checked');
                document._fireEvent(this, 'input', e);
                return true;
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                this.prop('checked', false);
                document._fireEvent(this, 'input', e);
                return true;
            }
            return false;
        }
        click(document, _element, e) {
            if (!e)
                return false;
            if (!this.contains(e))
                return false;
            this.toggleProp('checked');
            document.setActiveElement(this);
            document._fireEvent(this, 'input', e);
            return true;
        }
    }
    CheckBox.default = {
        uncheck: '\u2610',
        check: '\u2612',
        padCheck: '1',
        value: 'on',
    };
    installElement('checkbox', (tag, sheet) => {
        return new CheckBox(tag, sheet);
    });

    defaultStyle$1.add('button', {
        fg: 'black',
        bg: 'gray',
    });
    class Button extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            this.on('keypress', this.keypress.bind(this));
            this.on('click', this.click.bind(this));
            this.prop('tabindex', true);
            Object.entries(Button.default).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    this.prop(key, value);
                }
                else {
                    this.attr(key, value);
                }
            });
        }
        // ATTRIBUTES
        _setAttr(name, value) {
            this._attrs[name] = value;
            if (name === 'value') {
                this._setProp('value', value);
            }
        }
        // PROPERTIES
        // CONTENT
        // DRAWING
        // EVENTS
        keypress(document, _element, e) {
            if (!e)
                return false;
            if (e.key === 'Enter' || e.key === ' ') {
                document._fireEvent(this, 'click', e);
                return true;
            }
            return false;
        }
        click(document, _element, e) {
            if (!e)
                return false;
            if (!this.contains(e))
                return false;
            if (this.prop('clickfocus')) {
                document.setActiveElement(this);
            }
            return true;
        }
    }
    Button.default = {
        clickfocus: false,
    };
    installElement('button', (tag, sheet) => {
        return new Button(tag, sheet);
    });

    defaultStyle$1.add('fieldset', {
        margin: 1,
        border: 'dark_gray',
        fg: 'white',
        bg: -1,
        padding: 1,
    });
    class FieldSet extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            Object.entries(FieldSet.default).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    this.prop(key, value);
                }
                else if (value !== undefined) {
                    this.attr(key, '' + value);
                }
            });
        }
        // ATTRIBUTES
        // PROPERTIES
        // CONTENT
        // DRAWING
        _drawBorder(buffer) {
            super._drawBorder(buffer);
            const legend = this.attr('legend');
            if (!legend || legend.length == 0)
                return;
            const used = this._usedStyle;
            const fg = used.fg || 'white';
            const top = this.innerTop - (used.padTop || 0) - 1; // -1 for border
            const width = this.innerWidth;
            const left = this.innerLeft;
            const align = used.align;
            buffer.drawText(left, top, legend, fg, -1, width, align);
        }
    }
    FieldSet.default = {};
    installElement('fieldset', (tag, sheet) => {
        return new FieldSet(tag, sheet);
    });

    // import { Document } from './document';
    // Style.defaultStyle.add('button', {
    //     fg: 'black',
    //     bg: 'gray',
    // });
    class UnorderedList extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
        }
        // CONTENT
        get indentWidth() {
            return 2;
        }
        _calcContentWidth() {
            return this.indentWidth + super._calcContentWidth();
        }
        _calcContentHeight() {
            this._lines = GWU__namespace.text.splitIntoLines(this._text, this.innerWidth - this.indentWidth);
            return Math.max(1, this._lines.length);
        }
        get innerLeft() {
            return super.innerLeft + this.indentWidth;
        }
        get innerWidth() {
            return Math.max(0, super.innerWidth - this.indentWidth);
        }
        // DRAWING
        _drawBullet(buffer, _index, left, top, fg) {
            const b = this._attrs.bullet || UnorderedList.default.bullet;
            buffer.drawText(left, top, b, fg, -1);
        }
        _drawChildren(buffer) {
            this.children.forEach((c, i) => {
                const fg = c.used('fg') || 'white';
                const top = c.bounds.top + (c.used('marginTop') || 0);
                const left = c.bounds.left - this.indentWidth;
                this._drawBullet(buffer, i, left, top, fg);
                c.draw(buffer);
            });
        }
    }
    UnorderedList.default = {
        bullet: '\u2022', // bullet
    };
    installElement('ul', (tag, sheet) => {
        return new UnorderedList(tag, sheet);
    });
    class OrderedList extends UnorderedList {
        constructor(tag, sheet) {
            super(tag, sheet);
        }
        get indentWidth() {
            return this.children.length >= 10 ? 4 : 3;
        }
        _drawBullet(buffer, index, left, top, fg) {
            const b = ('' + (index + 1) + '. ').padStart(this.indentWidth, ' ');
            buffer.drawText(left, top, b, fg, -1);
        }
    }
    installElement('ol', (tag, sheet) => {
        return new OrderedList(tag, sheet);
    });

    class DataList extends Element {
        constructor(tag, sheet) {
            super(tag, sheet);
            this._data = [];
        }
        // CONTENT
        _setData(doc, v) {
            if (!Array.isArray(v)) {
                throw new Error('<datalist> only uses Array values for data field.');
            }
            super._setData(doc, v);
            this.dirty = true;
            if (this.children.length) {
                const oldChildren = doc.select(this.children.filter((c) => c.tag === 'data'));
                oldChildren.detach();
            }
            if (!this._data)
                return;
            this._data.forEach((item) => {
                doc.create('<data>').text(item).appendTo(this);
            });
        }
        get indentWidth() {
            return 0;
            // const prefix = this.attr('prefix') || DataList.default.prefix;
            // if (!prefix) return 0;
            // if (prefix.includes('#')) {
            //     return prefix.length - 1 + this._data.length >= 10 ? 2 : 1;
            // }
            // return prefix.length;
        }
        _calcContentWidth() {
            return DataList.default.width; // no legend or data, so use default
        }
        _calcContentHeight() {
            return 1; // no legend or data so just an empty cell
        }
        _calcChildHeight() {
            if (!this._data || this._data.length === 0) {
                return super._calcChildHeight() + 1; // legend (if present) + empty cell
            }
            return super._calcChildHeight();
        }
        get innerLeft() {
            return super.innerLeft + this.indentWidth;
        }
        get innerWidth() {
            return Math.max(0, super.innerWidth - this.indentWidth);
        }
        // DRAWING
        _drawContent(buffer) {
            // draw legend and data (if any)
            this._drawChildren(buffer);
            if (!this._data || this._data.length == 0) {
                // empty cell is necessary
                const fg = this.used('fg') || 'white';
                const top = this.innerBottom - 1;
                const left = this.innerLeft + this.indentWidth;
                const width = this.innerWidth - this.indentWidth;
                const align = this.used('align');
                const empty = this.attr('empty') || DataList.default.empty;
                buffer.drawText(left, top, empty, fg, -1, width, align);
            }
        }
        // CHILDREN
        _isValidChild(child) {
            return ['data', 'legend'].includes(child.tag);
        }
    }
    DataList.default = {
        bullet: '\u2022',
        empty: '-',
        prefix: 'none',
        width: 10,
    };
    installElement('datalist', (tag, sheet) => {
        return new DataList(tag, sheet);
    });

    defaultStyle$1.add('body', {
        bg: 'black',
    });
    class Document {
        constructor(ui, rootTag = 'body') {
            this._activeElement = null;
            this._done = false;
            this.ui = ui;
            this.stylesheet = new Sheet$1();
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
            return parse(tag, this.stylesheet);
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
            let anyChanged = false;
            this.children.forEach((w) => {
                if (w.used().dirty || this.stylesheet.dirty) {
                    w.used(this.stylesheet.computeFor(w));
                    anyChanged = true;
                }
            });
            this.stylesheet.dirty = false;
            return anyChanged;
        }
        updateLayout(widget) {
            widget = widget || this.body;
            widget.updateLayout();
        }
        draw(buffer) {
            if (this._prepareDraw()) {
                buffer = buffer || this.ui.buffer;
                this.body.draw(buffer);
                buffer.render();
                // console.log('draw');
            }
        }
        _prepareDraw() {
            if (!this.computeStyles() && !this.children.some((c) => c.dirty))
                return false;
            this.updateLayout();
            return true;
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
                this._activeElement.onblur(this);
            this._activeElement = w;
            if (this._activeElement)
                this._activeElement.onfocus(this, reverse);
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
            if (element.prop('disabled'))
                return false;
            if (this._bubbleEvent(element, 'click', e))
                return this._done;
            if (element.prop('tabindex')) {
                this.setActiveElement(element);
            }
            return false;
        }
        mousemove(e) {
            let element = this.elementFromPoint(e.x, e.y);
            const hovered = [];
            let current = element;
            while (current) {
                hovered.push(current);
                current.prop('hover', true);
                current = current.parent;
            }
            this.children.forEach((w) => {
                if (hovered.includes(w))
                    return;
                w.prop('hover', false);
            });
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
    ///////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////
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
                    parent.appendChild(toAdd, nextIndex);
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
                    dest.appendChild(toAppend);
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
                    parent.appendChild(toAdd, nextIndex++);
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
                    dest.appendChild(toAppend, 0); // before first child
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
        data(d) {
            if (d === undefined) {
                if (!this.selected.length)
                    return undefined;
                return this.selected[0].data();
            }
            this.selected.forEach((e) => e.data(this.document, d));
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

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Selector: Selector,
        compile: compile,
        Style: Style$1,
        makeStyle: makeStyle,
        ComputedStyle: ComputedStyle$1,
        Sheet: Sheet$1,
        defaultStyle: defaultStyle$1,
        Element: Element,
        Input: Input,
        CheckBox: CheckBox,
        Button: Button,
        FieldSet: FieldSet,
        UnorderedList: UnorderedList,
        OrderedList: OrderedList,
        DataList: DataList,
        selfClosingTags: selfClosingTags,
        elements: elements,
        configureElement: configureElement,
        installElement: installElement,
        parse: parse,
        Document: Document,
        Selection: Selection
    });

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
                this._fg = GWU__namespace.color.from(this._fg).darken(pct);
            }
            if (bg) {
                this._bg = GWU__namespace.color.from(this._bg).darken(pct);
            }
            return this;
        }
        bright(pct = 25, fg = true, bg = false) {
            if (fg) {
                this._fg = GWU__namespace.color.from(this._fg).lighten(pct);
            }
            if (bg) {
                this._bg = GWU__namespace.color.from(this._bg).lighten(pct);
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
            this.bounds = new GWU__namespace.xy.Bounds(0, 0, 0, 1);
            this._style = new Style();
            this.parent = null;
            this.classes = [];
            this._props = {};
            this._attrs = {};
            this._needsDraw = true;
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
        get needsDraw() {
            return this._needsDraw;
        }
        set needsDraw(v) {
            this._needsDraw = v;
        }
        attr(name, v) {
            if (v === undefined)
                return this._attrs[name];
            this._attrs[name] = v;
            return this;
        }
        prop(name, v) {
            if (v === undefined)
                return this._props[name] || false;
            this._props[name] = v;
            this._updateStyle();
            return this;
        }
        contains(...args) {
            return this.bounds.contains(args[0], args[1]);
        }
        style(opts) {
            if (opts === undefined)
                return this._style;
            this._style.set(opts);
            this._updateStyle();
            return this;
        }
        get focused() {
            return this.prop('focus');
        }
        set focused(v) {
            this.prop('focus', v);
        }
        get hovered() {
            return this.prop('hover');
        }
        set hovered(v) {
            this.prop('hover', v);
        }
        _updateStyle() {
            this._used = this.term.styles.computeFor(this);
            this.needsDraw = true; // changed style or state
        }
        mousemove(e, _term) {
            this.hovered = this.contains(e);
            return false;
        }
    }
    class WidgetGroup extends Widget {
        constructor(term, opts = {}) {
            super(term, opts);
            this.widgets = [];
        }
        get needsDraw() {
            return this._needsDraw || this.widgets.some((w) => w.needsDraw);
        }
        set needsDraw(v) {
            this._needsDraw = v;
        }
        contains(...args) {
            return this.widgets.some((w) => w.contains(args[0], args[1]));
        }
        widgetAt(...args) {
            return this.widgets.find((w) => w.contains(args[0], args[1])) || null;
        }
        draw(buffer) {
            if (!this.needsDraw)
                return;
            this.widgets.forEach((w) => w.draw(buffer));
            this.needsDraw = false;
        }
        mousemove(e, term) {
            let handled = false;
            this.widgets.forEach((w) => {
                if (w.mousemove(e, term)) {
                    handled = true;
                }
            });
            return super.mousemove(e, term) || handled;
        }
    }

    class Text extends Widget {
        constructor(term, text, opts = {}) {
            super(term, opts);
            this.text = '';
            this._lines = [];
            this.text = text;
            this.bounds.width = opts.width || 0;
            this._lines = GWU__namespace.text.splitIntoLines(this.text, this.bounds.width > 0 ? this.bounds.width : 100);
            if (this.bounds.width <= 0) {
                this.bounds.width = this._lines.reduce((out, line) => Math.max(out, line.length), 0);
            }
            if (opts.height) {
                if (this._lines.length > opts.height) {
                    this._lines.length = opts.height;
                }
            }
            else {
                this.bounds.height = this._lines.length;
            }
        }
        draw(buffer, parentX = 0, parentY = 0) {
            if (!this.needsDraw)
                return;
            this.needsDraw = false;
            buffer.fillRect(this.bounds.x + parentX, this.bounds.y + parentY, this.bounds.width, this.bounds.height, ' ', this._used.bg, this._used.bg);
            this._lines.forEach((line, i) => {
                buffer.drawText(this.bounds.x + parentX, this.bounds.y + i + parentY, line, this._used.fg, -1, this.bounds.width, this._used.align);
            });
        }
    }

    class Grid {
        constructor(x, y) {
            this._left = 0;
            this._top = 0;
            this._colWidths = [];
            this._rowHeights = [];
            this._col = 0;
            this._row = -1;
            this.x = 0;
            this.y = 0;
            this._left = x;
            this._top = y;
            this.x = x;
            this.y = y;
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
            this._col = GWU__namespace.clamp(n, 0, this._colWidths.length - 1);
            return this._resetX()._resetY(); // move back to top of our current row
        }
        nextCol() {
            return this.col(this._col + 1);
        }
        row(n) {
            if (n === undefined)
                n = this._row;
            this._row = GWU__namespace.clamp(n, 0, this._rowHeights.length - 1);
            return this._resetY()._resetX(); // move back to beginning of current column
        }
        nextRow() {
            return this.row(this._row + 1).col(0);
        }
        setRowHeight(h) {
            if (h < 0)
                return this;
            this._rowHeights[this._row] = h;
            return this;
        }
        _resetX() {
            this.x = this._left;
            for (let i = 0; i < this._col; ++i) {
                this.x += this._colWidths[i];
            }
            return this;
        }
        _resetY() {
            this.y = this._top;
            for (let i = 0; i < this._row; ++i) {
                this.y += this._rowHeights[i];
            }
            return this;
        }
    }

    class Term {
        constructor(ui) {
            this.x = 0;
            this.y = 0;
            this.widgets = [];
            this.styles = new Sheet();
            this._currentWidget = null;
            this._style = new Style();
            this._grid = null;
            this.ui = ui;
            this.reset();
        }
        get buffer() {
            return this.ui.buffer;
        }
        get width() {
            return this.ui.width;
        }
        get height() {
            return this.ui.height;
        }
        // COLOR
        reset() {
            this._style.copy(this.styles.get('*'));
            return this;
        }
        fg(v) {
            this._style.set('fg', v);
            return this;
        }
        bg(v) {
            this._style.set('bg', v);
            return this;
        }
        dim(pct = 25, fg = true, bg = false) {
            this._style.dim(pct, fg, bg);
            return this;
        }
        bright(pct = 25, fg = true, bg = false) {
            this._style.bright(pct, fg, bg);
            return this;
        }
        invert() {
            this._style.invert();
            return this;
        }
        // STYLE
        loadStyle(name) {
            const s = this.styles.get(name);
            if (s) {
                this._style.copy(s);
            }
            return this;
        }
        style(opts) {
            this._style.set(opts);
            return this;
        }
        // POSITION
        pos(x, y) {
            this.x = GWU__namespace.clamp(x, 0, this.width);
            this.y = GWU__namespace.clamp(y, 0, this.height);
            return this;
        }
        moveTo(x, y) {
            return this.pos(x, y);
        }
        move(dx, dy) {
            this.x = GWU__namespace.clamp(this.x + dx, 0, this.width);
            this.y = GWU__namespace.clamp(this.y + dy, 0, this.height);
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
            return this.pos(0, this.y + n);
        }
        prevLine(n = 1) {
            return this.pos(0, this.y - n);
        }
        // EDIT
        // erase and move back to top left
        clear(color) {
            return this.erase(color).pos(0, 0);
        }
        // just erase screen
        erase(color) {
            // remove all widgets
            if (color === undefined) {
                color = this._style.bg;
            }
            this.buffer.fill(' ', color, color);
            return this;
        }
        eraseBelow() {
            // TODO - remove widgets below
            this.buffer.fillRect(0, this.y + 1, this.width, this.height - this.y - 1, ' ', this._style.bg, this._style.bg);
            return this;
        }
        eraseAbove() {
            // TODO - remove widgets above
            this.buffer.fillRect(0, 0, this.width, this.y - 1, ' ', this._style.bg, this._style.bg);
            return this;
        }
        eraseLine(n) {
            if (n === undefined) {
                n = this.y;
            }
            if (n >= 0 && n < this.height) {
                // TODO - remove widgets on line
                this.buffer.fillRect(0, n, this.width, 1, ' ', this._style.bg, this._style.bg);
            }
            return this;
        }
        eraseLineAbove() {
            return this.eraseLine(this.y - 1);
        }
        eraseLineBelow() {
            return this.eraseLine(this.y + 1);
        }
        // GRID
        // erases/clears current grid information
        grid() {
            this._grid = new Grid(this.x, this.y);
            return this;
        }
        endGrid() {
            this._grid = null;
            return this;
        }
        cols(...args) {
            if (!this._grid)
                return this;
            this._grid.cols(args[0], args[1]);
            return this;
        }
        rows(...args) {
            if (!this._grid)
                return this;
            this._grid.rows(args[0], args[1]);
            return this;
        }
        startRow(n) {
            if (!this._grid)
                return this;
            if (n !== undefined) {
                this._grid.row(n);
            }
            else {
                this._grid.nextRow();
            }
            this.pos(this._grid.x, this._grid.y);
            return this;
        }
        nextCol() {
            if (!this._grid)
                return this;
            this._grid.nextCol();
            this.pos(this._grid.x, this._grid.y);
            return this;
        }
        // new row height
        endRow(h) {
            if (!this._grid)
                return this;
            if (h !== undefined && h > 0) {
                this._grid.setRowHeight(h);
            }
            return this;
        }
        // moves to specific column
        col(n) {
            if (!this._grid)
                return this;
            this._grid.col(n);
            this.pos(this._grid.x, this._grid.y);
            return this;
        }
        // moves to specific row
        row(n) {
            if (!this._grid)
                return this;
            this._grid.row(n);
            this.pos(this._grid.x, this._grid.y);
            return this;
        }
        // DRAW
        drawText(text, width, _align) {
            const widget = new Text(this, text, {
                width,
                style: this._style,
            });
            widget.draw(this.buffer);
            return this;
        }
        border(w, h, bg, ascii = false) {
            bg = bg || this._style.fg;
            const buf = this.buffer;
            if (ascii) {
                for (let i = 1; i < w; ++i) {
                    buf.draw(this.x + i, this.y, '-', bg, -1);
                    buf.draw(this.x + i, this.y + h - 1, '-', bg, -1);
                }
                for (let j = 1; j < h; ++j) {
                    buf.draw(this.x, this.y + j, '|', bg, -1);
                    buf.draw(this.x + w - 1, this.y + j, '|', bg, -1);
                }
                buf.draw(this.x, this.y, '+', bg);
                buf.draw(this.x + w - 1, this.y, '+', bg);
                buf.draw(this.x, this.y + h - 1, '+', bg);
                buf.draw(this.x + w - 1, this.y + h - 1, '+', bg);
            }
            else {
                GWU__namespace.xy.forBorder(this.x, this.y, w, h, (x, y) => {
                    buf.draw(x, y, ' ', bg, bg);
                });
            }
            return this;
        }
        // WIDGETS
        get() {
            return this._currentWidget;
        }
        widgetAt(...args) {
            return this.widgets.find((w) => w.contains(args[0], args[1])) || null;
        }
        text(text, opts = {}) {
            // TODO - if in a grid cell, adjust width and height based on grid
            // opts.style = opts.style || this._style;
            const widget = new Text(this, text, opts);
            widget.draw(this.buffer);
            this._currentWidget = widget;
            this.widgets.push(widget);
            return widget;
        }
        // CONTROL
        render() {
            this.ui.render();
            return this;
        }
        // EVENTS
        mousemove(e) {
            let handled = false;
            this.widgets.forEach((w) => {
                if (w.mousemove(e, this)) {
                    handled = true;
                }
            });
            return handled;
        }
        draw() {
            this.widgets.forEach((w) => w.draw(this.buffer));
            this.render();
        }
    }

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Widget: Widget,
        WidgetGroup: WidgetGroup,
        Text: Text,
        Grid: Grid,
        Term: Term
    });

    exports.ActionButton = ActionButton;
    exports.ActorEntry = ActorEntry;
    exports.Box = Box;
    exports.Button = Button$1;
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
    exports.Text = Text$1;
    exports.UI = UI;
    exports.Viewport = Viewport;
    exports.Widget = Widget$1;
    exports.buildDialog = buildDialog;
    exports.html = index$1;
    exports.makeTable = makeTable;
    exports.showDropDown = showDropDown;
    exports.term = index;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
