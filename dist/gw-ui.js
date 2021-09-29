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

    class Viewport {
        constructor(opts) {
            this.follow = null;
            this.snap = false;
            this.filter = null;
            this.offsetX = 0;
            this.offsetY = 0;
            this.lockX = false;
            this.lockY = false;
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
        contains(x, y) {
            return this.bounds.contains(x, y);
        }
        halfWidth() {
            return Math.floor(this.bounds.width / 2);
        }
        halfHeight() {
            return Math.floor(this.bounds.height / 2);
        }
        centerOn(map, x, y) {
            this.updateOffset(map, { x, y });
        }
        updateOffset(map, focus) {
            if (focus && GWU__namespace.xy.contains(map, focus.x, focus.y)) {
                if (this.snap) {
                    const left = this.offsetX;
                    const right = this.offsetX + this.bounds.width;
                    const top = this.offsetY;
                    const bottom = this.offsetY + this.bounds.height;
                    const edgeX = Math.floor(this.bounds.width / 5);
                    const edgeY = Math.floor(this.bounds.height / 5);
                    const thirdW = Math.floor(this.bounds.width / 3);
                    if (left + edgeX >= focus.x) {
                        this.offsetX = Math.max(0, focus.x + thirdW - this.bounds.width);
                    }
                    else if (right - edgeX <= focus.x) {
                        this.offsetX = Math.min(focus.x - thirdW, map.width - this.bounds.width);
                    }
                    const thirdH = Math.floor(this.bounds.height / 3);
                    if (top + edgeY >= focus.y) {
                        this.offsetY = Math.max(0, focus.y + thirdH - this.bounds.height);
                    }
                    else if (bottom - edgeY <= focus.y) {
                        this.offsetY = Math.min(focus.y - thirdH, map.height - this.bounds.height);
                    }
                }
                else {
                    this.offsetX = focus.x - this.halfWidth();
                    this.offsetY = focus.y - this.halfHeight();
                }
            }
            if (this.lockX) {
                this.offsetX = GWU__namespace.clamp(this.offsetX, 0, map.width - this.bounds.width);
            }
            if (this.lockY) {
                this.offsetY = GWU__namespace.clamp(this.offsetY, 0, map.height - this.bounds.height);
            }
        }
        draw(map, fov) {
            if (!map)
                return false;
            // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;
            this.updateOffset(map, this.follow);
            const mixer = new GWU__namespace.sprite.Mixer();
            for (let x = 0; x < this.bounds.width; ++x) {
                for (let y = 0; y < this.bounds.height; ++y) {
                    const mapX = x + this.offsetX;
                    const mapY = y + this.offsetY;
                    if (map.hasXY(mapX, mapY)) {
                        const cell = map.cell(x, y);
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
        }
        draw(_sidebar) { }
    }
    class ActorEntry extends EntryBase {
        constructor(actor) {
            super();
            this.actor = actor;
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
        draw(sidebar) {
            this.item.drawStatus(sidebar);
        }
    }
    class CellEntry extends EntryBase {
        constructor(cell) {
            super();
            this.cell = cell;
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
            this.currentPriority = -1;
            this.ui = opts.ui;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
            this.bg = GWU__namespace.color.from(opts.bg || 'black');
            this.fg = GWU__namespace.color.from(opts.fg || 'purple');
        }
        get buffer() {
            return this.ui.buffer;
        }
        contains(x, y) {
            return this.bounds.contains(x, y);
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
        makeActorEntry(actor) {
            return new ActorEntry(actor);
        }
        makeItemEntry(item) {
            return new ItemEntry(item);
        }
        makeCellEntry(cell) {
            return new CellEntry(cell);
        }
        getPriority(map, x, y, fov) {
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
        addActor(actor, map, x, y, fov) {
            const priority = this.getPriority(map, actor.x, actor.y, fov);
            if (priority < 0)
                return false;
            const entry = this.makeActorEntry(actor);
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, actor.x, actor.y);
            entry.priority = actor.isPlayer() ? 0 : priority;
            this.entries.push(entry);
            return true;
        }
        addItem(item, map, x, y, fov) {
            const priority = this.getPriority(map, item.x, item.y, fov);
            if (priority < 0)
                return false;
            const entry = this.makeItemEntry(item);
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, item.x, item.y);
            entry.priority = priority;
            this.entries.push(entry);
            return true;
        }
        addCell(cell, map, x, y, fov) {
            const priority = this.getPriority(map, cell.x, cell.y, fov);
            if (priority < 0)
                return false;
            const entry = this.makeCellEntry(cell);
            entry.dist = GWU__namespace.xy.distanceBetween(x, y, cell.x, cell.y);
            entry.priority = priority;
            this.entries.push(entry);
            return true;
        }
        findEntries(map, cx, cy, fov) {
            if (map === this.lastMap && cx === this.lastX && cy === this.lastY)
                return;
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
                if (this.addActor(a, map, cx, cy, fov)) {
                    done[x][y] = 1;
                }
            });
            map.eachItem((i) => {
                const x = i.x;
                const y = i.y;
                if (done[x][y])
                    return;
                if (this.addItem(i, map, cx, cy, fov)) {
                    done[x][y] = 1;
                }
            });
            this.cellCache.forEach((c) => {
                if (done[c.x][c.y])
                    return;
                if (this.addCell(c, map, cx, cy, fov)) {
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
        draw(map, cx, cy, fov) {
            this.updateCellCache(map);
            this.findEntries(map, cx, cy, fov);
            this.clearSidebar();
            this.currentY = this.bounds.y;
            this.currentPriority = -1;
            for (let i = 0; i < this.entries.length && this.currentY < this.bounds.bottom; ++i) {
                const entry = this.entries[i];
                this.currentPriority = entry.priority;
                entry.draw(this);
                ++this.currentY; // skip a line
            }
            this.currentPriority = -1;
            return true;
        }
        drawTitle(cell, title, fg) {
            fg = GWU__namespace.color.from(fg || this.fg);
            const fgColor = this.currentPriority < 3 ? fg : fg.clone().darken(50);
            this.buffer.drawSprite(this.bounds.x + 1, this.currentY, cell);
            this.buffer.wrapText(this.bounds.x + 3, this.currentY, this.bounds.width - 3, title, fgColor);
            ++this.currentY;
        }
        drawTextLine(text, fg) {
            fg = GWU__namespace.color.from(fg || this.fg);
            const fgColor = this.currentPriority < 3 ? fg : fg.clone().darken(50);
            this.buffer.drawText(this.bounds.x + 3, this.currentY, text, fgColor, this.bounds.width - 3);
            ++this.currentY;
        }
        drawProgressBar(val, max, text, color, bg, fg) {
            color = GWU__namespace.color.from(color || this.fg);
            bg = GWU__namespace.color.from(bg || color.clone().darken(50));
            fg = GWU__namespace.color.from(fg || color.clone().lighten(50));
            if (this.currentPriority < 3) {
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

    exports.ActorEntry = ActorEntry;
    exports.CellEntry = CellEntry;
    exports.EntryBase = EntryBase;
    exports.Flavor = Flavor;
    exports.ItemEntry = ItemEntry;
    exports.Messages = Messages;
    exports.Sidebar = Sidebar;
    exports.UI = UI;
    exports.Viewport = Viewport;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
