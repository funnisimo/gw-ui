import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

import { UICore, UISubject } from './types';

GWU.color.install('blueBar', 15, 10, 50);
GWU.color.install('redBar', 45, 10, 15);
GWU.color.install('purpleBar', 50, 0, 50);
GWU.color.install('greenBar', 10, 50, 10);

export interface SidebarOptions {
    ui: UICore;
    x: number;
    y: number;
    width: number;
    height: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
}

export abstract class EntryBase {
    dist = 0;
    priority = 0;
    changed = false;
    sidebarY = -1;

    abstract get x(): number;
    abstract get y(): number;

    draw(_sidebar: Sidebar): void {}
}

export class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;

    constructor(actor: GWM.actor.Actor) {
        super();
        this.actor = actor;
    }

    get x() {
        return this.actor.x;
    }
    get y() {
        return this.actor.y;
    }

    draw(sidebar: Sidebar): void {
        this.actor.drawStatus(sidebar);
    }
}

export class ItemEntry extends EntryBase {
    item: GWM.item.Item;

    constructor(item: GWM.item.Item) {
        super();
        this.item = item;
    }

    get x() {
        return this.item.x;
    }
    get y() {
        return this.item.y;
    }

    draw(sidebar: Sidebar): void {
        this.item.drawStatus(sidebar);
    }
}

export class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;

    constructor(cell: GWM.map.CellInfoType) {
        super();
        this.cell = cell;
    }

    get x() {
        return this.cell.x;
    }
    get y() {
        return this.cell.y;
    }

    draw(sidebar: Sidebar): void {
        this.cell.drawStatus(sidebar);
    }
}

export type SidebarEntry = ActorEntry | ItemEntry | CellEntry;

export class Sidebar implements GWM.entity.StatusDrawer {
    ui: UICore;
    bounds: GWU.xy.Bounds;
    cellCache: GWM.map.CellInfoType[] = [];
    lastX = -1;
    lastY = -1;
    lastMap: GWM.map.Map | null = null;
    entries: SidebarEntry[] = [];
    fg: GWU.color.Color;
    bg: GWU.color.Color;
    mixer: GWU.sprite.Mixer = new GWU.sprite.Mixer();
    currentY = 0;
    follow: UISubject | null = null;
    highlight: EntryBase | null = null;
    currentEntry: EntryBase | null = null;

    constructor(opts: SidebarOptions) {
        this.ui = opts.ui;
        this.bounds = new GWU.xy.Bounds(
            opts.x,
            opts.y,
            opts.width,
            opts.height
        );
        this.bg = GWU.color.from(opts.bg || 'black');
        this.fg = GWU.color.from(opts.fg || 'purple');
    }

    get buffer(): GWU.canvas.DataBuffer {
        return this.ui.buffer;
    }

    contains(e: GWU.io.Event): boolean {
        return this.bounds.contains(e.x, e.y);
    }

    toInnerY(y: number) {
        return GWU.clamp(y - this.bounds.top, 0, this.bounds.height);
    }

    updateHighlight(e: GWU.io.Event): boolean {
        if (!this.contains(e)) {
            this.clearHighlight();
            return false;
        }
        return this.highlightRow(this.toInnerY(e.y));
    }

