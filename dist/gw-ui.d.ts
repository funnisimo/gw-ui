import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

declare type MatchFn = (el: UISelectable) => boolean;
declare type BuildFn = (next: MatchFn, e: UISelectable) => boolean;
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
    matches(obj: UISelectable): boolean;
}
declare function compile(text: string): Selector;

interface Size {
    width: number;
    height: number;
}
declare type PrefixType = 'none' | 'letter' | 'number' | 'bullet';
declare type PropType = string | number | boolean;
interface UIStyle {
    readonly selector: Selector;
    dirty: boolean;
    readonly fg?: GWU.color.ColorBase;
    readonly bg?: GWU.color.ColorBase;
    readonly align?: GWU.text.Align;
    readonly valign?: GWU.text.VAlign;
    get(key: keyof UIStyle): any;
    set(key: keyof UIStyle, value: any): this;
    set(values: StyleOptions): this;
    unset(key: keyof UIStyle): this;
}
interface StyleOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}
interface UISelectable {
    readonly tag: string;
    readonly classes: string[];
    children: UISelectable[];
    attr(name: string): PropType | undefined;
    prop(name: string): PropType | undefined;
    parent: UISelectable | null;
}
interface UIStylable extends UISelectable {
    style(): UIStyle;
    readonly opacity: number;
}
interface UILayer {
    readonly buffer: GWU.canvas.Buffer;
    readonly width: number;
    readonly height: number;
    finish(result?: any): void;
    click(e: GWU.io.Event): boolean;
    mousemove(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;
    draw(): void;
    needsDraw: boolean;
}
interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}

interface GridTarget {
    pos(): GWU.xy.XY;
    pos(x: number, y: number): any;
}
declare class Grid {
    _left: number;
    _top: number;
    _colWidths: number[];
    _rowHeights: number[];
    _col: number;
    _row: number;
    target: GridTarget;
    constructor(target: GridTarget);
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
    endRow(h: number): this;
    protected _setPos(): this;
}

