import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

class Messages extends GWU.widget.Widget {
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
        this._showArchive();
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
    _showArchive() {
        if (this.cache.length <= this.bounds.height)
            return;
        showArchive(this);
    }
}
class MessageArchive extends GWU.widget.Widget {
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
        this._timeout = null;
        this.source = source;
        this.isOnTop = this.source.bounds.y < 10;
        this.bounds.height = this.isOnTop
            ? layer.height - source.bounds.y
            : source.bounds.bottom;
        this.totalCount = Math.min(source.cache.length, this.isOnTop
            ? layer.height - this.source.bounds.top
            : this.source.bounds.bottom);
        this.shown = source.bounds.height;
        this._timeout = this.layer.setTimeout(() => this._forward(), 16);
        // confirm them as they are right now...
        this.source.cache.confirmAll();
    }
    contains() {
        return true; // Eat all mouse activity
    }
    finish() {
        this.layer.finish();
    }
    keypress(e) {
        return this.click(e);
    }
    click(_e) {
        if (this.mode === 'ack') {
            this.mode = 'reverse';
            this.layer.needsDraw = true;
            if (this._timeout) {
                this.layer.clearTimeout(this._timeout);
            }
            this._timeout = this.layer.setTimeout(() => this._reverse(), 16);
        }
        else if (this.mode === 'reverse') {
            this.finish();
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            if (this._timeout) {
                this.layer.clearTimeout(this._timeout);
                this._timeout = null;
            }
            this.layer.needsDraw = true;
        }
        return true;
    }
    _forward() {
        // console.log('forward');
        ++this.shown;
        this._timeout = null;
        this.layer.needsDraw = true;
        if (this.shown < this.totalCount) {
            this._timeout = this.layer.setTimeout(() => this._forward(), 16);
        }
        else {
            this.mode = 'ack';
            this.shown = this.totalCount;
        }
        return true;
    }
    _reverse() {
        // console.log('reverse');
        --this.shown;
        this._timeout = null;
        if (this.shown <= this.source.bounds.height) {
            this.finish();
        }
        else {
            this.layer.needsDraw = true;
            this._timeout = this.layer.setTimeout(() => this._reverse(), 16);
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
async function showArchive(widget) {
    const layer = new GWU.widget.WidgetLayer(widget.layer.ui);
    // @ts-ignore
    new MessageArchive(layer, widget);
    await layer.run();
}

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);
class Flavor extends GWU.widget.Text {
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
class Sidebar extends GWU.widget.Widget {
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

class Viewport extends GWU.widget.Widget {
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
    showArchive: showArchive,
    Flavor: Flavor,
    EntryBase: EntryBase,
    ActorEntry: ActorEntry,
    ItemEntry: ItemEntry,
    CellEntry: CellEntry,
    Sidebar: Sidebar,
    Viewport: Viewport
});

export { index as game };
