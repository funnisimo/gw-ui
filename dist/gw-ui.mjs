import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

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
        this.bounds = new GWU.xy.Bounds(-1, -1, -1, -1); // nothing set
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
        const textLen = GWU.text.length(this.text);
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
            this.lines = GWU.text.splitIntoLines(this.text, 
            // @ts-ignore
            opts.width);
        }
        else {
            const textLen = GWU.text.length(this.text);
            opts.width = opts.width || textLen || 10;
            if (opts.width < textLen) {
                opts.text = GWU.text.truncate(this.text, opts.width);
            }
            this.lines = [this.text];
        }
        opts.height = Math.max(this.lines.length, opts.height || 1);
        super.init(opts);
    }
    setText(text) {
        this.text = text;
        if (this.wrap) {
            this.lines = GWU.text.splitIntoLines(this.text, this.bounds.width);
        }
        else {
            const textLen = GWU.text.length(this.text);
            if (textLen > this.bounds.width) {
                this.text = GWU.text.truncate(this.text, this.bounds.width);
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
        opts.tabStop = GWU.first(opts.tabStop, true); // Can receive input (Enter)
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

class Input extends Widget {
    constructor(id, opts) {
        super(id, opts);
    }
    init(opts) {
        this.minLength = opts.minLength || 1;
        if (!opts.width) {
            opts.width = Math.max(this.minLength, 10);
        }
        opts.tabStop = GWU.first(opts.tabStop, true); // Need to receive input
        super.init(opts);
        this.default = opts.default || '';
        this.errorFg = opts.errorFg || this.fg;
        this.hint = opts.hint || '';
        this.hintFg = opts.hintFg || this.errorFg;
        this.numbersOnly = opts.numbersOnly || false;
        this.min = GWU.first(opts.min, Number.MIN_SAFE_INTEGER);
        this.max = GWU.first(opts.max, Number.MAX_SAFE_INTEGER);
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
                this.text = GWU.text.spliceRaw(this.text, this.text.length - 1, 1);
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
        this._value = GWU.IDENTITY;
        // align: Widget.Align = 'left';
        // valign: Widget.VAlign = 'middle';
        // hover: HoverType = 'cell';
        this.x = -1;
        this.width = -1;
        this.index = -1;
        GWU.object.assignOmitting('value', this, opts);
        if (this.width <= 0) {
            this.width = this.header.length || 1;
        }
        if (typeof opts.value === 'string') {
            this._value = GWU.text.compile(opts.value);
        }
        else {
            this._value = opts.value || GWU.IDENTITY;
        }
        if (opts.align)
            this.align = opts.align;
    }
    value(data, index) {
        const v = this._value(data, index);
        return GWU.text.truncate(v, this.width);
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
        opts.tabStop = GWU.first(opts.tabStop, true);
        super.init(opts);
        this.headers = GWU.first(opts.headers, true);
        this.letters = GWU.first(opts.letters, true);
        this.columns = [];
        this.hoverType = opts.hover || 'row';
        this.wrapColumns = GWU.first(opts.wrapColumns, opts.wrap, true);
        this.wrapRows = GWU.first(opts.wrapRows, opts.wrap, true);
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
            : GWU.list.length(this.data);
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
            : GWU.list.length(this.data);
        this.selectedIndex = GWU.nextIndex(this.selectedIndex, len, wrap);
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
            : GWU.list.length(this.data);
        this.selectedIndex = GWU.prevIndex(this.selectedIndex, len, wrap);
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
            let index = GWU.nextIndex(this.selectedColumn.index, this.columns.length, wrap);
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
            let index = GWU.prevIndex(this.selectedColumn.index, this.columns.length, wrap);
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
            return GWU.list.at(this.data, this.selectedIndex);
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
            GWU.list.forEach(this.data, (item, index) => {
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
                opts.depth = -1; // hid behind other widgets
            if (opts.title)
                opts.text = opts.title;
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
    constructor(ui, opts) {
        this.title = '';
        this.titleFg = 0xfff;
        this.bg = 0x999;
        this.borderBg = 0x999;
        this.widgets = [];
        this.eventHandlers = {};
        this._activeWidget = null;
        this.result = null;
        this.done = false;
        this.timers = {};
        this.needsRedraw = true;
        this.ui = ui;
        this.id = 'DIALOG';
        this.bounds = new GWU.xy.Bounds(-1, -1, 0, 0);
        if (opts)
            this.init(opts);
    }
    init(opts) {
        if (opts.id)
            this.id = opts.id;
        if (opts.x !== undefined)
            this.bounds.x = opts.x;
        if (opts.y !== undefined)
            this.bounds.y = opts.y;
        if (opts.height !== undefined)
            this.bounds.height = opts.height;
        if (opts.width !== undefined)
            this.bounds.width = opts.width;
        if (opts.title)
            this.title = opts.title;
        if (opts.titleFg)
            this.titleFg = opts.titleFg;
        if (opts.bg) {
            this.bg = opts.bg;
            this.borderBg = opts.bg;
        }
        if (opts.borderBg) {
            this.borderBg = opts.borderBg;
        }
        if (opts.widgets) {
            opts.widgets.forEach((w) => this.widgets.push(w));
        }
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
    contains(e) {
        return this.bounds.contains(e);
    }
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
        return this.widgets.find((w) => w.contains(x, y)) || null;
    }
    getWidget(id) {
        return this.widgets.find((w) => w.id === id) || null;
    }
    nextTabstop() {
        if (!this.activeWidget) {
            this.setActiveWidget(this.widgets.find((w) => w.tabStop) || null);
            return !!this.activeWidget;
        }
        const next = GWU.arrayNext(this.widgets, this.activeWidget, (w) => w.tabStop);
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
        const prev = GWU.arrayPrev(this.widgets, this.activeWidget, (w) => w.tabStop);
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
        this.ui.resetLayerBuffer(buffer);
        // Draw dialog
        if (this.borderBg) {
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this.borderBg, this.borderBg);
            buffer.fillRect(this.bounds.x + 1, this.bounds.y + 1, this.bounds.width - 2, this.bounds.height - 2, ' ', this.bg, this.bg);
        }
        else {
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', this.bg, this.bg);
        }
        if (this.title) {
            const x = this.bounds.x +
                Math.floor((this.bounds.width - GWU.text.length(this.title)) / 2);
            buffer.drawText(x, this.bounds.y, this.title, this.titleFg);
        }
        this.widgets.forEach((w) => w.draw(buffer));
    }
}
class DialogBuilder {
    constructor(ui, opts = {}) {
        this.nextY = 0;
        this.nextY = 1;
        this.dialog = new Dialog(ui, opts);
    }
    with(widget) {
        // widget bounds are set relative to the dialog top left,
        // if we don't get any, help them out
        // TODO - Get rid of x, y
        this.addWidget(widget);
        this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1);
        return this;
    }
    center() {
        const size = this.dialog.ui.buffer;
        const bounds = this.dialog.bounds;
        bounds.x = Math.floor((size.width - bounds.width) / 2);
        bounds.y = Math.floor((size.height - bounds.height) / 2);
        return this;
    }
    place(x, y) {
        const bounds = this.dialog.bounds;
        bounds.x = x;
        bounds.y = y;
        return this;
    }
    done() {
        if (this.dialog.bounds.x < 0)
            this.dialog.bounds.x = 0;
        if (this.dialog.bounds.y < 0)
            this.dialog.bounds.y = 0;
        if (this.dialog.bounds.right > this.dialog.ui.buffer.width)
            throw new Error('Dialog is off screen!');
        if (this.dialog.bounds.bottom > this.dialog.ui.buffer.height)
            throw new Error('Dialog is off screen!');
        // lock in locations
        this.dialog.widgets.forEach((w) => {
            w.bounds.x += this.dialog.bounds.x;
            w.bounds.y += this.dialog.bounds.y;
        });
        return this.dialog;
    }
    addWidget(widget) {
        const dlgBounds = this.dialog.bounds;
        const x = widget.bounds.x;
        const y = widget.bounds.y;
        if (x >= 0) {
            dlgBounds.width = Math.max(dlgBounds.width, widget.bounds.width + x);
        }
        else if (x < 0) {
            widget.bounds.x = dlgBounds.width - widget.bounds.width + x;
        }
        if (y >= 0) {
            dlgBounds.height = Math.max(dlgBounds.height, widget.bounds.height + y);
        }
        else if (y < 0) {
            widget.bounds.y = dlgBounds.height - widget.bounds.height + y;
        }
        this.dialog.widgets.push(widget);
        return widget;
    }
}
function buildDialog(ui, opts = {}) {
    return new DialogBuilder(ui, opts);
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
        this.loop = opts.loop || GWU.loop;
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
        this.buffer =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
        // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
        this.buffer.copy(base);
        return this.buffer;
    }
    resetLayerBuffer(dest) {
        const base = this.layers[this.layers.length - 1] || this.canvas.buffer;
        dest.copy(base);
    }
    finishLayer() {
        if (!this.inDialog)
            return;
        if (this.buffer !== this.canvas.buffer) {
            this.freeBuffers.push(this.buffer);
        }
        this.buffer = this.layers.pop() || this.canvas.buffer;
        this.buffer.render();
        this.inDialog = this.layers.length > 0;
    }
    // UTILITY FUNCTIONS
    async fadeTo(color = 'black', duration = 1000) {
        color = GWU.color.from(color);
        const buffer = this.startLayer();
        let pct = 0;
        let elapsed = 0;
        while (elapsed < duration) {
            elapsed += 32;
            if (await this.loop.pause(32)) {
                elapsed = duration;
            }
            pct = Math.floor((100 * elapsed) / duration);
            this.resetLayerBuffer(buffer);
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
            text = GWU.text.apply(text, args);
        }
        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;
        opts.width = opts.width || GWU.text.length(text) + 2 * padX;
        const textOpts = {
            fg: opts.fg,
            text,
            x: padX,
            y: padY,
            wrap: opts.width - 2 * padX,
        };
        textOpts.text = text;
        textOpts.wrap = opts.width;
        const textWidget = new Text('TEXT', textOpts);
        opts.height =
            (opts.title ? 1 : 0) + padY + textWidget.bounds.height + padY;
        const dlg = buildDialog(this, opts)
            .with(textWidget)
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
            text = GWU.text.apply(text, textArgs);
        }
        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;
        opts.width =
            opts.width ||
                Math.min(Math.floor(this.buffer.width / 2), GWU.text.length(text) + 2 * padX);
        let textWidth = opts.width - 2 * padX;
        const textOpts = {
            fg: opts.fg,
            text,
            wrap: textWidth,
            y: opts.title ? 2 : 1,
            x: padX,
        };
        const textWidget = new Text('TEXT', textOpts);
        opts.height =
            (opts.title ? 1 : 0) + padY + textWidget.bounds.height + 2 + padY;
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
        const okOpts = Object.assign({}, opts.buttons, { text: 'OK', y: -padY, x: padX }, opts.ok);
        const cancelOpts = Object.assign({}, opts.buttons, { text: 'CANCEL', y: -padY, x: -padX }, opts.cancel);
        const builder = buildDialog(this, opts)
            .with(textWidget)
            .with(new Button('OK', okOpts));
        if (opts.allowCancel) {
            builder.with(new Button('CANCEL', cancelOpts));
        }
        const dlg = builder.center().done();
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
        if (widget.bounds.x < 0) {
            widget.bounds.x = Math.floor((this.buffer.width - widget.bounds.width) / 2);
        }
        if (widget.bounds.y < 0) {
            widget.bounds.y = Math.floor((this.buffer.height - widget.bounds.height) / 2);
        }
        const dlg = new Dialog(this, {
            width: widget.bounds.width,
            height: widget.bounds.height,
            widgets: [widget],
            x: widget.bounds.x,
            y: widget.bounds.y,
            bg: -1,
        });
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
        const widget = new Input('INPUT', opts);
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
            prompt = GWU.text.apply(prompt, args);
        }
        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;
        opts.width =
            opts.width ||
                Math.min(Math.floor(this.buffer.width / 2), GWU.text.length(prompt) + 2 * padX);
        let promptWidth = opts.width - 2 * padX;
        const promptOpts = {
            fg: opts.fg,
            text: prompt,
            wrap: promptWidth,
            x: padX,
            y: (opts.title ? 1 : 0) + padY,
        };
        const promptWidget = new Text('TEXT', promptOpts);
        opts.height =
            (opts.title ? 1 : 0) +
                padY +
                promptWidget.bounds.height +
                3 +
                1 +
                padY;
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
        const okOpts = Object.assign({}, opts.buttons, { text: 'OK', y: -padY, x: padX }, opts.ok);
        const cancelOpts = Object.assign({}, opts.buttons, { text: 'CANCEL', y: -padY, x: -padX }, opts.cancel);
        opts.input = opts.input || {};
        opts.input.width = opts.input.width || promptWidth;
        opts.input.bg = opts.input.bg || opts.fg;
        opts.input.fg = opts.input.fg || opts.bg;
        opts.input.x = padX;
        opts.input.y = opts.height - 1 - padY - 2;
        const inputWidget = new Input('INPUT', opts.input || {});
        const builder = buildDialog(this, opts)
            .with(promptWidget)
            .with(inputWidget)
            .with(new Button('OK', okOpts));
        if (opts.allowCancel) {
            builder.with(new Button('CANCEL', cancelOpts));
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
        this.cache = new GWU.message.MessageCache({
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
        const fg = GWU.color.from(this.fg);
        totalMessageCount = Math.min(totalMessageCount, isOnTop ? dbuf.height - this.bounds.top : this.bounds.bottom + 1);
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
                    : this.bounds.bottom - currentM + 1;
                const endY = isOnTop ? this.bounds.y : this.bounds.bottom;
                const dy = isOnTop ? -1 : 1;
                ui.resetLayerBuffer(dbuf);
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
            this.offsetX = GWU.clamp(this.offsetX, 0, map.width - this.bounds.width);
        }
        if (this.lockY && map) {
            this.offsetY = GWU.clamp(this.offsetY, 0, map.height - this.bounds.height);
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

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);
class Flavor extends Text {
    constructor(id, opts) {
        super(id, opts);
    }
    init(opts) {
        opts.fg = opts.fg || 'flavorText';
        opts.bg = opts.bg || 'black';
        super.init(opts);
        this.promptFg = GWU.color.from(opts.promptFg || 'flavorPrompt');
        this.overflow = opts.overflow || false;
        this.isPrompt = false;
    }
    showText(text) {
        this.text = GWU.text.capitalize(text);
        const len = GWU.text.length(this.text);
        if (len > this.bounds.width) {
            this.lines = GWU.text.splitIntoLines(this.text, this.bounds.width);
            if (!this.overflow && this.lines.length > this.bounds.height) {
                if (this.bounds.height == 1) {
                    this.text = GWU.text.truncate(this.text, this.bounds.width);
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
        this.bounds = new GWU.xy.Bounds(0, 0, 0, 0);
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
    button.buttons[0].hovered = true;
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
        draw: () => {
            if (!activeButton)
                return;
            ui.resetLayerBuffer(buffer);
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
        opts.fg = GWU.first(opts.fg, 'black');
        opts.bg = GWU.first(opts.bg, 'light_gray');
        opts.height = opts.height || 1;
        opts.tabStop = GWU.first(opts.tabStop, true);
        super.init(opts);
        this.dropFg = GWU.color.from(opts.dropFg || this.fg);
        this.dropBg = GWU.color.from(opts.dropBg || this.bg);
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
        return GWU.arrayFindRight(this.buttons, (b) => b.x < x) || null;
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
        if (x + text.length + 2 > this.bounds.width) {
            throw new Error('Button makes menu too wide :' + text);
        }
        let button;
        if (typeof config === 'string') {
            button = new ActionButton(text, config);
        }
        else {
            const dropdown = new DropDownButton(this, null, text, config);
            dropdown.bounds.x = x;
            if (this.bounds.y) {
                dropdown.bounds.y = this.bounds.y - dropdown.bounds.height;
            }
            else {
                dropdown.bounds.y = this.bounds.y + 1;
            }
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

export { ActionButton, ActorEntry, Box, Button, CellEntry, Column, Dialog, DialogBuilder, DropDownButton, EntryBase, Flavor, Input, ItemEntry, List, Menu, MenuButton, Messages, Sidebar, Table, Text, UI, Viewport, Widget, buildDialog, makeTable, showDropDown };
