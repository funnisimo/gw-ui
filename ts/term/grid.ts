import * as GWU from 'gw-utils';

export class Grid {
    _left = 0;
    _top = 0;
    _colWidths: number[] = [];
    _rowHeights: number[] = [];
    _col = 0;
    _row = -1;
    x = 0;
    y = 0;

    constructor(x: number, y: number) {
        this._left = x;
        this._top = y;
        this.x = x;
        this.y = y;
    }

    cols(): number[];
    cols(count: number, width: number): this;
    cols(widths: number[]): this;
    cols(...args: any[]): this | number[] {
        if (args.length === 0) return this._colWidths;
        if (args.length == 2) {
            args[0] = new Array(args[0]).fill(args[1]);
        }
        if (Array.isArray(args[0])) {
            this._colWidths = args[0];
        }
        return this;
    }

    rows(): number[];
    rows(count: number, height?: number): this;
    rows(heights: number[]): this;
    rows(...args: any[]): this | number[] {
        if (args.length === 0) return this._rowHeights;
        if (typeof args[0] === 'number') {
            args[0] = new Array(args[0]).fill(args[1] || 1);
        }
        if (Array.isArray(args[0])) {
            this._rowHeights = args[0];
        }
        return this;
    }

    col(n?: number): this {
        if (n === undefined) n = this._col;
        this._col = GWU.clamp(n, 0, this._colWidths.length - 1);

        return this._setX()._setY(); // move back to top of our current row
    }

    nextCol(): this {
        return this.col(this._col + 1);
    }

    row(n?: number): this {
        if (n === undefined) n = this._row;
        this._row = GWU.clamp(n, 0, this._rowHeights.length - 1);
        return this._setY()._setX(); // move back to beginning of current column
    }

    nextRow(): this {
        return this.row(this._row + 1).col(0);
    }

    protected _setX(): this {
        this.x = this._left;
        for (let i = 0; i < this._col; ++i) {
            this.x += this._colWidths[i];
        }
        return this;
    }

    protected _setY(): this {
        this.y = this._top;
        for (let i = 0; i < this._row; ++i) {
            this.y += this._rowHeights[i];
        }
        return this;
    }
}
