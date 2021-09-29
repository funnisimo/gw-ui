import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

export interface UICore {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;

    render(): void;

    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}

export interface UISubject {
    readonly map: GWM.map.Map;
    readonly x: number;
    readonly y: number;
    readonly fov?: GWU.fov.FovTracker;
    readonly memory?: GWM.memory.Memory;
}
