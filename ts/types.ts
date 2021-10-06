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

export interface AlertOptions extends Widget.DialogOptions {
    duration?: number;
    waitForAck?: boolean;
}

export interface ConfirmOptions extends Widget.DialogOptions {
    allowCancel?: boolean;

    buttons?: Widget.ButtonOptions;
    ok?: string | Widget.ButtonOptions;
    cancel?: string | Widget.ButtonOptions;
}

export interface InputBoxOptions extends ConfirmOptions {
    prompt?: string | Widget.TextOptions;
    input?: Widget.InputOptions;
}

export interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;

    render(): void;

    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;

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
