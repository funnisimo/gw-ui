import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

export interface GetInputOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    errorFg?: GWU.color.ColorBase;

    hint?: string;
    hintFg?: GWU.color.ColorBase;

    default?: string;
    minLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;
}

export interface AlertOptions {
    duration?: number;
    waitForAck?: boolean;

    x?: number;
    y?: number;

    bg?: GWU.color.ColorBase;
    borderBg?: GWU.color.ColorBase;

    fg?: GWU.color.ColorBase;

    title?: string;
    titleFg?: GWU.color.ColorBase;

    width?: number;
    height?: number;
    padX?: number;
    padY?: number;
}

export interface ConfirmOptions extends GetInputOptions {
    x?: number;
    y?: number;

    allowCancel?: boolean;

    width?: number;
    height?: number;
    padX?: number;
    padY?: number;

    title?: string;
    titleFg?: GWU.color.ColorBase;

    borderBg?: GWU.color.ColorBase;

    ok?: string;
    cancel?: string;
    buttonFg?: GWU.color.ColorBase;
    buttonBg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
}

export interface InputBoxOptions extends GetInputOptions {
    x?: number;
    y?: number;

    allowCancel?: boolean;

    width?: number;
    height?: number;
    padX?: number;
    padY?: number;

    title?: string;
    titleFg?: GWU.color.ColorBase;

    borderBg?: GWU.color.ColorBase;

    ok?: string;
    cancel?: string;
    buttonFg?: GWU.color.ColorBase;
    buttonBg?: GWU.color.ColorBase;
    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
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
        opts?: GetInputOptions
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
