import * as GWU from 'gw-utils';

export interface UIType {
    buffer: GWU.canvas.DataBuffer;
    loop: GWU.io.Loop;

    render(): void;

    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}
