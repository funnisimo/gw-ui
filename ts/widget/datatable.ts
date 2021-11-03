import * as GWU from 'gw-utils';
import { Widget, WidgetOptions, SetParentOptions } from './widget';
import { PrefixType } from '../types';
import { Text } from './text';
import { drawBorder } from './border';
import { installWidget } from './make';
import { Layer } from '../layer';

export type FormatFn = GWU.text.Template; // (data: any, index: number) => string;
export type Value = string | number;
export type SelectType = 'none' | 'column' | 'row' | 'cell';
export type DataObject = Record<string, any>;
export type DataItem = Value | Value[] | DataObject;
export type DataType = DataItem[];

export type BorderType = 'ascii' | 'fill' | 'none';

export interface ColumnOptions {
    width?: number; // must have
    format?: string | FormatFn; // must have

    header?: string;
    headerClass?: string;

    empty?: string;
    dataClass?: string;
}

export interface DataTableOptions extends Omit<WidgetOptions, 'height'> {
    size?: number;
    rowHeight?: number;

    header?: boolean; // show a header on top of each column
    headerTag?: string;
    dataTag?: string;

    prefix?: PrefixType;
    select?: SelectType;

    columns: ColumnOptions[]; // must have at least 1

    data?: DataType;
    border?: boolean | BorderType;
}

export class Column {
    width: number;
    format: GWU.text.Template = GWU.IDENTITY;
    header: string;
    headerClass: string;
    dataClass: string;
    empty: string;

    constructor(opts: ColumnOptions) {
        this.width = opts.width || DataTable.default.columnWidth;
        if (typeof opts.format === 'function') {
            this.format = opts.format;
        } else if (opts.format) {
            this.format = GWU.text.compile(opts.format);
        }

        this.header = opts.header || '';
        this.headerClass = opts.headerClass || DataTable.default.headerClass;
        this.empty = opts.empty || DataTable.default.empty;
        this.dataClass = opts.dataClass || DataTable.default.dataClass;
    }

    addHeader(table: DataTable, x: number, y: number): Text {
        const t = new Text(table.layer, {
            x,
            y,
            class: this.headerClass,
            tag: table.headerTag,
            width: this.width,
            height: table.rowHeight,
            depth: table.depth + 1,
            text: this.header,
        });
        t.setParent(table);
        table.layer.attach(t);

        return t;
    }

    addData(
        table: DataTable,
        data: DataItem,
        x: number,
        y: number,
        col: number,
        row: number
    ): Text {
        let text: string;
        if (Array.isArray(data)) {
            text = '' + (data[col] || this.empty);
        } else if (typeof data !== 'object') {
            text = '' + data;
        } else {
            text = this.format(data);
        }

        const widget = new Text(table.layer, {
            text,
            x,
            y,
            class: this.dataClass,
            tag: table.dataTag,
            width: this.width,
            height: table.rowHeight,
            depth: table.depth + 1,
        });
        widget.prop(row % 2 == 0 ? 'even' : 'odd', true);
        widget.prop('row', row);
        widget.prop('col', col);
        widget.setParent(table);
        table.layer.attach(widget);
        return widget;
    }

    addEmpty(
        table: DataTable,
        x: number,
        y: number,
        col: number,
        row: number
    ): Text {
        return this.addData(table, [], x, y, col, row);
    }
}

export class DataTable extends Widget {
    static default = {
        columnWidth: 10,
        empty: '-',
        headerClass: 'header',
        headerTag: 'th',
        dataClass: 'data',
        dataTag: 'td',
        select: 'cell' as SelectType,
        prefix: 'none' as PrefixType,
    };

    _data: DataType = [];
    columns: Column[] = [];
    showHeader = false;
    headerTag = 'th';
    dataTag = 'td';
    prefix: PrefixType = 'none';
    select: SelectType = 'cell';
    rowHeight = 1;
    border: BorderType = 'none';
    size: number;

    constructor(layer: Layer, opts: DataTableOptions) {
        super(layer, opts);
        this.tag = 'table';

        this.size = opts.size || layer.height;

        this.bounds.width = 0;
        opts.columns.forEach((o) => {
            const col = new Column(o);
            this.columns.push(col);
            this.bounds.width += col.width;
        });

        if (opts.border) {
            if (opts.border === true) opts.border = 'ascii';
            this.border = opts.border;
        }
        this.rowHeight = opts.rowHeight || 1;

        this.bounds.height = 1;
        if (opts.header) {
            this.showHeader = true;
        }
        this.headerTag = opts.headerTag || DataTable.default.headerTag;
        this.dataTag = opts.dataTag || DataTable.default.dataTag;
        this.prefix = opts.prefix || DataTable.default.prefix;
        this.select = opts.select || DataTable.default.select;

        this.data(opts.data || []);
    }

    data(): DataType;
    data(data: DataType): this;
    data(data?: DataType): this | DataType {
        if (!data) return this._data;
        this._data = data;
        for (let i = this.children.length - 1; i >= 0; --i) {
            const c = this.children[i];
            if (c.tag !== this.headerTag) {
                this.layer.detach(c);
            }
        }

        const borderAdj = this.border !== 'none' ? 1 : 0;

        let x = this.bounds.x + borderAdj;
        let y = this.bounds.y + borderAdj;
        if (this.showHeader) {
            this.columns.forEach((col) => {
                col.addHeader(this, x, y);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        }

        this._data.forEach((obj, j) => {
            if (j >= this.size) return;
            x = this.bounds.x + borderAdj;
            this.columns.forEach((col, i) => {
                col.addData(this, obj, x, y, i, j);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        });

        if (this._data.length == 0) {
            x = this.bounds.x + borderAdj;
            this.columns.forEach((col, i) => {
                col.addEmpty(this, x, y, i, 0);
                x += col.width + borderAdj;
            });
            y += 1;
        }

        this.bounds.height = y - this.bounds.y;
        this.bounds.width = x - this.bounds.x;
        this.updateStyle(); // sets this.needsDraw

        return this;
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        this._drawFill(buffer);

        this.children.forEach((w) => {
            if (w.prop('row')! >= this.size) return;
            if (this.border !== 'none') {
                drawBorder(
                    buffer,
                    w.bounds.x - 1,
                    w.bounds.y - 1,
                    w.bounds.width + 2,
                    w.bounds.height + 2,
                    this._used,
                    this.border == 'ascii'
                );
            }
        });
        return true;
    }

    mousemove(e: GWU.io.Event): boolean {
        const active = (this.hovered = this.contains(e));
        if (!active) {
            this.children.forEach((c) => (c.hovered = false));
            return false;
        }

        const hovered = this.children.find((c) => c.contains(e));

        if (hovered) {
            if (this.select === 'none') {
                this.children.forEach((c) => (c.hovered = false));
            } else if (this.select === 'row') {
                this.children.forEach(
                    (c) => (c.hovered = hovered.prop('row') == c.prop('row'))
                );
            } else if (this.select === 'column') {
                this.children.forEach(
                    (c) => (c.hovered = hovered.prop('col') == c.prop('col'))
                );
            }
        }
        return true;
    }
}

installWidget('datatable', (l, opts) => new DataTable(l, opts));

// extend Layer

export type AddDataTableOptions = DataTableOptions &
    SetParentOptions & { parent?: Widget };

declare module '../layer' {
    interface Layer {
        datatable(opts: AddDataTableOptions): DataTable;
    }
}
Layer.prototype.datatable = function (opts: AddDataTableOptions): DataTable {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataTable(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
