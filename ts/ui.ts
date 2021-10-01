import * as GWU from 'gw-utils';
import { UICore } from './types';

export interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}

export interface GetInputOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;

    errorFg?: GWU.color.ColorBase;

    default?: string;
    minLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;
}

export class UI implements UICore {
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

    // assumes you are in a dialog and give the buffer for that dialog
    async getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts: GetInputOptions = {}
    ) {
        let defaultEntry = opts.default || '';
        let numbersOnly = opts.numbersOnly || false;

        const textEntryBounds = numbersOnly ? ['0', '9'] : [' ', '~'];

        const buffer = this.startDialog();
        maxLength = Math.min(maxLength, buffer.width - x);
        const minLength = opts.minLength || 1;

        let inputText = defaultEntry;
        let charNum = GWU.text.length(inputText);

        const fg = GWU.color.from(opts.fg || 'white');
        if (opts.bg) {
            const bg = GWU.color.from(opts.bg);
            buffer.fillRect(x, y, maxLength, 1, null, null, bg);
        }
        const errorFg = GWU.color.from(opts.errorFg || 'red');

        function isValid(text: string) {
            if (numbersOnly) {
                const val = Number.parseInt(text);
                if (opts.min && val < opts.min) return false;
                if (opts.max && val > opts.max) return false;
                return val > 0;
            }
            return text.length >= minLength;
        }

        let ev;
        do {
            buffer.render();

            ev = await this.loop.nextKeyPress(-1);
            if (!ev || !ev.key) continue;

            if ((ev.key == 'Delete' || ev.key == 'Backspace') && charNum > 0) {
                buffer.draw(x + charNum - 1, y, ' ', fg);
                charNum--;
                inputText = GWU.text.spliceRaw(inputText, charNum, 1);
            } else if (ev.key.length > 1) {
                // ignore other special keys...
            } else if (
                ev.key >= textEntryBounds[0] &&
                ev.key <= textEntryBounds[1]
            ) {
                // allow only permitted input
                if (charNum < maxLength) {
                    inputText += ev.key;
                    charNum++;
                }
            }

            const color = isValid(inputText) ? fg : errorFg;
            buffer.drawText(x, y, inputText, color);

            if (ev.key == 'Escape') {
                this.finishDialog();
                return '';
            }
        } while (!isValid(inputText) || !ev || ev.key != 'Enter');

        this.finishDialog();
        // GW.ui.draw(); // reverts to old display
        return inputText;
    }
}
