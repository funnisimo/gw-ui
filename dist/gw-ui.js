(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gw-utils')) :
    typeof define === 'function' && define.amd ? define(['exports', 'gw-utils'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GWI = {}, global.GWU));
}(this, (function (exports, GWU) { 'use strict';

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

    class UI {
        constructor(opts = {}) {
            this.layers = [];
            this.freeBuffers = [];
            this.inDialog = false;
            this.overlay = null;
            if (!opts.canvas)
                throw new Error('Need a canvas.');
            this.canvas = opts.canvas;
            this.buffer = opts.canvas.buffer;
            this.loop = opts.loop || GWU__namespace.loop;
        }
        startDialog() {
            this.inDialog = true;
            const base = this.overlay || this.buffer;
            this.layers.push(base);
            this.overlay =
                this.freeBuffers.pop() || new GWU__namespace.canvas.Buffer(this.canvas);
            // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
            this.overlay.copy(base);
            return this.overlay;
        }
        resetDialogBuffer(dest) {
            const base = this.layers[this.layers.length - 1] || this.buffer;
            dest.copy(base);
        }
        finishDialog() {
            if (!this.inDialog)
                return;
            if (this.overlay) {
                this.freeBuffers.push(this.overlay);
            }
            this.overlay = this.layers.pop() || this.buffer;
            this.overlay.render();
            this.inDialog = this.layers.length > 0;
        }
    }

    class Messages {
        constructor(opts) {
            const buffer = opts.ui.buffer;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, Math.min(opts.width || buffer.width, buffer.width - opts.x), Math.min(opts.height || buffer.height, buffer.height - opts.y));
            this.cache = new GWU__namespace.message.MessageCache({
                width: this.bounds.width,
                length: buffer.height,
            });
            this.ui = opts.ui;
            this.bg = GWU__namespace.color.from(opts.bg || 'black');
            this.fg = GWU__namespace.color.from(opts.fg || 'white');
        }
        contains(x, y) {
            return this.bounds.contains(x, y);
        }
        get needsUpdate() {
            return this.cache.needsUpdate;
        }
        get buffer() {
            return this.ui.buffer;
        }
        draw(force = false) {
            if (!force && !this.cache.needsUpdate)
                return false;
            let messageColor;
            const tempColor = GWU__namespace.color.make();
            const isOnTop = this.bounds.y < 10;
            // black out the message area
            this.buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', 0, this.bg);
            this.cache.forEach((msg, confirmed, i) => {
                if (i >= this.bounds.height)
                    return;
                messageColor = tempColor;
                messageColor.copy(this.fg);
                if (confirmed) {
                    messageColor.mix(this.bg, 50);
                    messageColor.mix(this.bg, (75 * i) / (2 * this.bounds.height));
                }
                const localY = isOnTop ? this.bounds.height - i - 1 : i;
                const y = this.toBufferY(localY);
                GWU__namespace.text.eachChar(msg, (c, color, _bg, j) => {
                    const x = this.toBufferX(j);
                    if (color && messageColor !== color && confirmed) {
                        color.mix(this.bg, 50);
                        color.mix(this.bg, (75 * i) / (2 * this.bounds.height));
                    }
                    messageColor = color || tempColor;
                    this.buffer.draw(x, y, c, messageColor, this.bg);
                });
                // for (let j = GWU.text.length(msg); j < this.bounds.width; j++) {
                //     const x = this.toBufferX(j);
                //     this.buffer.draw(x, y, ' ', this.bg, this.bg);
                // }
            });
            this.cache.needsUpdate = false;
            return true;
        }
        toBufferY(y) {
            return this.bounds.y + y;
        }
        toBufferX(x) {
            return this.bounds.x + x;
        }
        async showArchive() {
            let reverse, fadePercent, currentMessageCount = 0;
            let fastForward;
            // Count the number of lines in the archive.
            let totalMessageCount = 0;
            this.cache.forEach(() => ++totalMessageCount);
            if (totalMessageCount <= this.bounds.height)
                return;
            const isOnTop = this.bounds.y < 10;
            const dbuf = this.ui.startDialog();
            // Pull-down/pull-up animation:
            for (reverse = 0; reverse <= 1; reverse++) {
                fastForward = false;
                for (currentMessageCount = reverse
                    ? totalMessageCount
                    : this.bounds.height; reverse
                    ? currentMessageCount >= this.bounds.height
                    : currentMessageCount <= totalMessageCount; currentMessageCount += reverse ? -1 : 1) {
                    this.ui.resetDialogBuffer(dbuf);
                    // Print the message archive text to the dbuf.
                    this.cache.forEach((msg, _confirmed, j) => {
                        if (j >= currentMessageCount || j >= dbuf.height)
                            return;
                        const y = isOnTop ? j : dbuf.height - j - 1;
                        fadePercent = Math.floor((50 * (currentMessageCount - j)) / currentMessageCount);
                        const fg = this.fg.clone().mix(this.bg, fadePercent);
                        dbuf.wrapText(this.toBufferX(0), y, this.bounds.width, msg, fg, this.bg);
                    });
                    dbuf.render();
                    if (!fastForward &&
                        (await this.ui.loop.pause(reverse ? 15 : 45))) {
                        fastForward = true;
                        // dequeueEvent();
                        currentMessageCount = reverse
                            ? this.bounds.height + 1
                            : totalMessageCount - 1; // skip to the end
                    }
                }
                if (!reverse) {
                    const y = isOnTop ? 0 : dbuf.height - 1;
                    const x = this.bounds.x > 8
                        ? this.bounds.x - 8 // to left of box
                        : Math.min(this.bounds.x + this.bounds.width, // just to right of box
                        this.buffer.width - 8 // But definitely on the screen - overwrite some text if necessary
                        );
                    dbuf.wrapText(x, y, 8, '--DONE--', this.bg, this.fg);
                    dbuf.render();
                    await this.ui.loop.waitForAck();
                }
            }
            this.ui.finishDialog();
            this.cache.confirmAll();
            this.cache.needsUpdate = true;
        }
    }

    exports.Messages = Messages;
    exports.UI = UI;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
