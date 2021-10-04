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
            var _a, _b;
            if (typeof opts === 'number') {
                opts = { duration: opts };
            }
            const buffer = this.startDialog();
            if (args) {
                text = GWU__namespace.text.apply(text, args);
            }
            let padX = opts.padX || 2;
            let padY = opts.padY || 1;
            if (opts.title) {
                padY = Math.max(padY, 2);
            }
            let lines = [text];
            if (text.includes('\n')) {
                lines = text.split('\n');
            }
            const lineLen = lines.reduce((len, line) => Math.max(len, GWU__namespace.text.length(line)), 0);
            const totalLength = lineLen + padX * 2;
            let width = totalLength + padX * 2;
            if (opts.width && opts.width > 0) {
                width = opts.width;
                if (opts.width < totalLength) {
                    lines = GWU__namespace.text.splitIntoLines(text, opts.width - padX * 2);
                }
            }
            let height = Math.max(lines.length + 2 * padY, opts.height || 0);
            const x = (_a = opts.x) !== null && _a !== void 0 ? _a : Math.min(Math.floor((buffer.width - width) / 2));
            const y = (_b = opts.y) !== null && _b !== void 0 ? _b : Math.floor((buffer.height - height) / 2);
            const fg = GWU__namespace.color.from(opts.fg || 'white');
            if (opts.borderBg) {
                buffer.fillRect(x, y, width, height, 0, 0, opts.borderBg);
                buffer.fillRect(x + 1, y + 1, width - 2, height - 2, 0, 0, opts.bg || 'gray');
            }
            else {
                buffer.fillRect(x, y, width, height, 0, 0, opts.bg || 'gray');
            }
            if (opts.title) {
                let tx = x + Math.floor((width - opts.title.length) / 2);
                buffer.drawText(tx, y, opts.title, opts.titleFg || fg);
            }
            lines.forEach((line, i) => {
                buffer.drawText(x + padX, y + padY + i, line, fg);
            });
            buffer.render();
            if (opts.waitForAck) {
                await this.loop.waitForAck();
            }
            else {
                await this.loop.pause(opts.duration || 30 * 1000);
            }
            this.finishDialog();
        }
        async confirm(...args) {
            let opts;
            let text;
            let textArgs = null;
            if (args.length <= 2) {
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
            opts.allowCancel = opts.allowCancel || !!opts.cancel;
            const buffer = this.startDialog();
            buffer.mix('black', 50);
            const btnOK = opts.ok || 'OK';
            const btnCancel = opts.cancel || 'Cancel';
            const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
            const x = Math.floor((this.canvas.width - len - 4) / 2) - 2;
            const y = Math.floor(this.canvas.height / 2) - 1;
            buffer.fillRect(x, y, len + 4, 5, ' ', 'black', opts.bg || 'dark_gray');
            buffer.drawText(x + 2, y + 1, text, opts.fg || 'white');
            buffer.drawText(x + 2, y + 3, btnOK, opts.buttonFg || 'white', opts.buttonBg);
            if (opts.allowCancel) {
                buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, opts.buttonFg || 'white', opts.buttonBg);
            }
            buffer.render();
            let result;
            while (result === undefined) {
                const ev = await this.loop.nextEvent(1000);
                if (!ev)
                    continue;
                await GWU__namespace.io.dispatchEvent(ev, {
                    enter() {
                        result = true;
                    },
                    escape() {
                        if (opts.allowCancel) {
                            result = false;
                        }
                    },
                    mousemove() {
                        let isOK = ev.x < x + btnOK.length + 2;
                        let isCancel = ev.x > x + len + 4 - btnCancel.length - 4;
                        if (ev.x < x || ev.x > x + len + 4) {
                            isOK = false;
                            isCancel = false;
                        }
                        if (ev.y != y + 3) {
                            isOK = false;
                            isCancel = false;
                        }
                        buffer.drawText(x + 2, y + 3, btnOK, isOK ? GWU__namespace.colors.teal : GWU__namespace.colors.white);
                        if (opts.allowCancel) {
                            buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 3, btnCancel, isCancel ? GWU__namespace.colors.teal : GWU__namespace.colors.white);
                        }
                        buffer.render();
                    },
                    click() {
                        if (ev.x < x || ev.x > x + len + 4)
                            return;
                        if (ev.y < y || ev.y > y + 5)
                            return;
                        result = ev.x < x + Math.floor(len / 2) + 2;
                    },
                });
            }
            this.finishDialog();
            return result;
        }
        // assumes you are in a dialog and give the buffer for that dialog
        async getInputAt(x, y, maxLength, opts = {}) {
            let numbersOnly = opts.numbersOnly || false;
            const textEntryBounds = numbersOnly ? ['0', '9'] : [' ', '~'];
            const buffer = this.startDialog();
            maxLength = Math.min(maxLength, buffer.width - x);
            const minLength = opts.minLength || 1;
            let inputText = opts.default || '';
            let charNum = GWU__namespace.text.length(inputText);
            const fg = GWU__namespace.color.from(opts.fg || 'white');
            const bg = GWU__namespace.color.from(opts.bg || 'dark_gray');
            const errorFg = GWU__namespace.color.from(opts.errorFg || 'red');
            const hintFg = opts.hintFg ? GWU__namespace.color.from(opts.hintFg) : 'gray';
            function isValid(text) {
                if (numbersOnly) {
                    const val = Number.parseInt(text);
                    if (opts.min !== undefined && val < opts.min)
                        return false;
                    if (opts.max !== undefined && val > opts.max)
                        return false;
                    return val > 0;
                }
                return text.length >= minLength;
            }
            let ev;
            do {
                buffer.fillRect(x, y, maxLength, 1, ' ', fg, bg);
                if (!inputText.length && opts.hint && opts.hint.length) {
                    buffer.drawText(x, y, opts.hint, hintFg);
                }
                else {
                    const color = isValid(inputText) ? fg : errorFg;
                    buffer.drawText(x, y, inputText, color);
                }
                buffer.render();
                ev = await this.loop.nextKeyPress(-1);
                if (!ev || !ev.key)
                    continue;
                if ((ev.key == 'Delete' || ev.key == 'Backspace') && charNum > 0) {
                    buffer.draw(x + charNum - 1, y, ' ', fg);
                    charNum--;
                    inputText = GWU__namespace.text.spliceRaw(inputText, charNum, 1);
                }
                else if (ev.key.length > 1) ;
                else if (ev.key >= textEntryBounds[0] &&
                    ev.key <= textEntryBounds[1]) {
                    // allow only permitted input
                    if (charNum < maxLength) {
                        inputText += ev.key;
                        charNum++;
                    }
                }
                if (ev.key == 'Escape') {
                    this.finishDialog();
                    return '';
                }
            } while (!isValid(inputText) || !ev || ev.key != 'Enter');
            this.finishDialog();
            // GW.ui.draw(); // reverts to old display
            return inputText;
        }
        async inputBox(opts, prompt, args) {
            var _a;
            let text;
            if (prompt) {
                text = GWU__namespace.text.apply(prompt, args);
            }
            const allowCancel = (_a = opts.allowCancel) !== null && _a !== void 0 ? _a : true;
            const bg = opts.bg || 'black';
            const buffer = this.startDialog();
            buffer.mix('black', 50);
            const btnOK = 'OK';
            const btnCancel = 'Cancel';
            const len = Math.max(text.length, btnOK.length + 4 + btnCancel.length);
            const x = Math.floor((buffer.width - len - 4) / 2) - 2;
            const y = Math.floor(buffer.height / 2) - 1;
            buffer.fillRect(x, y, len + 4, 6, ' ', 'black', bg);
            buffer.drawText(x + 2, y + 1, text);
            buffer.fillRect(x + 2, y + 2, len - 4, 1, ' ', 'gray', 'gray');
            buffer.drawText(x + 2, y + 4, btnOK);
            if (allowCancel) {
                buffer.drawText(x + len + 4 - btnCancel.length - 2, y + 4, btnCancel);
            }
            buffer.render();
            const value = await this.getInputAt(x + 2, y + 2, len - 4, opts);
            this.finishDialog();
            return value;
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
        contains(e) {
            return this.bounds.contains(e.x, e.y);
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

    class Viewport {
        constructor(opts) {
            this.center = false;
            this.snap = false;
            this.filter = null;
            this.offsetX = 0;
            this.offsetY = 0;
            this.lockX = false;
            this.lockY = false;
            this._follow = null;
            this.ui = opts.ui;
            this.snap = opts.snap || false;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
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
        get follow() {
            return this._follow;
        }
        set follow(subject) {
            this.center = !!subject;
            if (subject) {
                this.offsetX = subject.x - this.halfWidth();
                this.offsetY = subject.y - this.halfHeight();
                this.centerOn(subject.x, subject.y, subject.map);
            }
            this._follow = subject;
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
        contains(e) {
            return this.bounds.contains(e.x, e.y);
        }
        halfWidth() {
            return Math.floor(this.bounds.width / 2);
        }
        halfHeight() {
            return Math.floor(this.bounds.height / 2);
        }
        centerOn(x, y, map) {
            this.center = true;
            this.updateOffset({ x, y }, map);
        }
        updateOffset(focus, map) {
            const bounds = map || this.bounds;
            if (focus && GWU__namespace.xy.contains(bounds, focus.x, focus.y)) {
                if (this.snap) {
                    let left = this.offsetX;
                    let right = this.offsetX + this.bounds.width;
                    let top = this.offsetY;
                    let bottom = this.offsetY + this.bounds.height;
                    // auto center if outside the viewport
                    if (focus.x < left || focus.x > right) {
                        left = this.offsetX = focus.x - this.halfWidth();
                        right = left + this.bounds.width;
                    }
                    if (focus.y < top || focus.y > bottom) {
                        top = this.offsetY = focus.y - this.halfHeight();
                        bottom = top + this.bounds.height;
                    }
                    const edgeX = Math.floor(this.bounds.width / 5);
                    const edgeY = Math.floor(this.bounds.height / 5);
                    const thirdW = Math.floor(this.bounds.width / 3);
                    if (left + edgeX >= focus.x) {
                        this.offsetX = Math.max(0, focus.x + thirdW - this.bounds.width);
                    }
                    else if (right - edgeX <= focus.x) {
                        this.offsetX = Math.min(focus.x - thirdW, bounds.width - this.bounds.width);
                    }
                    const thirdH = Math.floor(this.bounds.height / 3);
                    if (top + edgeY >= focus.y) {
                        this.offsetY = Math.max(0, focus.y + thirdH - this.bounds.height);
                    }
                    else if (bottom - edgeY <= focus.y) {
                        this.offsetY = Math.min(focus.y - thirdH, bounds.height - this.bounds.height);
                    }
                }
                else if (this.center) {
                    this.offsetX = focus.x - this.halfWidth();
                    this.offsetY = focus.y - this.halfHeight();
                }
                else {
                    this.offsetX = focus.x;
                    this.offsetY = focus.y;
                }
            }
            if (this.lockX && map) {
                this.offsetX = GWU__namespace.clamp(this.offsetX, 0, map.width - this.bounds.width);
            }
            if (this.lockY && map) {
                this.offsetY = GWU__namespace.clamp(this.offsetY, 0, map.height - this.bounds.height);
            }
        }
        drawFor(subject) {
            if (!subject.map)
                throw new Error('No map!');
            return this.draw(subject.memory || subject.map, subject.fov);
        }
        draw(map, fov) {
            if (!map) {
                if (!this._follow)
                    throw new Error('Either map or follow must be set.');
                return this.drawFor(this._follow);
            }
            // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;
            this.updateOffset(this._follow, map);
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
                        mixer.blackOut();
                    }
                    if (this.filter) {
                        this.filter(mixer, mapX, mapY, map);
                    }
                    this.ui.buffer.drawSprite(x + this.bounds.x, y + this.bounds.y, mixer);
                }
            }
            // map.clearMapFlag(GWM.flags.Map.MAP_CHANGED);
            return true;
        }
    }

    GWU__namespace.color.install('flavorText', 50, 40, 90);
    GWU__namespace.color.install('flavorPrompt', 100, 90, 20);
    class Flavor {
        constructor(opts) {
            var _a, _b, _c;
            this.text = '';
            this.needsUpdate = false;
            this.isPrompt = false;
            this.overflow = false;
            this.ui = opts.ui;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, 1);
            this.fg = GWU__namespace.color.from((_a = opts.fg) !== null && _a !== void 0 ? _a : 'flavorText');
            this.bg = GWU__namespace.color.from((_b = opts.bg) !== null && _b !== void 0 ? _b : 'black');
            this.promptFg = GWU__namespace.color.from((_c = opts.promptFg) !== null && _c !== void 0 ? _c : 'flavorPrompt');
        }
        showText(text) {
            this.text = GWU__namespace.text.capitalize(text);
            this.needsUpdate = true;
            this.isPrompt = false;
            this.draw();
        }
        clear() {
            this.text = '';
            this.needsUpdate = true;
            this.isPrompt = false;
            this.draw();
        }
        showPrompt(text) {
            this.text = GWU__namespace.text.capitalize(text);
            this.needsUpdate = true;
            this.isPrompt = true;
            this.draw();
        }
        draw(force = false) {
            if (!force && !this.needsUpdate)
                return false;
            const buffer = this.ui.buffer;
            const color = this.isPrompt ? this.fg : this.promptFg;
            const nextY = buffer.wrapText(this.bounds.x, this.bounds.y, this.bounds.width, this.text, color, this.bg);
            this.overflow = nextY !== this.bounds.y + 1;
            this.ui.render();
            this.needsUpdate = false;
            return true;
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
        draw(_sidebar) { }
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
        draw(sidebar) {
            this.actor.drawStatus(sidebar);
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
        draw(sidebar) {
            this.item.drawStatus(sidebar);
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
        draw(sidebar) {
            this.cell.drawStatus(sidebar);
        }
    }
    class Sidebar {
        constructor(opts) {
            this.cellCache = [];
            this.lastX = -1;
            this.lastY = -1;
            this.lastMap = null;
            this.entries = [];
            this.mixer = new GWU__namespace.sprite.Mixer();
            this.currentY = 0;
            this.follow = null;
            this.highlight = null;
            this.currentEntry = null;
            this.ui = opts.ui;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
            this.bg = GWU__namespace.color.from(opts.bg || 'black');
            this.fg = GWU__namespace.color.from(opts.fg || 'purple');
        }
        get buffer() {
            return this.ui.buffer;
        }
        contains(e) {
            return this.bounds.contains(e.x, e.y);
        }
        toInnerY(y) {
            return GWU__namespace.clamp(y - this.bounds.top, 0, this.bounds.height);
        }
        updateHighlight(e) {
            if (!this.contains(e)) {
                this.clearHighlight();
                return false;
            }
            return this.highlightRow(this.toInnerY(e.y));
        }
        highlightRow(innerY) {
            const y = GWU__namespace.clamp(innerY, 0, this.bounds.height);
            this.highlight = null;
            // processed in ascending y order
            this.entries.forEach((e) => {
                if (e.sidebarY <= y && e.sidebarY !== -1) {
                    this.highlight = e;
                }
            });
            if (this.highlight) {
                // @ts-ignore
                this.highlight.highlight = true;
                return true;
            }
            return false;
        }
        clearHighlight() {
            this.highlight = null;
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
            return !!this.highlight || entry.priority > 2;
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
        clearSidebar() {
            this.ui.buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, 0, 0, this.bg);
        }
        drawFor(subject) {
            return this.draw(subject.memory || subject.map, subject.x, subject.y, subject.fov);
        }
        draw(map, cx, cy, fov) {
            if (arguments.length < 3) {
                if (this.follow) {
                    return this.drawFor(this.follow);
                }
                throw new Error('Not following a subject - map, cx, cy required.');
            }
            this.updateCellCache(map);
            this.findEntries(map, cx, cy, fov);
            this.clearSidebar();
            this.currentY = this.bounds.y;
            // clear the row information
            this.entries.forEach((e) => (e.sidebarY = -1));
            for (let i = 0; i < this.entries.length && this.currentY < this.bounds.bottom; ++i) {
                this.currentEntry = this.entries[i];
                this.currentEntry.sidebarY = this.currentY;
                this.currentEntry.draw(this);
                ++this.currentY; // skip a line
            }
            this.currentEntry = null;
            return true;
        }
        drawTitle(cell, title, fg) {
            fg = GWU__namespace.color.from(fg || this.fg);
            const fgColor = this._isDim(this.currentEntry)
                ? fg.clone().darken(50)
                : fg;
            this.buffer.drawSprite(this.bounds.x + 1, this.currentY, cell);
            this.buffer.wrapText(this.bounds.x + 3, this.currentY, this.bounds.width - 3, title, fgColor);
            ++this.currentY;
        }
        drawTextLine(text, fg) {
            fg = GWU__namespace.color.from(fg || this.fg);
            const fgColor = this._isDim(this.currentEntry)
                ? fg.clone().darken(50)
                : fg;
            this.buffer.drawText(this.bounds.x + 3, this.currentY, text, fgColor, this.bounds.width - 3);
            ++this.currentY;
        }
        drawProgressBar(val, max, text, color, bg, fg) {
            color = GWU__namespace.color.from(color || this.fg);
            bg = GWU__namespace.color.from(bg || color.clone().darken(50));
            fg = GWU__namespace.color.from(fg || color.clone().lighten(50));
            if (this._isDim(this.currentEntry)) {
                bg.darken(50);
                fg.darken(50);
                color.darken(50);
            }
            this.buffer.fillRect(this.bounds.x + 1, this.currentY, this.bounds.width - 1, 1, undefined, undefined, bg);
            const len = Math.floor(((this.bounds.width - 1) * val) / max);
            this.buffer.fillRect(this.bounds.x + 1, this.currentY, len, 1, undefined, undefined, color);
            const title = GWU__namespace.text.center(text, this.bounds.width);
            this.buffer.drawText(this.bounds.x + 1, this.currentY, title, fg, undefined, this.bounds.width - 1 // just in case title is too long
            );
            ++this.currentY;
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
        activate() {
            return this.fn(this);
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
            if (this.buttons.length >= this.menu.ui.buffer.height - 1) {
                throw new Error('Too many menu options.');
            }
            let button;
            if (typeof config === 'function') {
                button = new ActionButton(text, config);
            }
            else {
                button = new DropDownButton(this.menu, this, text, config);
            }
            this.buttons.push(button);
            ++this.bounds.height;
            this.bounds.width = Math.max(this.bounds.width, text.length + 2);
        }
        setBounds(px, py, pwidth) {
            const right = px + pwidth;
            const left = px;
            const totalWidth = this.menu.ui.buffer.width;
            if (this.bounds.width < totalWidth - right) {
                this.bounds.x = right;
            }
            else if (this.bounds.width < left) {
                this.bounds.x = left - this.bounds.width;
            }
            else {
                throw new Error('Menu does not fit - too wide.');
            }
            const totalHeight = this.menu.ui.buffer.height;
            if (this.bounds.height <= totalHeight - py) {
                this.bounds.y = py;
            }
            else if (this.bounds.height < totalHeight) {
                this.bounds.y = totalHeight - this.bounds.height - 1;
            }
            else {
                throw new Error('Menu does not fit - too tall.');
            }
            this.buttons.forEach((b, i) => {
                if (b instanceof DropDownButton) {
                    b.setBounds(this.bounds.x, this.bounds.y + i, this.bounds.width);
                }
            });
        }
        contains(e) {
            return this.bounds.contains(e.x, e.y);
        }
        buttonAt(e) {
            const index = e.y - this.bounds.y;
            return this.buttons[index] || null;
        }
        drawInto(buffer) {
            const width = this.bounds.width;
            const height = this.bounds.height;
            const x = this.bounds.x;
            let y = this.bounds.y;
            buffer.fillRect(x, y, width, height, 0, 0, this.menu.dropBg);
            // Now draw the individual buttons...
            this.buttons.forEach((b) => {
                buffer.drawText(x + 1, y, b.text, b.hovered ? this.menu.hoverFg : this.menu.dropFg, b.hovered ? this.menu.hoverBg : this.menu.dropBg);
                ++y;
            });
            if (this.parent) {
                this.parent.drawInto(buffer);
            }
        }
    }
    async function showDropDown(menu, button) {
        const ui = button.menu.ui;
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
                            activeButton = selected;
                        }
                    }
                }
                else {
                    if (menu.contains(e)) {
                        menu.needsRedraw = true;
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
                    return actionButton.activate(); // actions return true if they want to close the menu (otherwise the menu stays open)
                }
            },
            draw: () => {
                if (!activeButton)
                    return;
                ui.resetDialogBuffer(dialog);
                activeButton.drawInto(dialog);
                menu.drawInto(dialog);
                dialog.render();
            },
        });
        ui.finishDialog();
        menu.clearHighlight();
    }
    class Menu {
        constructor(opts) {
            this.buttons = [];
            this.separator = ' | ';
            this.lead = ' ';
            this.needsRedraw = false;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, 1);
            this.ui = opts.ui;
            this.needsRedraw = true;
            this.fg = GWU__namespace.color.from(opts.fg || 'black');
            this.bg = GWU__namespace.color.from(opts.bg || 'light_gray');
            this.hoverFg = opts.hoverFg
                ? GWU__namespace.color.from(opts.hoverFg)
                : this.fg.clone().lighten(50);
            this.hoverBg = opts.hoverBg
                ? GWU__namespace.color.from(opts.hoverBg)
                : this.bg.clone().darken(50);
            this.dropFg = opts.dropFg
                ? GWU__namespace.color.from(opts.dropFg)
                : this.fg.clone();
            this.dropBg = opts.dropBg
                ? GWU__namespace.color.from(opts.dropBg)
                : this.bg.clone();
            Object.entries(opts.buttons).forEach(([text, opts]) => {
                this.addButton(text, opts);
            });
            if (opts.separator) {
                this.separator = opts.separator;
            }
            if (opts.lead !== undefined) {
                this.lead = opts.lead ? opts.lead : '';
            }
        }
        contains(e) {
            return this.bounds.contains(e);
        }
        handleMouse(e) {
            // turn off all the hovers
            this.buttons.forEach((b) => {
                if (b.hovered) {
                    this.needsRedraw = true;
                    b.hovered = false;
                }
            });
            // highlight one of them...
            if (this.bounds.contains(e.x, e.y)) {
                this.needsRedraw = true;
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
                return true; // we handled the message
            }
            return false;
        }
        clearHighlight() {
            this.buttons.forEach((b) => {
                b.hovered = false;
            });
            this.needsRedraw = true;
        }
        getButtonAt(x, _y) {
            return GWU__namespace.arrayFindRight(this.buttons, (b) => b.x < x) || null;
        }
        async handleClick(e) {
            if (this.bounds.contains(e.x, e.y)) {
                // get active button
                let activeButton = this.getButtonAt(e.x, e.y);
                if (!activeButton)
                    return false;
                if (activeButton instanceof DropDownButton) {
                    await showDropDown(this, activeButton);
                }
                else if (activeButton instanceof ActionButton) {
                    await activeButton.activate();
                }
                return true;
            }
            return false;
        }
        addButton(text, config) {
            this.needsRedraw = true;
            const x = this.buttons.reduce((len, button) => len + button.text.length + this.separator.length, this.lead.length + this.bounds.x);
            if (x + text.length + 2 > this.bounds.width) {
                throw new Error('Button makes menu too wide :' + text);
            }
            let button;
            if (typeof config === 'function') {
                button = new ActionButton(text, config);
            }
            else {
                button = new DropDownButton(this, null, text, config);
                button.setBounds(x - 1, this.bounds.y ? this.bounds.y - 1 : 1, 0);
            }
            button.x = x;
            this.buttons.push(button);
        }
        draw(force = false) {
            if (!this.needsRedraw && !force)
                return false;
            const buffer = this.ui.buffer;
            return this.drawInto(buffer);
        }
        drawInto(buffer) {
            this.needsRedraw = false;
            buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, 1, 0, 0, this.bg);
            let x = this.bounds.x;
            const y = this.bounds.y;
            buffer.drawText(x, y, this.lead, this.fg);
            this.buttons.forEach((b) => {
                const color = b.hovered ? this.hoverFg : this.fg;
                const bgColor = b.hovered ? this.hoverBg : this.bg;
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
