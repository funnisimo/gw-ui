import * as DataTable from './datatable';
import { PrefixType } from '../types';
import * as Widget from './widget';
import { installWidget } from './make';
import { Layer } from '../layer';

export interface DataListOptions
    extends DataTable.ColumnOptions,
        Widget.WidgetOptions {
    size?: number;
    rowHeight?: number;
    hover?: DataTable.HoverType;

    headerTag?: string;
    dataTag?: string;

    prefix?: PrefixType;

    data?: DataTable.DataType;
    border?: boolean | DataTable.BorderType;
}

export class DataList extends DataTable.DataTable {
    constructor(layer: Layer, opts: DataListOptions) {
        super(
            layer,
            (() => {
                // @ts-ignore
                const tableOpts: DataList.TableOptions = opts;
                if (opts.border !== 'none' && opts.width) {
                    opts.width -= 2;
                }
                tableOpts.columns = [Object.assign({}, opts)];
                if (!opts.header || !opts.header.length) {
                    tableOpts.header = false;
                }
                return tableOpts;
            })()
        );
    }
}

installWidget('list', (l, opts) => new DataList(l, opts));

// extend Layer

export type AddDataListOptions = DataListOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        datalist(opts: AddDataListOptions): DataList;
    }
}
Layer.prototype.datalist = function (opts: AddDataListOptions): DataList {
    const options = Object.assign({}, this._opts, opts);
    const list = new DataList(this, options);
    if (opts.parent) {
        list.setParent(opts.parent, opts);
    }
    return list;
};