    highlightRow(innerY: number) {
        const y = GWU.clamp(innerY, 0, this.bounds.height);
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

    updateCellCache(map: GWM.map.Map) {
        if (
            this.lastMap &&
            map === this.lastMap &&
            !map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)
        ) {
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

    _makeActorEntry(actor: GWM.actor.Actor): ActorEntry {
        return new ActorEntry(actor);
    }

    _makeItemEntry(item: GWM.item.Item): ItemEntry {
        return new ItemEntry(item);
    }

    _makeCellEntry(cell: GWM.map.CellInfoType): CellEntry {
        return new CellEntry(cell);
    }

    _getPriority(
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovTracker
    ): number {
        if (!fov) {
            return map.cell(x, y).hasCellFlag(GWM.flags.Cell.STABLE_MEMORY)
                ? 3
                : 1;
        }
        if (fov.isDirectlyVisible(x, y)) {
            return 1;
        } else if (fov.isAnyKindOfVisible(x, y)) {
            return 2;
        } else if (fov.isRevealed(x, y)) {
            return 3;
        }
        return -1; // not visible, or revealed
    }

    _isDim(entry: EntryBase): boolean {
        if (entry === this.highlight) return false;
        return !!this.highlight || entry.priority > 2;
    }

    _addActorEntry(
        actor: GWM.actor.Actor,
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovTracker
    ): boolean {
        const priority = this._getPriority(map, actor.x, actor.y, fov);
        if (priority < 0) return false;

        const entry = this._makeActorEntry(actor);
        entry.dist = GWU.xy.distanceBetween(x, y, actor.x, actor.y);
        entry.priority = actor.isPlayer() ? 0 : priority;

        this.entries.push(entry);
        return true;
    }

    _addItemEntry(
        item: GWM.item.Item,
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovTracker
    ): boolean {
        const priority = this._getPriority(map, item.x, item.y, fov);
        if (priority < 0) return false;

        const entry = this._makeItemEntry(item);
        entry.dist = GWU.xy.distanceBetween(x, y, item.x, item.y);
        entry.priority = priority;

        this.entries.push(entry);
        return true;
    }

    _addCellEntry(
        cell: GWM.map.CellInfoType,
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovTracker
    ): boolean {
        const priority = this._getPriority(map, cell.x, cell.y, fov);
        if (priority < 0) return false;

        const entry = this._makeCellEntry(cell);
        entry.dist = GWU.xy.distanceBetween(x, y, cell.x, cell.y);
        entry.priority = priority;

        this.entries.push(entry);
        return true;
    }

    findEntries(
        map: GWM.map.Map,
        cx: number,
        cy: number,
        fov?: GWU.fov.FovTracker
    ) {
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
            if (done[x][y]) return;
            if (this._addActorEntry(a, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });

        map.eachItem((i) => {
            const x = i.x;
            const y = i.y;
            if (done[x][y]) return;
            if (this._addItemEntry(i, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });

        this.cellCache.forEach((c) => {
            if (done[c.x][c.y]) return;
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

    clearSidebar() {
        this.ui.buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            0,
            0,
            this.bg
        );
    }

    drawFor(subject: UISubject): boolean {
        return this.draw(
            subject.memory || subject.map,
            subject.x,
            subject.y,
            subject.fov
        );
    }

    draw(): boolean;
    draw(
        map: GWM.map.Map,
        cx: number,
        cy: number,
        fov?: GWU.fov.FovTracker
    ): boolean;
    draw(
        map?: GWM.map.Map,
        cx?: number,
        cy?: number,
        fov?: GWU.fov.FovTracker
    ): boolean {
        if (arguments.length < 3) {
            if (this.follow) {
                return this.drawFor(this.follow);
            }
            throw new Error('Not following a subject - map, cx, cy required.');
        }
        this.updateCellCache(map!);
        this.findEntries(map!, cx!, cy!, fov);
        this.clearSidebar();

        this.currentY = this.bounds.y;

        // clear the row information
        this.entries.forEach((e) => (e.sidebarY = -1));

        for (
            let i = 0;
            i < this.entries.length && this.currentY < this.bounds.bottom;
            ++i
        ) {
            this.currentEntry = this.entries[i];
            this.currentEntry.sidebarY = this.currentY;
            this.currentEntry.draw(this);
            ++this.currentY; // skip a line
        }

        this.currentEntry = null;
        return true;
    }

    drawTitle(
        cell: GWU.sprite.Mixer,
        title: string,
        fg?: GWU.color.ColorBase
    ): void {
        fg = GWU.color.from(fg || this.fg);
        const fgColor = this._isDim(this.currentEntry!)
            ? fg.clone().darken(50)
            : fg;
        this.buffer.drawSprite(this.bounds.x + 1, this.currentY, cell);
        this.buffer.wrapText(
            this.bounds.x + 3,
            this.currentY,
            this.bounds.width - 3,
            title,
            fgColor
        );
        ++this.currentY;
    }
    drawTextLine(text: string, fg?: GWU.color.ColorBase): void {
        fg = GWU.color.from(fg || this.fg);
        const fgColor = this._isDim(this.currentEntry!)
            ? fg.clone().darken(50)
            : fg;
        this.buffer.drawText(
            this.bounds.x + 3,
            this.currentY,
            text,
            fgColor,
            this.bounds.width - 3
        );
        ++this.currentY;
    }
    drawProgressBar(
        val: number,
        max: number,
        text: string,
        color?: GWU.color.ColorBase,
        bg?: GWU.color.ColorBase,
        fg?: GWU.color.ColorBase
    ): void {
        color = GWU.color.from(color || this.fg);
        bg = GWU.color.from(bg || color.clone().darken(50));
        fg = GWU.color.from(fg || color.clone().lighten(50));

        if (this._isDim(this.currentEntry!)) {
            bg.darken(50);
            fg.darken(50);
            color.darken(50);
        }

        this.buffer.fillRect(
            this.bounds.x + 1,
            this.currentY,
            this.bounds.width - 1,
            1,
            undefined,
            undefined,
            bg
        );
        const len = Math.floor(((this.bounds.width - 1) * val) / max);
        this.buffer.fillRect(
            this.bounds.x + 1,
            this.currentY,
            len,
            1,
            undefined,
            undefined,
            color
        );

        const title = GWU.text.center(text, this.bounds.width);
        this.buffer.drawText(
            this.bounds.x + 1,
            this.currentY,
            title,
            fg,
            undefined,
            this.bounds.width - 1 // just in case title is too long
        );
        ++this.currentY;
    }
}