declare type StyleType = string | StyleOptions;
declare class Style implements UIStyle {
    _fg?: GWU.color.ColorBase;
    _bg?: GWU.color.ColorBase;
    _border?: GWU.color.ColorBase;
    _align?: GWU.text.Align;
    _valign?: GWU.text.VAlign;
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
declare function makeStyle(style: string, selector?: string): Style;
declare class ComputedStyle extends Style {
    sources: UIStyle[];
    _opacity: number;
    _baseFg: GWU.color.Color | null;
    _baseBg: GWU.color.Color | null;
    constructor(sources?: UIStyle[], opacity?: number);
    get opacity(): number;
    set opacity(v: number);
    get dirty(): boolean;
    set dirty(v: boolean);
}
declare class Sheet {
    rules: UIStyle[];
    _dirty: boolean;
    constructor(parentSheet?: Sheet | null);
    get dirty(): boolean;
    set dirty(v: boolean);
    add(selector: string, props: StyleOptions): this;
    get(selector: string): UIStyle | null;
    remove(selector: string): void;
    computeFor(widget: UIStylable): ComputedStyle;
}
declare const defaultStyle: Sheet;

declare type EventCb = (name: string, widget: Widget | null, args?: any) => boolean;
interface WidgetOptions extends StyleOptions {
    id?: string;
    disabled?: boolean;
    hidden?: boolean;
    opacity?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    class?: string;
    tag?: string;
    tabStop?: boolean;
    action?: string;
    depth?: number;
}
interface SetParentOptions {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    beforeIndex?: number;
}
declare class Widget implements UIStylable {
    tag: string;
    layer: Layer;
    bounds: GWU.xy.Bounds;
    _depth: number;
    events: Record<string, EventCb[]>;
    children: Widget[];
    _style: Style;
    _used: ComputedStyle;
    _parent: Widget | null;
    classes: string[];
    _props: Record<string, PropType>;
    _attrs: Record<string, PropType>;
    constructor(term: Layer, opts?: WidgetOptions);
    get depth(): number;
    set depth(v: number);
    get parent(): Widget | null;
    set parent(v: Widget | null);
    setParent(v: Widget | null, opts?: SetParentOptions): void;
    pos(): GWU.xy.XY;
    pos(xy: GWU.xy.XY): this;
    pos(x: number, y: number): this;
    center(bounds?: GWU.xy.Bounds): this;
    centerX(bounds?: GWU.xy.Bounds): this;
    centerY(bounds?: GWU.xy.Bounds): this;
    text(): string;
    text(v: string): this;
    attr(name: string): PropType;
    attr(name: string, v: PropType): this;
    _attrInt(name: string): number;
    _attrStr(name: string): string;
    _attrBool(name: string): boolean;
    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    _setProp(name: string, v: PropType): void;
    _propInt(name: string): number;
    _propStr(name: string): string;
    _propBool(name: string): boolean;
    toggleProp(name: string): this;
    incProp(name: string, n?: number): this;
    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    style(): Style;
    style(opts: StyleOptions): this;
    addClass(c: string): this;
    removeClass(c: string): this;
    hasClass(c: string): boolean;
    toggleClass(c: string): this;
    get focused(): boolean;
    focus(reverse?: boolean): boolean;
    blur(reverse?: boolean): boolean;
    get hovered(): boolean;
    set hovered(v: boolean);
    get hidden(): boolean;
    set hidden(v: boolean);
    get opacity(): number;
    set opacity(v: number);
    updateStyle(): void;
    draw(buffer: GWU.buffer.Buffer): boolean;
    fadeIn(ms: number): this;
    fadeOut(ms: number): this;
    fadeTo(opacity: number, ms: number): this;
    fadeToggle(ms: number): this;
    protected _draw(buffer: GWU.buffer.Buffer): boolean;
    protected _drawFill(buffer: GWU.buffer.Buffer): void;
    childAt(xy: GWU.xy.XY): Widget | null;
    childAt(x: number, y: number): Widget | null;
    _addChild(w: Widget, opts?: SetParentOptions): this;
    _removeChild(w: Widget): this;
    resize(w: number, h: number): this;
    mouseenter(e: GWU.io.Event, over: Widget): void;
    mousemove(e: GWU.io.Event): boolean;
    mouseleave(e: GWU.io.Event): void;
    click(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    _fireEvent(name: string, source: Widget | null, args?: any): boolean;
    _bubbleEvent(name: string, source: Widget | null, args?: any): boolean;
}

declare type TimerFn = () => void | Promise<void>;
interface TimerInfo {
    action: string | TimerFn;
    time: number;
}
interface UICore {
    readonly loop: GWU.io.Loop;
    readonly canvas: GWU.canvas.BaseCanvas;
    readonly width: number;
    readonly height: number;
    readonly styles: Sheet;
    startNewLayer(): Layer;
    copyUIBuffer(dest: GWU.buffer.Buffer): void;
    finishLayer(layer: Layer): void;
    stop(): void;
}
interface LayerOptions {
    styles?: Sheet;
}
declare class Layer implements UILayer {
    ui: UICore;
    buffer: GWU.canvas.Buffer;
    body: Widget;
    styles: Sheet;
    needsDraw: boolean;
    result: any;
    _attachOrder: Widget[];
    _depthOrder: Widget[];
    _focusWidget: Widget | null;
    _hasTabStop: boolean;
    timers: TimerInfo[];
    _tweens: GWU.tween.Tween[];
    promise: Promise<any>;
    _done: Function | null;
    _opts: WidgetOptions;
    constructor(ui: UICore, opts?: LayerOptions);
    get width(): number;
    get height(): number;
    reset(): this;
    fg(v: GWU.color.ColorBase): this;
    bg(v: GWU.color.ColorBase): this;
    dim(pct?: number, fg?: boolean, bg?: boolean): this;
    bright(pct?: number, fg?: boolean, bg?: boolean): this;
    invert(): this;
    style(opts: StyleOptions): this;
    class(c: string): this;
    pos(): GWU.xy.XY;
    pos(x: number, y: number): this;
    moveTo(x: number, y: number): this;
    move(dx: number, dy: number): this;
    up(n?: number): this;
    down(n?: number): this;
    left(n?: number): this;
    right(n?: number): this;
    nextLine(n?: number): this;
    prevLine(n?: number): this;
    grid(): Grid;
    clear(color?: GWU.color.ColorBase): this;
    sortWidgets(): this;
    attach(w: Widget): this;
    detach(w: Widget): this;
    widgetAt(x: number, y: number): Widget;
    widgetAt(xy: GWU.xy.XY): Widget;
    get focusWidget(): Widget | null;
    setFocusWidget(w: Widget | null, reverse?: boolean): void;
    getWidget(id: string): Widget | null;
    nextTabStop(): boolean;
    prevTabStop(): boolean;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    mousemove(e: GWU.io.Event): boolean;
    click(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;
    draw(): void;
    setTimeout(action: string | TimerFn, time: number): void;
    clearTimeout(action: string | TimerFn): void;
    animate(tween: GWU.tween.Tween): this;
    finish(result?: any): void;
    _finish(): void;
}

interface TextOptions extends WidgetOptions {
    text: string;
}
declare class Text extends Widget {
    _text: string;
    _lines: string[];
    _fixedWidth: boolean;
    _fixedHeight: boolean;
    constructor(layer: Layer, opts: TextOptions);
    text(): string;
    text(v: string): this;
    resize(w: number, h: number): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}
declare type AddTextOptions = Omit<TextOptions, 'text'> & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        text(text: string, opts?: AddTextOptions): Text;
    }
}

declare type FormatFn = GWU.text.Template;
declare type Value = string | number;
declare type SelectType = 'none' | 'column' | 'row' | 'cell';
declare type HoverType = 'none' | 'column' | 'row' | 'cell' | 'select';
declare type DataObject = Record<string, any>;
declare type DataItem = Value | Value[] | DataObject;
declare type DataType = DataItem[];
declare type BorderType = 'ascii' | 'fill' | 'none';
interface ColumnOptions {
    width?: number;
    format?: string | FormatFn;
    header?: string;
    headerTag?: string;
    headerClass?: string;
    empty?: string;
    dataTag?: string;
    dataClass?: string;
}
interface DataTableOptions extends Omit<WidgetOptions, 'height'> {
    size?: number;
    rowHeight?: number;
    header?: boolean;
    headerTag?: string;
    dataTag?: string;
    prefix?: PrefixType;
    select?: SelectType;
    hover?: HoverType;
    wrap?: boolean;
    columns: ColumnOptions[];
    data?: DataType;
    border?: boolean | BorderType;
}
declare class Column {
    static default: {
        select: string;
        hover: string;
        tag: string;
        headerTag: string;
        dataTag: string;
        border: string;
    };
    width: number;
    format: GWU.text.Template;
    header: string;
    headerTag: string;
    dataTag: string;
    empty: string;
    constructor(opts: ColumnOptions);
    addHeader(table: DataTable, x: number, y: number, col: number): Text;
    addData(table: DataTable, data: DataItem, x: number, y: number, col: number, row: number): Text;
    addEmpty(table: DataTable, x: number, y: number, col: number, row: number): Text;
}
declare class DataTable extends Widget {
    static default: {
        columnWidth: number;
        header: boolean;
        empty: string;
        tag: string;
        headerTag: string;
        dataTag: string;
        select: SelectType;
        hover: HoverType;
        prefix: PrefixType;
        border: BorderType;
        wrap: boolean;
    };
    _data: DataType;
    columns: Column[];
    showHeader: boolean;
    rowHeight: number;
    size: number;
    selectedRow: number;
    selectedColumn: number;
    constructor(layer: Layer, opts: DataTableOptions);
    get selectedData(): any;
    select(col: number, row: number): this;
    selectNextRow(): this;
    selectPrevRow(): this;
    selectNextCol(): this;
    selectPrevCol(): this;
    blur(reverse?: boolean): boolean;
    data(): DataType;
    data(data: DataType): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
    mouseenter(e: GWU.io.Event, over: Widget): void;
    click(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
}
declare class TD extends Text {
    mouseleave(e: GWU.io.Event): void;
}
declare type AddDataTableOptions = DataTableOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        datatable(opts: AddDataTableOptions): DataTable;
    }
}

