# Table

The table widget allows you to create a table of data. It has features to customize the highlighting of the cells/rows/columns. It also handles many of the standard mouse+key manipulations and events.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const table = new GWI.Table('TABLE', {
    // x: 10,
    // y: 5,
    // width: 80,
    height: 28,
    bg: 'teal',
    fg: 'black',
    headerBg: 'light_blue',
    headerFg: 'white',
    hoverBg: 'yellow',
    hoverFg: 'black',
    hover: 'cell',
    columns: [
        { header: 'A', value: '§a§', width: 10, empty: 'ΩredΩNONE∆' },
        {
            header: 'B',
            value: GWU.text.compile('^b^', { field: '^' }),
            width: 10,
        },
        { header: 'C', value: (obj) => obj.c, width: 20, empty: '-' },
    ],
});

table.setData([
    { a: 1, b: '', c: '' },
    { a: '', b: 'value b', c: '' },
    { a: '', c: 'testing long values in shorter fields' },
    { a: 'fun', b: 'fun', c: '' },
]);

ui.showWidget(table, {
    TABLE_HOVER() {
        console.log(
            'hover',
            table.selectedIndex,
            table.selectedColumn.index,
            table.selectedData
        );
    },
    TABLE() {
        console.log(
            'click',
            table.selectedIndex,
            table.selectedColumn.index,
            table.selectedData
        );
    },
});
```
