import * as GWU from 'gw-utils';
import { UICore, GetInputOptions, AlertOptions } from './types';

export interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
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

    async fadeTo(color: GWU.color.ColorBase = 'black', duration = 1000) {
        color = GWU.color.from(color);
        const buffer = this.startDialog();

        let pct = 0;
        let elapsed = 0;

        while (elapsed < duration) {
            elapsed += 32;
            if (await this.loop.pause(32)) {
                elapsed = duration;
            }

            pct = Math.floor((100 * elapsed) / duration);

            this.resetDialogBuffer(buffer);
            buffer.mix(color, pct);
            buffer.render();
        }

        this.finishDialog();
    }

    async alert(opts: number | AlertOptions, text: string, args: any) {
        if (typeof opts === 'number') {
            opts = { duration: opts } as AlertOptions;
        }
        const buffer = this.startDialog();

        if (args) {
            text = GWU.text.apply(text, args);
        }

        let padX = opts.padX || 2;
        let padY = opts.padY || 1;

        if (opts.title) {
            padY = Math.max(padY, 2);
        }

        let lines = [text];
        if (text.includes('\n')) {
            lines = text.split('\n');
        }

        const lineLen = lines.reduce(
            (len, line) => Math.max(len, GWU.text.length(line)),
            0
        );
        const totalLength = lineLen + padX * 2;

        let width = totalLength + padX * 2;
        if (opts.width && opts.width > 0) {
            width = opts.width;
            if (opts.width < totalLength) {
                lines = GWU.text.splitIntoLines(text, opts.width - padX * 2);
            }
        }
        let height = Math.max(lines.length + 2 * padY, opts.height || 0);

        const x = opts.x ?? Math.min(Math.floor((buffer.width - width) / 2));
        const y = opts.y ?? Math.floor((buffer.height - height) / 2);

        const fg = GWU.color.from(opts.fg || 'white');

        if (opts.borderBg) {
            buffer.fillRect(x, y, width, height, 0, 0, opts.borderBg);
            buffer.fillRect(
                x + 1,
                y + 1,
                width - 2,
                height - 2,
                0,
                0,
                opts.bg || 'gray'
            );
        } else {
            buffer.fillRect(x, y, width, height, 0, 0, opts.bg || 'gray');
        }
        if (opts.title) {
            let tx = x + Math.floor((width - opts.title.length) / 2);
            buffer.drawText(tx, y, opts.title, opts.titleFg || fg);
        }
        lines.forEach((line, i) => {
            buffer.drawText(x + padX, y + padY + i, line, fg);
        });
        buffer.render();

        if (opts.waitForAck) {
            await this.loop.waitForAck();
        } else {
            await this.loop.pause(opts.duration || 30 * 1000);
        }

        this.finishDialog();
    }

    // assumes you are in a dialog and give the buffer for that dialog
    async getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts: GetInputOptions = {}
    ) {
        let numbersOnly = opts.numbersOnly || false;

        const textEntryBounds = numbersOnly ? ['0', '9'] : [' ', '~'];

        const buffer = this.startDialog();
        maxLength = Math.min(maxLength, buffer.width - x);
        const minLength = opts.minLength || 1;

        let inputText = opts.default || '';
        let charNum = GWU.text.length(inputText);

        const fg = GWU.color.from(opts.fg || 'white');
        const bg = GWU.color.from(opts.bg || 'dark_gray');
        const errorFg = GWU.color.from(opts.errorFg || 'red');
        const promptFg = opts.promptFg ? GWU.color.from(opts.promptFg) : 'gray';

        function isValid(text: string) {
            if (numbersOnly) {
                const val = Number.parseInt(text);
                if (opts.min !== undefined && val < opts.min) return false;
                if (opts.max !== undefined && val > opts.max) return false;
                return val > 0;
            }
            return text.length >= minLength;
        }

        let ev;
        do {
            buffer.fillRect(x, y, maxLength, 1, ' ', fg, bg);

            if (!inputText.length && opts.prompt && opts.prompt.length) {
                buffer.drawText(x, y, opts.prompt, promptFg);
            } else {
                const color = isValid(inputText) ? fg : errorFg;
                buffer.drawText(x, y, inputText, color);
            }

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