declare type PadInfo = boolean | number | [number] | [number, number] | [number, number, number, number];
interface DialogOptions extends WidgetOptions {
    width: number;
    height: number;
    border?: BorderType;
    pad?: PadInfo;
    legend?: string;
    legendTag?: string;
    legendClass?: string;
    legendAlign?: GWU.text.Align;
}
declare function toPadArray(pad: PadInfo): [number, number, number, number];
declare class Dialog extends Widget {
    static default: {
        tag: string;
        border: BorderType;
        pad: boolean;
        legendTag: string;
        legendClass: string;
        legendAlign: "left" | "center" | "right";
    };
    legend: Widget | null;
    constructor(layer: Layer, opts: DialogOptions);
    _adjustBounds(pad: [number, number, number, number]): this;
    get _innerLeft(): number;
    get _innerWidth(): number;
    get _innerTop(): number;
    get _innerHeight(): number;
    _addLegend(opts: DialogOptions): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}
declare type AddDialogOptions = DialogOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        dialog(opts?: AddDialogOptions): Dialog;
    }
}

interface AlertOptions extends DialogOptions {
    duration?: number;
    waitForAck?: boolean;
    textClass?: string;
    opacity?: number;
}
declare module './layer' {
    interface Layer {
        alert(opts: AlertOptions | number, text: string, args?: any): Layer;
    }
}

declare module './layer' {
    interface Layer {
        fadeTo(color?: GWU.color.ColorBase, time?: number): Layer;
    }
}

interface ButtonOptions extends Omit<TextOptions, 'text'> {
    text?: string;
    id: string;
}
declare class Button extends Text {
    constructor(layer: Layer, opts: ButtonOptions);
    keypress(ev: GWU.io.Event): boolean;
    click(ev: GWU.io.Event): boolean;
}
declare type AddButtonOptions = Omit<ButtonOptions, 'text'> & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        button(text: string, opts?: AddButtonOptions): Button;
    }
}

