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

        opts.width = opts.width || GWU.text.length(text) + 2 * padX;

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            x: padX,
            y: padY,
            wrap: opts.width - 2 * padX,
        };
        textOpts.text = text;
        textOpts.wrap = opts.width;

        const textWidget = new Widget.Text('TEXT', textOpts);

        opts.height =
            (opts.title ? 1 : 0) + padY + textWidget.bounds.height + padY;

        const dlg: Widget.Dialog = Widget.buildDialog(this, opts)
            .with(textWidget)
            .center()
            .done();

        dlg.setEventHandlers({
            click: () => dlg.close(true),
            keypress: () => dlg.close(true),
            TIMEOUT: () => dlg.close(false),
        });

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
                GWU.text.length(text) + 2 * padX
            );
        let textWidth = opts.width - 2 * padX;

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            wrap: textWidth,
            y: opts.title ? 2 : 1,
            x: padX,
        };
        const textWidget = new Widget.Text('TEXT', textOpts);

        opts.height =
            (opts.title ? 1 : 0) + padY + textWidget.bounds.height + 2 + padY;
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

        dlg.setEventHandlers({
            OK() {
                dlg.close(true);
            },
            CANCEL() {
                dlg.close(false);
            },
            Escape() {
                dlg.close(false);
            },
            Enter() {
                dlg.close(true);
            },
        });

        return await dlg.show();
    }

    async showWidget(widget: Widget.Widget, keymap: Widget.EventHandlers = {}) {
        if (widget.bounds.x < 0) {
            widget.bounds.x = Math.floor(
                (this.buffer.width - widget.bounds.width) / 2
            );
        }
        if (widget.bounds.y < 0) {
            widget.bounds.y = Math.floor(
                (this.buffer.height - widget.bounds.height) / 2
            );
        }
        const dlg = new Widget.Dialog(this, {
            width: widget.bounds.width,
            height: widget.bounds.height,
            widgets: [widget],
            x: widget.bounds.x,
            y: widget.bounds.y,
        });

        keymap.Escape =
            keymap.Escape ||
            (() => {
                dlg.close(false);
            });
        dlg.setEventHandlers(keymap);

        return await dlg.show();
    }

    // assumes you are in a dialog and give the buffer for that dialog
    async getInputAt(
        x: number,
        y: number,
        maxLength: number,
        opts: Widget.InputOptions = {}
    ): Promise<string> {
        opts.width = maxLength;
        opts.x = x;
        opts.y = y;
        const widget = new Widget.Input('INPUT', opts);

        return this.showWidget(widget, {
            INPUT(_e, dlg) {
                dlg.close(widget.text);
            },
            Escape(_e, dlg) {
                dlg.close('');
            },
        });
    }

    async inputBox(opts: InputBoxOptions, prompt: string, args?: any) {
        if (args) {
            prompt = GWU.text.apply(prompt, args);
        }

        const padX = opts.padX || opts.pad || 1;
        const padY = opts.padY || opts.pad || 1;

        opts.width =
            opts.width ||
            Math.min(
                Math.floor(this.buffer.width / 2),
                GWU.text.length(prompt) + 2 * padX
            );
        let promptWidth = opts.width - 2 * padX;

        const promptOpts: Widget.TextOptions = {
            fg: opts.fg,
            text: prompt,
            wrap: promptWidth,
            x: padX,
            y: (opts.title ? 1 : 0) + padY,
        };
        const promptWidget = new Widget.Text('TEXT', promptOpts);

        opts.height =
            (opts.title ? 1 : 0) +
            padY +
            promptWidget.bounds.height +
            3 +
            1 +
            padY;
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
        opts.input.x = padX;
        opts.input.y = opts.height - 1 - padY - 2;

        const inputWidget = new Widget.Input('INPUT', opts.input || {});
        const builder = Widget.buildDialog(this, opts)
            .with(promptWidget)
            .with(inputWidget)
            .with(new Widget.Button('OK', okOpts));

        if (opts.allowCancel) {
            builder.with(new Widget.Button('CANCEL', cancelOpts));
        }

        const dlg: Widget.Dialog = builder.center().done();

        dlg.setEventHandlers({
            OK() {
                dlg.close(inputWidget.text);
            },
            CANCEL() {
                dlg.close('');
            },
            Escape() {
                dlg.close('');
            },
            INPUT() {
                dlg.close(inputWidget.text);
            },
        });

        return await dlg.show();
    }
}
