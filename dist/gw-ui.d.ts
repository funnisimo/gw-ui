import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

interface GetInputOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    errorFg?: GWU.color.ColorBase;
    promptFg?: GWU.color.ColorBase;
    prompt?: string;
    default?: string;
    minLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
}
interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;
    render(): void;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
    getInputAt(x: number, y: number, maxLength: number, opts?: GetInputOptions): Promise<string>;
}
interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}

interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}
declare class UI implements UICore {
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
    getInputAt(x: number, y: number, maxLength: number, opts?: GetInputOptions): Promise<string>;
}

interface MessageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    ui: UICore;
    bg?: GWU.color.ColorBase;
    fg?: GWU.color.ColorBase;
}
declare class Messages {
    bounds: GWU.xy.Bounds;
    cache: GWU.message.MessageCache;
    ui: UICore;
    bg: GWU.color.Color;
    fg: GWU.color.Color;
    constructor(opts: MessageOptions);
    contains(e: GWU.io.Event): boolean;
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
    ui: UICore;
    x: number;
    y: number;
    width: number;
    height: number;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}
declare class Viewport {
    ui: UICore;
    center: boolean;
    snap: boolean;
    bounds: GWU.xy.Bounds;
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    lockX: boolean;
    lockY: boolean;
    _follow: UISubject | null;
    constructor(opts: ViewportOptions);
    get follow(): UISubject | null;
    set follow(subject: UISubject | null);
    toMapX(x: number): number;
    toMapY(y: number): number;
    toInnerX(x: number): number;
    toInnerY(y: number): number;
    contains(e: GWU.io.Event): boolean;
    halfWidth(): number;
    halfHeight(): number;
    centerOn(x: number, y: number, map?: GWU.xy.Size): void;
    updateOffset(focus: GWU.xy.XY | null, map?: GWU.xy.Size): void;
    drawFor(subject: UISubject): boolean;
    draw(map?: GWM.map.Map, fov?: GWU.fov.FovTracker): boolean;
}

interface FlavorOptions {
    ui: UICore;
    x: number;
    y: number;
    width: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    promptFg?: GWU.color.ColorBase;
}
declare class Flavor {
    ui: UICore;
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
    ui: UICore;
    x: number;
    y: number;
    width: number;
    height: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
}
declare abstract class EntryBase {
    dist: number;
    priority: number;
    changed: boolean;
    sidebarY: number;
    abstract get x(): number;
    abstract get y(): number;
    draw(_sidebar: Sidebar): void;
}
declare class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;
    constructor(actor: GWM.actor.Actor);
    get x(): number;
    get y(): number;
    draw(sidebar: Sidebar): void;
}
declare class ItemEntry extends EntryBase {
    item: GWM.item.Item;
    constructor(item: GWM.item.Item);
    get x(): number;
    get y(): number;
    draw(sidebar: Sidebar): void;
}
declare class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;
    constructor(cell: GWM.map.CellInfoType);
    get x(): number;
    get y(): number;
    draw(sidebar: Sidebar): void;
}
declare type SidebarEntry = ActorEntry | ItemEntry | CellEntry;
declare class Sidebar implements GWM.entity.StatusDrawer {
    ui: UICore;
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
    follow: UISubject | null;
    highlight: EntryBase | null;
    currentEntry: EntryBase | null;
    constructor(opts: SidebarOptions);
    get buffer(): GWU.canvas.DataBuffer;
    contains(e: GWU.io.Event): boolean;
    toInnerY(y: number): number;
    updateHighlight(e: GWU.io.Event): boolean;
    highlightRow(innerY: number): boolean;
    clearHighlight(): void;
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
    clearSidebar(): void;
    drawFor(subject: UISubject): boolean;
    draw(): boolean;
    draw(map: GWM.map.Map, cx: number, cy: number, fov?: GWU.fov.FovTracker): boolean;
    drawTitle(cell: GWU.sprite.Mixer, title: string, fg?: GWU.color.ColorBase): void;
    drawTextLine(text: string, fg?: GWU.color.ColorBase): void;
    drawProgressBar(val: number, max: number, text: string, color?: GWU.color.ColorBase, bg?: GWU.color.ColorBase, fg?: GWU.color.ColorBase): void;
}

declare type ActionFn = (button: ActionButton) => boolean | Promise<boolean>;
interface Rec<T> {
    [keys: string]: T;
}
declare type DropdownConfig = Rec<ButtonConfig>;
declare type ActionConfig = ActionFn;
declare type ButtonConfig = ActionConfig | DropdownConfig;
declare class Button {
    text: string;
    hovered: boolean;
    x: number;
    constructor(text: string);
    get width(): number;
}
declare class ActionButton extends Button {
    fn: ActionFn;
    constructor(text: string, fn: ActionFn);
    activate(): any;
}
declare class DropDownButton extends Button {
    bounds: GWU.xy.Bounds;
    buttons: Button[];
    menu: Menu;
    parent: DropDownButton | null;
    constructor(menu: Menu, parent: DropDownButton | null, text: string, buttons: ButtonConfig);
    addButton(text: string, config: ButtonConfig): void;
    setBounds(px: number, py: number, pwidth: number): void;
    contains(e: GWU.io.Event): boolean;
    buttonAt(e: GWU.io.Event): Button | null;
    drawInto(buffer: GWU.canvas.DataBuffer): void;
}
declare function showDropDown(menu: Menu, button: DropDownButton): Promise<void>;
interface MenuOptions {
    ui: UICore;
    x: number;
    y: number;
    width: number;
    separator?: string;
    lead?: string;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
    dropFg?: GWU.color.ColorBase;
    dropBg?: GWU.color.ColorBase;
    buttons: ButtonConfig;
}
declare class Menu {
    bounds: GWU.xy.Bounds;
    buttons: Button[];
    ui: UICore;
    separator: string;
    lead: string;
    fg: GWU.color.Color;
    bg: GWU.color.Color;
    hoverFg: GWU.color.Color;
    hoverBg: GWU.color.Color;
    dropFg: GWU.color.Color;
    dropBg: GWU.color.Color;
    needsRedraw: boolean;
    constructor(opts: MenuOptions);
    contains(e: GWU.io.Event): boolean;
    handleMouse(e: GWU.io.Event): boolean;
    clearHighlight(): void;
    getButtonAt(x: number, _y: number): Button | null;
    handleClick(e: GWU.io.Event): Promise<boolean>;
    addButton(text: string, config: ButtonConfig): void;
    draw(force?: boolean): boolean;
    drawInto(buffer: GWU.canvas.DataBuffer): boolean;
}

export { ActionButton, ActionFn, ActorEntry, Button, CellEntry, DropDownButton, EntryBase, Flavor, FlavorOptions, GetInputOptions, ItemEntry, Menu, MenuOptions, MessageOptions, Messages, Sidebar, SidebarEntry, SidebarOptions, UI, UICore, UIOptions, UISubject, ViewFilterFn, Viewport, ViewportOptions, showDropDown };