interface ConfirmOptions extends Omit<DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;
    textClass?: string;
    opacity?: number;
    buttonWidth?: number;
    ok?: string;
    okClass?: string;
    cancel?: boolean | string;
    cancelClass?: string;
}
declare module './layer' {
    interface Layer {
        confirm(text: string, args?: any): Layer;
        confirm(opts: ConfirmOptions, text: string, args?: any): Layer;
    }
}

interface InputBoxOptions extends Omit<DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;
    textClass?: string;
    opacity?: number;
    buttonWidth?: number;
    label?: string;
    labelClass?: string;
    default?: string;
    placeholder?: string;
    inputClass?: string;
    minLength?: number;
    maxLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
}
declare module './layer' {
    interface Layer {
        inputbox(text: string, args?: any): Layer;
        inputbox(opts: InputBoxOptions, text: string, args?: any): Layer;
    }
}

interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}
declare class UI implements UICore {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
    layer: Layer | null;
    layers: Layer[];
    _done: boolean;
    _promise: Promise<void> | null;
    constructor(opts?: Partial<UIOptions>);
    get width(): number;
    get height(): number;
    get styles(): Sheet;
    get baseBuffer(): GWU.canvas.Buffer;
    get canvasBuffer(): GWU.canvas.Buffer;
    get buffer(): GWU.canvas.Buffer;
    startNewLayer(): Layer;
    copyUIBuffer(dest: GWU.buffer.Buffer): void;
    finishLayer(layer: Layer): void;
    stop(): void;
    mousemove(e: GWU.io.Event): boolean;
    click(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;
    draw(): void;
}

declare class Body extends Widget {
    constructor(layer: Layer);
    _drawFill(buffer: GWU.buffer.Buffer): void;
}

interface BorderOptions extends WidgetOptions {
    width: number;
    height: number;
    ascii?: boolean;
}
declare class Border extends Widget {
    ascii: boolean;
    constructor(layer: Layer, opts: BorderOptions);
    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}
declare type AddBorderOptions = BorderOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        border(opts: AddBorderOptions): Border;
    }
}
declare function drawBorder(buffer: GWU.buffer.Buffer, x: number, y: number, w: number, h: number, style: UIStyle, ascii: boolean): void;

interface FieldsetOptions extends Omit<DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;
    dataWidth: number;
    separator?: string;
    labelTag?: string;
    labelClass?: string;
    dataTag?: string;
    dataClass?: string;
}
declare class Fieldset extends Dialog {
    static default: {
        tag: string;
        border: BorderType;
        separator: string;
        pad: boolean;
        legendTag: string;
        legendClass: string;
        legendAlign: "left" | "center" | "right";
        labelTag: string;
        labelClass: string;
        dataTag: string;
        dataClass: string;
    };
    fields: Field[];
    constructor(layer: Layer, opts: FieldsetOptions);
    _adjustBounds(pad: [number, number, number, number]): this;
    get _labelLeft(): number;
    get _dataLeft(): number;
    get _nextY(): number;
    add(label: string, format: string | FieldOptions): this;
    data(d: any): this;
}
declare type AddFieldsetOptions = FieldsetOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        fieldset(opts?: AddFieldsetOptions): Fieldset;
    }
}
interface FieldOptions extends WidgetOptions {
    format: string | GWU.text.Template;
}
declare class Field extends Text {
    _format: GWU.text.Template;
    constructor(layer: Layer, opts: FieldOptions);
    data(v: any): this;
}

interface OrderedListOptions extends WidgetOptions {
    pad?: number;
}
declare class OrderedList extends Widget {
    static default: {
        pad: number;
    };
    _fixedWidth: boolean;
    _fixedHeight: boolean;
    constructor(layer: Layer, opts: OrderedListOptions);
    _addChild(w: Widget, opts?: SetParentOptions): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
    _getBullet(index: number): string;
    _drawBulletFor(widget: Widget, buffer: GWU.buffer.Buffer, index: number): void;
}
interface UnorderedListOptions extends OrderedListOptions {
    bullet?: string;
}
declare class UnorderedList extends OrderedList {
    static default: {
        bullet: string;
        pad: number;
    };
    constructor(layer: Layer, opts: UnorderedListOptions);
    _getBullet(_index: number): string;
}
declare type AddOrderedListOptions = OrderedListOptions & SetParentOptions & {
    parent?: Widget;
};
declare type AddUnorderedListOptions = UnorderedListOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        ol(opts?: AddOrderedListOptions): OrderedList;
        ul(opts?: AddUnorderedListOptions): UnorderedList;
    }
}

