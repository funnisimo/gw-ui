import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as Widget from './widget';

import { UISubject, UICore } from './types';

GWU.color.install('blueBar', 15, 10, 50);
GWU.color.install('redBar', 45, 10, 15);
GWU.color.install('purpleBar', 50, 0, 50);
GWU.color.install('greenBar', 10, 50, 10);

export interface SidebarOptions extends Widget.WidgetOptions {}

export abstract class EntryBase {
    dist = 0;
    priority = 0;
    changed = false;
    sidebarY = -1;

    abstract get x(): number;
    abstract get y(): number;

    draw(_buffer: GWU.canvas.DataBuffer, _bounds: GWU.xy.Bounds): number {
        return 0;
    }
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

    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number {
        return this.actor.drawStatus(buffer, bounds);
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

    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number {
        return this.item.drawStatus(buffer, bounds);
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

    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number {
        return this.cell.drawStatus(buffer, bounds);
    }
}

export type SidebarEntry = ActorEntry | ItemEntry | CellEntry;

export class Sidebar extends Widget.Widget {
    cellCache: GWM.map.CellInfoType[] = [];
    lastX = -1;
    lastY = -1;
    lastMap: GWM.map.Map | null = null;
    entries: SidebarEntry[] = [];
    subject: UISubject | null = null;
    highlight: EntryBase | null = null;

    constructor(id: string, opts?: SidebarOptions) {
        super(id, opts);
    }

    init(opts: SidebarOptions) {
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

    entryAt(e: GWU.io.Event): EntryBase | null {
        return (
            this.entries.find((entry) => {
                return entry.sidebarY <= e.y && entry.sidebarY !== -1;
            }) || null
        );
    }

    mousemove(e: GWU.io.Event, ui: UICore): boolean | Promise<boolean> {
        super.mousemove(e, ui);
        if (this.contains(e)) {
            return this.highlightRow(e.y);
        }
        return this.clearHighlight();
    }

    highlightRow(y: number) {
        const last = this.highlight;
        this.highlight = null;
        // processed in ascending y order
        this.entries.forEach((e) => {
            if (e.sidebarY <= y && e.sidebarY !== -1) {
                this.highlight = e;
            }
        });
        if (this.parent) this.parent.requestRedraw();
        return this.highlight !== last;
    }

    clearHighlight() {
        const result = !!this.highlight;
        this.highlight = null;
        if (this.parent) this.parent.requestRedraw();
        return result;
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
        return entry.priority > 2 || !!this.highlight;
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

    update(): boolean {
        if (!this.subject) {
            throw new Error('Update requires a subject to follow.');
        }
        return this.updateFor(this.subject);
    }

    updateFor(subject: UISubject): boolean {
        return this.updateAt(
            subject.memory || subject.map,
            subject.x,
            subject.y,
            subject.fov
        );
    }

    updateAt(
        map: GWM.map.Map,
        cx: number,
        cy: number,
        fov?: GWU.fov.FovTracker
    ): boolean {
        this.updateCellCache(map);
        this.findEntries(map, cx, cy, fov);
        if (this.parent) this.parent.requestRedraw();
        return true;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            0,
            0,
            this.bg
        );

        // clear the row information
        this.entries.forEach((e) => (e.sidebarY = -1));

        const drawBounds = this.bounds.clone();
        let currentEntry: EntryBase;

        for (let i = 0; i < this.entries.length && drawBounds.height > 0; ++i) {
            currentEntry = this.entries[i];
            currentEntry.sidebarY = drawBounds.y;
            let usedLines = currentEntry.draw(buffer, drawBounds);
            if (this._isDim(currentEntry)) {
                buffer.mix(
                    this.bg,
                    50,
                    drawBounds.x,
                    drawBounds.y,
                    drawBounds.width,
                    usedLines
                );
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
