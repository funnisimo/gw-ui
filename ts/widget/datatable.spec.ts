import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as DataTable from './datatable';
import * as Layer from '../layer';

describe('Table Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('Column', () => {
        const col = new DataTable.Column({
            header: 'HEADER',
            width: 10,
            format: '§age§ years',
        });

        expect(col.format({ age: 5 })).toEqual('5 years');
    });

    test('no size', () => {
        expect(
            () =>
                new DataTable.DataTable(layer, {
                    id: 'ID',
                    columns: [{ width: 3, header: 'ID', format: '§id§' }],
                })
        ).not.toThrow();
    });

    test('no columns', () => {
        expect(
            () =>
                new DataTable.DataTable(layer, {
                    id: 'ID',
                    size: 10,
                    columns: [],
                })
        ).not.toThrow();
    });

    test('simple', () => {
        const table = new DataTable.DataTable(layer, {
            id: 'TABLE',
            header: true, // show a header on top of each column
            size: 10,
            columns: [
                {
                    width: 10,
                    header: 'Item',
                    format: ((d: { count: number; name: string }) => {
                        if (d.count) return `${d.count} ${d.name}s`;
                        return d.name;
                    }) as GWU.text.Template,
                },
                { width: 5, header: 'Each', format: '$§price%4d§' },
            ],
        });

        expect(table.bounds.width).toEqual(15);

        expect(table.columns).toHaveLength(2);

        expect(table.columns[0].header).toEqual('Item');
        expect(table.columns[1].header).toEqual('Each');

        expect(
            table.columns[0].format({ count: 3, name: 'Apple', price: 4 })
        ).toEqual('3 Apples');
        expect(
            table.columns[1].format({ count: 3, name: 'Apple', price: 4 })
        ).toEqual('$   4');
    });
});