interface InputOptions extends Omit<TextOptions, 'text'> {
    text?: string;
    id: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    numbersOnly?: boolean;
    min?: number;
    max?: number;
    required?: boolean;
    disabled?: boolean;
}
declare class Input extends Text {
    static default: {
        tag: string;
        width: number;
        placeholder: string;
    };
    minLength: number;
    maxLength: number;
    numbersOnly: boolean;
    min: number;
    max: number;
    constructor(layer: Layer, opts: InputOptions);
    reset(): void;
    _setProp(name: string, v: PropType): void;
    isValid(): boolean;
    keypress(ev: GWU.io.Event): boolean;
    text(): string;
    text(v: string): this;
    _draw(buffer: GWU.buffer.Buffer, _force?: boolean): boolean;
}
declare type AddInputOptions = InputOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        input(opts: AddInputOptions): Input;
    }
}

interface DataListOptions extends ColumnOptions, WidgetOptions {
    size?: number;
    rowHeight?: number;
    hover?: HoverType;
    headerTag?: string;
    dataTag?: string;
    prefix?: PrefixType;
    data?: DataType;
    border?: boolean | BorderType;
}
declare class DataList extends DataTable {
    constructor(layer: Layer, opts: DataListOptions);
}
declare type AddDataListOptions = DataListOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        datalist(opts: AddDataListOptions): DataList;
    }
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
    minWidth?: number;
    marker?: string;
}
declare class Menu extends Widget {
    static default: {
        tag: string;
        class: string;
        buttonClass: string;
        buttonTag: string;
        marker: string;
        minWidth: number;
    };
    constructor(layer: Layer, opts: MenuOptions);
    _initButtons(opts: MenuOptions): void;
    collapse(): this;
}
interface MenuButtonOptions extends WidgetOptions {
    text: string;
    buttons: ButtonConfig;
}
declare class MenuButton extends Text {
    menu: Menu | null;
    constructor(layer: Layer, opts: MenuButtonOptions);
    collapse(): this;
    expand(): this;
    _setMenuPos(xy: GWU.xy.XY, opts: MenuButtonOptions): void;
    _initMenu(opts: MenuButtonOptions): Menu | null;
}
declare type AddMenuOptions = MenuOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        menu(opts: AddMenuOptions): Menu;
    }
}

interface MenubarOptions extends WidgetOptions {
    buttons: DropdownConfig;
    buttonClass?: string | string[];
    buttonTag?: string;
    menuClass?: string | string[];
    menuTag?: string;
    minWidth?: number;
    prefix?: string;
    separator?: string;
}
declare class Menubar extends Widget {
    static default: {
        buttonClass: string;
        buttonTag: string;
        menuClass: string;
        menuTag: string;
        prefix: string;
        separator: string;
    };
    _config: DropdownConfig;
    _buttons: MenubarButton[];
    _selectedIndex: number;
    constructor(layer: Layer, opts: MenubarOptions);
    get selectedIndex(): number;
    set selectedIndex(v: number);
    get selectedButton(): Widget;
    focus(reverse?: boolean): boolean;
    blur(reverse?: boolean): boolean;
    collapse(): boolean;
    keypress(e: GWU.io.Event): boolean;
    mousemove(e: GWU.io.Event): boolean;
    _initButtons(opts: MenubarOptions): void;
    _buttonClick(_action: string, button: Widget | null): boolean;
}
interface MenubarButtonOptions extends WidgetOptions {
    text: string;
    buttons: ButtonConfig;
}
declare class MenubarButton extends Text {
    menu: Menu | null;
    constructor(layer: Layer, opts: MenubarButtonOptions);
    collapse(): boolean;
    expand(): this;
    _setMenuPos(xy: GWU.xy.XY, opts: MenubarButtonOptions): void;
    _initMenu(opts: MenubarButtonOptions): Menu | null;
}
declare type AddMenubarOptions = MenubarOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        menubar(opts?: AddMenubarOptions): Menubar;
    }
}
declare class MenuViewer extends Widget {
    menubar: Menubar;
    mainMenu: Menu;
    constructor(menubar: Menubar, buttons: DropdownConfig);
    contains(): boolean;
    finish(): void;
    _initMenu(buttons: DropdownConfig): Menu;
    keypress(e: GWU.io.Event): boolean;
}

interface SelectOptions extends WidgetOptions {
    text: string;
    buttons: DropdownConfig;
    buttonClass?: string;
    buttonTag?: string;
}
declare class Select extends Widget {
    dropdown: Text;
    menu: Menu;
    constructor(layer: Layer, opts: SelectOptions);
    _initText(opts: SelectOptions): void;
    _initMenu(opts: SelectOptions): void;
}
declare type AddSelectOptions = SelectOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        select(opts: AddSelectOptions): Select;
    }
}

