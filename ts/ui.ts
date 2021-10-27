import * as GWU from 'gw-utils';
import { UICore } from './types';
import * as Widget from './widget';

export interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}

export interface AlertOptions extends Widget.WidgetOptions {
    duration?: number;
    waitForAck?: boolean;

    pad?: number;
    padX?: number;
    padY?: number;

    box?: Widget.BoxOptions;
}

export interface ConfirmOptions extends Widget.WidgetOptions {
    allowCancel?: boolean;

    pad?: number;
    padX?: number;
    padY?: number;

    buttons?: Widget.ButtonOptions;
    ok?: string | Widget.ButtonOptions;
    cancel?: string | Widget.ButtonOptions;

    box?: Widget.BoxOptions;
}

export interface InputBoxOptions extends ConfirmOptions {
    prompt?: string | Widget.TextOptions;
    input?: Widget.InputOptions;
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

    get width(): number {
        return this.canvas.width;
    }
    get height(): number {
        return this.canvas.height;
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
        this.buffer = this.freeBuffers.pop() || this.canvas.buffer.clone();
        // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
        this.buffer.copy(base);
        this.buffer.changed = false;
        return this.buffer;
    }

    resetLayerBuffer(): void {
        const base = this.baseBuffer;
        this.buffer.copy(base);
        this.buffer.changed = false; // So you have to draw something to make the canvas render...
    }

    finishLayer(): void {
        if (!this.inDialog) return;

        if (this.buffer !== this.canvas.buffer) {
            this.freeBuffers.push(this.buffer);
        }
        this.buffer = this.layers.pop() || this.canvas.buffer;
        this.buffer.changed = true;
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

            this.resetLayerBuffer();
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

        const width = opts.width || GWU.text.length(text);
        opts.box = opts.box || { bg: opts.bg };
        // opts.box.bg = opts.box.bg || 'gray';

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            x: 0,
            y: 0,
            wrap: width,
        };
        const textWidget = new Widget.Text('TEXT', textOpts);

        const height = textWidget.bounds.height;

        const dlg: Widget.Dialog = Widget.buildDialog(this, width, height)
            .with(textWidget, { x: 0, y: 0 })
            .addBox(opts.box)
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

        const width =
            opts.width ||
            Math.min(Math.floor(this.buffer.width / 2), GWU.text.length(text));

        const textOpts: Widget.TextOptions = {
            fg: opts.fg,
            text,
            wrap: width,
        };
        const textWidget = new Widget.Text('TEXT', textOpts);

        const height = textWidget.bounds.height + 2;

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

        const okOpts = Object.assign({}, opts.buttons, { text: 'OK' }, opts.ok);
        const cancelOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'CANCEL' },
            opts.cancel
        );

        const builder = Widget.buildDialog(this, width, height)
            .with(textWidget, { x: 0, y: 0 })
            .with(new Widget.Button('OK', okOpts), { x: 0, bottom: 0 });

        if (opts.allowCancel) {
            builder.with(new Widget.Button('CANCEL', cancelOpts), {
                right: 0,
                bottom: 0,
            });
        }

        const dlg: Widget.Dialog = builder.center().addBox(opts.box).done();

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
        const center = widget.bounds.x < 0 || widget.bounds.y < 0;

        const place = { x: widget.bounds.x, y: widget.bounds.y };
        const builder = Widget.buildDialog(this).with(widget, { x: 0, y: 0 });
        if (center) {
            builder.center();
        } else {
            builder.place(place.x, place.y);
        }
        const dlg = builder.done();

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

        const width =
            opts.width ||
            Math.min(
                Math.floor(this.buffer.width / 2),
                GWU.text.length(prompt)
            );

        const promptOpts: Widget.TextOptions = {
            fg: opts.fg,
            text: prompt,
            wrap: width,
        };
        const promptWidget = new Widget.Text('TEXT', promptOpts);

        const height =
            promptWidget.bounds.height +
            2 + // skip + input
            2; // skip + ok/cancel
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

        const okOpts = Object.assign({}, opts.buttons, { text: 'OK' }, opts.ok);
        const cancelOpts = Object.assign(
            {},
            opts.buttons,
            { text: 'CANCEL' },
            opts.cancel
        );

        opts.input = opts.input || {};
        opts.input.width = opts.input.width || width;
        opts.input.bg = opts.input.bg || opts.fg;
        opts.input.fg = opts.input.fg || opts.bg;

        const inputWidget = new Widget.Input('INPUT', opts.input || {});
        const builder = Widget.buildDialog(this, width, height)
            .with(promptWidget, { x: 0, y: 0 })
            .with(inputWidget, { bottom: 2, x: 0 })
            .with(new Widget.Button('OK', okOpts), { bottom: 0, x: 0 })
            .addBox(opts.box);

        if (opts.allowCancel) {
            builder.with(new Widget.Button('CANCEL', cancelOpts), {
                bottom: 0,
                right: 0,
            });
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
