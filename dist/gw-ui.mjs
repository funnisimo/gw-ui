import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

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
    startDialog() {
        this.inDialog = true;
        const base = this.buffer || this.canvas.buffer;
        this.layers.push(base);
        this.buffer =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
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
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, Math.min(opts.width || buffer.width, buffer.width - opts.x), Math.min(opts.height || buffer.height, buffer.height - opts.y));
        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: buffer.height,
        });
        this.ui = opts.ui;
        this.bg = GWU.color.from(opts.bg || 'black');
        this.fg = GWU.color.from(opts.fg || 'white');
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
        const tempColor = GWU.color.make();
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
            GWU.text.eachChar(msg, (c, color, _bg, j) => {
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
        this.follow = false;
        this.snap = false;
        this.filter = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.lockX = false;
        this.lockY = false;
        this.ui = opts.ui;
        this.follow = opts.follow || false;
        this.snap = opts.snap || false;
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
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
    draw(map, playerX, playerY) {
        if (!map)
            return false;
        // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;
        if (this.follow && playerX !== undefined && playerY !== undefined) {
            this.offsetX = playerX - this.halfWidth();
            this.offsetY = playerY - this.halfHeight();
        }
        else if (this.snap &&
            playerX !== undefined &&
            playerY !== undefined) {
            const left = this.offsetX;
            const right = this.offsetX + this.bounds.width;
            const top = this.offsetY;
            const bottom = this.offsetY + this.bounds.height;
            const edgeX = Math.floor(this.bounds.width / 5);
            const edgeY = Math.floor(this.bounds.height / 5);
            const thirdW = Math.floor(this.bounds.width / 3);
            if (left + edgeX >= playerX) {
                this.offsetX = Math.max(0, playerX + thirdW - this.bounds.width);
            }
            else if (right - edgeX <= playerX) {
                this.offsetX = Math.min(playerX - thirdW, map.width - this.bounds.width);
            }
            const thirdH = Math.floor(this.bounds.height / 3);
            if (top + edgeY >= playerY) {
                this.offsetY = Math.max(0, playerY + thirdH - this.bounds.height);
            }
            else if (bottom - edgeY <= playerY) {
                this.offsetY = Math.min(playerY - thirdH, map.height - this.bounds.height);
            }
        }
        else if (playerX !== undefined && playerY !== undefined) {
            this.offsetX = playerX;
            this.offsetY = playerY;
        }
        if (this.lockX) {
            this.offsetX = GWU.clamp(this.offsetX, 0, map.width - this.bounds.width);
        }
        if (this.lockY) {
            this.offsetY = GWU.clamp(this.offsetY, 0, map.height - this.bounds.height);
        }
        const mixer = new GWU.sprite.Mixer();
        for (let x = 0; x < this.bounds.width; ++x) {
            for (let y = 0; y < this.bounds.height; ++y) {
                const mapX = x + this.offsetX;
                const mapY = y + this.offsetY;
                if (map.hasXY(mapX, mapY)) {
                    map.getAppearanceAt(mapX, mapY, mixer);
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

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);
class Flavor {
    constructor(opts) {
        var _a, _b, _c;
        this.text = '';
        this.needsUpdate = false;
        this.isPrompt = false;
        this.overflow = false;
        this.ui = opts.ui;
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, 1);
        this.fg = GWU.color.from((_a = opts.fg) !== null && _a !== void 0 ? _a : 'flavorText');
        this.bg = GWU.color.from((_b = opts.bg) !== null && _b !== void 0 ? _b : 'black');
        this.promptFg = GWU.color.from((_c = opts.promptFg) !== null && _c !== void 0 ? _c : 'flavorPrompt');
    }
    showText(text) {
        this.text = GWU.text.capitalize(text);
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
        this.text = GWU.text.capitalize(text);
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
    getFlavorText(map, x, y) {
        const cell = map.knowledge(x, y);
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
        const isAnyKindOfVisible = map.fov.isAnyKindOfVisible(x, y);
        const isDirectlyVisible = map.fov.isDirectlyVisible(x, y) ||
            (!map.fov.isEnabled && isAnyKindOfVisible);
        const isRemembered = map.fov.isRevealed(x, y);
        const isMapped = map.fov.isMagicMapped(x, y);
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
        const actor = cell.actor || null;
        // const player = actor?.isPlayer() ? actor : null;
        const theItem = cell.item;
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
    }
}
class ActorEntry extends EntryBase {
    constructor(actor) {
        super();
        this.actor = actor;
    }
}
class ItemEntry extends EntryBase {
    constructor(item) {
        super();
        this.item = item;
    }
}
class CellEntry extends EntryBase {
    constructor(cell) {
        super();
        this.cell = cell;
    }
}
class Sidebar {
    constructor(opts) {
        this.cellCache = [];
        this.lastX = -1;
        this.lastY = -1;
        this.lastMap = null;
        this.entries = [];
        this.ui = opts.ui;
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
        this.bg = GWU.color.from(opts.bg || 'black');
    }
    contains(x, y) {
        return this.bounds.contains(x, y);
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
            const info = map.knowledge(x, y);
            if (info.hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)) {
                this.cellCache.push(info);
            }
        });
        map.clearMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED);
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
    getPriority(map, x, y) {
        if (map.fov.isDirectlyVisible(x, y)) {
            return 1;
        }
        else if (map.fov.isAnyKindOfVisible(x, y)) {
            return 2;
        }
        else if (map.fov.isRevealed(x, y)) {
            return 3;
        }
        return -1; // not visible, or revealed
    }
    addActor(actor, map, x, y) {
        const priority = this.getPriority(map, actor.x, actor.y);
        if (priority < 0)
            return false;
        const entry = this.makeActorEntry(actor);
        entry.dist = GWU.xy.distanceBetween(x, y, actor.x, actor.y);
        entry.priority = actor.isPlayer() ? 0 : priority;
        this.entries.push(entry);
        return true;
    }
    addItem(item, map, x, y) {
        const priority = this.getPriority(map, item.x, item.y);
        if (priority < 0)
            return false;
        const entry = this.makeItemEntry(item);
        entry.dist = GWU.xy.distanceBetween(x, y, item.x, item.y);
        entry.priority = priority;
        this.entries.push(entry);
        return true;
    }
    addCell(cell, map, x, y) {
        const priority = this.getPriority(map, cell.x, cell.y);
        if (priority < 0)
            return false;
        const entry = this.makeCellEntry(cell);
        entry.dist = GWU.xy.distanceBetween(x, y, cell.x, cell.y);
        entry.priority = priority;
        this.entries.push(entry);
        return true;
    }
    findEntries(map, cx, cy) {
        if (map === this.lastMap && cx === this.lastX && cy === this.lastY)
            return;
        this.lastMap = map;
        this.lastX = cx;
        this.lastY = cy;
        this.entries.length = 0;
        const done = GWU.grid.alloc(map.width, map.height);
        map.eachActor((a) => {
            const x = a.lastSeen ? a.lastSeen.x : a.x;
            const y = a.lastSeen ? a.lastSeen.y : a.y;
            if (done[x][y])
                return;
            if (this.addActor(a, map, cx, cy)) {
                done[x][y] = 1;
            }
        });
        map.eachItem((i) => {
            const x = i.lastSeen ? i.lastSeen.x : i.x;
            const y = i.lastSeen ? i.lastSeen.y : i.y;
            if (done[x][y])
                return;
            if (this.addItem(i, map, cx, cy)) {
                done[x][y] = 1;
            }
        });
        this.cellCache.forEach((c) => {
            if (done[c.x][c.y])
                return;
            if (this.addCell(c, map, cx, cy)) {
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
    clearSidebar() {
        this.ui.buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, 0, 0, this.bg);
    }
    update(map, x, y) {
        this.updateCellCache(map);
        this.findEntries(map, x, y);
        this.clearSidebar();
        return true;
    }
}

export { ActorEntry, CellEntry, EntryBase, Flavor, ItemEntry, Messages, Sidebar, UI, Viewport };
