import * as GWU from 'gw-utils';
import { Layer } from './layer';
import '../widget/button';
import * as Dialog from '../widget/dialog';

export interface ConfirmOptions
    extends Omit<Dialog.DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;

    textClass?: string;
    opacity?: number;

    buttonWidth?: number;

    ok?: string;
    okClass?: string;

    cancel?: boolean | string;
    cancelClass?: string;
}

// extend Layer

declare module './layer' {
    interface Layer {
        confirm(text: string, args?: any): Layer;
        confirm(opts: ConfirmOptions, text: string, args?: any): Layer;
    }
}

Layer.prototype.confirm = function (
    opts: ConfirmOptions | string,
    text?: string | any,
    args?: any
): Layer {
    if (typeof opts === 'string') {
        args = text;
        text = opts;
        opts = {};
    }
    if (args) {
        text = GWU.text.apply(text!, args);
    }

    opts.class = opts.class || 'confirm';
    opts.border = opts.border || 'ascii';
    opts.pad = opts.pad || 1;

    const layer = this.ui.startNewLayer();

    // Fade the background
    const opacity = opts.opacity !== undefined ? opts.opacity : 50;
    layer.body.style().set('bg', GWU.color.BLACK.alpha(opacity));

    if (opts.cancel === undefined) {
        opts.cancel = 'Cancel';
    } else if (opts.cancel === true) {
        opts.cancel = 'Cancel';
    } else if (!opts.cancel) {
        opts.cancel = '';
    }

    opts.ok = opts.ok || 'Ok';

    let buttonWidth = opts.buttonWidth || 0;
    if (!buttonWidth) {
        buttonWidth = Math.max(opts.ok.length, opts.cancel.length);
    }

    const width = Math.max(opts.width || 0, buttonWidth * 2 + 2);

    // create the text widget
    const textWidget = layer
        .text(text!, {
            class: opts.textClass || opts.class,
            width: width,
            height: opts.height,
        })
        .center();

    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height + 2, // for buttons
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
        tag: 'confirm',
    });
    const dialog = layer.dialog(opts as Dialog.DialogOptions);
    textWidget.setParent(dialog);

    layer
        .button(opts.ok, {
            class: opts.okClass || opts.class,
            width: buttonWidth,
            id: 'OK',
            parent: dialog,
            x: dialog._innerLeft + dialog._innerWidth - buttonWidth,
            y: dialog._innerTop + dialog._innerHeight - 1,
        })
        .on('click', () => {
            layer.finish(true);
            return true;
        });

    if (opts.cancel.length) {
        layer
            .button(opts.cancel, {
                class: opts.cancelClass || opts.class,
                width: buttonWidth,
                id: 'CANCEL',
                parent: dialog,
                x: dialog._innerLeft,
                y: dialog._innerTop + dialog._innerHeight - 1,
            })
            .on('click', () => {
                layer.finish(false);
                return true;
            });
    }

    layer.on('keypress', (_n, _w, e) => {
        if (e.key === 'Escape') {
            layer.finish(false);
        } else if (e.key === 'Enter') {
            layer.finish(true);
        }
        return true;
    });

    return layer;
};
