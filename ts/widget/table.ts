import * as GWU from 'gw-utils';
import * as Widget from './widget';

export type ValueFn = (data: any, index: number) => string;

export interface ColumnOptions {
    width: number; // must have
    value: string | ValueFn; // must have

    header?: string;
    empty?: string;

    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;

    activeFg?: GWU.color.ColorBase;
    activeBg?: GWU.color.ColorBase;

    hoverFg?: GWU.color.ColorBase;
    hoverBg?: GWU.color.ColorBase;
}

export type HoverType = 'none' | 'column' | 'row' | 'cell';

export interface TableOptions extends Widget.WidgetOptions {
    height: number; // must have

    letters?: boolean; // start row with letter for the row
    headers?: boolean; // show a header on top of each column
    hover?: HoverType;

    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;

    wrap?: boolean;
    wrapColumns?: boolean;
    wrapRows?: boolean;

    columns: ColumnOptions[]; // must have at least 1
}

export type ColorOption = GWU.color.ColorBase | null;

export type DataArray = any[];
export type DataList = { next: any };
export type DataType = DataArray | DataList | null;

export class Column {
    active = false;
    hovered = false;

    fg: ColorOption = null;
    bg: ColorOption = null;

    activeFg: ColorOption = null;
    activeBg: ColorOption = null;

    hoverFg: ColorOption = null;
    hoverBg: ColorOption = null;

    header: string = '';
    empty: string = '';
    _value: ValueFn = GWU.IDENTITY;

    // align: Widget.Align = 'left';
    // valign: Widget.VAlign = 'middle';
    // hover: HoverType = 'cell';

    x = -1;
    width = -1;
    index = -1;

    constructor(opts: ColumnOptions) {
        GWU.object.assignOmitting('value', this, opts);
        if (this.width <= 0) {
            this.width = this.header.length || 1;
        }
        if (typeof opts.value === 'string') {
            this._value = GWU.text.compile(opts.value);
        } else {
            this._value = opts.value;
        }
    }

    value(data: any, index: number): string {
        const v = this._value(data, index);
        return GWU.text.truncate(v, this.width);
    }
}

export class Table extends Widget.Widget {
    headers!: boolean;
    letters!: boolean;

    headerFg!: GWU.color.ColorBase;
    headerBg!: GWU.color.ColorBase;

    wrapColumns!: boolean;
    wrapRows!: boolean;

    columns!: Column[];

    data: DataType = null;
    hoverType!: HoverType;
    selectedColumn: Column | null = null;
    selectedIndex = -1;

    constructor(id: string, opts?: TableOptions) {
        super(id, opts);
    }

    init(opts: TableOptions) {
        if (!opts.height) throw new Error('Height is required.');
        if (!opts.columns || opts.columns.length == 0)
            throw new Error('Must have at least 1 column.');

        opts.tabStop = GWU.first(opts.tabStop, true);

        super.init(opts);
        this.headers = GWU.first(opts.headers, true);
        this.letters = GWU.first(opts.letters, true);
        this.columns = [];
        this.hoverType = opts.hover || 'row';
        this.wrapColumns = GWU.first(opts.wrapColumns, opts.wrap, true);
        this.wrapRows = GWU.first(opts.wrapRows, opts.wrap, true);

        this.headerFg = opts.headerFg || this.fg;
        this.headerBg = opts.headerBg || this.bg;

        let columnWidth = 0;
        if (opts.letters) {
            this.columns.push(
                new Column({
                    width: 2,
                    value: (_data, index) => {
                        const letter = String.fromCharCode(97 + index);
                        return letter + ')';
                    },
                })
            );
            columnWidth += 2;
        }

        if (opts.columns) {
            opts.columns.forEach((c) => {
                const col = new Column(c);
                this.columns.push(col);
                columnWidth += col.width;
            });
        }

        this.columns.forEach((c, i) => (c.index = i));

        // scrolling?  paging?  fixed columns/headers?
        this.bounds.width =
            this.bounds.width > 0 ? this.bounds.width : columnWidth;
    }

    setData(data: DataType) {
        this.data = data;
        this.selectedIndex = -1;
    }

    selectRow(index: number): boolean {
        if (!this.data) return false;
        const len = Array.isArray(this.data)
            ? this.data.length
            : GWU.list.length(this.data);
        if (index >= len) return false;
        if (index < -1) return false;
        this.selectedIndex = index;
        return true;
    }

    selectNextRow(wrap = true): number {
        if (!this.data) return -1;

        const len = Array.isArray(this.data)
            ? this.data.length
            : GWU.list.length(this.data);

        this.selectedIndex = GWU.nextIndex(this.selectedIndex, len, wrap);

        if (this.selectedIndex > -1 && !this.selectedColumn) {
            this.selectedColumn = this.columns[0];
        }
        return this.selectedIndex;
    }

    selectPrevRow(wrap = true): number {
        if (!this.data) return -1;

        const len = Array.isArray(this.data)
            ? this.data.length
            : GWU.list.length(this.data);

        this.selectedIndex = GWU.prevIndex(this.selectedIndex, len, wrap);

        if (this.selectedIndex > -1 && !this.selectedColumn) {
            this.selectedColumn = this.columns[0];
        }
        return this.selectedIndex;
    }

