import * as GWU from 'gw-utils';

export interface UIType {
    buffer: GWU.canvas.Buffer;
    loop: GWU.io.Loop;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}
