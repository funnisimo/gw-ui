import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

declare type VAlign = 'top' | 'middle' | 'bottom';
interface PosOptions {
    x?: number;
    y?: number;
    right?: number;
    bottom?: number;
}
interface WidgetRunner {
    readonly ui: UICore;
    fireAction(action: string, widget: Widget): void | Promise<void>;
    requestRedraw(): void;
}
interface WidgetOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    activeFg?: GWU.color.ColorBase;
    activeBg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
    text?: string;
    align?: GWU.canvas.TextAlign;
    valign?: VAlign;
    tabStop?: boolean;
    action?: string;
    depth?: number;
}
declare abstract class Widget {
    bounds: GWU.xy.Bounds;
    active: boolean;
    hovered: boolean;
    tabStop: boolean;
    depth: number;
    fg: GWU.color.ColorBase;
    bg: GWU.color.ColorBase;
    activeFg: GWU.color.ColorBase;
    activeBg: GWU.color.ColorBase;
    hoverFg: GWU.color.ColorBase;
    hoverBg: GWU.color.ColorBase;
    id: string;
    text: string;
    align: GWU.canvas.TextAlign;
    valign: VAlign;
    action: string;
    constructor(id: string, opts?: WidgetOptions);
    init(opts: WidgetOptions): void;
    reset(): void;
    activate(_reverse?: boolean): void;
    deactivate(): void;
    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    mousemove(e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    tick(_e: GWU.io.Event, _dialog: WidgetRunner): void | Promise<void>;
    click(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    keypress(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    dir(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

interface TextOptions extends WidgetOptions {
    wrap?: number;
}
declare class Text extends Widget {
    lines: string[];
    wrap: boolean;
    constructor(id: string, opts?: TextOptions);
    init(opts: TextOptions): void;
    setText(text: string): void;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

interface ButtonOptions extends WidgetOptions {
}
declare class Button extends Widget {
    constructor(id: string, opts?: ButtonOptions);
    init(opts: ButtonOptions): void;
    click(ev: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    keypress(ev: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
}

interface InputOptions extends Omit<WidgetOptions, 'text'> {
    errorFg?: GWU.color.ColorBase;
    hint?: string;
    hintFg?: GWU.color.ColorBase;
    default?: string;
    minLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
}
declare class Input extends Widget {
    hint: string;
    hintFg: GWU.color.ColorBase;
    errorFg: GWU.color.ColorBase;
    default: string;
    minLength: number;
    numbersOnly: boolean;
    min: number;
    max: number;
    constructor(id: string, opts?: InputOptions);
    init(opts: InputOptions): void;
    reset(): void;
    isValid(): boolean;
    get value(): string | number;
    keypress(ev: GWU.io.Event, dialog: WidgetRunner): boolean | Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

declare type ValueFn = (data: any, index: number) => string;
interface ColumnOptions {
    width: number;
    value: string | ValueFn;
    header?: string;
    empty?: string;
    align?: GWU.canvas.TextAlign;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    activeFg?: GWU.color.ColorBase;
    activeBg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
}
declare type HoverType = 'none' | 'column' | 'row' | 'cell';
interface TableOptions extends WidgetOptions {
    height: number;
    letters?: boolean;
    headers?: boolean;
    hover?: HoverType;
    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;
    wrap?: boolean;
    wrapColumns?: boolean;
    wrapRows?: boolean;
    columns: ColumnOptions[];
}
declare type ColorOption = GWU.color.ColorBase | null;
declare type DataArray = any[];
declare type DataList = {
    next: any;
};
declare type DataType = DataArray | DataList | null;
declare class Column {
    active: boolean;
    hovered: boolean;
    fg: ColorOption;
    bg: ColorOption;
    activeFg: ColorOption;
    activeBg: ColorOption;
    hoverFg: ColorOption;
    hoverBg: ColorOption;
    align: GWU.canvas.TextAlign;
    header: string;
    empty: string;
    _value: ValueFn;
    x: number;
    width: number;
    index: number;
    constructor(opts: ColumnOptions);
    value(data: any, index: number): string;
}
declare class Table extends Widget {
    headers: boolean;
    letters: boolean;
    headerFg: GWU.color.ColorBase;
    headerBg: GWU.color.ColorBase;
    wrapColumns: boolean;
    wrapRows: boolean;
    columns: Column[];
    data: DataType;
    hoverType: HoverType;
    selectedColumn: Column | null;
    selectedIndex: number;
    constructor(id: string, opts?: TableOptions);
    init(opts: TableOptions): void;
    setData(data: DataType): void;
    selectRow(index: number): boolean;
    selectNextRow(wrap?: boolean): number;
    selectPrevRow(wrap?: boolean): number;
    selectNextColumn(wrap?: boolean): Column | null;
    selectPrevColumn(wrap?: boolean): Column | null;
    get selectedData(): any | null;
    draw(buffer: GWU.canvas.DataBuffer): void;
    drawColumn(buffer: GWU.canvas.DataBuffer, column: Column, x: number): void;
    drawCell(buffer: GWU.canvas.DataBuffer, column: Column, data: any, index: number, x: number, y: number): void;
    mousemove(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    dir(e: GWU.io.Event): boolean;
}
declare function makeTable(id: string, opts: TableOptions): Table;

interface ListOptions extends ColumnOptions {
    height: number;
    hover?: boolean;
    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;
    wrap?: boolean;
}
declare class List extends Table {
    constructor(id: string, opts: ListOptions);
}

interface BoxOptions extends Omit<WidgetOptions, 'text'> {
    title?: string;
    borderBg?: GWU.color.ColorBase;
    pad?: number;
    padX?: number;
    padY?: number;
}
declare class Box extends Widget {
    borderBg: GWU.color.ColorBase | null;
    constructor(id: string, opts?: BoxOptions);
    init(opts: BoxOptions): void;
    mousemove(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

declare type EventCallback = (ev: GWU.io.Event | string, dialog: Dialog, widget: Widget | null) => any | Promise<any>;
declare type EventHandlers = Record<string, EventCallback>;
declare class Dialog implements WidgetRunner {
    ui: UICore;
    id: string;
    widgets: Widget[];
    eventHandlers: EventHandlers;
    _activeWidget: Widget | null;
    result: any;
    done: boolean;
    timers: Record<string, number>;
    needsRedraw: boolean;
    constructor(ui: UICore, id?: string);
    init(): void;
    get activeWidget(): Widget | null;
    setActiveWidget(w: Widget | null, reverse?: boolean): void;
    requestRedraw(): void;
    setTimeout(action: string, time: number): void;
    clearTimeout(action: string): void;
    fireAction(action: string, widget: Widget | null): Promise<void>;
    setEventHandlers(map: EventHandlers): void;
    show(): Promise<any>;
    close(returnValue: any): void;
    widgetAt(x: number, y: number): Widget | null;
    getWidget(id: string): Widget | null;
    nextTabstop(): boolean;
    prevTabstop(): boolean;
    tick(e: GWU.io.Event): Promise<boolean>;
    mousemove(e: GWU.io.Event): Promise<boolean>;
    click(e: GWU.io.Event): Promise<boolean>;
    keypress(e: GWU.io.Event): Promise<boolean>;
    dir(e: GWU.io.Event): Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer, force?: boolean): void;
}
declare class DialogBuilder {
    dialog: Dialog;
    bounds: GWU.xy.Bounds;
    nextY: number;
    box: BoxOptions | null;
    constructor(ui: UICore, width: number, height: number);
    with(widget: Widget, at?: PosOptions): this;
    center(): this;
    place(x: number, y: number): this;
    addBox(opts?: BoxOptions): this;
    done(): Dialog;
}
declare function buildDialog(ui: UICore, width?: number, height?: number): DialogBuilder;

interface AlertOptions extends WidgetOptions {
    duration?: number;
    waitForAck?: boolean;
    pad?: number;
    padX?: number;
    padY?: number;
    box?: BoxOptions;
}
interface ConfirmOptions extends WidgetOptions {
    allowCancel?: boolean;
    pad?: number;
    padX?: number;
    padY?: number;
    buttons?: ButtonOptions;
    ok?: string | ButtonOptions;
    cancel?: string | ButtonOptions;
    box?: BoxOptions;
}
interface InputBoxOptions extends ConfirmOptions {
    prompt?: string | TextOptions;
    input?: InputOptions;
}
interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;
    render(): void;
    startLayer(): GWU.canvas.Buffer;
    resetLayerBuffer(): void;
    finishLayer(): void;
    fadeTo(color?: GWU.color.ColorBase, duration?: number): Promise<void>;
    getInputAt(x: number, y: number, maxLength: number, opts?: InputOptions): Promise<string>;
    alert(opts: number | AlertOptions, text: string, args: any): Promise<void>;
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
    get baseBuffer(): GWU.canvas.Buffer;
    get canvasBuffer(): GWU.canvas.Buffer;
    startLayer(): GWU.canvas.Buffer;
    resetLayerBuffer(): void;
    finishLayer(): void;
    fadeTo(color?: GWU.color.ColorBase, duration?: number): Promise<void>;
    alert(opts: number | AlertOptions, text: string, args: any): Promise<any>;
    confirm(text: string, args?: any): Promise<boolean>;
    confirm(opts: ConfirmOptions, text: string, args?: any): Promise<boolean>;
    showWidget(widget: Widget, keymap?: EventHandlers): Promise<any>;
    getInputAt(x: number, y: number, maxLength: number, opts?: InputOptions): Promise<string>;
    inputBox(opts: InputBoxOptions, prompt: string, args?: any): Promise<any>;
}

interface MessageOptions extends WidgetOptions {
    length?: number;
}
declare class Messages extends Widget {
    cache: GWU.message.MessageCache;
    constructor(id: string, opts?: MessageOptions);
    init(opts: MessageOptions): void;
    click(e: GWU.io.Event, dialog: WidgetRunner): boolean | Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer): boolean;
    showArchive(dialog: WidgetRunner): Promise<boolean>;
}

declare type ViewFilterFn = (mixer: GWU.sprite.Mixer, x: number, y: number, map: GWM.map.Map) => void;
interface ViewportOptions extends WidgetOptions {
    snap?: boolean;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}
declare class Viewport extends Widget {
    center: boolean;
    snap: boolean;
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    lockX: boolean;
    lockY: boolean;
    _subject: UISubject | null;
    constructor(id: string, opts?: ViewportOptions);
    init(opts: ViewportOptions): void;
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
    draw(buffer: GWU.canvas.DataBuffer): boolean;
}

interface FlavorOptions extends TextOptions {
    promptFg?: GWU.color.ColorBase;
    overflow?: boolean;
}
declare class Flavor extends Text {
    isPrompt: boolean;
    overflow: boolean;
    promptFg: GWU.color.Color;
    constructor(id: string, opts?: FlavorOptions);
    init(opts: FlavorOptions): void;
    showText(text: string): void;
    clear(): void;
    showPrompt(text: string): void;
    draw(buffer: GWU.canvas.DataBuffer): void;
    getFlavorText(map: GWM.map.Map, x: number, y: number, fov?: GWU.fov.FovSystem): string;
}

interface SidebarOptions extends WidgetOptions {
}
declare abstract class EntryBase {
    dist: number;
    priority: number;
    changed: boolean;
    sidebarY: number;
    abstract get x(): number;
    abstract get y(): number;
    draw(_buffer: GWU.canvas.DataBuffer, _bounds: GWU.xy.Bounds): number;
}
declare class ActorEntry extends EntryBase {
    actor: GWM.actor.Actor;
    constructor(actor: GWM.actor.Actor);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number;
}
declare class ItemEntry extends EntryBase {
    item: GWM.item.Item;
    constructor(item: GWM.item.Item);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number;
}
declare class CellEntry extends EntryBase {
    cell: GWM.map.CellInfoType;
    constructor(cell: GWM.map.CellInfoType);
    get x(): number;
    get y(): number;
    draw(buffer: GWU.canvas.DataBuffer, bounds: GWU.xy.Bounds): number;
}
declare type SidebarEntry = ActorEntry | ItemEntry | CellEntry;
declare class Sidebar extends Widget {
    cellCache: GWM.map.CellInfoType[];
    lastX: number;
    lastY: number;
    lastMap: GWM.map.Map | null;
    entries: SidebarEntry[];
    subject: UISubject | null;
    highlight: EntryBase | null;
    constructor(id: string, opts?: SidebarOptions);
    init(opts: SidebarOptions): void;
    reset(): void;
    entryAt(e: GWU.io.Event): EntryBase | null;
    mousemove(e: GWU.io.Event, dialog: WidgetRunner): boolean | Promise<boolean>;
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
    draw(buffer: GWU.canvas.DataBuffer): boolean;
}

declare type ActionFn = (e: GWU.io.Event, ui: UICore, button: MenuButton) => boolean | Promise<boolean>;
interface Rec<T> {
    [keys: string]: T;
}
declare type DropdownConfig = Rec<ButtonConfig>;
declare type ActionConfig = string;
declare type ButtonConfig = ActionConfig | DropdownConfig;
declare class MenuButton {
    text: string;
    hovered: boolean;
    x: number;
    constructor(text: string);
    get width(): number;
}
declare class ActionButton extends MenuButton {
    action: string;
    constructor(text: string, action: string);
}
declare class DropDownButton extends MenuButton {
    bounds: GWU.xy.Bounds;
    buttons: MenuButton[];
    menu: Menu;
    parent: DropDownButton | null;
    constructor(menu: Menu, parent: DropDownButton | null, text: string, buttons: ButtonConfig);
    addButton(text: string, config: ButtonConfig): void;
    setBounds(buffer: GWU.canvas.DataBuffer, px: number, py: number, pw: number): void;
    contains(e: GWU.io.Event): boolean;
    buttonAt(e: GWU.io.Event): MenuButton | null;
    draw(buffer: GWU.canvas.DataBuffer): void;
}
declare function showDropDown(dialog: WidgetRunner, menu: Menu, button: DropDownButton): Promise<void>;
interface MenuOptions extends WidgetOptions {
    separator?: string;
    lead?: string;
    dropFg?: GWU.color.ColorBase;
    dropBg?: GWU.color.ColorBase;
    buttons: ButtonConfig;
}
declare class Menu extends Widget {
    buttons: MenuButton[];
    separator: string;
    lead: string;
    dropFg: GWU.color.Color;
    dropBg: GWU.color.Color;
    activeIndex: number;
    actionButton: ActionButton | null;
    constructor(id: string, opts?: MenuOptions);
    init(opts: MenuOptions): void;
    reset(): void;
    activate(reverse?: boolean): void;
    deactivate(): void;
    mousemove(e: GWU.io.Event, dialog: WidgetRunner): boolean;
    clearHighlight(): void;
    getButtonAt(x: number, _y: number): MenuButton | null;
    click(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    keypress(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    protected _addButton(text: string, config: ButtonConfig): void;
    draw(buffer: GWU.canvas.DataBuffer): boolean;
}

export { ActionButton, ActionFn, ActorEntry, AlertOptions, Box, BoxOptions, Button, ButtonOptions, CellEntry, ColorOption, Column, ColumnOptions, ConfirmOptions, DataArray, DataList, DataType, Dialog, DialogBuilder, DropDownButton, EntryBase, EventCallback, EventHandlers, Flavor, FlavorOptions, HoverType, Input, InputBoxOptions, InputOptions, ItemEntry, List, ListOptions, Menu, MenuButton, MenuOptions, MessageOptions, Messages, PosOptions, Sidebar, SidebarEntry, SidebarOptions, Table, TableOptions, Text, TextOptions, UI, UICore, UIOptions, UISubject, VAlign, ValueFn, ViewFilterFn, Viewport, ViewportOptions, Widget, WidgetOptions, WidgetRunner, buildDialog, makeTable, showDropDown };