    selectNextColumn(wrap = true): Column | null {
        if (!this.selectedColumn) {
            this.selectedColumn = this.columns[0];
        } else {
            let index = GWU.nextIndex(
                this.selectedColumn.index,
                this.columns.length,
                wrap
            );
            this.selectedColumn = this.columns[index] || null;
        }
        if (this.selectedColumn && this.selectedIndex < 0 && this.data) {
            this.selectedIndex = 0;
        }
        return this.selectedColumn;
    }

    selectPrevColumn(wrap = true): Column | null {
        if (!this.selectedColumn) {
            this.selectedColumn = this.columns[this.columns.length - 1]; // last column
        } else {
            let index = GWU.prevIndex(
                this.selectedColumn.index,
                this.columns.length,
                wrap
            );
            this.selectedColumn = this.columns[index] || null;
        }
        if (this.selectedColumn && this.selectedIndex < 0 && this.data) {
            this.selectedIndex = 0;
        }
        return this.selectedColumn;
    }

    get selectedData(): any | null {
        if (!this.data) return null;
        if (Array.isArray(this.data)) {
            return this.data[this.selectedIndex] || null;
        } else {
            return GWU.list.at(this.data, this.selectedIndex);
        }
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        const b = this.bounds;
        buffer.fillRect(b.x, b.y, b.width, b.height, ' ', this.bg, this.bg);

        let x = b.x;
        this.columns.forEach((col) => {
            this.drawColumn(buffer, col, x);
            x += col.width;
        });
    }

    drawColumn(buffer: GWU.canvas.DataBuffer, column: Column, x: number) {
        let y = this.bounds.y;
        if (column.header) {
            buffer.fillRect(
                x,
                y,
                column.width,
                1,
                ' ',
                this.headerFg,
                this.headerBg
            );
            buffer.drawText(
                x,
                y,
                column.header,
                this.headerFg,
                this.headerBg,
                column.width
            );
            ++y;
        }
        if (!this.data) return;
        if (Array.isArray(this.data)) {
            this.data.forEach((item, index) => {
                this.drawCell(buffer, column, item, index, x, y);
                ++y;
            });
        } else {
            GWU.list.forEach(this.data, (item, index) => {
                this.drawCell(buffer, column, item, index, x, y);
                ++y;
            });
        }
    }

    drawCell(
        buffer: GWU.canvas.DataBuffer,
        column: Column,
        data: any,
        index: number,
        x: number,
        y: number
    ) {
        if (y > this.bounds.bottom) return;
        let text = column._value(data, index);
        if (text.length == 0) {
            text = column.empty;
        }

        // pick color...
        let fg = this.fg;
        let bg = this.bg;

        if (this.hoverType === 'row') {
            if (index === this.selectedIndex) {
                fg = this.hoverFg;
                bg = this.hoverBg;
            }
        } else if (this.hoverType === 'column') {
            if (column === this.selectedColumn) {
                fg = this.hoverFg;
                bg = this.hoverBg;
            }
        } else if (this.hoverType === 'cell') {
            if (
                column === this.selectedColumn &&
                index === this.selectedIndex
            ) {
                fg = this.hoverFg;
                bg = this.hoverBg;
            }
        }

        buffer.fillRect(x, y, column.width, 1, ' ', bg, bg);
        buffer.drawText(x, y, text, fg, bg, column.width);
    }

    async mousemove(
        e: GWU.io.Event,
        dialog: Widget.WidgetRunner
    ): Promise<boolean> {
        if (!super.mousemove(e, dialog)) {
            return false;
        }

        const oldColumn = this.selectedColumn;
        const oldIndex = this.selectedIndex;

        let x = e.x - this.bounds.x;
        const column = (this.selectedColumn =
            this.columns.find((c) => {
                if (c.width >= x) return true;
                x -= c.width;
                return false;
            }) || null);

        let index = -1;
        if (this.data) {
            index = e.y - this.bounds.y - (this.headers ? 1 : 0);

            if (Array.isArray(this.data)) {
                if (index >= this.data.length) index = -1;
            }
        }
        this.selectedIndex = index;

        if (oldColumn !== column || oldIndex !== index) {
            dialog.fireAction(this.id + '_HOVER', this);
            dialog.requestRedraw();
        }
        return true;
    }

    dir(e: GWU.io.Event): boolean {
        if (!e.dir) return false;
        if (e.dir[0] > 0) {
            this.selectNextColumn(this.wrapColumns);
        } else if (e.dir[0] < 0) {
            this.selectPrevColumn(this.wrapColumns);
        }
        if (e.dir[1] > 0) {
            this.selectNextRow(this.wrapRows);
        } else if (e.dir[1] < 0) {
            this.selectPrevRow(this.wrapRows);
        }
        return true;
    }
}

export function makeTable(id: string, opts: TableOptions): Table {
    return new Table(id, opts);
}
