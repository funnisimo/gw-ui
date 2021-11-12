import * as GWU from 'gw-utils';
import { Layer } from './layer';
import '../widget/button';
import * as Dialog from '../widget/dialog';

export interface InputBoxOptions
    extends Omit<Dialog.DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;

    textClass?: string;
    opacity?: number;

    buttonWidth?: number;

    label?: string;
    labelClass?: string;

    default?: string;
    placeholder?: string;
    inputClass?: string;

    minLength?: number;
    maxLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;
}

// extend Layer

declare module './layer' {
    interface Layer {
        inputbox(text: string, args?: any): Layer;
        inputbox(opts: InputBoxOptions, text: string, args?: any): Layer;
    }
}

Layer.prototype.inputbox = function (
    opts: InputBoxOptions | string,
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

    // create the text widget
    const textWidget = layer
        .text(text!, {
            class: opts.textClass || opts.class,
            width: opts.width,
            height: opts.height,
        })
        .center();

    Object.assign(opts, {
        width: textWidget.bounds.width,
        height: textWidget.bounds.height + 2, // for input
        x: textWidget.bounds.x,
        y: textWidget.bounds.y,
        tag: 'inputbox',
    });
    const dialog = layer.dialog(opts as Dialog.DialogOptions);
    textWidget.setParent(dialog);

    let width = dialog._innerWidth;
    let x = dialog._innerLeft;
    if (opts.label) {
        const label = layer.text(opts.label, {
            class: opts.labelClass || opts.class,
            tag: 'label',
            parent: dialog,
            x,
            y: dialog._innerTop + dialog._innerHeight - 1,
        });

        x += label.bounds.width + 1;
        width -= label.bounds.width + 1;
    }

    layer
        .input({
            class: opts.inputClass || opts.class,
            width,
            id: 'INPUT',
            parent: dialog,
            x,
            y: dialog._innerTop + dialog._innerHeight - 1,
        })
        .on('INPUT', (_n, w, _e) => {
            w && layer.finish(w.text());
            return true;
        });

    layer.on('keypress', (_n, _w, e) => {
        if (e.key === 'Escape') {
            layer.finish(null);
            return true;
        }
        return false;
    });

    return layer;
};
