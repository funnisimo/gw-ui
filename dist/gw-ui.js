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
            this.fg = 0xfff;
            this.bg = -1;
            this.activeFg = 0xfff;
            this.activeBg = -1;
            this.hoverFg = 0xfff;
            this.hoverBg = -1;
            this.text = '';
            this.align = 'left';
            this.valign = 'middle';
            this.bounds = new GWU__namespace.xy.Bounds(0, 0, 0, 0);
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
            if (opts.text) {
                this.text = opts.text;
                if (!this.bounds.width)
                    this.bounds.width = opts.text.length;
                if (!this.bounds.height)
                    this.bounds.height = 1;
            }
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
        contains(x, y) {
            if (arguments.length == 1)
                return this.bounds.contains(x);
            return this.bounds.contains(x, y);
        }
        // returns true if mouse is over this widget
        mousemove(e, _ui) {
            this.hovered = this.contains(e);
            return this.hovered;
        }
        tick(_e, _ui) { }
        // returns true if click is handled by this widget (stopPropagation)
        click(_e, _ui) {
            return false;
        }
        // returns true if key is used by widget and you want to stopPropagation
        keypress(_e, _ui) {
            return false;
        }
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
        // TODO - get text() {}, set text(v:string) { // do lines stuff }
        draw(buffer) {
            const fg = this.active ? this.activeFg : this.fg;
            const bg = this.active ? this.activeBg : this.bg;
            this.lines.forEach((line, i) => {
                buffer.drawText(this.bounds.x, this.bounds.y + i, line, fg, bg, this.bounds.width);
            });
        }
    }

    class Button$1 extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            var _a;
            this.actionFn = null;
            if (!opts.text)
                throw new Error('Must have text value in config for Button widget - ' + this.id);
            opts.tabStop = (_a = opts.tabStop) !== null && _a !== void 0 ? _a : true; // Can receive input (Enter)
            super.init(opts);
            if (opts.actionFn)
                this.actionFn = opts.actionFn;
        }
        click(ev) {
            if (!this.contains(ev))
                return false;
            let r;
            if (this.actionFn) {
                r = this.actionFn(ev, this);
            }
            else {
                r = this.parent.fireAction(this.action, this);
            }
            if (r)
                return r.then(() => true);
            return true;
        }
        keypress(ev) {
            if (!ev.key)
                return false;
            if (ev.key === 'Enter') {
                const r = this.parent.fireAction(this.action, this);
                if (r)
                    return r.then(() => true);
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
            var _a, _b, _c;
            this.minLength = opts.minLength || 1;
            if (!opts.width) {
                opts.width = Math.max(this.minLength, 10);
            }
            opts.tabStop = (_a = opts.tabStop) !== null && _a !== void 0 ? _a : true; // Need to receive input
            super.init(opts);
            this.default = opts.default || '';
            this.errorFg = opts.errorFg || this.fg;
            this.hint = opts.hint || '';
            this.hintFg = opts.hintFg || this.errorFg;
            this.numbersOnly = opts.numbersOnly || false;
            this.min = (_b = opts.min) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
            this.max = (_c = opts.max) !== null && _c !== void 0 ? _c : Number.MAX_SAFE_INTEGER;
            if (!this.bounds.width) {
                if (this.hint)
                    this.bounds.width = this.hint.length;
                if (this.default)
                    this.bounds.width = this.default.length;
            }
            if (!this.bounds.height) {
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
        keypress(ev, _ui) {
            const textEntryBounds = this.numbersOnly ? ['0', '9'] : [' ', '~'];
            if (!ev.key)
                return false;
            if (ev.key === 'Enter' && this.isValid()) {
                const r = this.parent.fireAction(this.action, this);
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

    class Dialog {
        constructor(ui, opts) {
            this.title = '';
            this.titleFg = 0xfff;
            this.bg = 0x999;
            this.borderBg = 0x999;
            this.widgets = [];
            this.actionHandlers = {};
            this.keypressHandlers = {};
            this.clickHandlers = {};
            this._activeWidget = null;
            this.result = null;
            this.done = false;
            this.timers = {};
            this.needsRedraw = true;
            this.ui = ui;
            this.id = 'DIALOG';
            this.bounds = new GWU__namespace.xy.Bounds(-1, -1, 0, 0);
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
        }
        get activeWidget() {
            return this._activeWidget;
        }
        set activeWidget(w) {
            if (this._activeWidget) {
                this._activeWidget.active = false;
            }
            this._activeWidget = w;
            if (this._activeWidget) {
                this._activeWidget.active = true;
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
        fireAction(action, widget) {
            const handler = this.actionHandlers[action];
            if (handler) {
                return handler(action, widget, this);
            }
        }
        setActionHandlers(map) {
            this.actionHandlers = map;
        }
        setKeyHandlers(map) {
            this.keypressHandlers = map;
        }
        setClickHandlers(map) {
            this.clickHandlers = map;
        }
        async show() {
            this.done = false;
            // reset any temp data...
            this.widgets.forEach((w) => w.reset());
            // first tabStop is the starting active Widget
            this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
            // start dialog
            const buffer = this.ui.startDialog();
            // run input loop
            await this.ui.loop.run({
                keypress: this.keypress.bind(this),
                mousemove: this.mousemove.bind(this),
                click: this.click.bind(this),
                tick: this.tick.bind(this),
                draw: () => {
                    this.draw(buffer);
                    buffer.render();
                },
            }, 100);
            // stop dialog
            this.ui.finishDialog();
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
                this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
                return !!this.activeWidget;
            }
            const next = GWU__namespace.arrayNext(this.widgets, this.activeWidget, (w) => w.tabStop);
            if (next) {
                this.activeWidget = next;
                return true;
            }
            return false;
        }
        prevTabstop() {
            if (!this.activeWidget) {
                this.activeWidget = this.widgets.find((w) => w.tabStop) || null;
                return !!this.activeWidget;
            }
            const prev = GWU__namespace.arrayPrev(this.widgets, this.activeWidget, (w) => w.tabStop);
            if (prev) {
                this.activeWidget = prev;
                return true;
            }
            return false;
        }
        tick(e) {
            const dt = e.dt;
            let promises = [];
            Object.entries(this.timers).forEach(([action, time]) => {
                time -= dt;
                if (time <= 0) {
                    delete this.timers[action];
                    const r = this.fireAction(action, null);
                    if (r && r.then) {
                        promises.push(r);
                    }
                }
                else {
                    this.timers[action] = time;
                }
            });
            for (let w of this.widgets) {
                const r = w.tick(e, this.ui);
                if (r && r.then) {
                    promises.push(r);
                }
            }
            if (promises.length) {
                return Promise.all(promises).then(() => this.done);
            }
            return this.done;
        }
        // TODO - async - to allow animations or events on mouseover?
        mousemove(e) {
            // this.activeWidget = null;
            this.widgets.forEach((w) => {
                w.mousemove(e, this.ui);
                if (w.hovered && w.tabStop) {
                    this.activeWidget = w;
                }
            });
            return this.done;
        }
        click(e) {
            this.mousemove(e); // make sure activeWidget is set correctly
            let fn = null;
            if (this.activeWidget) {
                fn = this.clickHandlers[this.activeWidget.id];
            }
            if (!fn && this.contains(e)) {
                fn = this.clickHandlers[this.id];
            }
            if (!fn) {
                fn = this.clickHandlers.click;
            }
            if (fn) {
                const r = fn(e, this.activeWidget, this);
                if (r && r.then) {
                    return r.then(() => this.done);
                }
            }
            else if (this.activeWidget) {
                const r = this.activeWidget.click(e, this.ui);
                if (typeof r !== 'boolean') {
                    return r.then(() => this.done);
                }
            }
            return this.done;
        }
        keypress(e) {
            if (!e.key)
                return false;
            const fn = this.keypressHandlers[e.key] ||
                (e.code && this.keypressHandlers[e.code]) ||
                this.keypressHandlers.keypress;
            if (fn) {
                const r = fn(e, this.activeWidget, this);
                if (r && r.then) {
                    return r.then(() => this.done);
                }
                return this.done;
            }
            if (this.activeWidget) {
                const r = this.activeWidget.keypress(e, this.ui);
                if (typeof r !== 'boolean') {
                    return r.then(() => this.done);
                }
                if (e.key === 'Tab') {
                    // Next widget
                    this.nextTabstop();
                }
                else if (e.key === 'TAB') {
                    // Prev Widget
                    this.prevTabstop();
                }
            }
            return this.done;
        }
        draw(buffer, force = false) {
            if (!this.needsRedraw && !force)
                return;
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
                    Math.floor((this.bounds.width - GWU__namespace.text.length(this.title)) / 2);
                buffer.drawText(x, this.bounds.y, this.title, this.titleFg);
            }
            this.widgets.forEach((w) => w.draw(buffer));
        }
    }
    class DialogBuilder {
        constructor(ui, opts = {}) {
            this.nextY = 0;
            this.padY = 1;
            this.padX = 1;
            this.padX = opts.padX || opts.pad || 1;
            this.padY = opts.padY || opts.pad || 1;
            this.nextY = this.padY;
            this.dialog = new Dialog(ui, opts);
        }
        with(widget) {
            // widget bounds are set relative to the dialog top left,
            // if we don't get any, help them out
            let y = widget.bounds.y;
            if (y >= 0 && y < this.padY) {
                y = this.nextY;
            }
            else if (y < 0 && y > -this.padY) {
                y = -this.padY;
            }
            widget.bounds.y = y;
            let x = widget.bounds.x;
            if (x >= 0 && x < this.padX) {
                x = this.padX;
            }
            else if (x < 0 && x > -this.padX) {
                x = -this.padX;
            }
            widget.bounds.x = x;
            // TODO - Get rid of x, y
            this.addWidget(widget);
            this.nextY = Math.max(this.nextY, widget.bounds.bottom + 1 + this.padY);
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
            // lock in locations
            this.dialog.widgets.forEach((w) => {
                w.bounds.x += this.dialog.bounds.x;
                w.bounds.y += this.dialog.bounds.y;
            });
            return this.dialog;
        }
        addWidget(widget) {
            widget.parent = this.dialog;
            const dlgBounds = this.dialog.bounds;
            const x = widget.bounds.x;
            const y = widget.bounds.y;
            if (x >= 0) {
                dlgBounds.width = Math.max(dlgBounds.width, widget.bounds.width + x + this.padX);
            }
            else {
                widget.bounds.right = dlgBounds.width + x - 1;
            }
            if (y >= 0) {
                dlgBounds.height = Math.max(dlgBounds.height, widget.bounds.height + y + this.padY);
            }
            else {
                widget.bounds.bottom = dlgBounds.height + y - 1;
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
        startDialog() {
            this.inDialog = true;
            const base = this.buffer || this.canvas.buffer;
            this.layers.push(base);
            this.buffer =
                this.freeBuffers.pop() || new GWU__namespace.canvas.Buffer(this.canvas);
            // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
            this.buffer.copy(base);
            return this.buffer;
        }
        resetDialogBuffer(dest) {
            const base = this.layers[this.layers.length - 1] || this.canvas.buffer;
            dest.copy(base);
        }
        finishDialog() {
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
            color = GWU__namespace.color.from(color);
            const buffer = this.startDialog();
            let pct = 0;
            let elapsed = 0;
            while (elapsed < duration) {
                elapsed += 32;
                if (await this.loop.pause(32)) {
                    elapsed = duration;
                }
                pct = Math.floor((100 * elapsed) / duration);
                this.resetDialogBuffer(buffer);
                buffer.mix(color, pct);
                buffer.render();
            }
            this.finishDialog();
        }
        async alert(opts, text, args) {
            if (typeof opts === 'number') {
                opts = { duration: opts };
            }
            if (args) {
                text = GWU__namespace.text.apply(text, args);
            }
            const padX = opts.padX || opts.pad || 1;
            const padY = opts.padY || opts.pad || 1;
            opts.width = opts.width || GWU__namespace.text.length(text) + padX * 2;
            const textOpts = {
                fg: opts.fg,
                text,
                x: padX,
                y: padY,
                wrap: opts.width - 2 * padX,
            };
            textOpts.text = text;
            textOpts.wrap = opts.width;
            const dlg = buildDialog(this, opts)
                .with(new Text('TEXT', textOpts))
                .center()
                .done();
            dlg.setClickHandlers({ click: () => dlg.close(true) }); // any click
            dlg.setKeyHandlers({ keypress: () => dlg.close(true) }); // any key
            dlg.setActionHandlers({ TIMEOUT: () => dlg.close(false) });
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
            const padX = opts.padX || opts.pad || 1;
            const padY = opts.padY || opts.pad || 1;
            opts.width =
                opts.width ||
                    Math.min(Math.floor(this.buffer.width / 2), GWU__namespace.text.length(text) + padX * 2);
            let textWidth = opts.width - padX * 2;
            const textOpts = {
                fg: opts.fg,
                text,
                wrap: textWidth,
            };
            const textWidget = new Text('TEXT', textOpts);
            opts.height = textWidget.bounds.height + 2 * padY + 2;
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
                .with(new Button$1('OK', okOpts));
            if (opts.allowCancel) {
                builder.with(new Button$1('CANCEL', cancelOpts));
            }
            const dlg = builder.center().done();
            dlg.setClickHandlers({
                OK() {
                    dlg.close(true);
                },
                CANCEL() {
                    dlg.close(false);
                },
            });
            dlg.setKeyHandlers({
                Escape() {
                    dlg.close(false);
                },
                Enter() {
                    dlg.close(true);
                },
            });
            return await dlg.show();
        }
        // assumes you are in a dialog and give the buffer for that dialog
        async getInputAt(x, y, maxLength, opts = {}) {
            opts.width = maxLength;
            opts.x = x;
            opts.y = y;
            const widget = new Input('INPUT', opts);
            const buffer = this.startDialog();
            await this.loop.run({
                Enter: () => {
                    return true; // done
                },
                Escape: () => {
                    widget.text = '';
                    return true; // done
                },
                keypress: (e) => {
                    widget.keypress(e, this);
                },
                draw() {
                    widget.draw(buffer);
                    buffer.render();
                },
            });
            this.finishDialog();
            return widget.text;
        }
        async inputBox(opts, prompt, args) {
            const padX = opts.padX || opts.pad || 1;
            const padY = opts.padY || opts.pad || 1;
            if (args) {
                prompt = GWU__namespace.text.apply(prompt, args);
            }
            opts.width =
                opts.width ||
                    Math.min(Math.floor(this.buffer.width / 2), GWU__namespace.text.length(prompt) + padX * 2);
            let promptWidth = opts.width - padX * 2;
            const promptOpts = {
                fg: opts.fg,
                text: prompt,
                wrap: promptWidth,
            };
            const promptWidget = new Text('TEXT', promptOpts);
            opts.height = promptWidget.bounds.height + 2 * padY + 4;
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
            const inputWidget = new Input('INPUT', opts.input || {});
            const builder = buildDialog(this, opts)
                .with(promptWidget)
                .with(inputWidget)
                .with(new Button$1('OK', okOpts));
            if (opts.allowCancel) {
                builder.with(new Button$1('CANCEL', cancelOpts));
            }
            const dlg = builder.center().done();
            dlg.setClickHandlers({
                OK() {
                    dlg.close(inputWidget.text);
                },
                CANCEL() {
                    dlg.close('');
                },
            });
            dlg.setKeyHandlers({
                Escape() {
                    dlg.close('');
                },
                Enter() {
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
            super.init(opts);
            if (!this.bounds.height)
                throw new Error('Must provde a height for messages widget.');
            this.cache = new GWU__namespace.message.MessageCache({
                width: this.bounds.width,
                length: opts.length || 40,
                match: (_x, _y) => {
                    if (this.parent)
                        this.parent.requestRedraw();
                    return true;
                },
            });
        }
        click(e, ui) {
            if (!this.contains(e))
                return false;
            return this.showArchive(ui).then(() => true);
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
        async showArchive(ui) {
            let reverse, fadePercent = 0;
            let fastForward;
            // Count the number of lines in the archive.
            let totalMessageCount = this.cache.length;
            if (totalMessageCount <= this.bounds.height)
                return false;
            const isOnTop = this.bounds.y < 10;
            const dbuf = ui.startDialog();
            const fg = GWU__namespace.color.from(this.fg);
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
                    ui.resetDialogBuffer(dbuf);
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
            ui.finishDialog();
            this.cache.confirmAll();
            if (this.parent)
                this.parent.requestRedraw(); // everything is confirmed
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
            if (this.parent)
                this.parent.requestRedraw();
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
            if (this.parent)
                this.parent.requestRedraw();
        }
        clear() {
            this.text = '';
            this.lines = [''];
            this.isPrompt = false;
            if (this.parent)
                this.parent.requestRedraw();
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
        mousemove(e, ui) {
            super.mousemove(e, ui);
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
            if (this.parent)
                this.parent.requestRedraw();
            return this.highlight !== last;
        }
        clearHighlight() {
            const result = !!this.highlight;
            this.highlight = null;
            if (this.parent)
                this.parent.requestRedraw();
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
            if (this.parent)
                this.parent.requestRedraw();
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

    class Button {
        constructor(text) {
            this.hovered = false;
            this.x = 999;
            this.text = text;
        }
        get width() {
            return this.text.length;
        }
    }
    class ActionButton extends Button {
        constructor(text, fn) {
            super(text);
            this.fn = fn;
        }
        activate(e, ui) {
            return this.fn(e, ui, this);
        }
    }
    class DropDownButton extends Button {
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
            if (typeof config === 'function') {
                button = new ActionButton(text, config);
            }
            else if (typeof config === 'string') {
                button = new ActionButton(text, () => {
                    const r = this.menu.parent.fireAction(config, this.menu);
                    if (r && r.then) {
                        return r.then(() => true);
                    }
                    return true;
                });
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
    async function showDropDown(menu, button, ui) {
        // Start dialog
        const dialog = ui.startDialog();
        let activeButton = button;
        await ui.loop.run({
            Escape() {
                return true;
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
                            selected.setBounds(ui.buffer, activeButton.bounds.x, e.y, activeButton.bounds.width);
                            activeButton = selected;
                        }
                    }
                }
                else {
                    if (menu.contains(e)) {
                        if (menu.parent)
                            menu.parent.requestRedraw();
                        const button = menu.getButtonAt(e.x, e.y);
                        if (button instanceof DropDownButton) {
                            activeButton.hovered = false;
                            activeButton = button;
                            activeButton.hovered = true;
                        }
                        else {
                            activeButton = null; // done.
                            if (button)
                                button.hovered = true;
                        }
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
                    return actionButton.activate(e, ui); // actions return true if they want to close the menu (otherwise the menu stays open)
                }
            },
            draw: () => {
                if (!activeButton)
                    return;
                ui.resetDialogBuffer(dialog);
                activeButton.draw(dialog);
                menu.draw(dialog);
                dialog.render();
            },
        });
        ui.finishDialog();
        menu.clearHighlight();
    }
    class Menu extends Widget {
        constructor(id, opts) {
            super(id, opts);
        }
        init(opts) {
            var _a, _b;
            opts.fg = (_a = opts.fg) !== null && _a !== void 0 ? _a : 'black';
            opts.bg = (_b = opts.bg) !== null && _b !== void 0 ? _b : 'light_gray';
            opts.height = opts.height || 1;
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
        mousemove(e) {
            // turn off all the hovers
            this.buttons.forEach((b) => {
                if (b.hovered) {
                    b.hovered = false;
                }
            });
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
                }
                if (this.parent)
                    this.parent.requestRedraw();
                return true; // we handled the message
            }
            return false;
        }
        clearHighlight() {
            this.buttons.forEach((b) => {
                b.hovered = false;
            });
            if (this.parent)
                this.parent.requestRedraw();
        }
        getButtonAt(x, _y) {
            return GWU__namespace.arrayFindRight(this.buttons, (b) => b.x < x) || null;
        }
        async click(e, ui) {
            if (this.bounds.contains(e)) {
                // get active button
                let activeButton = this.getButtonAt(e.x, e.y);
                if (!activeButton)
                    return false;
                if (activeButton instanceof DropDownButton) {
                    await showDropDown(this, activeButton, ui);
                }
                else if (activeButton instanceof ActionButton) {
                    await activeButton.activate(e, ui);
                }
                return true;
            }
            return false;
        }
        _addButton(text, config) {
            const x = this.buttons.reduce((len, button) => len + button.text.length + this.separator.length, this.lead.length + this.bounds.x);
            if (x + text.length + 2 > this.bounds.width) {
                throw new Error('Button makes menu too wide :' + text);
            }
            let button;
            if (typeof config === 'function') {
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
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, 1, 0, 0, this.bg);
            let x = this.bounds.x;
            const y = this.bounds.y;
            buffer.drawText(x, y, this.lead, this.fg);
            this.buttons.forEach((b) => {
                const color = b.hovered ? this.activeFg : this.fg;
                const bgColor = b.hovered ? this.activeBg : this.bg;
                buffer.drawText(b.x, y, b.text, color, bgColor);
                x = b.x + b.text.length;
                buffer.drawText(x, y, this.separator, this.fg);
            });
            return true;
        }
    }

    exports.ActionButton = ActionButton;
    exports.ActorEntry = ActorEntry;
    exports.Button = Button;
    exports.CellEntry = CellEntry;
    exports.DropDownButton = DropDownButton;
    exports.EntryBase = EntryBase;
    exports.Flavor = Flavor;
    exports.ItemEntry = ItemEntry;
    exports.Menu = Menu;
    exports.Messages = Messages;
    exports.Sidebar = Sidebar;
    exports.UI = UI;
    exports.Viewport = Viewport;
    exports.showDropDown = showDropDown;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