declare type NextType = string | null;
interface PromptChoice {
    info?: string | GWU.text.Template;
    next?: string;
    value?: any;
}
interface PromptOptions {
    field?: string;
    next?: string;
    id?: string;
}
declare class Prompt {
    _id: string | null;
    _field: string;
    _prompt: string | GWU.text.Template;
    _choices: string[];
    _infos: (string | GWU.text.Template)[];
    _next: NextType[];
    _values: any[];
    _defaultNext: NextType;
    selection: number;
    constructor(question: string | GWU.text.Template, field?: string | PromptOptions);
    reset(): void;
    field(): string;
    field(v: string): this;
    id(): string | null;
    id(v: string | null): this;
    prompt(arg?: any): string;
    next(): string | null;
    next(v: string | null): this;
    choices(): string[];
    choices(choices: Record<string, string | PromptChoice>): this;
    choices(choices: string[], infos?: (string | PromptChoice)[]): this;
    choice(choice: string, info?: string | PromptChoice): this;
    info(arg?: any): string;
    choose(n: number): this;
    value(): any;
    updateResult(res: any): this;
}
interface ChoiceOptions extends WidgetOptions {
    width: number;
    height: number;
    choiceWidth: number;
    border?: BorderType;
    promptTag?: string;
    promptClass?: string;
    choiceTag?: string;
    choiceClass?: string;
    infoTag?: string;
    infoClass?: string;
    prompt?: Prompt;
}
declare class Choice extends Widget {
    static default: {
        tag: string;
        border: string;
        promptTag: string;
        promptClass: string;
        choiceTag: string;
        choiceClass: string;
        infoTag: string;
        infoClass: string;
    };
    choiceWidth: number;
    prompt: Widget;
    list: DataList;
    info: Text;
    _prompt: Prompt | null;
    _done: null | ((v: any) => void);
    constructor(layer: Layer, opts: ChoiceOptions);
    showPrompt(prompt: Prompt, arg?: any): Promise<any>;
    _addList(): this;
    _addInfo(): this;
    _addLegend(): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}
declare type AddChoiceOptions = ChoiceOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../ui/layer' {
    interface Layer {
        choice(opts?: AddChoiceOptions): Choice;
    }
}
declare class Inquiry {
    widget: Choice;
    _prompts: Prompt[];
    events: Record<string, EventCb[]>;
    _result: any;
    _stack: Prompt[];
    _current: Prompt | null;
    constructor(widget: Choice);
    prompts(v: Prompt[] | Prompt, ...args: Prompt[]): this;
    _finish(): void;
    _cancel(): void;
    start(): void;
    back(): void;
    restart(): void;
    quit(): void;
    _keypress(_n: string, _w: Widget | null, e: GWU.io.Event): boolean;
    _change(_n: string, _w: Widget | null, p: Prompt): boolean;
    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
    _fireEvent(name: string, source: Widget | null, args?: any): boolean;
}

