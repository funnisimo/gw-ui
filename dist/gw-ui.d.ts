import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

interface UIType {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;
    render(): void;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}

interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}
declare class UI implements UIType {
    buffer: GWU.canvas.Buffer;
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
    layers: GWU.canvas.Buffer[];
    freeBuffers: GWU.canvas.Buffer[];
    inDialog: boolean;
    constructor(opts?: Partial<UIOptions>);
    render(): void;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}

interface MessageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    ui: UIType;
    bg?: GWU.color.ColorBase;
    fg?: GWU.color.ColorBase;
}
declare class Messages {
    bounds: GWU.xy.Bounds;
    cache: GWU.message.MessageCache;
    ui: UIType;
    bg: GWU.color.Color;
    fg: GWU.color.Color;
    constructor(opts: MessageOptions);
    contains(x: number, y: number): boolean;
    get needsUpdate(): boolean;
    get buffer(): GWU.canvas.DataBuffer;
    draw(force?: boolean): boolean;
    toBufferY(y: number): number;
    toBufferX(x: number): number;
    showArchive(): Promise<void>;
}

declare type ViewFilterFn = (mixer: GWU.sprite.Mixer, x: number, y: number, map: GWM.map.Map) => void;
interface ViewportOptions {
    snap?: boolean;
    follow?: boolean;
    ui: UIType;
    x: number;
    y: number;
    width: number;
    height: number;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
}
declare class Viewport {
    ui: UIType;
    follow: boolean;
    snap: boolean;
    bounds: GWU.xy.Bounds;
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    lockX: boolean;
    lockY: boolean;
    constructor(opts: ViewportOptions);
    toMapX(x: number): number;
    toMapY(y: number): number;
    toInnerX(x: number): number;
    toInnerY(y: number): number;
    contains(x: number, y: number): boolean;
    halfWidth(): number;
    halfHeight(): number;
    draw(map: GWM.map.Map, playerX?: number, playerY?: number): boolean;
}

interface FlavorOptions {
    ui: UIType;
    x: number;
    y: number;
    width: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    promptFg?: GWU.color.ColorBase;
}
declare class Flavor {
    ui: UIType;
    bounds: GWU.xy.Bounds;
    text: string;
    needsUpdate: boolean;
    isPrompt: boolean;
    overflow: boolean;
    fg: GWU.color.Color;
    bg: GWU.color.Color;
    promptFg: GWU.color.Color;
    constructor(opts: FlavorOptions);
    showText(text: string): void;
    clear(): void;
    showPrompt(text: string): void;
    draw(force?: boolean): boolean;
    getFlavorText(map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): string;
}

interface SidebarOptions {
    ui: UIType;
    x: number;
    y: number;
    width: number;
    height: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
}
declare class EntryBase {
    dist: number;
    priority: number;
    changed: boolean;
    draw(_sidebar: Sidebar): void;
}
declare class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;
    constructor(actor: GWM.actor.Actor);
    draw(sidebar: Sidebar): void;
}
declare class ItemEntry extends EntryBase {
    item: GWM.item.Item;
    constructor(item: GWM.item.Item);
    draw(sidebar: Sidebar): void;
}
declare class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;
    constructor(cell: GWM.map.CellInfoType);
    draw(sidebar: Sidebar): void;
}
declare type SidebarEntry = ActorEntry | ItemEntry | CellEntry;
declare class Sidebar implements GWM.entity.StatusDrawer {
    ui: UIType;
    bounds: GWU.xy.Bounds;
    cellCache: GWM.map.CellInfoType[];
    lastX: number;
    lastY: number;
    lastMap: GWM.map.Map | null;
    entries: SidebarEntry[];
    fg: GWU.color.Color;
    bg: GWU.color.Color;
    mixer: GWU.sprite.Mixer;
    currentY: number;
    constructor(opts: SidebarOptions);
    get buffer(): GWU.canvas.DataBuffer;
    contains(x: number, y: number): boolean;
    updateCellCache(map: GWM.map.Map): void;
    makeActorEntry(actor: GWM.actor.Actor): ActorEntry;
    makeItemEntry(item: GWM.item.Item): ItemEntry;
    makeCellEntry(cell: GWM.map.CellInfoType): CellEntry;
    getPriority(map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): number;
    addActor(actor: GWM.actor.Actor, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): boolean;
    addItem(item: GWM.item.Item, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): boolean;
    addCell(cell: GWM.map.CellInfoType, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): boolean;
    findEntries(map: GWM.map.Map, cx: number, cy: number, fov?: GWU.fov.FovSystem): void;
    clearSidebar(): void;
    draw(map: GWM.map.Map, cx: number, cy: number, fov?: GWU.fov.FovSystem): boolean;
    drawTitle(cell: GWU.sprite.Mixer, title: string, fg?: GWU.color.ColorBase): void;
    drawTextLine(text: string, fg?: GWU.color.ColorBase): void;
    drawProgressBar(val: number, max: number, text: string, color?: GWU.color.ColorBase, bg?: GWU.color.ColorBase, fg?: GWU.color.ColorBase): void;
}

export { ActorEntry, CellEntry, EntryBase, Flavor, FlavorOptions, ItemEntry, MessageOptions, Messages, Sidebar, SidebarEntry, SidebarOptions, UI, UIOptions, UIType, ViewFilterFn, Viewport, ViewportOptions };
