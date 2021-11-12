import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Dialog from '../widget/dialog';

export interface AlertOptions extends Dialog.DialogOptions {
    duration?: number;
    waitForAck?: boolean;
    textClass?: string;
    opacity?: number;
}

// extend Layer

declare module '../layer' {
    interface Layer {
        alert(
            opts: AlertOptions | number,
            text: string,
            args?: any
        ): Promise<boolean>;
    }
}

Layer.prototype.alert = function (
    opts: AlertOptions | number,
    text: string,
    args?: any
): Promise<boolean> {
    if (typeof opts === 'number') {
        opts = { duration: opts } as AlertOptions;
    }

    if (args) {
        text = GWU.text.apply(text, args);
    }

    opts.class = opts.class || 'alert';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;

    // const width = opts.width || GWU.text.length(text);

    const layer = this.ui.startNewLayer();

    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));

    // create the text widget
    const textWidget = layer
        .text(text, {
            class: opts.textClass || opts.class,
            width: opts.width,
            height: opts.height,
        })
        .center();

    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height,
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
    });
    const dialog = layer.dialog(opts);
    textWidget.setParent(dialog);

    layer.on('click', () => {
        layer.finish(true);
        return true;
    });

    layer.on('keypress', () => {
        layer.finish(true);
        return true;
    });

    layer.setTimeout(() => {
        layer.finish(true);
    }, opts.duration || 3000);

    // const textOpts: Widget.TextOptions = {
    //     fg: opts.fg,
    //     text,
    //     x: 0,
    //     y: 0,
    //     wrap: width,
    // };
    // const textWidget = new Widget.Text('TEXT', textOpts);

    // const height = textWidget.bounds.height;

    // const dlg: Widget.Dialog = Widget.buildDialog(this, width, height)
    //     .with(textWidget, { x: 0, y: 0 })
    //     .addBox(opts.box)
    //     .center()
    //     .done();

    // dlg.setEventHandlers({
    //     click: () => dlg.close(true),
    //     keypress: () => dlg.close(true),
    //     TIMEOUT: () => dlg.close(false),
    // });

    // if (!opts.waitForAck) {
    //     dlg.setTimeout('TIMEOUT', opts.duration || 3000);
    // }

    // return await dlg.show();

    return layer.promise;
};
