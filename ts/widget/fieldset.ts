import * as GWU from 'gw-utils';
import { Layer } from '../ui/layer';
import * as Text from './text';
import * as Widget from './widget';
import * as Dialog from './dialog';
import { BorderType } from './datatable';
import { DialogOptions } from '.';

export interface FieldsetOptions
    extends Omit<Dialog.DialogOptions, 'width' | 'height'> {
    width?: number;
    height?: number;
    dataWidth: number;
    separator?: string;

    labelTag?: string;
    labelClass?: string;

    dataTag?: string;
    dataClass?: string;
}

export class Fieldset extends Dialog.Dialog {
    static default = {
        tag: 'fieldset',
        border: 'none' as BorderType,
        separator: ' : ',
        pad: false,

        legendTag: 'legend',
        legendClass: 'legend',
        legendAlign: 'left' as GWU.text.Align,

        labelTag: 'label',
        labelClass: '',

        dataTag: 'field',
        dataClass: '',
    };

    fields: Field[] = [];

    constructor(layer: Layer, opts: FieldsetOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || Fieldset.default.tag;
                opts.border = opts.border || Fieldset.default.border;
                opts.legendTag = opts.legendTag || Fieldset.default.legendTag;
                opts.legendClass =
                    opts.legendClass || Fieldset.default.legendClass;
                opts.legendAlign =
                    opts.legendAlign || Fieldset.default.legendAlign;
                opts.width = opts.width || 0;
                opts.height = opts.height || 0;
                return opts as Dialog.DialogOptions;
            })()
        );
        this.attr('separator', opts.separator || Fieldset.default.separator);

        this.attr('dataTag', opts.dataTag || Fieldset.default.dataTag);
        this.attr('dataClass', opts.dataClass || Fieldset.default.dataClass);
        this.attr('dataWidth', opts.dataWidth);

        this.attr('labelTag', opts.labelTag || Fieldset.default.labelTag);
        this.attr('labelClass', opts.labelClass || Fieldset.default.labelClass);
        this.attr('labelWidth', this._innerWidth - opts.dataWidth);

        this._addLegend(opts as DialogOptions);
    }

    _adjustBounds(pad: [number, number, number, number]): this {
        this.bounds.width = Math.max(this.bounds.width, pad[1] + pad[3]);
        this.bounds.height = Math.max(this.bounds.height, pad[0] + pad[2]);
        return this;
    }

    get _labelLeft(): number {
        const border = this._attrStr('border');
        const padLeft = this._attrInt('padLeft');
        return this.bounds.x + padLeft + (border === 'none' ? 0 : 1);
    }

    get _dataLeft(): number {
        return this._labelLeft + this._attrInt('labelWidth');
    }

    get _nextY(): number {
        const border = this._attrStr('border');
        const padBottom = this._attrInt('padBottom');
        return this.bounds.bottom - (border === 'none' ? 0 : 1) - padBottom;
    }

    add(label: string, format: string | FieldOptions): this {
        const sep = this._attrStr('separator');
        const labelText =
            GWU.text.padEnd(
                label,
                this._attrInt('labelWidth') - sep.length,
                ' '
            ) + sep;

        this.layer.text(labelText, {
            x: this._labelLeft,
            y: this._nextY,
            width: this._attrInt('labelWidth'),
            tag: this._attrStr('labelTag'),
            class: this._attrStr('labelClass'),
        });

        if (typeof format === 'string') {
            format = { format };
        }
        format.x = this._dataLeft;
        format.y = this._nextY;
        format.width = this._attrInt('dataWidth');
        format.tag = format.tag || this._attrStr('dataTag');
        format.class = format.class || this._attrStr('dataClass');

        const field = new Field(this.layer, format);
        field.setParent(this);
        this.bounds.height += 1;
        this.fields.push(field);
        return this;
    }

    data(d: any): this {
        this.fields.forEach((f) => f.data(d));
        this.layer.needsDraw = true;
        return this;
    }
}

// extend Layer

export type AddFieldsetOptions = FieldsetOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../ui/layer' {
    interface Layer {
        fieldset(opts?: AddFieldsetOptions): Fieldset;
    }
}
Layer.prototype.fieldset = function (opts: AddFieldsetOptions): Fieldset {
    const options = Object.assign({}, this._opts, opts) as FieldsetOptions;
    const widget = new Fieldset(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

///////////////////////////////
// FIELD

export interface FieldOptions extends Widget.WidgetOptions {
    format: string | GWU.text.Template;
}

export class Field extends Text.Text {
    _format: GWU.text.Template;

    constructor(layer: Layer, opts: FieldOptions) {
        super(
            layer,
            (() => {
                // @ts-ignore
                const topts: Text.TextOptions = opts;
                topts.tag = topts.tag || 'field';
                topts.text = '';
                return topts;
            })()
        );

        if (typeof opts.format === 'string') {
            this._format = GWU.text.compile(opts.format);
        } else {
            this._format = opts.format;
        }
    }

    data(v: any): this {
        const t = this._format(v) || '';
        return this.text(t);
    }
}
