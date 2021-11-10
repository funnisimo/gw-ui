import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Text from './text';
import * as Widget from './widget';
import { BorderType } from './datatable';
import { drawBorder } from './border';

export interface FieldsetOptions extends Widget.WidgetOptions {
    width: number;
    dataWidth: number;
    border?: BorderType;
    separator?: string;

    legend?: string;
    legendTag?: string;
    legendClass?: string;
    legendAlign?: GWU.text.Align;

    labelTag?: string;
    labelClass?: string;

    dataTag?: string;
    dataClass?: string;
}

export class Fieldset extends Widget.Widget {
    static default = {
        tag: 'fieldset',
        border: 'none' as BorderType,
        separator: ':',

        legendTag: 'legend',
        legendClass: 'legend',
        legendAlign: 'left' as GWU.text.Align,

        labelTag: 'label',
        labelClass: '',

        dataTag: 'field',
        dataClass: '',
    };

    legend: Widget.Widget | null = null;
    fields: Field[] = [];

    constructor(layer: Layer, opts: FieldsetOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || Fieldset.default.tag;
                const border = opts.border || Fieldset.default.border;
                if (border !== 'none') {
                    opts.height = opts.height || 2;
                }
                return opts;
            })()
        );
        const border = opts.border || Fieldset.default.border;
        this.attr('border', border);
        this.attr('separator', opts.separator || Fieldset.default.separator);

        this.attr('legendTag', opts.legendTag || Fieldset.default.legendTag);
        this.attr(
            'legendClass',
            opts.legendClass || Fieldset.default.legendClass
        );
        this.attr(
            'legendAlign',
            opts.legendAlign || Fieldset.default.legendAlign
        );

        this.attr('dataTag', opts.dataTag || Fieldset.default.dataTag);
        this.attr('dataClass', opts.dataClass || Fieldset.default.dataClass);
        this.attr('dataWidth', opts.dataWidth);

        this.attr('labelTag', opts.labelTag || Fieldset.default.labelTag);
        this.attr('labelClass', opts.labelClass || Fieldset.default.labelClass);
        this.attr(
            'labelWidth',
            opts.width - opts.dataWidth - (border !== 'none' ? 2 : 0)
        );

        this._addLegend(opts);
    }

    get _labelLeft(): number {
        const border = this._attrStr('border');
        if (border === 'none') return this.bounds.x;
        return this.bounds.x + 1;
    }

    get _dataLeft(): number {
        const border = this._attrStr('border');
        const base = this.bounds.x + this._attrInt('labelWidth');
        if (border === 'none') return base;
        return base + 1;
    }

    get _nextY(): number {
        const border = this._attrStr('border');
        if (border === 'none') return this.bounds.bottom;
        return this.bounds.bottom - 1;
    }

    _addLegend(opts: FieldsetOptions): this {
        if (!opts.legend) return this;

        const border = this._attrStr('border') !== 'none';
        const textWidth = GWU.text.length(opts.legend);
        const width = this.bounds.width - (border ? 4 : 0);
        const align = this._attrStr('legendAlign');
        let x = this.bounds.x + (border ? 2 : 0);
        if (align === 'center') {
            x += Math.floor((width - textWidth) / 2);
        } else if (align === 'right') {
            x += width - textWidth;
        }

        this.legend = new Text.Text(this.layer, {
            text: opts.legend,
            x,
            y: this.bounds.y,
            depth: this.depth + 1,
            tag: this._attrStr('legendTag'),
            class: this._attrStr('legendClass'),
        });
        if (this.bounds.width < this.legend.bounds.width + 4) {
            this.bounds.width = this.legend.bounds.width + 4;
        }

        this.legend.setParent(this);
        return this;
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

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        const border = this._attrStr('border');
        if (!border || border === 'none') return false;

        drawBorder(
            buffer,
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            this._used,
            border === 'ascii'
        );
        return true;
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
