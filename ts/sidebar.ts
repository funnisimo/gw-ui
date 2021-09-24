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
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
}

export class EntryBase {
    dist = 0;
    priority = 0;
    changed = false;

    draw(_sidebar: Sidebar): void {}
}

export class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;

    constructor(actor: GWM.actor.Actor) {
        super();
        this.actor = actor;
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

    draw(sidebar: Sidebar): void {
        this.cell.drawStatus(sidebar);
    }
}

export type SidebarEntry = ActorEntry | ItemEntry | CellEntry;

export class Sidebar implements GWM.entity.StatusDrawer {
    ui: UIType;
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
            const info = map.cell(x, y);
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

    getPriority(
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovSystem
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

    addActor(
        actor: GWM.actor.Actor,
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovSystem
    ): boolean {
        const priority = this.getPriority(map, actor.x, actor.y, fov);
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
        y: number,
        fov?: GWU.fov.FovSystem
    ): boolean {
        const priority = this.getPriority(map, item.x, item.y, fov);
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
        y: number,
        fov?: GWU.fov.FovSystem
    ): boolean {
        const priority = this.getPriority(map, cell.x, cell.y, fov);
        if (priority < 0) return false;

        const entry = this.makeCellEntry(cell);
        entry.dist = GWU.xy.distanceBetween(x, y, cell.x, cell.y);
        entry.priority = priority;

        this.entries.push(entry);
        return true;
    }

    findEntries(
        map: GWM.map.Map,
        cx: number,
        cy: number,
        fov?: GWU.fov.FovSystem
    ) {
        if (map === this.lastMap && cx === this.lastX && cy === this.lastY)
            return;

        this.lastMap = map;
        this.lastX = cx;
        this.lastY = cy;

        this.entries.length = 0;
        const done = GWU.grid.alloc(map.width, map.height);

        map.eachActor((a) => {
            const x = a.x;
            const y = a.y;
            if (done[x][y]) return;
            if (this.addActor(a, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });

        map.eachItem((i) => {
            const x = i.x;
            const y = i.y;
            if (done[x][y]) return;
            if (this.addItem(i, map, cx, cy, fov)) {
                done[x][y] = 1;
            }
        });

        this.cellCache.forEach((c) => {
            if (done[c.x][c.y]) return;
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

    draw(
        map: GWM.map.Map,
        cx: number,
        cy: number,
        fov?: GWU.fov.FovSystem
    ): boolean {
        this.updateCellCache(map);
        this.findEntries(map, cx, cy, fov);
        this.clearSidebar();

        this.currentY = this.bounds.y;

        for (
            let i = 0;
            i < this.entries.length && this.currentY < this.bounds.bottom;
            ++i
        ) {
            const entry = this.entries[i];
            entry.draw(this);
            ++this.currentY; // skip a line
        }

        return true;
    }

    drawTitle(
        cell: GWU.sprite.Mixer,
        title: string,
        fg?: GWU.color.ColorBase
    ): void {
        this.buffer.drawSprite(this.bounds.x + 1, this.currentY, cell);
        this.buffer.wrapText(
            this.bounds.x + 3,
            this.currentY,
            this.bounds.width - 3,
            title,
            fg || this.fg
        );
        ++this.currentY;
    }
    drawTextLine(text: string, fg?: GWU.color.ColorBase): void {
        this.buffer.drawText(
            this.bounds.x + 3,
            this.currentY,
            text,
            fg || this.fg,
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