type index_d$1_EventCb = EventCb;
type index_d$1_WidgetOptions = WidgetOptions;
type index_d$1_SetParentOptions = SetParentOptions;
type index_d$1_Widget = Widget;
declare const index_d$1_Widget: typeof Widget;
type index_d$1_Body = Body;
declare const index_d$1_Body: typeof Body;
type index_d$1_TextOptions = TextOptions;
type index_d$1_Text = Text;
declare const index_d$1_Text: typeof Text;
type index_d$1_AddTextOptions = AddTextOptions;
type index_d$1_BorderOptions = BorderOptions;
type index_d$1_Border = Border;
declare const index_d$1_Border: typeof Border;
type index_d$1_AddBorderOptions = AddBorderOptions;
declare const index_d$1_drawBorder: typeof drawBorder;
type index_d$1_ButtonOptions = ButtonOptions;
type index_d$1_Button = Button;
declare const index_d$1_Button: typeof Button;
type index_d$1_AddButtonOptions = AddButtonOptions;
type index_d$1_PadInfo = PadInfo;
type index_d$1_DialogOptions = DialogOptions;
declare const index_d$1_toPadArray: typeof toPadArray;
type index_d$1_Dialog = Dialog;
declare const index_d$1_Dialog: typeof Dialog;
type index_d$1_AddDialogOptions = AddDialogOptions;
type index_d$1_FieldsetOptions = FieldsetOptions;
type index_d$1_Fieldset = Fieldset;
declare const index_d$1_Fieldset: typeof Fieldset;
type index_d$1_AddFieldsetOptions = AddFieldsetOptions;
type index_d$1_FieldOptions = FieldOptions;
type index_d$1_Field = Field;
declare const index_d$1_Field: typeof Field;
type index_d$1_OrderedListOptions = OrderedListOptions;
type index_d$1_OrderedList = OrderedList;
declare const index_d$1_OrderedList: typeof OrderedList;
type index_d$1_UnorderedListOptions = UnorderedListOptions;
type index_d$1_UnorderedList = UnorderedList;
declare const index_d$1_UnorderedList: typeof UnorderedList;
type index_d$1_AddOrderedListOptions = AddOrderedListOptions;
type index_d$1_AddUnorderedListOptions = AddUnorderedListOptions;
type index_d$1_InputOptions = InputOptions;
type index_d$1_Input = Input;
declare const index_d$1_Input: typeof Input;
type index_d$1_AddInputOptions = AddInputOptions;
type index_d$1_FormatFn = FormatFn;
type index_d$1_Value = Value;
type index_d$1_SelectType = SelectType;
type index_d$1_HoverType = HoverType;
type index_d$1_DataObject = DataObject;
type index_d$1_DataItem = DataItem;
type index_d$1_DataType = DataType;
type index_d$1_BorderType = BorderType;
type index_d$1_ColumnOptions = ColumnOptions;
type index_d$1_DataTableOptions = DataTableOptions;
type index_d$1_Column = Column;
declare const index_d$1_Column: typeof Column;
type index_d$1_DataTable = DataTable;
declare const index_d$1_DataTable: typeof DataTable;
type index_d$1_TD = TD;
declare const index_d$1_TD: typeof TD;
type index_d$1_AddDataTableOptions = AddDataTableOptions;
type index_d$1_DataListOptions = DataListOptions;
type index_d$1_DataList = DataList;
declare const index_d$1_DataList: typeof DataList;
type index_d$1_AddDataListOptions = AddDataListOptions;
type index_d$1_Rec<_0> = Rec<_0>;
type index_d$1_DropdownConfig = DropdownConfig;
type index_d$1_ActionConfig = ActionConfig;
type index_d$1_ButtonConfig = ButtonConfig;
type index_d$1_MenuOptions = MenuOptions;
type index_d$1_Menu = Menu;
declare const index_d$1_Menu: typeof Menu;
type index_d$1_MenuButtonOptions = MenuButtonOptions;
type index_d$1_MenuButton = MenuButton;
declare const index_d$1_MenuButton: typeof MenuButton;
type index_d$1_AddMenuOptions = AddMenuOptions;
type index_d$1_MenubarOptions = MenubarOptions;
type index_d$1_Menubar = Menubar;
declare const index_d$1_Menubar: typeof Menubar;
type index_d$1_MenubarButtonOptions = MenubarButtonOptions;
type index_d$1_MenubarButton = MenubarButton;
declare const index_d$1_MenubarButton: typeof MenubarButton;
type index_d$1_AddMenubarOptions = AddMenubarOptions;
type index_d$1_MenuViewer = MenuViewer;
declare const index_d$1_MenuViewer: typeof MenuViewer;
type index_d$1_SelectOptions = SelectOptions;
type index_d$1_Select = Select;
declare const index_d$1_Select: typeof Select;
type index_d$1_AddSelectOptions = AddSelectOptions;
type index_d$1_NextType = NextType;
type index_d$1_PromptChoice = PromptChoice;
type index_d$1_PromptOptions = PromptOptions;
type index_d$1_Prompt = Prompt;
declare const index_d$1_Prompt: typeof Prompt;
type index_d$1_ChoiceOptions = ChoiceOptions;
type index_d$1_Choice = Choice;
declare const index_d$1_Choice: typeof Choice;
type index_d$1_AddChoiceOptions = AddChoiceOptions;
type index_d$1_Inquiry = Inquiry;
declare const index_d$1_Inquiry: typeof Inquiry;
declare namespace index_d$1 {
  export {
    index_d$1_EventCb as EventCb,
    index_d$1_WidgetOptions as WidgetOptions,
    index_d$1_SetParentOptions as SetParentOptions,
    index_d$1_Widget as Widget,
    index_d$1_Body as Body,
    index_d$1_TextOptions as TextOptions,
    index_d$1_Text as Text,
    index_d$1_AddTextOptions as AddTextOptions,
    index_d$1_BorderOptions as BorderOptions,
    index_d$1_Border as Border,
    index_d$1_AddBorderOptions as AddBorderOptions,
    index_d$1_drawBorder as drawBorder,
    index_d$1_ButtonOptions as ButtonOptions,
    index_d$1_Button as Button,
    index_d$1_AddButtonOptions as AddButtonOptions,
    index_d$1_PadInfo as PadInfo,
    index_d$1_DialogOptions as DialogOptions,
    index_d$1_toPadArray as toPadArray,
    index_d$1_Dialog as Dialog,
    index_d$1_AddDialogOptions as AddDialogOptions,
    index_d$1_FieldsetOptions as FieldsetOptions,
    index_d$1_Fieldset as Fieldset,
    index_d$1_AddFieldsetOptions as AddFieldsetOptions,
    index_d$1_FieldOptions as FieldOptions,
    index_d$1_Field as Field,
    index_d$1_OrderedListOptions as OrderedListOptions,
    index_d$1_OrderedList as OrderedList,
    index_d$1_UnorderedListOptions as UnorderedListOptions,
    index_d$1_UnorderedList as UnorderedList,
    index_d$1_AddOrderedListOptions as AddOrderedListOptions,
    index_d$1_AddUnorderedListOptions as AddUnorderedListOptions,
    index_d$1_InputOptions as InputOptions,
    index_d$1_Input as Input,
    index_d$1_AddInputOptions as AddInputOptions,
    index_d$1_FormatFn as FormatFn,
    index_d$1_Value as Value,
    index_d$1_SelectType as SelectType,
    index_d$1_HoverType as HoverType,
    index_d$1_DataObject as DataObject,
    index_d$1_DataItem as DataItem,
    index_d$1_DataType as DataType,
    index_d$1_BorderType as BorderType,
    index_d$1_ColumnOptions as ColumnOptions,
    index_d$1_DataTableOptions as DataTableOptions,
    index_d$1_Column as Column,
    index_d$1_DataTable as DataTable,
    index_d$1_TD as TD,
    index_d$1_AddDataTableOptions as AddDataTableOptions,
    index_d$1_DataListOptions as DataListOptions,
    index_d$1_DataList as DataList,
    index_d$1_AddDataListOptions as AddDataListOptions,
    index_d$1_Rec as Rec,
    index_d$1_DropdownConfig as DropdownConfig,
    index_d$1_ActionConfig as ActionConfig,
    index_d$1_ButtonConfig as ButtonConfig,
    index_d$1_MenuOptions as MenuOptions,
    index_d$1_Menu as Menu,
    index_d$1_MenuButtonOptions as MenuButtonOptions,
    index_d$1_MenuButton as MenuButton,
    index_d$1_AddMenuOptions as AddMenuOptions,
    index_d$1_MenubarOptions as MenubarOptions,
    index_d$1_Menubar as Menubar,
    index_d$1_MenubarButtonOptions as MenubarButtonOptions,
    index_d$1_MenubarButton as MenubarButton,
    index_d$1_AddMenubarOptions as AddMenubarOptions,
    index_d$1_MenuViewer as MenuViewer,
    index_d$1_SelectOptions as SelectOptions,
    index_d$1_Select as Select,
    index_d$1_AddSelectOptions as AddSelectOptions,
    index_d$1_NextType as NextType,
    index_d$1_PromptChoice as PromptChoice,
    index_d$1_PromptOptions as PromptOptions,
    index_d$1_Prompt as Prompt,
    index_d$1_ChoiceOptions as ChoiceOptions,
    index_d$1_Choice as Choice,
    index_d$1_AddChoiceOptions as AddChoiceOptions,
    index_d$1_Inquiry as Inquiry,
  };
}

