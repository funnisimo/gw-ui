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
interface WidgetOptions$1 {
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
    constructor(id: string, opts?: WidgetOptions$1);
    init(opts: WidgetOptions$1): void;
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

interface TextOptions$1 extends WidgetOptions$1 {
    wrap?: number;
}
declare class Text$1 extends Widget$1 {
    lines: string[];
    wrap: boolean;
    constructor(id: string, opts?: TextOptions$1);
    init(opts: TextOptions$1): void;
    setText(text: string): void;
    draw(buffer: GWU.canvas.DataBuffer): void;
}

interface ButtonOptions extends WidgetOptions$1 {
}
declare class Button$1 extends Widget$1 {
    constructor(id: string, opts?: ButtonOptions);
    init(opts: ButtonOptions): void;
    click(ev: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    keypress(ev: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
}

interface InputOptions extends Omit<WidgetOptions$1, 'text'> {
    errorFg?: GWU.color.ColorBase;
    hint?: string;
    hintFg?: GWU.color.ColorBase;
    default?: string;
    minLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
}
declare class Input$1 extends Widget$1 {
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
interface ColumnOptions$1 {
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
interface TableOptions$1 extends WidgetOptions$1 {
    height: number;
    letters?: boolean;
    headers?: boolean;
    hover?: HoverType;
    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;
    wrap?: boolean;
    wrapColumns?: boolean;
    wrapRows?: boolean;
    columns: ColumnOptions$1[];
}
declare type ColorOption = GWU.color.ColorBase | null;
declare type DataArray = any[];
declare type DataList$1 = {
    next: any;
};
declare type DataType$1 = DataArray | DataList$1 | null;
declare class Column$1 {
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
    constructor(opts: ColumnOptions$1);
    value(data: any, index: number): string;
}
declare class Table$1 extends Widget$1 {
    headers: boolean;
    letters: boolean;
    headerFg: GWU.color.ColorBase;
    headerBg: GWU.color.ColorBase;
    wrapColumns: boolean;
    wrapRows: boolean;
    columns: Column$1[];
    data: DataType$1;
    hoverType: HoverType;
    selectedColumn: Column$1 | null;
    selectedIndex: number;
    constructor(id: string, opts?: TableOptions$1);
    init(opts: TableOptions$1): void;
    setData(data: DataType$1): void;
    selectRow(index: number): boolean;
    selectNextRow(wrap?: boolean): number;
    selectPrevRow(wrap?: boolean): number;
    selectNextColumn(wrap?: boolean): Column$1 | null;
    selectPrevColumn(wrap?: boolean): Column$1 | null;
    get selectedData(): any | null;
    draw(buffer: GWU.canvas.DataBuffer): void;
    drawColumn(buffer: GWU.canvas.DataBuffer, column: Column$1, x: number): void;
    drawCell(buffer: GWU.canvas.DataBuffer, column: Column$1, data: any, index: number, x: number, y: number): void;
    mousemove(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    dir(e: GWU.io.Event): boolean;
}
declare function makeTable(id: string, opts: TableOptions$1): Table$1;

interface ListOptions extends ColumnOptions$1 {
    height: number;
    hover?: boolean;
    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;
    wrap?: boolean;
}
declare class List extends Table$1 {
    constructor(id: string, opts: ListOptions);
}

interface BoxOptions extends Omit<WidgetOptions$1, 'text'> {
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

interface AlertOptions extends WidgetOptions$1 {
    duration?: number;
    waitForAck?: boolean;
    pad?: number;
    padX?: number;
    padY?: number;
    box?: BoxOptions;
}
interface ConfirmOptions extends WidgetOptions$1 {
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
    prompt?: string | TextOptions$1;
    input?: InputOptions;
}
interface UICore {
    buffer: GWU.canvas.Buffer;
    loop: GWU.io.Loop;
    readonly width: number;
    readonly height: number;
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
    get width(): number;
    get height(): number;
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

interface MessageOptions extends WidgetOptions$1 {
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
interface ViewportOptions extends WidgetOptions$1 {
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

interface FlavorOptions extends TextOptions$1 {
    promptFg?: GWU.color.ColorBase;
    overflow?: boolean;
}
declare class Flavor extends Text$1 {
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

interface SidebarOptions extends WidgetOptions$1 {
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
interface Rec$1<T> {
    [keys: string]: T;
}
declare type DropdownConfig$1 = Rec$1<ButtonConfig$1>;
declare type ActionConfig$1 = string;
declare type ButtonConfig$1 = ActionConfig$1 | DropdownConfig$1;
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
    menu: Menu$1;
    parent: DropDownButton | null;
    constructor(menu: Menu$1, parent: DropDownButton | null, text: string, buttons: ButtonConfig$1);
    addButton(text: string, config: ButtonConfig$1): void;
    setBounds(buffer: GWU.canvas.DataBuffer, px: number, py: number, pw: number): void;
    contains(e: GWU.io.Event): boolean;
    buttonAt(e: GWU.io.Event): MenuButton | null;
    draw(buffer: GWU.canvas.DataBuffer): void;
}
declare function showDropDown(dialog: WidgetRunner, menu: Menu$1, button: DropDownButton): Promise<void>;
interface MenuOptions$1 extends WidgetOptions$1 {
    separator?: string;
    lead?: string;
    dropFg?: GWU.color.ColorBase;
    dropBg?: GWU.color.ColorBase;
    buttons: ButtonConfig$1;
}
declare class Menu$1 extends Widget$1 {
    buttons: MenuButton[];
    separator: string;
    lead: string;
    dropFg: GWU.color.Color;
    dropBg: GWU.color.Color;
    activeIndex: number;
    actionButton: ActionButton | null;
    constructor(id: string, opts?: MenuOptions$1);
    init(opts: MenuOptions$1): void;
    reset(): void;
    activate(reverse?: boolean): void;
    deactivate(): void;
    mousemove(e: GWU.io.Event, dialog: WidgetRunner): boolean;
    clearHighlight(): void;
    getButtonAt(x: number, _y: number): MenuButton | null;
    click(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    keypress(e: GWU.io.Event, dialog: WidgetRunner): Promise<boolean>;
    protected _addButton(text: string, config: ButtonConfig$1): void;
    draw(buffer: GWU.canvas.DataBuffer): boolean;
}

interface Size {
    width: number;
    height: number;
}
declare type PropType$1 = string | number | boolean;
interface Selectable {
    tag: string;
    classes: string[];
    attr(name: string): string | undefined;
    prop(name: string): PropType$1 | undefined;
    parent: Selectable | null;
    children?: Selectable[];
}

declare type MatchFn = (el: Selectable) => boolean;
declare type BuildFn = (next: MatchFn, e: Selectable) => boolean;
declare class Selector {
    text: string;
    priority: number;
    matchFn: MatchFn;
    constructor(text: string);
    protected _parse(text: string): MatchFn;
    protected _parentMatch(): BuildFn;
    protected _ancestorMatch(): BuildFn;
    protected _matchElement(text: string): BuildFn;
    protected _matchTag(tag: string): MatchFn | null;
    protected _matchClass(cls: string): MatchFn;
    protected _matchProp(prop: string): MatchFn;
    protected _matchId(id: string): MatchFn;
    protected _matchFirst(): MatchFn;
    protected _matchLast(): MatchFn;
    protected _matchNot(fn: MatchFn): MatchFn;
    matches(obj: Selectable): boolean;
}
declare function compile(text: string): Selector;

declare type Position = 'static' | 'relative' | 'fixed' | 'absolute';
interface Stylable$1 extends Selectable {
    style(): Style$1;
    prop(name: string): PropType$1;
}
interface StyleOptions$1 {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
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
    padding?: number | [number] | [number, number] | [number, number, number] | [number, number, number, number];
    padLeft?: number;
    padRight?: number;
    padTop?: number;
    padBottom?: number;
    margin?: number | [number] | [number, number] | [number, number, number] | [number, number, number, number];
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginBottom?: number;
    border?: GWU.color.ColorBase;
}
declare class Style$1 {
    protected _fg?: GWU.color.ColorBase;
    protected _bg?: GWU.color.ColorBase;
    protected _border?: GWU.color.ColorBase;
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
    protected _marginLeft?: number;
    protected _marginRight?: number;
    protected _marginTop?: number;
    protected _marginBottom?: number;
    selector: Selector;
    protected _dirty: boolean;
    constructor(selector?: string, init?: StyleOptions$1);
    get dirty(): boolean;
    set dirty(v: boolean);
    get fg(): GWU.color.ColorBase | undefined;
    get bg(): GWU.color.ColorBase | undefined;
    get border(): GWU.color.ColorBase | undefined;
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
    get marginLeft(): number | undefined;
    get marginRight(): number | undefined;
    get marginTop(): number | undefined;
    get marginBottom(): number | undefined;
    get(key: keyof Style$1): any;
    set(opts: StyleOptions$1, setDirty?: boolean): this;
    set(key: keyof StyleOptions$1, value: any, setDirty?: boolean): this;
    unset(key: keyof Style$1): this;
    clone(): this;
    copy(other: Style$1): this;
}
declare function makeStyle(style: string, selector?: string): Style$1;
declare class ComputedStyle$1 extends Style$1 {
    sources: Style$1[];
    constructor(sources?: Style$1[]);
    get dirty(): boolean;
    set dirty(v: boolean);
}
declare class Sheet$1 {
    rules: Style$1[];
    _dirty: boolean;
    constructor(parentSheet?: Sheet$1 | null);
    get dirty(): boolean;
    set dirty(v: boolean);
    add(selector: string, props: StyleOptions$1): Style$1;
    get(selector: string): Style$1 | null;
    remove(selector: string): void;
    computeFor(widget: Stylable$1): ComputedStyle$1;
}
declare const defaultStyle: Sheet$1;

declare type EventCb$1 = (document: Document, element: Element, io?: GWU.io.Event) => boolean;
declare type FxFn = () => void;
declare type Fx = number;
declare type ElementCb = (element: Element) => any;
declare type ElementMatch = (element: Element) => boolean;
declare type SelectType$1 = string | Element | Element[] | Selection;
declare class Document {
    ui: UICore;
    body: Element;
    _activeElement: Element | null;
    children: Element[];
    stylesheet: Sheet$1;
    _done: boolean;
    constructor(ui: UICore, rootTag?: string);
    $(id?: SelectType$1): Selection;
    select(id?: SelectType$1): Selection;
    createElement(tag: string): Element;
    create(tag: string): Selection;
    rule(info: Record<string, StyleOptions$1>): this;
    rule(rule: string): Style$1;
    rule(rule: string, style: StyleOptions$1): this;
    removeRule(rule: string): this;
    _attach(w: Element | Element[]): this;
    _detach(w: Element | Element[]): this;
    computeStyles(): boolean;
    updateLayout(widget?: Element): void;
    draw(buffer?: GWU.canvas.Buffer): void;
    protected _prepareDraw(): boolean;
    get activeElement(): Element | null;
    setActiveElement(w: Element | null, reverse?: boolean): boolean;
    nextTabStop(): boolean;
    prevTabStop(): boolean;
    elementFromPoint(x: number, y: number): Element;
    _fireEvent(element: Element, name: string, e?: Partial<GWU.io.Event>): boolean;
    _bubbleEvent(element: Element, name: string, e: GWU.io.Event): boolean;
    click(e: GWU.io.Event): boolean;
    mousemove(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
}
declare class Selection {
    document: Document;
    selected: Element[];
    constructor(document: Document, widgets?: Element[]);
    get(): Element[];
    get(index: number): Element;
    length(): number;
    slice(start: number, end?: number): Selection;
    add(arg: SelectType$1): this;
    clone(): this;
    forEach(cb: ElementCb): this;
    after(content: SelectType$1): this;
    append(content: SelectType$1): this;
    appendTo(dest: SelectType$1): this;
    before(content: SelectType$1): this;
    detach(): this;
    empty(): this;
    insertAfter(target: SelectType$1): this;
    insertBefore(target: SelectType$1): this;
    prepend(content: SelectType$1): this;
    prependTo(dest: SelectType$1): this;
    remove(_sub?: string): this;
    replaceAll(target: SelectType$1): this;
    replaceWith(content: SelectType$1): this;
    text(): string;
    text(t: string): this;
    data(): any;
    data(d: any): this;
    attr(id: string): string | undefined;
    attr(id: string, value: string): this;
    prop(id: string): PropType$1 | undefined;
    prop(id: string, value: PropType$1): this;
    addClass(id: string): this;
    hasClass(id: string): boolean;
    removeClass(id: string): this;
    toggleClass(id: string): this;
    style(): Style$1;
    style(style: StyleOptions$1): this;
    style(name: keyof Style$1): any;
    style(name: keyof StyleOptions$1, value: any): this;
    removeStyle(name: keyof Style$1): this;
    pos(): GWU.xy.XY | undefined;
    pos(left: number, top: number, position?: Omit<Position, 'static'>): this;
    pos(xy: PosOptions, position?: Omit<Position, 'static'>): this;
    size(): Size | undefined;
    size(width: number, height: number): this;
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
    on(event: string, cb: EventCb$1): this;
    off(event: string, cb?: EventCb$1): this;
    fire(event: string, e?: GWU.io.Event): this;
}

interface PosOptions {
    x?: number;
    y?: number;
    right?: number;
    left?: number;
    bottom?: number;
    top?: number;
}
interface SizeOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
declare class Element implements Selectable {
    tag: string;
    parent: Element | null;
    _props: Record<string, PropType$1>;
    _attrs: Record<string, string>;
    classes: string[];
    children: Element[];
    events: Record<string, EventCb$1[]>;
    _data: any | null;
    _bounds: GWU.xy.Bounds;
    _text: string;
    _lines: string[];
    _dirty: boolean;
    _attached: boolean;
    _style: Style$1 | null;
    _usedStyle: ComputedStyle$1;
    constructor(tag: string, styles?: Sheet$1);
    contains(xy: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    clone(): this;
    get dirty(): boolean;
    set dirty(v: boolean);
    attr(name: string): string;
    attr(name: string, value: string): this;
    protected _setAttr(name: string, value: string): void;
    protected _attrInt(name: string, def?: number): number;
    protected _attrString(name: string): string;
    protected _attrBool(name: string): boolean;
    prop(name: string): PropType$1;
    prop(name: string, value: PropType$1): this;
    protected _setProp(name: string, value: PropType$1): void;
    toggleProp(name: string): this;
    val(): PropType$1;
    val(v: PropType$1): this;
    data(): any;
    data(doc: Document, v: any): this;
    protected _setData(_doc: Document, v: any): void;
    onblur(_doc: Document): void;
    onfocus(_doc: Document, _reverse: boolean): void;
    protected _propInt(name: string, def?: number): number;
    protected _propString(name: string): string;
    protected _propBool(name: string): boolean;
    _isValidChild(_child: Element): boolean;
    appendChild(child: Element, beforeIndex?: number): this;
    removeChild(child: Element): this;
    empty(): Element[];
    root(): Element | null;
    protected positionedParent(): Element | null;
    get bounds(): GWU.xy.Bounds;
    get innerLeft(): number;
    get innerRight(): number;
    get innerWidth(): number;
    get innerHeight(): number;
    get innerTop(): number;
    get innerBottom(): number;
    updateLayout(): this;
    _updateWidth(): number;
    _updateHeight(): number;
    _updateLeft(): void;
    _updateTop(parentBottom?: number): number;
    style(): Style$1;
    style(id: keyof Style$1): any;
    style(props: StyleOptions$1): this;
    style(id: keyof StyleOptions$1, val: any): this;
    removeStyle(id: keyof Style$1): this;
    used(): Style$1;
    used(style: ComputedStyle$1): this;
    used(id: keyof Style$1): any;
    addClass(id: string): this;
    removeClass(id: string): this;
    toggleClass(id: string): this;
    pos(): GWU.xy.XY;
    pos(left: number, top: number, position?: Omit<Position, 'static'>): this;
    pos(xy: PosOptions, position?: Omit<Position, 'static'>): this;
    isPositioned(): boolean;
    size(): Size;
    size(width: number, height: number): this;
    size(size: SizeOptions): this;
    text(): string;
    text(v: string): this;
    protected _setText(v: string): void;
    _calcContentWidth(): number;
    _calcContentHeight(): number;
    _calcChildHeight(): number;
    _updateContentHeight(): void;
    draw(buffer: GWU.canvas.DataBuffer): boolean;
    _drawBorder(buffer: GWU.canvas.DataBuffer): void;
    _fill(buffer: GWU.canvas.DataBuffer): void;
    _drawContent(buffer: GWU.canvas.DataBuffer): void;
    _drawChildren(buffer: GWU.canvas.DataBuffer): void;
    _drawText(buffer: GWU.canvas.DataBuffer): void;
    on(event: string, cb: EventCb$1): this;
    off(event: string, cb?: EventCb$1): this;
    elementFromPoint(x: number, y: number): Element | null;
}

declare class Input extends Element {
    constructor(tag: string, sheet?: Sheet$1);
    protected _setAttr(name: string, value: string): void;
    protected _setProp(name: string, value: PropType$1): void;
    get isTypeNumber(): boolean;
    _calcContentWidth(): number;
    _calcContentHeight(): number;
    _updateContentHeight(): void;
    isValid(): boolean;
    _drawText(buffer: GWU.canvas.DataBuffer): void;
    onblur(doc: Document): void;
    keypress(document: Document, _element: Element, e?: GWU.io.Event): boolean;
}

declare class CheckBox extends Element {
    static default: {
        uncheck: string;
        check: string;
        padCheck: string;
        value: string;
    };
    constructor(tag: string, sheet?: Sheet$1);
    protected _setAttr(name: string, value: string): void;
    _calcContentWidth(): number;
    _calcContentHeight(): number;
    _drawText(buffer: GWU.canvas.DataBuffer): void;
    onblur(doc: Document): void;
    keypress(document: Document, _element: Element, e?: GWU.io.Event): boolean;
    click(document: Document, _element: Element, e?: GWU.io.Event): boolean;
}

declare class Button extends Element {
    static default: {
        clickfocus: boolean;
    };
    constructor(tag: string, sheet?: Sheet$1);
    protected _setAttr(name: string, value: string): void;
    keypress(document: Document, _element: Element, e?: GWU.io.Event): boolean;
    click(document: Document, _element: Element, e?: GWU.io.Event): boolean;
}

declare class FieldSet extends Element {
    static default: Record<string, PropType$1>;
    constructor(tag: string, sheet?: Sheet$1);
    _drawBorder(buffer: GWU.canvas.DataBuffer): void;
}

declare class UnorderedList extends Element {
    static default: {
        bullet: string;
    };
    constructor(tag: string, sheet?: Sheet$1);
    protected get indentWidth(): number;
    _calcContentWidth(): number;
    _calcContentHeight(): number;
    get innerLeft(): number;
    get innerWidth(): number;
    _drawBullet(buffer: GWU.canvas.DataBuffer, _index: number, left: number, top: number, fg: GWU.color.ColorBase): void;
    _drawChildren(buffer: GWU.canvas.DataBuffer): void;
}
declare class OrderedList extends UnorderedList {
    constructor(tag: string, sheet?: Sheet$1);
    protected get indentWidth(): number;
    _drawBullet(buffer: GWU.canvas.DataBuffer, index: number, left: number, top: number, fg: GWU.color.ColorBase): void;
}

declare type PrefixType = 'none' | 'letter' | 'number' | 'bullet';
declare class DataList extends Element {
    _data: any[];
    static default: {
        bullet: string;
        empty: string;
        prefix: PrefixType;
        width: number;
    };
    constructor(tag: string, sheet?: Sheet$1);
    protected _setData(doc: Document, v: any): void;
    protected get indentWidth(): number;
    _calcContentWidth(): number;
    _calcContentHeight(): number;
    _calcChildHeight(): number;
    get innerLeft(): number;
    get innerWidth(): number;
    _drawContent(buffer: GWU.canvas.DataBuffer): void;
    _isValidChild(child: Element): boolean;
}

declare const selfClosingTags: Record<string, boolean>;
declare type MakeElementFn = (tag: string, sheet?: Sheet$1) => Element;
declare const elements: Record<string, MakeElementFn>;
interface ElementInstallOptions {
    selfClosing?: boolean;
    openCloses?: string[];
    closeCloses?: string[];
}
declare function configureElement(tag: string, opts?: ElementInstallOptions): void;
declare function installElement(tag: string, fn: MakeElementFn, opts?: ElementInstallOptions): void;
interface MyOptions {
    lowerCaseTagName?: boolean;
    stylesheet?: Sheet$1;
}
/**
 * Parse a chuck of HTML source.
 * @param  {string} data      html
 * @return {HTMLElement}      root element
 */
declare function parse(data: string, options?: MyOptions | Sheet$1): Element;

type index_d$1_Size = Size;
type index_d$1_Selectable = Selectable;
type index_d$1_MatchFn = MatchFn;
type index_d$1_Selector = Selector;
declare const index_d$1_Selector: typeof Selector;
declare const index_d$1_compile: typeof compile;
type index_d$1_Position = Position;
declare const index_d$1_makeStyle: typeof makeStyle;
declare const index_d$1_defaultStyle: typeof defaultStyle;
type index_d$1_PosOptions = PosOptions;
type index_d$1_SizeOptions = SizeOptions;
type index_d$1_Element = Element;
declare const index_d$1_Element: typeof Element;
type index_d$1_Input = Input;
declare const index_d$1_Input: typeof Input;
type index_d$1_CheckBox = CheckBox;
declare const index_d$1_CheckBox: typeof CheckBox;
type index_d$1_Button = Button;
declare const index_d$1_Button: typeof Button;
type index_d$1_FieldSet = FieldSet;
declare const index_d$1_FieldSet: typeof FieldSet;
type index_d$1_UnorderedList = UnorderedList;
declare const index_d$1_UnorderedList: typeof UnorderedList;
type index_d$1_OrderedList = OrderedList;
declare const index_d$1_OrderedList: typeof OrderedList;
type index_d$1_PrefixType = PrefixType;
type index_d$1_DataList = DataList;
declare const index_d$1_DataList: typeof DataList;
declare const index_d$1_selfClosingTags: typeof selfClosingTags;
type index_d$1_MakeElementFn = MakeElementFn;
declare const index_d$1_elements: typeof elements;
type index_d$1_ElementInstallOptions = ElementInstallOptions;
declare const index_d$1_configureElement: typeof configureElement;
declare const index_d$1_installElement: typeof installElement;
declare const index_d$1_parse: typeof parse;
type index_d$1_FxFn = FxFn;
type index_d$1_Fx = Fx;
type index_d$1_ElementCb = ElementCb;
type index_d$1_ElementMatch = ElementMatch;
type index_d$1_Document = Document;
declare const index_d$1_Document: typeof Document;
type index_d$1_Selection = Selection;
declare const index_d$1_Selection: typeof Selection;
declare namespace index_d$1 {
  export {
    index_d$1_Size as Size,
    PropType$1 as PropType,
    index_d$1_Selectable as Selectable,
    index_d$1_MatchFn as MatchFn,
    index_d$1_Selector as Selector,
    index_d$1_compile as compile,
    index_d$1_Position as Position,
    Stylable$1 as Stylable,
    StyleOptions$1 as StyleOptions,
    Style$1 as Style,
    index_d$1_makeStyle as makeStyle,
    ComputedStyle$1 as ComputedStyle,
    Sheet$1 as Sheet,
    index_d$1_defaultStyle as defaultStyle,
    index_d$1_PosOptions as PosOptions,
    index_d$1_SizeOptions as SizeOptions,
    index_d$1_Element as Element,
    index_d$1_Input as Input,
    index_d$1_CheckBox as CheckBox,
    index_d$1_Button as Button,
    index_d$1_FieldSet as FieldSet,
    index_d$1_UnorderedList as UnorderedList,
    index_d$1_OrderedList as OrderedList,
    index_d$1_PrefixType as PrefixType,
    index_d$1_DataList as DataList,
    index_d$1_selfClosingTags as selfClosingTags,
    index_d$1_MakeElementFn as MakeElementFn,
    index_d$1_elements as elements,
    index_d$1_ElementInstallOptions as ElementInstallOptions,
    index_d$1_configureElement as configureElement,
    index_d$1_installElement as installElement,
    index_d$1_parse as parse,
    EventCb$1 as EventCb,
    index_d$1_FxFn as FxFn,
    index_d$1_Fx as Fx,
    index_d$1_ElementCb as ElementCb,
    index_d$1_ElementMatch as ElementMatch,
    SelectType$1 as SelectType,
    index_d$1_Document as Document,
    index_d$1_Selection as Selection,
  };
}

interface Stylable {
    tag: string;
    classes: string[];
    attr(name: string): string | undefined;
    prop(name: string): PropType$1 | undefined;
    parent: Selectable | null;
    children?: Selectable[];
    style(): Style;
}
interface StyleOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}
declare class Style {
    protected _fg?: GWU.color.ColorBase;
    protected _bg?: GWU.color.ColorBase;
    protected _border?: GWU.color.ColorBase;
    protected _align?: GWU.text.Align;
    protected _valign?: GWU.text.VAlign;
    selector: Selector;
    protected _dirty: boolean;
    constructor(selector?: string, init?: StyleOptions);
    get dirty(): boolean;
    set dirty(v: boolean);
    get fg(): GWU.color.ColorBase | undefined;
    get bg(): GWU.color.ColorBase | undefined;
    dim(pct?: number, fg?: boolean, bg?: boolean): this;
    bright(pct?: number, fg?: boolean, bg?: boolean): this;
    invert(): this;
    get align(): GWU.text.Align | undefined;
    get valign(): GWU.text.VAlign | undefined;
    get(key: keyof Style): any;
    set(opts: StyleOptions, setDirty?: boolean): this;
    set(key: keyof StyleOptions, value: any, setDirty?: boolean): this;
    unset(key: keyof Style): this;
    clone(): this;
    copy(other: Style): this;
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
    constructor(parentSheet?: Sheet | null);
    get dirty(): boolean;
    set dirty(v: boolean);
    add(selector: string, props: StyleOptions): this;
    get(selector: string): Style | null;
    remove(selector: string): void;
    computeFor(widget: Stylable): ComputedStyle;
}

declare class Grid {
    _left: number;
    _top: number;
    _colWidths: number[];
    _rowHeights: number[];
    _col: number;
    _row: number;
    x: number;
    y: number;
    constructor(x: number, y: number);
    cols(): number[];
    cols(count: number, width: number): this;
    cols(widths: number[]): this;
    rows(): number[];
    rows(count: number, height?: number): this;
    rows(heights: number[]): this;
    col(n?: number): this;
    nextCol(): this;
    row(n?: number): this;
    nextRow(): this;
    setRowHeight(h: number): this;
    protected _resetX(): this;
    protected _resetY(): this;
}

interface TextOptions extends WidgetOptions {
}
declare class Text extends Widget {
    text: string;
    _lines: string[];
    constructor(term: Term, text: string, opts?: TextOptions);
    draw(buffer: GWU.canvas.DataBuffer, force?: boolean): boolean;
}

declare type FormatFn = GWU.text.Template;
declare type Value = string | number;
declare type SelectType = 'none' | 'column' | 'row' | 'cell';
declare type DataObject = Record<string, any>;
declare type DataItem = Value | Value[] | DataObject;
declare type DataType = DataItem[];
declare type BorderType = 'ascii' | 'fill' | 'none';
interface ColumnOptions {
    width: number;
    format: string | FormatFn;
    header?: string;
    headerClass?: string;
    empty?: string;
    dataClass?: string;
}
interface TableOptions extends Omit<WidgetOptions, 'height'> {
    size?: number;
    rowHeight?: number;
    header?: boolean;
    headerTag?: string;
    dataTag?: string;
    prefix?: PrefixType;
    select?: SelectType;
    columns: ColumnOptions[];
    data?: DataType;
    border?: boolean | BorderType;
}
declare class Column {
    width: number;
    format: GWU.text.Template;
    header: string;
    headerClass: string;
    dataClass: string;
    empty: string;
    constructor(opts: ColumnOptions);
    makeHeader(table: Table): Text;
    makeData(table: Table, data: DataItem, col: number, row: number): Text;
}
declare class Table extends WidgetGroup {
    _data: DataType;
    columns: Column[];
    showHeader: boolean;
    headerTag: string;
    dataTag: string;
    prefix: PrefixType;
    select: SelectType;
    rowHeight: number;
    border: BorderType;
    size: number;
    constructor(term: Term, opts: TableOptions);
    data(): DataType;
    data(data: DataType): this;
    draw(buffer: GWU.canvas.DataBuffer, force?: boolean): boolean;
    mousemove(e: GWU.io.Event): boolean;
}

interface Rec<T> {
    [keys: string]: T;
}
declare type DropdownConfig = Rec<ButtonConfig>;
declare type ActionConfig = string;
declare type ButtonConfig = ActionConfig | DropdownConfig;
interface MenuOptions extends WidgetOptions {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
}
declare class Menu extends WidgetGroup {
    buttonClass: string | string[];
    buttonTag: string;
    constructor(term: Term, opts: MenuOptions);
    _initButtons(buttons: DropdownConfig): void;
}

declare class Term {
    ui: UICore;
    x: number;
    y: number;
    widgets: Widget[];
    allWidgets: Widget[];
    styles: Sheet;
    _currentWidget: Widget | null;
    events: Record<string, EventCb[]>;
    _style: Style;
    _grid: Grid | null;
    _needsRender: boolean;
    constructor(ui: UICore);
    get buffer(): GWU.canvas.DataBuffer;
    get width(): number;
    get height(): number;
    reset(): this;
    fg(v: GWU.color.ColorBase): this;
    bg(v: GWU.color.ColorBase): this;
    dim(pct?: number, fg?: boolean, bg?: boolean): this;
    bright(pct?: number, fg?: boolean, bg?: boolean): this;
    invert(): this;
    loadStyle(name: string): this;
    style(opts: StyleOptions): this;
    pos(x: number, y: number): this;
    moveTo(x: number, y: number): this;
    move(dx: number, dy: number): this;
    up(n?: number): this;
    down(n?: number): this;
    left(n?: number): this;
    right(n?: number): this;
    nextLine(n?: number): this;
    prevLine(n?: number): this;
    clear(color?: GWU.color.ColorBase): this;
    erase(color?: GWU.color.ColorBase): this;
    eraseBelow(): this;
    eraseAbove(): this;
    eraseLine(n: number): this;
    eraseLineAbove(): this;
    eraseLineBelow(): this;
    grid(): this;
    endGrid(): this;
    cols(count: number, width: number): this;
    cols(widths: number[]): this;
    rows(count: number, width: number): this;
    rows(heights: number[]): this;
    startRow(n: number): this;
    nextCol(): this;
    endRow(h?: number): this;
    col(n: number): this;
    row(n: number): this;
    drawText(text: string, width?: number, _align?: GWU.text.Align): this;
    border(w: number, h: number, color?: GWU.color.ColorBase, ascii?: boolean): this;
    get(): Widget | null;
    addWidget(w: Widget): this;
    removeWidget(w: Widget): this;
    widgetAt(x: number, y: number): Widget | null;
    widgetAt(xy: GWU.xy.XY): Widget | null;
    text(text: string, opts?: TextOptions): Text;
    table(opts: TableOptions): Table;
    menu(opts: MenuOptions): Menu;
    render(): this;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    fireEvent(name: string, source: Widget, e?: Partial<GWU.io.Event>): boolean;
    mousemove(e: GWU.io.Event): boolean;
    click(e: GWU.io.Event): boolean;
    draw(): void;
}

declare type EventCb = (name: string, widget: Widget, io?: GWU.io.Event) => boolean;
interface WidgetOptions {
    id?: string;
    parent?: Widget;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    style?: StyleOptions;
    class?: string | string[];
    tag?: string;
    tabStop?: boolean;
    action?: string;
    depth?: number;
}
declare type PropType = boolean | number | string;
declare abstract class Widget implements Stylable {
    tag: string;
    term: Term;
    bounds: GWU.xy.Bounds;
    depth: number;
    events: Record<string, EventCb[]>;
    _style: Style;
    _used: ComputedStyle;
    parent: Widget | null;
    classes: string[];
    _props: Record<string, PropType>;
    _attrs: Record<string, string>;
    _needsDraw: boolean;
    constructor(term: Term, opts?: WidgetOptions);
    get needsDraw(): boolean;
    set needsDraw(v: boolean);
    attr(name: string): string;
    attr(name: string, v: string): this;
    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    style(): Style;
    style(opts: StyleOptions): this;
    get focused(): boolean;
    set focused(v: boolean);
    get hovered(): boolean;
    set hovered(v: boolean);
    _updateStyle(): void;
    draw(_buffer: GWU.canvas.DataBuffer, _force?: boolean): boolean;
    protected _drawFill(buffer: GWU.canvas.DataBuffer): boolean;
    mousemove(e: GWU.io.Event): boolean;
    click(e: GWU.io.Event): boolean;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    _fireEvent(name: string, source: Widget, e?: Partial<GWU.io.Event>): boolean;
    _bubbleEvent(name: string, source: Widget, e?: GWU.io.Event): boolean;
}
declare class WidgetGroup extends Widget {
    children: Widget[];
    constructor(term: Term, opts?: WidgetOptions);
    get needsDraw(): boolean;
    set needsDraw(v: boolean);
    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    widgetAt(e: GWU.xy.XY): Widget | null;
    widgetAt(x: number, y: number): Widget | null;
    _updateStyle(): void;
    draw(buffer: GWU.canvas.DataBuffer, force?: boolean): boolean;
    _drawChildren(buffer: GWU.canvas.DataBuffer, force?: boolean): boolean;
    mousemove(e: GWU.io.Event): boolean;
    tick(_e: GWU.io.Event): void;
    click(_e: GWU.io.Event): boolean;
    keypress(_e: GWU.io.Event): boolean;
    dir(_e: GWU.io.Event): boolean;
}

type index_d_EventCb = EventCb;
type index_d_WidgetOptions = WidgetOptions;
type index_d_PropType = PropType;
type index_d_Widget = Widget;
declare const index_d_Widget: typeof Widget;
type index_d_WidgetGroup = WidgetGroup;
declare const index_d_WidgetGroup: typeof WidgetGroup;
type index_d_TextOptions = TextOptions;
type index_d_Text = Text;
declare const index_d_Text: typeof Text;
type index_d_Grid = Grid;
declare const index_d_Grid: typeof Grid;
type index_d_FormatFn = FormatFn;
type index_d_Value = Value;
type index_d_SelectType = SelectType;
type index_d_DataObject = DataObject;
type index_d_DataItem = DataItem;
type index_d_DataType = DataType;
type index_d_BorderType = BorderType;
type index_d_ColumnOptions = ColumnOptions;
type index_d_TableOptions = TableOptions;
type index_d_Column = Column;
declare const index_d_Column: typeof Column;
type index_d_Table = Table;
declare const index_d_Table: typeof Table;
type index_d_MenuOptions = MenuOptions;
type index_d_Menu = Menu;
declare const index_d_Menu: typeof Menu;
type index_d_Term = Term;
declare const index_d_Term: typeof Term;
declare namespace index_d {
  export {
    index_d_EventCb as EventCb,
    index_d_WidgetOptions as WidgetOptions,
    index_d_PropType as PropType,
    index_d_Widget as Widget,
    index_d_WidgetGroup as WidgetGroup,
    index_d_TextOptions as TextOptions,
    index_d_Text as Text,
    index_d_Grid as Grid,
    index_d_FormatFn as FormatFn,
    index_d_Value as Value,
    index_d_SelectType as SelectType,
    index_d_DataObject as DataObject,
    index_d_DataItem as DataItem,
    index_d_DataType as DataType,
    index_d_BorderType as BorderType,
    index_d_ColumnOptions as ColumnOptions,
    index_d_TableOptions as TableOptions,
    index_d_Column as Column,
    index_d_Table as Table,
    index_d_MenuOptions as MenuOptions,
    index_d_Menu as Menu,
    index_d_Term as Term,
  };
}

export { ActionButton, ActionFn, ActorEntry, AlertOptions, Box, BoxOptions, Button$1 as Button, ButtonOptions, CellEntry, ColorOption, Column$1 as Column, ColumnOptions$1 as ColumnOptions, ConfirmOptions, DataArray, DataList$1 as DataList, DataType$1 as DataType, Dialog, DialogBuilder, DropDownButton, EntryBase, EventCallback, EventHandlers, Flavor, FlavorOptions, HoverType, Input$1 as Input, InputBoxOptions, InputOptions, ItemEntry, List, ListOptions, Menu$1 as Menu, MenuButton, MenuOptions$1 as MenuOptions, MessageOptions, Messages, PosOptions$1 as PosOptions, Sidebar, SidebarEntry, SidebarOptions, Table$1 as Table, TableOptions$1 as TableOptions, Text$1 as Text, TextOptions$1 as TextOptions, UI, UICore, UIOptions, UISubject, VAlign, ValueFn, ViewFilterFn, Viewport, ViewportOptions, Widget$1 as Widget, WidgetOptions$1 as WidgetOptions, WidgetRunner, buildDialog, index_d$1 as html, makeTable, showDropDown, index_d as term };
