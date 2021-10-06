import * as GWU from 'gw-utils';
import { UICore, AlertOptions, ConfirmOptions, InputBoxOptions } from './types';
import * as Widget from './widget';

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

    get baseBuffer(): GWU.canvas.Buffer {
        return this.layers[this.layers.length - 1] || this.canvas.buffer;
    }

    get canvasBuffer(): GWU.canvas.Buffer {
        return this.canvas.buffer;
    }

    startLayer(): GWU.canvas.Buffer {
        this.inDialog = true;
        const base = this.buffer || this.canvas.buffer;
        this.layers.push(base);
        this.buffer =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
        // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
        this.buffer.copy(base);
        return this.buffer;
    }

    resetLayerBuffer(dest: GWU.canvas.Buffer): void {
        const base = this.layers[this.layers.length - 1] || this.canvas.buffer;
        dest.copy(base);
    }

    finishLayer(): void {
        if (!this.inDialog) return;

        if (this.buffer !== this.canvas.buffer) {
            this.freeBuffers.push(this.buffer);
        }
        this.buffer = this.layers.pop() || this.canvas.buffer;
        this.buffer.render();

        this.inDialog = this.layers.length > 0;
    }

    // UTILITY FUNCTIONS

    async fadeTo(color: GWU.color.ColorBase = 'black', duration = 1000) {
        color = GWU.color.from(color);
        const buffer = this.startLayer();

        let pct = 0;
        let elapsed = 0;

        while (elapsed < duration) {
            elapsed += 32;
            if (await this.loop.pause(32)) {
                elapsed = duration;
            }

            pct = Math.floor((100 * elapsed) / duration);

            this.resetLayerBuffer(buffer);
            buffer.mix(color, pct);
            buffer.render();
        }

        this.finishLayer();
    }

    async alert(opts: number | AlertOptions, text: string, args: any) {
        if (typeof opts === 'number') {
            opts = { duration: opts } as AlertOptions;
        }

        if (args) {
            text = GWU.text.apply(text, args);
        }

        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;
        opts.width = opts.width || GWU.text.length(text) + padX * 2;

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            x: padX,
            y: padY,
            wrap: opts.width - 2 * padX,
        };
        textOpts.text = text;
        textOpts.wrap = opts.width;

        const dlg: Widget.Dialog = Widget.buildDialog(this, opts)
            .with(new Widget.Text('TEXT', textOpts))
            .center()
            .done();

        dlg.setClickHandlers({ click: () => dlg.close(true) }); // any click
        dlg.setKeyHandlers({ keypress: () => dlg.close(true) }); // any key
        dlg.setActionHandlers({ TIMEOUT: () => dlg.close(false) });

        if (!opts.waitForAck) {
            dlg.setTimeout('TIMEOUT', opts.duration || 3000);
        }

        return await dlg.show();
    }

    async confirm(text: string, args?: any): Promise<boolean>;
    async confirm(
        opts: ConfirmOptions,
        text: string,
        args?: any
    ): Promise<boolean>;
    async confirm(...args: any[]): Promise<boolean> {
        let opts: ConfirmOptions;
        let text: string;
        let textArgs: any = null;
        if (args.length <= 2 && typeof args[0] === 'string') {
            opts = {};
            text = args[0];
            textArgs = args[1] || null;
        } else {
            opts = args[0];
            text = args[1];
            textArgs = args[2] || null;
        }

        if (textArgs) {
            text = GWU.text.apply(text, textArgs);
        }

        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;

        opts.width =
            opts.width ||
            Math.min(
                Math.floor(this.buffer.width / 2),
                GWU.text.length(text) + padX * 2
            );
        let textWidth = opts.width - padX * 2;

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            wrap: textWidth,
        };
        const textWidget = new Widget.Text('TEXT', textOpts);

        opts.height = textWidget.bounds.height + 2 * padY + 2;
        opts.allowCancel = opts.allowCancel !== false;
        opts.buttons = Object.assign(
            {
                fg: 'white',
                activeFg: 'teal',
                bg: 'dark_gray',
                activeBg: 'darkest_gray',
            },
            opts.buttons || {}
        );
        if (typeof opts.ok === 'string') {
            opts.ok = { text: opts.ok };
        }
        if (typeof opts.cancel === 'string') {
            opts.cancel = { text: opts.cancel };
        }
        opts.ok = opts.ok || {};
        opts.cancel = opts.cancel || {};

        const okOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'OK', y: -padY, x: padX },
            opts.ok
        );
        const cancelOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'CANCEL', y: -padY, x: -padX },
            opts.cancel
        );

        const builder = Widget.buildDialog(this, opts)
            .with(textWidget)
            .with(new Widget.Button('OK', okOpts));

        if (opts.allowCancel) {
            builder.with(new Widget.Button('CANCEL', cancelOpts));
        }

        const dlg: Widget.Dialog = builder.center().done();

        dlg.setClickHandlers({
            OK() {
                dlg.close(true);
            },
            CANCEL() {
                dlg.close(false);
            },
        });
        dlg.setKeyHandlers({
            Escape() {
                dlg.close(false);
            },
            Enter() {
                dlg.close(true);
            },
        });

        return await dlg.show();
    }

    // assumes you are in a dialog and give the buffer for that dialog
    async getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts: Widget.InputOptions = {}
    ) {
        opts.width = maxLength;
        opts.x = x;
        opts.y = y;
        const widget = new Widget.Input('INPUT', opts);

        const buffer = this.startLayer();

        await this.loop.run({
            Enter: () => {
                return true; // done
            },
            Escape: () => {
                widget.text = '';
                return true; // done
            },
            keypress: (e) => {
                widget.keypress(e, this);
            },
            draw() {
                widget.draw(buffer);
                buffer.render();
            },
        });

        this.finishLayer();

        return widget.text;
    }

    async inputBox(opts: InputBoxOptions, prompt: string, args?: any) {
        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;

        if (args) {
            prompt = GWU.text.apply(prompt, args);
        }

        opts.width =
            opts.width ||
            Math.min(
                Math.floor(this.buffer.width / 2),
                GWU.text.length(prompt) + padX * 2
            );
        let promptWidth = opts.width - padX * 2;

        const promptOpts: Widget.TextOptions = {
            fg: opts.fg,
            text: prompt,
            wrap: promptWidth,
        };
        const promptWidget = new Widget.Text('TEXT', promptOpts);

        opts.height = promptWidget.bounds.height + 2 * padY + 4;
        opts.allowCancel = opts.allowCancel !== false;
        opts.buttons = Object.assign(
            {
                fg: 'white',
                activeFg: 'teal',
                bg: 'dark_gray',
                activeBg: 'darkest_gray',
            },
            opts.buttons || {}
        );
        if (typeof opts.ok === 'string') {
            opts.ok = { text: opts.ok };
        }
        if (typeof opts.cancel === 'string') {
            opts.cancel = { text: opts.cancel };
        }
        opts.ok = opts.ok || {};
        opts.cancel = opts.cancel || {};

        const okOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'OK', y: -padY, x: padX },
            opts.ok
        );
        const cancelOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'CANCEL', y: -padY, x: -padX },
            opts.cancel
        );

        opts.input = opts.input || {};
        opts.input.width = opts.input.width || promptWidth;
        opts.input.bg = opts.input.bg || opts.fg;
        opts.input.fg = opts.input.fg || opts.bg;

        const inputWidget = new Widget.Input('INPUT', opts.input || {});
        const builder = Widget.buildDialog(this, opts)
            .with(promptWidget)
            .with(inputWidget)
            .with(new Widget.Button('OK', okOpts));

        if (opts.allowCancel) {
            builder.with(new Widget.Button('CANCEL', cancelOpts));
        }

        const dlg: Widget.Dialog = builder.center().done();

        dlg.setClickHandlers({
            OK() {
                dlg.close(inputWidget.text);
            },
            CANCEL() {
                dlg.close('');
            },
        });
        dlg.setKeyHandlers({
            Escape() {
                dlg.close('');
            },
            Enter() {
                dlg.close(inputWidget.text);
            },
        });

        return await dlg.show();
    }
}
