import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as Widget from './widget';

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

export interface AlertOptions extends Widget.WidgetOptions {
    duration?: number;
    waitForAck?: boolean;

    pad?: number;
    padX?: number;
    padY?: number;

    box?: Widget.BoxOptions;
}

export interface ConfirmOptions extends Widget.WidgetOptions {
    allowCancel?: boolean;

    pad?: number;
    padX?: number;
    padY?: number;

    buttons?: Widget.ButtonOptions;
    ok?: string | Widget.ButtonOptions;
    cancel?: string | Widget.ButtonOptions;

    box?: Widget.BoxOptions;
}

export interface InputBoxOptions extends ConfirmOptions {
    prompt?: string | Widget.TextOptions;
    input?: Widget.InputOptions;
}

export interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;

    render(): void;

    startLayer(): GWU.canvas.Buffer;
    resetLayerBuffer(): void;
    finishLayer(): void;

    fadeTo(color?: GWU.color.ColorBase, duration?: number): Promise<void>;
    getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts?: Widget.InputOptions
    ): Promise<string>;
    alert(opts: number | AlertOptions, text: string, args: any): Promise<void>;
}

export interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}
