import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

export interface GetInputOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;

    errorFg?: GWU.color.ColorBase;
    promptFg?: GWU.color.ColorBase;

    prompt?: string;
    default?: string;
    minLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;
}

export interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;

    render(): void;

    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;

    getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts?: GetInputOptions
    ): Promise<string>;
}

export interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}
