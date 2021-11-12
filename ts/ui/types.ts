import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import { Selector } from './selector';

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

export type PrefixType = 'none' | 'letter' | 'number' | 'bullet';

export type PropType = string | number | boolean;

export interface UIStyle {
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

export interface StyleOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}

export interface UISelectable {
    readonly tag: string;
    readonly classes: string[];
    children: UISelectable[];
    attr(name: string): PropType | undefined;
    prop(name: string): PropType | undefined;
    parent: UISelectable | null;
}

export interface UIStylable extends UISelectable {
    style(): UIStyle;
}

// export interface UIStylesheet {
//     dirty: boolean;
//     add(selector: string, props: StyleOptions): this;
//     get(selector: string): UIStyle | null;
//     remove(selector: string): void;
//     computeFor(widget: UIStylable): UIStyle;
// }

// export interface UIWidget extends UISelectable {
//     readonly layer: UILayer;
//     readonly tag: string;
//     readonly bounds: GWU.xy.Bounds;
//     readonly depth: number;
//     readonly classes: string[];

//     parent: UIWidget | null;
//     children: UIWidget[];
//     addChild(c: UIWidget): this;
//     removeChild(c: UIWidget): this;

//     style(): UIStyle;

//     text(): string;
//     text(v: string): this;

//     attr(name: string): PropType;
//     attr(name: string, v: PropType): this;

//     prop(name: string): PropType | undefined;
//     prop(name: string, v: PropType): this;
//     toggleProp(name: string): this;
//     incProp(name: string): this;

//     contains(e: GWU.xy.XY): boolean;
//     contains(x: number, y: number): boolean;

//     addClass(c: string): this;
//     removeClass(c: string): this;
//     hasClass(c: string): boolean;
//     toggleClass(c: string): this;

//     readonly focused: boolean;
//     hovered: boolean;
//     hidden: boolean;

//     focus(reverse: boolean): void;
//     blur(): void;

//     updateStyle(): void;
//     draw(buffer: GWU.buffer.Buffer): void;

//     mouseenter(e: GWU.io.Event): void;
//     mousemove(e: GWU.io.Event): boolean;
//     mouseleave(e: GWU.io.Event): void;
//     click(e: GWU.io.Event): boolean;
//     keypress(e: GWU.io.Event): boolean;
//     dir(e: GWU.io.Event): boolean;
//     tick(e: GWU.io.Event): boolean;

//     on(event: string, cb: EventCb): this;
//     off(event: string, cb?: EventCb): this;
// }

export interface UILayer {
    // readonly ui: UICore;
    readonly buffer: GWU.canvas.Buffer;
    // readonly body: UIWidget;
    // readonly styles: UIStylesheet;

    readonly width: number;
    readonly height: number;

    // fadeTo(color?: GWU.color.ColorBase, duration?: number): void;

    // Focus
    // setFocusWidget(w: UIWidget | null, reverse?: boolean): void;
    // nextTabStop(): boolean;
    // prevTabStop(): boolean;

    // widgets
    // create(tag: string, opts: Record<string, any>): UIWidget;
    // addWidget(w: UIWidget): void;
    // removeWidget(w: UIWidget): void;

    // run
    finish(result?: any): void;

    // events
    click(e: GWU.io.Event): boolean;
    mousemove(e: GWU.io.Event): boolean;
    keypress(e: GWU.io.Event): boolean;
    dir(e: GWU.io.Event): boolean;
    tick(e: GWU.io.Event): boolean;

    // draw
    draw(): void;
    needsDraw: boolean;
}

export interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}
