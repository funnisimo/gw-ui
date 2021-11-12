import * as GWU from 'gw-utils';
import { Layer } from './layer';
import * as Dialog from '../widget/dialog';

export interface AlertOptions extends Dialog.DialogOptions {
    duration?: number;
    waitForAck?: boolean;
    textClass?: string;
    opacity?: number;
}

// extend Layer

declare module './layer' {
    interface Layer {
        alert(opts: AlertOptions | number, text: string, args?: any): Layer;
    }
}

Layer.prototype.alert = function (
    opts: AlertOptions | number,
    text: string,
    args?: any
): Layer {
    if (typeof opts === 'number') {
        opts = { duration: opts } as AlertOptions;
    }

    if (args) {
        text = GWU.text.apply(text, args);
    }

    opts.class = opts.class || 'alert';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;

    const layer = this.ui.startNewLayer();

    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));

    // create the text widget
    const textWidget = layer
        .text(text, {
            id: 'TEXT',
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
        id: 'DIALOG',
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
        layer.finish(false);
    }, opts.duration || 3000);

    return layer;
};
