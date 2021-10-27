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

export interface UIWidget {}

export interface UILayer {
    addWidget(w: UIWidget): void;
    removeWidget(w: UIWidget): void;

    readonly ui: UICore;
    readonly buffer: GWU.canvas.DataBuffer;

    show(): void;
    hide(): void;

    draw(): void;

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