interface MessageOptions extends WidgetOptions {
    length?: number;
}
declare class Messages extends Widget {
    cache: GWU.message.MessageCache;
    constructor(layer: Layer, opts: MessageOptions);
    click(e: GWU.io.Event): boolean;
    draw(buffer: GWU.buffer.Buffer): boolean;
    showArchive(): void;
}
declare type ArchiveMode = 'forward' | 'ack' | 'reverse';
declare class MessageArchive extends Widget {
    source: Messages;
    totalCount: number;
    isOnTop: boolean;
    mode: ArchiveMode;
    shown: number;
    constructor(layer: Layer, source: Messages);
    contains(): boolean;
    finish(): void;
    keypress(_e: GWU.io.Event): boolean;
    click(_e: GWU.io.Event): boolean;
    _forward(): boolean;
    _reverse(): boolean;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}

interface FlavorOptions extends WidgetOptions {
    overflow?: boolean;
}
declare class Flavor extends Text {
    isPrompt: boolean;
    overflow: boolean;
    promptFg: GWU.color.Color;
    constructor(layer: Layer, opts: FlavorOptions);
    showText(text: string): this;
    clear(): this;
    showPrompt(text: string): this;
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
declare class Sidebar extends Widget {
    cellCache: GWM.map.CellInfoType[];
    lastX: number;
    lastY: number;
    lastMap: GWM.map.Map | null;
    entries: SidebarEntry[];
    subject: UISubject | null;
    highlight: EntryBase | null;
    constructor(layer: Layer, opts: SidebarOptions);
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
interface ViewportOptions extends WidgetOptions {
    snap?: boolean;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}
declare class Viewport extends Widget {
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    _subject: UISubject | null;
    constructor(layer: Layer, opts: ViewportOptions);
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

export { AlertOptions, ComputedStyle, ConfirmOptions, Grid, GridTarget, InputBoxOptions, Layer, LayerOptions, MatchFn, PrefixType, PropType, Selector, Sheet, Size, Style, StyleOptions, StyleType, TimerFn, TimerInfo, UI, UICore, UILayer, UIOptions, UISelectable, UIStylable, UIStyle, UISubject, compile, defaultStyle, index_d as game, makeStyle, index_d$1 as widget };
