import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

// export interface GetInputOptions {
//     fg?: GWU.color.ColorBase;
//     bg?: GWU.color.ColorBase;
//     errorFg?: GWU.color.ColorBase;

//     hint?: string;
//     hintFg?: GWU.color.ColorBase;

//     default?: string;
//     minLength?: number;

//     numbersOnly?: boolean;
//     min?: number;
//     max?: number;
// }

export interface Size {
    width: number;
    height: number;
}

export type PropType = string | number | boolean;

export interface Selectable {
    tag: string;
    classes: string[];

    attr(name: string): string | undefined;
    prop(name: string): PropType | undefined;
    parent: Selectable | null;
    children?: Selectable[];
}

// return true if you want to stop the event from propagating
export type EventCb = (
    name: string,
    widget: UIWidget | null,
    io?: GWU.io.Event
) => boolean; // | Promise<boolean>;

export interface UIWidget {
    readonly tag: string;
    readonly bounds: GWU.xy.Bounds;
    readonly depth: number;
    // readonly events: Record<string, EventCb[]>;
    // readonly action: string;

    parent: UIWidget | null;
    // readonly classes: string[];

    attr(name: string): string;
    attr(name: string, v: string): this;

    prop(name: string): PropType | undefined;
    prop(name: string, v: PropType): this;
    toggleProp(name: string): this;
    incProp(name: string): this;

    contains(e: GWU.xy.XY): boolean;
    contains(x: number, y: number): boolean;

    addClass(c: string): this;
    removeClass(c: string): this;
    hasClass(c: string): boolean;
    toggleClass(c: string): this;

    focused: boolean;
    hovered: boolean;
    hidden: boolean;

    draw(buffer: GWU.canvas.DataBuffer): void;

    mouseenter(e: GWU.io.Event): void;
    mousemove(e: GWU.io.Event): boolean;
    mouseleave(e: GWU.io.Event): void;
    click(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;

    on(event: string, cb: EventCb): this;
    off(event: string, cb?: EventCb): this;
}

export interface UILayer {
    readonly ui: UICore;
    readonly buffer: GWU.canvas.DataBuffer;
    readonly body: UIWidget;

    show(): void;
    hide(): void;

    draw(): void;

    // widgets
    addWidget(w: UIWidget): void;
    removeWidget(w: UIWidget): void;

    // events
    click(e: GWU.io.Event): boolean;
    mousemove(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;
}

export interface UICore {
    buffer: GWU.canvas.Buffer;
    loop: GWU.io.Loop;
    readonly width: number;
    readonly height: number;

    render(): void;

    startLayer(): GWU.canvas.Buffer;
    resetLayerBuffer(): void;
    finishLayer(): void;

    fadeTo(color?: GWU.color.ColorBase, duration?: number): Promise<void>;
    // getInputAt(
    //     x: number,
    //     y: number,
    //     maxLength: number,
    //     opts?: Widget.InputOptions
    // ): Promise<string>;
    // alert(opts: number | AlertOptions, text: string, args: any): Promise<void>;
}

export interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}
