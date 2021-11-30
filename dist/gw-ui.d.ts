import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

interface MessageOptions extends GWU.widget.WidgetOptions {
    length?: number;
}
declare class Messages extends GWU.widget.Widget {
    cache: GWU.message.MessageCache;
    constructor(layer: GWU.widget.WidgetLayer, opts: MessageOptions);
    click(e: GWU.io.Event): boolean;
    draw(buffer: GWU.buffer.Buffer): boolean;
    showArchive(): void;
}
declare type ArchiveMode = 'forward' | 'ack' | 'reverse';
declare class MessageArchive extends GWU.widget.Widget {
    source: Messages;
    totalCount: number;
    isOnTop: boolean;
    mode: ArchiveMode;
    shown: number;
    constructor(layer: GWU.widget.WidgetLayer, source: Messages);
    contains(): boolean;
    finish(): void;
    keypress(_e: GWU.io.Event): boolean;
    click(_e: GWU.io.Event): boolean;
    _forward(): boolean;
    _reverse(): boolean;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}

interface FlavorOptions extends GWU.widget.WidgetOptions {
    overflow?: boolean;
}
declare class Flavor extends GWU.widget.Text {
    isPrompt: boolean;
    overflow: boolean;
    promptFg: GWU.color.Color;
    constructor(layer: GWU.widget.WidgetLayer, opts: FlavorOptions);
    showText(text: string): this;
    clear(): this;
    showPrompt(text: string): this;
    getFlavorText(map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): string;
}

interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}

interface SidebarOptions extends GWU.widget.WidgetOptions {
}
declare abstract class EntryBase {
    dist: number;
    priority: number;
    changed: boolean;
    sidebarY: number;
    abstract get x(): number;
    abstract get y(): number;
    draw(_buffer: GWU.buffer.Buffer, _bounds: GWU.xy.Bounds): number;
}
declare class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;
    constructor(actor: GWM.actor.Actor);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.buffer.Buffer, bounds: GWU.xy.Bounds): number;
}
declare class ItemEntry extends EntryBase {
    item: GWM.item.Item;
    constructor(item: GWM.item.Item);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.buffer.Buffer, bounds: GWU.xy.Bounds): number;
}
declare class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;
    constructor(cell: GWM.map.CellInfoType);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.buffer.Buffer, bounds: GWU.xy.Bounds): number;
}
declare type SidebarEntry = ActorEntry | ItemEntry | CellEntry;
declare class Sidebar extends GWU.widget.Widget {
    cellCache: GWM.map.CellInfoType[];
    lastX: number;
    lastY: number;
    lastMap: GWM.map.Map | null;
    entries: SidebarEntry[];
    subject: UISubject | null;
    highlight: EntryBase | null;
    constructor(layer: GWU.widget.WidgetLayer, opts: SidebarOptions);
    reset(): void;
    entryAt(e: GWU.io.Event): EntryBase | null;
    mousemove(e: GWU.io.Event): boolean;
    highlightRow(y: number): boolean;
    clearHighlight(): boolean;
    updateCellCache(map: GWM.map.Map): void;
    _makeActorEntry(actor: GWM.actor.Actor): ActorEntry;
    _makeItemEntry(item: GWM.item.Item): ItemEntry;
    _makeCellEntry(cell: GWM.map.CellInfoType): CellEntry;
    _getPriority(map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovTracker): number;
    _isDim(entry: EntryBase): boolean;
    _addActorEntry(actor: GWM.actor.Actor, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovTracker): boolean;
    _addItemEntry(item: GWM.item.Item, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovTracker): boolean;
    _addCellEntry(cell: GWM.map.CellInfoType, map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovTracker): boolean;
    findEntries(map: GWM.map.Map, cx: number, cy: number, fov?: GWU.fov.FovTracker): void;
    update(): boolean;
    updateFor(subject: UISubject): boolean;
    updateAt(map: GWM.map.Map, cx: number, cy: number, fov?: GWU.fov.FovTracker): boolean;
    draw(buffer: GWU.buffer.Buffer): boolean;
}

declare type ViewFilterFn = (mixer: GWU.sprite.Mixer, x: number, y: number, map: GWM.map.Map) => void;
interface ViewportOptions extends GWU.widget.WidgetOptions {
    snap?: boolean;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}
declare class Viewport extends GWU.widget.Widget {
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    _subject: UISubject | null;
    constructor(layer: GWU.widget.WidgetLayer, opts: ViewportOptions);
    get subject(): UISubject | null;
    set subject(subject: UISubject | null);
    set lock(v: boolean);
    toMapX(x: number): number;
    toMapY(y: number): number;
    toInnerX(x: number): number;
    toInnerY(y: number): number;
    halfWidth(): number;
    halfHeight(): number;
    centerOn(map: GWM.map.Map, x: number, y: number): void;
    showMap(map: GWM.map.Map, x?: number, y?: number): void;
    updateOffset(): void;
    draw(buffer: GWU.buffer.Buffer): boolean;
}

type index_d_MessageOptions = MessageOptions;
type index_d_Messages = Messages;
declare const index_d_Messages: typeof Messages;
type index_d_ArchiveMode = ArchiveMode;
type index_d_MessageArchive = MessageArchive;
declare const index_d_MessageArchive: typeof MessageArchive;
type index_d_FlavorOptions = FlavorOptions;
type index_d_Flavor = Flavor;
declare const index_d_Flavor: typeof Flavor;
type index_d_SidebarOptions = SidebarOptions;
type index_d_EntryBase = EntryBase;
declare const index_d_EntryBase: typeof EntryBase;
type index_d_ActorEntry = ActorEntry;
declare const index_d_ActorEntry: typeof ActorEntry;
type index_d_ItemEntry = ItemEntry;
declare const index_d_ItemEntry: typeof ItemEntry;
type index_d_CellEntry = CellEntry;
declare const index_d_CellEntry: typeof CellEntry;
type index_d_SidebarEntry = SidebarEntry;
type index_d_Sidebar = Sidebar;
declare const index_d_Sidebar: typeof Sidebar;
type index_d_ViewFilterFn = ViewFilterFn;
type index_d_ViewportOptions = ViewportOptions;
type index_d_Viewport = Viewport;
declare const index_d_Viewport: typeof Viewport;
declare namespace index_d {
  export {
    index_d_MessageOptions as MessageOptions,
    index_d_Messages as Messages,
    index_d_ArchiveMode as ArchiveMode,
    index_d_MessageArchive as MessageArchive,
    index_d_FlavorOptions as FlavorOptions,
    index_d_Flavor as Flavor,
    index_d_SidebarOptions as SidebarOptions,
    index_d_EntryBase as EntryBase,
    index_d_ActorEntry as ActorEntry,
    index_d_ItemEntry as ItemEntry,
    index_d_CellEntry as CellEntry,
    index_d_SidebarEntry as SidebarEntry,
    index_d_Sidebar as Sidebar,
    index_d_ViewFilterFn as ViewFilterFn,
    index_d_ViewportOptions as ViewportOptions,
    index_d_Viewport as Viewport,
  };
}

export { index_d as game };
