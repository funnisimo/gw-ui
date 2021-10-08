// import * as UTILS from '../../test/utils';
// import { UICore } from '../types';
import * as Table from './table';

describe('Table Widget', () => {
    // let ui: UICore;

    // beforeEach(() => {
    //     ui = UTILS.mockUI(100, 40);
    // });

    test('Column', () => {
        const col = new Table.Column({
            header: 'HEADER',
            fg: 'green',
            bg: 'black',
            hoverFg: 'red',
            hoverBg: 'yellow',
            activeFg: 'blue',
            activeBg: 'white',
            width: 10,
            value: '§age§ years',
        });

        expect(col.value({ age: 5 }, 0)).toEqual('5 years');
    });

    test('no height', () => {
        expect(() =>
            Table.makeTable('ID', {
                height: 0,
                columns: [{ width: 3, header: 'ID', value: '§id§' }],
            })
        ).toThrow();
    });

    test('no columns', () => {
        expect(() =>
            Table.makeTable('ID', {
                height: 10,
                columns: [],
            })
        ).toThrow();
    });

    test('simple', () => {
        const table: Table.Table = Table.makeTable('TABLE', {
            letters: true, // start row with letter for the row
            headers: true, // show a header on top of each column
            activeFg: 'teal',
            activeBg: 'dark_gray',
            fg: 'white',
            bg: 'black',
            height: 10,
            columns: [
                {
                    width: 10,
                    header: 'Item',
                    value: (d) => {
                        if (d.count) return `${d.count} ${d.name}s`;
                        return d.name;
                    },
                },
                { width: 5, header: 'Each', value: '$§price%4d§' },
            ],
        });

        expect(table.bounds.width).toEqual(17);

        expect(table.columns).toHaveLength(3);

        expect(table.columns[0].header).toEqual('');
        expect(table.columns[1].header).toEqual('Item');
        expect(table.columns[2].header).toEqual('Each');

        expect(
            table.columns[0].value({ count: 3, name: 'Apple', price: 4 }, 0)
        ).toEqual('a)');
        expect(
            table.columns[1].value({ count: 3, name: 'Apple', price: 4 }, 0)
        ).toEqual('3 Apples');
        expect(
            table.columns[2].value({ count: 3, name: 'Apple', price: 4 }, 0)
        ).toEqual('$   4');
    });
});
