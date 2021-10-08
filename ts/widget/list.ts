import * as GWU from 'gw-utils';
import * as Table from './table';

export interface ListOptions extends Table.ColumnOptions {
    height: number; // must have

    hover?: boolean;

    headerFg?: GWU.color.ColorBase;
    headerBg?: GWU.color.ColorBase;

    wrap?: boolean;
}

export class List extends Table.Table {
    constructor(id: string, opts: ListOptions) {
        super(
            id,
            (() => {
                // @ts-ignore
                const tableOpts: Table.TableOptions = opts;
                tableOpts.columns = [opts];
                tableOpts.headers = opts.header ? true : false;
                tableOpts.hover = opts.hover === false ? 'none' : 'row';
                return tableOpts;
            })()
        );
    }
}
