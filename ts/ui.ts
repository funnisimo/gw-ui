import * as GWU from 'gw-utils';
import { UIType } from './types';

export interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}

export class UI implements UIType {
    buffer: GWU.canvas.Buffer;
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;

    layers: GWU.canvas.Buffer[] = [];
    freeBuffers: GWU.canvas.Buffer[] = [];

    inDialog = false;
    overlay: GWU.canvas.Buffer | null = null;

    constructor(opts: Partial<UIOptions> = {}) {
        if (!opts.canvas) throw new Error('Need a canvas.');
        this.canvas = opts.canvas;
        this.buffer = opts.canvas.buffer;
        this.loop = opts.loop || GWU.loop;
    }

    startDialog(): GWU.canvas.Buffer {
        this.inDialog = true;
        const base = this.overlay || this.buffer;
        this.layers.push(base);
        this.overlay =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
        // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
        this.overlay.copy(base);
        return this.overlay;
    }

    resetDialogBuffer(dest: GWU.canvas.Buffer): void {
        const base = this.layers[this.layers.length - 1] || this.buffer;
        dest.copy(base);
    }

    finishDialog(): void {
        if (!this.inDialog) return;

        if (this.overlay) {
            this.freeBuffers.push(this.overlay);
        }
        this.overlay = this.layers.pop() || this.buffer;
        this.overlay.render();

        this.inDialog = this.layers.length > 0;
    }
}
