import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

declare type VAlign = 'top' | 'middle' | 'bottom';
interface PosOptions$1 {
    x?: number;
    y?: number;
    right?: number;
    bottom?: number;
}
interface WidgetRunner {
    readonly ui: UICore;
    fireAction(action: string, widget: Widget$1): void | Promise<void>;
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
    align?: GWU.text.Align;
    valign?: VAlign;
    tabStop?: boolean;
    action?: string;
    depth?: number;
}
declare abstract class Widget$1 {
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
    align: GWU.text.Align;
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
declare class Text extends Widget$1 {
    lines: string[];
    wrap: boolean;
    constructor(id: string, opts?: TextOptions);
    init(opts: TextOptions): void;
    setText(text: string): void;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

interface ButtonOptions extends WidgetOptions {
}
declare class Button extends Widget$1 {
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
declare class Input extends Widget$1 {
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
    align?: GWU.text.Align;
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
    align: GWU.text.Align;
    header: string;
    empty: string;
    _value: ValueFn;
    x: number;
    width: number;
    index: number;
    constructor(opts: ColumnOptions);
    value(data: any, index: number): string;
}
declare class Table extends Widget$1 {
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
declare class Box extends Widget$1 {
    borderBg: GWU.color.ColorBase | null;
    constructor(id: string, opts?: BoxOptions);
    init(opts: BoxOptions): void;
    mousemove(_e: GWU.io.Event, _dialog: WidgetRunner): boolean | Promise<boolean>;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

declare type EventCallback = (ev: GWU.io.Event | string, dialog: Dialog, widget: Widget$1 | null) => any | Promise<any>;
declare type EventHandlers = Record<string, EventCallback>;
declare class Dialog implements WidgetRunner {
    ui: UICore;
    id: string;
    widgets: Widget$1[];
    eventHandlers: EventHandlers;
    _activeWidget: Widget$1 | null;
    result: any;
    done: boolean;
    timers: Record<string, number>;
    needsRedraw: boolean;
    constructor(ui: UICore, id?: string);
    init(): void;
    get activeWidget(): Widget$1 | null;
    setActiveWidget(w: Widget$1 | null, reverse?: boolean): void;
    requestRedraw(): void;
    setTimeout(action: string, time: number): void;
    clearTimeout(action: string): void;
    fireAction(action: string, widget: Widget$1 | null): Promise<void>;
    setEventHandlers(map: EventHandlers): void;
    show(): Promise<any>;
    close(returnValue: any): void;
    widgetAt(x: number, y: number): Widget$1 | null;
    getWidget(id: string): Widget$1 | null;
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
    with(widget: Widget$1, at?: PosOptions$1): this;
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
    buffer: GWU.canvas.Buffer;
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
    showWidget(widget: Widget$1, keymap?: EventHandlers): Promise<any>;
    getInputAt(x: number, y: number, maxLength: number, opts?: InputOptions): Promise<string>;
    inputBox(opts: InputBoxOptions, prompt: string, args?: any): Promise<any>;
}

interface MessageOptions extends WidgetOptions {
    length?: number;
}
declare class Messages extends Widget$1 {
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
declare class Viewport extends Widget$1 {
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
declare class Sidebar extends Widget$1 {
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
declare class Menu extends Widget$1 {
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

declare type Cb = (...args: any[]) => any | Promise<any>;
declare class Callbacks {
    _items: Cb[];
    _disabled: boolean;
    _fired: boolean;
    _once: boolean;
    _stopOnFalse: boolean;
    _unique: boolean;
    constructor(flags: string);
    add(cb: Cb | Cb[]): this;
    disable(): this;
    disabled(): boolean;
    empty(): this;
    fire(...args: any[]): Promise<this>;
    fired(): boolean;
    fireWith(obj: object, args: any[]): Promise<this>;
    has(cb: Cb): boolean;
    remove(cb: Cb): this;
}

declare function isTruthy(v: any): boolean;
interface Selectable {
    tag: string;
    id: string;
    classes: string[];
    props: Record<string, any>;
}
declare class Selector {
    tag: string;
    id: string;
    class: string;
    prop: string;
    text: string;
    priority: number;
    constructor(text: string);
    matches(obj: Selectable): boolean;
}
declare function selector(text: string): Selector;

declare type Position = 'static' | 'relative' | 'fixed' | 'absolute';
interface StyleOptions {
    padding?: number | [number, number] | [number, number, number, number];
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    depth?: number;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
    position?: Position;
    minWidth?: number;
    maxWidth?: number;
    width?: number;
    minHeight?: number;
    maxHeight?: number;
    height?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
}
declare class Style {
    protected _fg?: GWU.color.ColorBase;
    protected _bg?: GWU.color.ColorBase;
    protected _depth?: number;
    protected _align?: GWU.text.Align;
    protected _valign?: GWU.text.VAlign;
    protected _position?: Position;
    protected _minWidth?: number;
    protected _maxWidth?: number;
    protected _width?: number;
    protected _minHeight?: number;
    protected _maxHeight?: number;
    protected _height?: number;
    protected _x?: number;
    protected _left?: number;
    protected _right?: number;
    protected _y?: number;
    protected _top?: number;
    protected _bottom?: number;
    protected _padLeft?: number;
    protected _padRight?: number;
    protected _padTop?: number;
    protected _padBottom?: number;
    selector: Selector;
    protected _dirty: boolean;
    constructor(selector?: string, init?: StyleOptions);
    get dirty(): boolean;
    set dirty(v: boolean);
    get fg(): GWU.color.ColorBase | undefined;
    get bg(): GWU.color.ColorBase | undefined;
    get depth(): number | undefined;
    get align(): GWU.text.Align | undefined;
    get valign(): GWU.text.VAlign | undefined;
    get position(): Position | undefined;
    get minWidth(): number | undefined;
    get maxWidth(): number | undefined;
    get width(): number | undefined;
    get minHeight(): number | undefined;
    get maxHeight(): number | undefined;
    get height(): number | undefined;
    get x(): number | undefined;
    get left(): number | undefined;
    get right(): number | undefined;
    get y(): number | undefined;
    get top(): number | undefined;
    get bottom(): number | undefined;
    get padLeft(): number | undefined;
    get padRight(): number | undefined;
    get padTop(): number | undefined;
    get padBottom(): number | undefined;
    get(key: keyof Style): any;
    set(opts: StyleOptions, setDirty?: boolean): this;
    set(key: keyof StyleOptions, value: any, setDirty?: boolean): this;
    unset(key: keyof Style): this;
    clone(): this;
    copy(other: Style): this;
}
interface Stylable {
    readonly tag: string;
    readonly id: string;
    readonly classes: string[];
    readonly props: Record<string, any>;
    readonly dirty: boolean;
    style(): Style;
}
declare class ComputedStyle extends Style {
    sources: Style[];
    constructor(sources?: Style[]);
    get dirty(): boolean;
    set dirty(v: boolean);
}
declare class Sheet {
    rules: Style[];
    _dirty: boolean;
    constructor(parentSheet?: Sheet);
    get dirty(): boolean;
    set dirty(v: boolean);
    add(selector: string, props: StyleOptions): Style;
    get(selector: string): Style | null;
    remove(selector: string): void;
    computeFor(widget: Stylable): ComputedStyle;
}

interface PosOptions {
    x?: number;
    y?: number;
    right?: number;
    left?: number;
    bottom?: number;
    top?: number;
}
interface Size {
    width: number;
    height: number;
}
interface SizeOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
declare class Widget implements Selectable {
    id: string;
    tag: string;
    parent: Widget | null;
    props: Record<string, any>;
    classes: string[];
    children: Widget[];
    _bounds: GWU.xy.Bounds;
    _text: string;
    _lines: string[];
    _dirty: boolean;
    _attached: boolean;
    _style: Style | null;
    _usedStyle: ComputedStyle;
    constructor(tag: string, styles?: Sheet);
    clone(): this;
    get dirty(): boolean;
    set dirty(v: boolean);
    addChild(child: Widget, beforeIndex?: number): this;
    removeChild(child: Widget): this;
    empty(): Widget[];
    root(): Widget | null;
    positionedParent(): Widget | null;
    get bounds(): GWU.xy.Bounds;
    get innerLeft(): number;
    get innerRight(): number;
    get innerWidth(): number;
    get innerHeight(): number;
    get innerTop(): number;
    get innerBottom(): number;
    updateLayout(): this;
    _updateWidth(parentWidth?: number): this;
    _updateLeft(parentLeft?: number, parentWidth?: number): this;
    _updateTop(parentBottom?: number): this;
    _updateHeight(): this;
    applyLayoutOffset(): this;
    _updateLayoutStatic(): this;
    _updateLayoutRelative(): void;
    _updateLayoutFixed(): this;
    _updateLayoutAbsolute(): this;
    style(): Style;
    style(id: keyof Style): any;
    style(props: StyleOptions): this;
    style(id: keyof StyleOptions, val: any): this;
    removeStyle(id: keyof Style): this;
    used(): Style;
    used(style: ComputedStyle): this;
    used(id: keyof Style): any;
    addClass(id: string): this;
    removeClass(id: string): this;
    toggleClass(id: string): this;
    pos(): GWU.xy.XY;
    pos(left: number, top: number): this;
    pos(xy: PosOptions): this;
    size(): Size;
    size(width: number, height: number): this;
    size(size: SizeOptions): this;
    text(): string;
    text(v: string): this;
    contentWidth(): number;
    draw(buffer: GWU.canvas.DataBuffer): boolean;
}

declare type EventCb = (e: GWU.io.Event, layer: Layer, widget: Widget) => boolean | Promise<boolean>;
declare type FxFn = () => void | Promise<void>;
declare type Fx = number;
declare type WidgetCb = (widget: Widget) => any;
declare type SelectType = string | Widget | Widget[] | Selection;
declare class Layer {
    ui: UICore;
    root: Widget;
    allWidgets: Widget[];
    styles: Sheet;
    constructor(ui: UICore, rootTag?: string);
    $(id?: SelectType): Selection;
    select(id?: SelectType): Selection;
    create(tag: string): Widget;
    rule(info: Record<string, StyleOptions>): this;
    rule(rule: string): Style;
    rule(rule: string, style: StyleOptions): this;
    removeRule(rule: string): this;
    _attach(w: Widget | Widget[]): this;
    _detach(w: Widget | Widget[]): this;
    computeStyles(): void;
    updateLayout(widget?: Widget): void;
    draw(buffer?: GWU.canvas.Buffer): void;
}
declare class Selection {
    layer: Layer;
    selected: Widget[];
    constructor(layer: Layer, widgets?: Widget[]);
    get(index: number): Widget;
    length(): number;
    add(arg: SelectType): this;
    clone(): this;
    forEach(cb: WidgetCb): this;
    after(content: SelectType): this;
    append(content: SelectType): this;
    appendTo(dest: SelectType): this;
    before(content: SelectType): this;
    detach(): this;
    empty(): this;
    insertAfter(target: SelectType): this;
    insertBefore(target: SelectType): this;
    prepend(content: SelectType): this;
    prependTo(dest: SelectType): this;
    remove(_sub?: string): this;
    replaceAll(target: SelectType): this;
    replaceWith(content: SelectType): this;
    text(): string;
    text(t: string): this;
    addClass(id: string): this;
    hasClass(id: string): boolean;
    removeClass(id: string): this;
    toggleClass(id: string): this;
    style(): Style;
    style(style: StyleOptions): this;
    style(name: keyof Style): any;
    style(name: keyof StyleOptions, value: any): this;
    removeStyle(name: keyof Style): this;
    animate(_props: any, _ms: number): this;
    clearQueue(_name?: string): this;
    delay(_ms: number, _name?: string): this;
    dequeue(): this;
    fadeIn(_ms: number): this;
    fadeOut(_ms: number): this;
    fadeTo(_ms: number, _opacity: number): this;
    fadeToggle(_ms: number): this;
    finish(_name?: string): this;
    hide(_ms?: number): this;
    queue(fn: FxFn): this;
    queue(name: string): Fx[];
    queue(name: string, fn: FxFn): this;
    queue(name: string, items: Fx[]): this;
    show(_ms?: number): this;
    slideDown(_ms: number): this;
    slideToggle(_ms: number): this;
    slideUp(_ms: number): this;
    stop(): this;
    toggle(): this;
    toggle(ms: number): this;
    toggle(visible: boolean): this;
    on(_event: string, _cb: EventCb): this;
    off(_event: string): this;
    click(cb: EventCb): this;
    click(e: GWU.io.Event): this;
    keypress(cb: EventCb): this;
    keypress(e: GWU.io.Event): this;
    dir(cb: EventCb): this;
    dir(e: GWU.io.Event): this;
    mouseenter(cb: EventCb): this;
    mouseenter(e: GWU.io.Event): this;
    mouseleave(cb: EventCb): this;
    mouseleave(e: GWU.io.Event): this;
    mousemove(cb: EventCb): this;
    mousemove(e: GWU.io.Event): this;
}

type index_d_Cb = Cb;
type index_d_Callbacks = Callbacks;
declare const index_d_Callbacks: typeof Callbacks;
declare const index_d_isTruthy: typeof isTruthy;
type index_d_Selectable = Selectable;
type index_d_Selector = Selector;
declare const index_d_Selector: typeof Selector;
declare const index_d_selector: typeof selector;
type index_d_Position = Position;
type index_d_StyleOptions = StyleOptions;
type index_d_Style = Style;
declare const index_d_Style: typeof Style;
type index_d_Stylable = Stylable;
type index_d_ComputedStyle = ComputedStyle;
declare const index_d_ComputedStyle: typeof ComputedStyle;
type index_d_Sheet = Sheet;
declare const index_d_Sheet: typeof Sheet;
type index_d_PosOptions = PosOptions;
type index_d_Size = Size;
type index_d_SizeOptions = SizeOptions;
type index_d_Widget = Widget;
declare const index_d_Widget: typeof Widget;
type index_d_EventCb = EventCb;
type index_d_FxFn = FxFn;
type index_d_Fx = Fx;
type index_d_WidgetCb = WidgetCb;
type index_d_SelectType = SelectType;
type index_d_Layer = Layer;
declare const index_d_Layer: typeof Layer;
type index_d_Selection = Selection;
declare const index_d_Selection: typeof Selection;
declare namespace index_d {
  export {
    index_d_Cb as Cb,
    index_d_Callbacks as Callbacks,
    index_d_isTruthy as isTruthy,
    index_d_Selectable as Selectable,
    index_d_Selector as Selector,
    index_d_selector as selector,
    index_d_Position as Position,
    index_d_StyleOptions as StyleOptions,
    index_d_Style as Style,
    index_d_Stylable as Stylable,
    index_d_ComputedStyle as ComputedStyle,
    index_d_Sheet as Sheet,
    index_d_PosOptions as PosOptions,
    index_d_Size as Size,
    index_d_SizeOptions as SizeOptions,
    index_d_Widget as Widget,
    index_d_EventCb as EventCb,
    index_d_FxFn as FxFn,
    index_d_Fx as Fx,
    index_d_WidgetCb as WidgetCb,
    index_d_SelectType as SelectType,
    index_d_Layer as Layer,
    index_d_Selection as Selection,
  };
}

export { ActionButton, ActionFn, ActorEntry, AlertOptions, Box, BoxOptions, Button, ButtonOptions, CellEntry, ColorOption, Column, ColumnOptions, ConfirmOptions, DataArray, DataList, DataType, Dialog, DialogBuilder, DropDownButton, EntryBase, EventCallback, EventHandlers, Flavor, FlavorOptions, HoverType, Input, InputBoxOptions, InputOptions, ItemEntry, List, ListOptions, Menu, MenuButton, MenuOptions, MessageOptions, Messages, PosOptions$1 as PosOptions, Sidebar, SidebarEntry, SidebarOptions, Table, TableOptions, Text, TextOptions, UI, UICore, UIOptions, UISubject, VAlign, ValueFn, ViewFilterFn, Viewport, ViewportOptions, Widget$1 as Widget, WidgetOptions, WidgetRunner, buildDialog, index_d as html, makeTable, showDropDown };
