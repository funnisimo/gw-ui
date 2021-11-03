import { Layer } from '../layer';
import * as Border from './border';
import * as Text from './text';
import * as Widget from './widget';

export interface FieldsetOptions extends Widget.WidgetOptions {
    width?: number;
    height?: number;

    ascii?: boolean;

    legend?: string;
    legendTag?: string;
    legendClass?: string;
}

export class Fieldset extends Border.Border {
    static default = {
        legendTag: 'legend',
        legendClass: 'legend',
    };

    _fixedWidth = false;
    _fixedHeight = false;
    legend: Widget.Widget | null = null;

    constructor(layer: Layer, opts: FieldsetOptions) {
        super(
            layer,
            (() => {
                const bopts = Object.assign({}, opts) as Border.BorderOptions;
                if (!bopts.height) bopts.height = 4;
                if (!bopts.width) bopts.width = 4;

                bopts.tag = bopts.tag || 'fieldset';
                return bopts as Border.BorderOptions;
            })()
        );
        this._addLegend(opts);
        this._fixedHeight = !!opts.height;
        this._fixedWidth = !!opts.width;
    }

    _addLegend(opts: FieldsetOptions): this {
        if (!opts.legend) return this;

        this.legend = new Text.Text(this.layer, {
            text: opts.legend,
            x: this.bounds.x + 2,
            y: this.bounds.y,
            depth: this.depth + 1,
            tag: opts.legendTag || Fieldset.default.legendTag,
            class: opts.legendClass || Fieldset.default.legendClass,
        });
        if (this.bounds.width < this.legend.bounds.width + 4) {
            this.bounds.width = this.legend.bounds.width + 4;
        }

        this.legend.setParent(this);
        this.layer.attach(this.legend);
        return this;
    }

    _addChild(w: Widget.Widget, opts: Widget.SetParentOptions = {}): this {
        if (w !== this.legend) {
            w.bounds.x = this.bounds.x + 2;
            if (!this._fixedHeight) {
                w.bounds.y = this.bounds.bottom - 2;
                this.bounds.height += w.bounds.height;
            }
            if (this._fixedWidth) {
                w.bounds.width = Math.min(
                    w.bounds.width,
                    this.bounds.width - 4
                );
            } else if (w.bounds.width > this.bounds.width - 4) {
                this.bounds.width = w.bounds.width + 4;
            }
        }

        return super._addChild(w, opts);
    }
}

// extend Layer

export type AddFieldsetOptions = FieldsetOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        fieldset(opts?: AddFieldsetOptions): Fieldset;
    }
}
Layer.prototype.fieldset = function (opts: AddFieldsetOptions = {}): Fieldset {
    const options = Object.assign({}, this._opts, opts) as FieldsetOptions;
    const widget = new Fieldset(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};
