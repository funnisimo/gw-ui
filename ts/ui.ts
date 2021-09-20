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

    constructor(opts: Partial<UIOptions> = {}) {
        if (!opts.canvas) throw new Error('Need a canvas.');
        this.canvas = opts.canvas;
        this.buffer = opts.canvas.buffer;
        this.loop = opts.loop || GWU.loop;
    }

    render() {
        this.buffer.render();
    }

    startDialog(): GWU.canvas.Buffer {
        this.inDialog = true;
        const base = this.buffer || this.canvas.buffer;
        this.layers.push(base);
        this.buffer =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
        // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
        this.buffer.copy(base);
        return this.buffer;
    }

    resetDialogBuffer(dest: GWU.canvas.Buffer): void {
        const base = this.layers[this.layers.length - 1] || this.canvas.buffer;
        dest.copy(base);
    }

    finishDialog(): void {
        if (!this.inDialog) return;

        if (this.buffer !== this.canvas.buffer) {
            this.freeBuffers.push(this.buffer);
        }
        this.buffer = this.layers.pop() || this.canvas.buffer;
        this.buffer.render();

        this.inDialog = this.layers.length > 0;
    }
}
