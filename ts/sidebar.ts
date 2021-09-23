import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

import { UIType } from './types';

GWU.color.install('blueBar', 15, 10, 50);
GWU.color.install('redBar', 45, 10, 15);
GWU.color.install('purpleBar', 50, 0, 50);
GWU.color.install('greenBar', 10, 50, 10);

export interface SidebarOptions {
    ui: UIType;
    x: number;
    y: number;
    width: number;
    height: number;
    bg?: GWU.color.ColorBase;
}

export class EntryBase {
    dist = 0;
    priority = 0;
    changed = false;
}

export class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;

    constructor(actor: GWM.actor.Actor) {
        super();
        this.actor = actor;
    }
}

export class ItemEntry extends EntryBase {
    item: GWM.item.Item;

    constructor(item: GWM.item.Item) {
        super();
        this.item = item;
    }
}

export class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;

    constructor(cell: GWM.map.CellInfoType) {
        super();
        this.cell = cell;
    }
}

export type SidebarEntry = ActorEntry | ItemEntry | CellEntry;

export class Sidebar {
    ui: UIType;
    bounds: GWU.xy.Bounds;
    cellCache: GWM.map.CellInfoType[] = [];
    lastX = -1;
    lastY = -1;
    lastMap: GWM.map.Map | null = null;
    entries: SidebarEntry[] = [];
    bg: GWU.color.Color;

    constructor(opts: SidebarOptions) {
        this.ui = opts.ui;
        this.bounds = new GWU.xy.Bounds(
            opts.x,
            opts.y,
            opts.width,
            opts.height
        );
        this.bg = GWU.color.from(opts.bg || 'black');
    }

    contains(x: number, y: number): boolean {
        return this.bounds.contains(x, y);
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
            const info = map.knowledge(x, y);
            if (info.hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)) {
                this.cellCache.push(info);
            }
        });

        map.clearMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED);
    }

    makeActorEntry(actor: GWM.actor.Actor): ActorEntry {
        return new ActorEntry(actor);
    }

    makeItemEntry(item: GWM.item.Item): ItemEntry {
        return new ItemEntry(item);
    }

    makeCellEntry(cell: GWM.map.CellInfoType): CellEntry {
        return new CellEntry(cell);
    }

    getPriority(map: GWM.map.Map, x: number, y: number): number {
        if (map.fov.isDirectlyVisible(x, y)) {
            return 1;
        } else if (map.fov.isAnyKindOfVisible(x, y)) {
            return 2;
        } else if (map.fov.isRevealed(x, y)) {
            return 3;
        }
        return -1; // not visible, or revealed
    }

    addActor(
        actor: GWM.actor.Actor,
        map: GWM.map.Map,
        x: number,
        y: number
    ): boolean {
        const priority = this.getPriority(map, actor.x, actor.y);
        if (priority < 0) return false;

        const entry = this.makeActorEntry(actor);
        entry.dist = GWU.xy.distanceBetween(x, y, actor.x, actor.y);
        entry.priority = actor.isPlayer() ? 0 : priority;

        this.entries.push(entry);
        return true;
    }

    addItem(
        item: GWM.item.Item,
        map: GWM.map.Map,
        x: number,
        y: number
    ): boolean {
        const priority = this.getPriority(map, item.x, item.y);
        if (priority < 0) return false;

        const entry = this.makeItemEntry(item);
        entry.dist = GWU.xy.distanceBetween(x, y, item.x, item.y);
        entry.priority = priority;

        this.entries.push(entry);
        return true;
    }

    addCell(
        cell: GWM.map.CellInfoType,
        map: GWM.map.Map,
        x: number,
        y: number
    ): boolean {
        const priority = this.getPriority(map, cell.x, cell.y);
        if (priority < 0) return false;

        const entry = this.makeCellEntry(cell);
        entry.dist = GWU.xy.distanceBetween(x, y, cell.x, cell.y);
        entry.priority = priority;

        this.entries.push(entry);
        return true;
    }

    findEntries(map: GWM.map.Map, cx: number, cy: number) {
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
            if (done[x][y]) return;
            if (this.addActor(a, map, cx, cy)) {
                done[x][y] = 1;
            }
        });

        map.eachItem((i) => {
            const x = i.lastSeen ? i.lastSeen.x : i.x;
            const y = i.lastSeen ? i.lastSeen.y : i.y;
            if (done[x][y]) return;
            if (this.addItem(i, map, cx, cy)) {
                done[x][y] = 1;
            }
        });

        this.cellCache.forEach((c) => {
            if (done[c.x][c.y]) return;
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

    update(map: GWM.map.Map, x: number, y: number): boolean {
        this.updateCellCache(map);
        this.findEntries(map, x, y);
        this.clearSidebar();

        return true;
    }
}
