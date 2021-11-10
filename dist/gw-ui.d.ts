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
}
interface UIStylesheet {
    dirty: boolean;
    add(selector: string, props: StyleOptions): this;
    get(selector: string): UIStyle | null;
    remove(selector: string): void;
    computeFor(widget: UIStylable): UIStyle;
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

declare type StyleType = string | StyleOptions;
declare class Style implements UIStyle {
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
declare function makeStyle(style: string, selector?: string): Style;
declare class ComputedStyle extends Style {
    sources: UIStyle[];
    constructor(sources?: UIStyle[]);
    get dirty(): boolean;
    set dirty(v: boolean);
}
declare class Sheet implements UIStylesheet {
    rules: UIStyle[];
    _dirty: boolean;
    constructor(parentSheet?: Sheet | null);
    get dirty(): boolean;
    set dirty(v: boolean);
    add(selector: string, props: StyleOptions): this;
    get(selector: string): UIStyle | null;
    remove(selector: string): void;
    computeFor(widget: UIStylable): UIStyle;
}
declare const defaultStyle: Sheet;

declare type EventCb = (name: string, widget: Widget | null, args?: any) => boolean;
interface WidgetOptions extends StyleOptions {
    id?: string;
    disabled?: boolean;
    hidden?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    class?: string | string[];
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
    _used: UIStyle;
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
    updateStyle(): void;
    draw(buffer: GWU.buffer.Buffer): boolean;
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
    id?: string;
    depth?: number;
    hidden?: boolean;
}
declare class Layer implements UILayer {
    ui: UICore;
    id: string;
    depth: number;
    hidden: boolean;
    buffer: GWU.canvas.Buffer;
    body: Widget;
    styles: UIStylesheet;
    needsDraw: boolean;
    result: any;
    _attachOrder: Widget[];
    _depthOrder: Widget[];
    _focusWidget: Widget | null;
    _hasTabStop: boolean;
    timers: TimerInfo[];
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
    fadeTo(_color?: GWU.color.ColorBase, _duration?: number): void;
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
    finish(result?: any): void;
    _finish(): void;
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
declare module '../layer' {
    interface Layer {
        text(text: string, opts?: AddTextOptions): Text;
    }
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
declare module '../layer' {
    interface Layer {
        border(opts: AddBorderOptions): Border;
    }
}
declare function drawBorder(buffer: GWU.buffer.Buffer, x: number, y: number, w: number, h: number, style: UIStyle, ascii: boolean): void;

interface ButtonOptions extends Omit<TextOptions, 'text'> {
    text?: string;
    id: string;
}
declare class Button extends Text {
    constructor(layer: Layer, opts: ButtonOptions);
    keypress(ev: GWU.io.Event): boolean;
    click(ev: GWU.io.Event): boolean;
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
declare module '../layer' {
    interface Layer {
        datatable(opts: AddDataTableOptions): DataTable;
    }
}

interface FieldsetOptions extends WidgetOptions {
    width: number;
    dataWidth: number;
    border?: BorderType;
    separator?: string;
    pad?: boolean | number | number[];
    legend?: string;
    legendTag?: string;
    legendClass?: string;
    legendAlign?: GWU.text.Align;
    labelTag?: string;
    labelClass?: string;
    dataTag?: string;
    dataClass?: string;
}
declare class Fieldset extends Widget {
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
    legend: Widget | null;
    fields: Field[];
    constructor(layer: Layer, opts: FieldsetOptions);
    get _labelLeft(): number;
    get _dataLeft(): number;
    get _nextY(): number;
    _addLegend(opts: FieldsetOptions): this;
    add(label: string, format: string | FieldOptions): this;
    data(d: any): this;
    _draw(buffer: GWU.buffer.Buffer): boolean;
}
declare type AddFieldsetOptions = FieldsetOptions & SetParentOptions & {
    parent?: Widget;
};
declare module '../layer' {
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
declare module '../layer' {
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
declare module '../layer' {
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
declare module '../layer' {
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
declare module '../layer' {
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
declare module '../layer' {
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
    buttonClass?: string | string[];
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
declare module '../layer' {
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
declare module '../layer' {
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

type index_d_EventCb = EventCb;
type index_d_WidgetOptions = WidgetOptions;
type index_d_SetParentOptions = SetParentOptions;
type index_d_Widget = Widget;
declare const index_d_Widget: typeof Widget;
type index_d_TextOptions = TextOptions;
type index_d_Text = Text;
declare const index_d_Text: typeof Text;
type index_d_AddTextOptions = AddTextOptions;
type index_d_BorderOptions = BorderOptions;
type index_d_Border = Border;
declare const index_d_Border: typeof Border;
type index_d_AddBorderOptions = AddBorderOptions;
declare const index_d_drawBorder: typeof drawBorder;
type index_d_ButtonOptions = ButtonOptions;
type index_d_Button = Button;
declare const index_d_Button: typeof Button;
type index_d_FieldsetOptions = FieldsetOptions;
type index_d_Fieldset = Fieldset;
declare const index_d_Fieldset: typeof Fieldset;
type index_d_AddFieldsetOptions = AddFieldsetOptions;
type index_d_FieldOptions = FieldOptions;
type index_d_Field = Field;
declare const index_d_Field: typeof Field;
type index_d_OrderedListOptions = OrderedListOptions;
type index_d_OrderedList = OrderedList;
declare const index_d_OrderedList: typeof OrderedList;
type index_d_UnorderedListOptions = UnorderedListOptions;
type index_d_UnorderedList = UnorderedList;
declare const index_d_UnorderedList: typeof UnorderedList;
type index_d_AddOrderedListOptions = AddOrderedListOptions;
type index_d_AddUnorderedListOptions = AddUnorderedListOptions;
type index_d_InputOptions = InputOptions;
type index_d_Input = Input;
declare const index_d_Input: typeof Input;
type index_d_AddInputOptions = AddInputOptions;
type index_d_FormatFn = FormatFn;
type index_d_Value = Value;
type index_d_SelectType = SelectType;
type index_d_HoverType = HoverType;
type index_d_DataObject = DataObject;
type index_d_DataItem = DataItem;
type index_d_DataType = DataType;
type index_d_BorderType = BorderType;
type index_d_ColumnOptions = ColumnOptions;
type index_d_DataTableOptions = DataTableOptions;
type index_d_Column = Column;
declare const index_d_Column: typeof Column;
type index_d_DataTable = DataTable;
declare const index_d_DataTable: typeof DataTable;
type index_d_TD = TD;
declare const index_d_TD: typeof TD;
type index_d_AddDataTableOptions = AddDataTableOptions;
type index_d_DataListOptions = DataListOptions;
type index_d_DataList = DataList;
declare const index_d_DataList: typeof DataList;
type index_d_AddDataListOptions = AddDataListOptions;
type index_d_Rec<_0> = Rec<_0>;
type index_d_DropdownConfig = DropdownConfig;
type index_d_ActionConfig = ActionConfig;
type index_d_ButtonConfig = ButtonConfig;
type index_d_MenuOptions = MenuOptions;
type index_d_Menu = Menu;
declare const index_d_Menu: typeof Menu;
type index_d_MenuButtonOptions = MenuButtonOptions;
type index_d_MenuButton = MenuButton;
declare const index_d_MenuButton: typeof MenuButton;
type index_d_AddMenuOptions = AddMenuOptions;
type index_d_MenubarOptions = MenubarOptions;
type index_d_Menubar = Menubar;
declare const index_d_Menubar: typeof Menubar;
type index_d_MenubarButtonOptions = MenubarButtonOptions;
type index_d_MenubarButton = MenubarButton;
declare const index_d_MenubarButton: typeof MenubarButton;
type index_d_AddMenubarOptions = AddMenubarOptions;
type index_d_MenuViewer = MenuViewer;
declare const index_d_MenuViewer: typeof MenuViewer;
type index_d_SelectOptions = SelectOptions;
type index_d_Select = Select;
declare const index_d_Select: typeof Select;
type index_d_AddSelectOptions = AddSelectOptions;
type index_d_NextType = NextType;
type index_d_PromptChoice = PromptChoice;
type index_d_PromptOptions = PromptOptions;
type index_d_Prompt = Prompt;
declare const index_d_Prompt: typeof Prompt;
type index_d_ChoiceOptions = ChoiceOptions;
type index_d_Choice = Choice;
declare const index_d_Choice: typeof Choice;
type index_d_AddChoiceOptions = AddChoiceOptions;
type index_d_Inquiry = Inquiry;
declare const index_d_Inquiry: typeof Inquiry;
declare namespace index_d {
  export {
    index_d_EventCb as EventCb,
    index_d_WidgetOptions as WidgetOptions,
    index_d_SetParentOptions as SetParentOptions,
    index_d_Widget as Widget,
    index_d_TextOptions as TextOptions,
    index_d_Text as Text,
    index_d_AddTextOptions as AddTextOptions,
    index_d_BorderOptions as BorderOptions,
    index_d_Border as Border,
    index_d_AddBorderOptions as AddBorderOptions,
    index_d_drawBorder as drawBorder,
    index_d_ButtonOptions as ButtonOptions,
    index_d_Button as Button,
    index_d_FieldsetOptions as FieldsetOptions,
    index_d_Fieldset as Fieldset,
    index_d_AddFieldsetOptions as AddFieldsetOptions,
    index_d_FieldOptions as FieldOptions,
    index_d_Field as Field,
    index_d_OrderedListOptions as OrderedListOptions,
    index_d_OrderedList as OrderedList,
    index_d_UnorderedListOptions as UnorderedListOptions,
    index_d_UnorderedList as UnorderedList,
    index_d_AddOrderedListOptions as AddOrderedListOptions,
    index_d_AddUnorderedListOptions as AddUnorderedListOptions,
    index_d_InputOptions as InputOptions,
    index_d_Input as Input,
    index_d_AddInputOptions as AddInputOptions,
    index_d_FormatFn as FormatFn,
    index_d_Value as Value,
    index_d_SelectType as SelectType,
    index_d_HoverType as HoverType,
    index_d_DataObject as DataObject,
    index_d_DataItem as DataItem,
    index_d_DataType as DataType,
    index_d_BorderType as BorderType,
    index_d_ColumnOptions as ColumnOptions,
    index_d_DataTableOptions as DataTableOptions,
    index_d_Column as Column,
    index_d_DataTable as DataTable,
    index_d_TD as TD,
    index_d_AddDataTableOptions as AddDataTableOptions,
    index_d_DataListOptions as DataListOptions,
    index_d_DataList as DataList,
    index_d_AddDataListOptions as AddDataListOptions,
    index_d_Rec as Rec,
    index_d_DropdownConfig as DropdownConfig,
    index_d_ActionConfig as ActionConfig,
    index_d_ButtonConfig as ButtonConfig,
    index_d_MenuOptions as MenuOptions,
    index_d_Menu as Menu,
    index_d_MenuButtonOptions as MenuButtonOptions,
    index_d_MenuButton as MenuButton,
    index_d_AddMenuOptions as AddMenuOptions,
    index_d_MenubarOptions as MenubarOptions,
    index_d_Menubar as Menubar,
    index_d_MenubarButtonOptions as MenubarButtonOptions,
    index_d_MenubarButton as MenubarButton,
    index_d_AddMenubarOptions as AddMenubarOptions,
    index_d_MenuViewer as MenuViewer,
    index_d_SelectOptions as SelectOptions,
    index_d_Select as Select,
    index_d_AddSelectOptions as AddSelectOptions,
    index_d_NextType as NextType,
    index_d_PromptChoice as PromptChoice,
    index_d_PromptOptions as PromptOptions,
    index_d_Prompt as Prompt,
    index_d_ChoiceOptions as ChoiceOptions,
    index_d_Choice as Choice,
    index_d_AddChoiceOptions as AddChoiceOptions,
    index_d_Inquiry as Inquiry,
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
    keypress(e: GWU.io.Event): boolean;
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
    center: boolean;
    snap: boolean;
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    lockX: boolean;
    lockY: boolean;
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

export { ActorEntry, ArchiveMode, CellEntry, ComputedStyle, EntryBase, Flavor, FlavorOptions, ItemEntry, Layer, LayerOptions, MessageArchive, MessageOptions, Messages, PrefixType, PropType, Sheet, Sidebar, SidebarEntry, SidebarOptions, Size, Style, StyleOptions, StyleType, TimerFn, TimerInfo, UI, UICore, UILayer, UIOptions, UISelectable, UIStylable, UIStyle, UIStylesheet, UISubject, ViewFilterFn, Viewport, ViewportOptions, defaultStyle, makeStyle, index_d as widget };
