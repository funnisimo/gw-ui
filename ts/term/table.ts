import * as GWU from 'gw-utils';
import { WidgetGroup, WidgetOptions } from './widget';
import { Term } from './term';
import { PrefixType } from '../html';
import { Text } from './text';

export type FormatFn = GWU.text.Template; // (data: any, index: number) => string;
export type Value = string | number;
export type SelectType = 'none' | 'column' | 'row' | 'cell';
export type DataObject = Record<string, any>;
export type DataItem = Value | Value[] | DataObject;
export type DataType = DataItem[];

export type BorderType = 'ascii' | 'fill' | 'none';

export interface ColumnOptions {
    width: number; // must have
    format: string | FormatFn; // must have

    header?: string;
    headerClass?: string;

    empty?: string;
    dataClass?: string;
}

export interface TableOptions extends Omit<WidgetOptions, 'height'> {
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
        this.width = opts.width;
        if (typeof opts.format === 'function') {
            this.format = opts.format;
        } else if (opts.format) {
            this.format = GWU.text.compile(opts.format);
        }
        this.header = opts.header || '';
        this.headerClass = opts.headerClass || '';
        this.empty = opts.empty || '';
        this.dataClass = opts.dataClass || '';
    }

    makeHeader(table: Table): Text {
        return new Text(table.term, this.header, {
            class: this.headerClass,
            tag: table.headerTag,
            width: this.width,
            height: table.rowHeight,
        });
    }

    makeData(table: Table, data: DataItem, col: number, row: number): Text {
        let text: string;
        if (Array.isArray(data)) {
            text = '' + (data[col] || this.empty);
        } else if (typeof data !== 'object') {
            text = '' + data;
        } else {
            text = this.format(data);
        }

        const widget = new Text(table.term, text, {
            class: this.dataClass,
            tag: table.dataTag,
            width: this.width,
            height: table.rowHeight,
        });
        widget.prop(row % 2 == 0 ? 'even' : 'odd', true);
        widget.prop('row', row);
        widget.prop('col', col);
        return widget;
    }
}

export class Table extends WidgetGroup {
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

    constructor(term: Term, opts: TableOptions) {
        super(term, opts);
        this.tag = 'table';

        this.size = opts.size || term.height;

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
        if (opts.headerTag) this.headerTag = opts.headerTag;
        if (opts.dataTag) this.dataTag = opts.dataTag;
        if (opts.prefix) this.prefix = opts.prefix;
        if (opts.select) this.select = opts.select;

        if (opts.data) {
            this.data(opts.data);
        }
    }

    data(): DataType;
    data(data: DataType): this;
    data(data?: DataType): this | DataType {
        if (data === undefined) return this._data;
        this._data = data;
        this.children = []; // get rid of old format...

        const borderAdj = this.border ? 1 : 0;

        let x = this.bounds.x + borderAdj;
        let y = this.bounds.y + borderAdj;
        if (this.showHeader) {
            this.columns.forEach((col) => {
                this.term.pos(x, y);
                const th = col.makeHeader(this);
                this.children.push(th);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        }

        this._data.forEach((obj, j) => {
            if (j >= this.size) return;
            x = this.bounds.x + borderAdj;
            this.columns.forEach((col, i) => {
                this.term.pos(x, y);
                const td = col.makeData(this, obj, i, j);
                this.children.push(td);
                x += col.width + borderAdj;
            });
            y += this.rowHeight + borderAdj;
        });
        this.bounds.height = y - this.bounds.y;
        this.bounds.width = x - this.bounds.x;
        this._updateStyle();

        return this;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        if (!this.needsDraw) return;

        this._drawFill(buffer);

        this.children.forEach((w) => {
            if (w.prop('row')! >= this.size) return;
            if (this.border !== 'none') {
                this.term
                    .pos(w.bounds.x - 1, w.bounds.y - 1)
                    .border(
                        w.bounds.width + 2,
                        w.bounds.height + 2,
                        this._used.fg,
                        this.border == 'ascii'
                    );
            }
            w.draw(buffer);
        });
        this.needsDraw = false;
    }

    mousemove(e: GWU.io.Event, term: Term): boolean {
        let result = super.mousemove(e, term);

        const hovered = this.children.find((c) => c.hovered);

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
        return result;
    }
}
