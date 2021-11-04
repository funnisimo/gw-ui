# Table

The table widget allows you to create a table of data. It has features to customize the highlighting of the cells/rows/columns. It also handles many of the standard mouse+key manipulations and events.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('td', { fg: 'green' });
layer.styles.add('td:hover', { bg: 'light_gray' });
layer.styles.add('th', { fg: 'red' });
layer.styles.add('datatable', { fg: 'blue' });

const table = layer.datatable({
    id: 'TABLE',
    // x: 10,
    // y: 5,
    height: 28,
    select: 'cell',
    header: true,
    border: 'ascii',
    columns: [
        { header: 'A', format: '§a§', width: 10, empty: 'ΩredΩNONE∆' },
        {
            header: 'B',
            format: GWU.text.compile('^b^', { field: '^' }),
            width: 10,
        },
        { header: 'C', format: (obj) => obj.c, width: 20, empty: '-' },
    ],
});

table.data([
    { a: 1, b: '', c: '' },
    { a: '', b: 'value b', c: '' },
    { a: '', c: 'testing long values in shorter fields' },
    { a: 'fun', b: 'fun', c: '' },
]);

table.on('input', () => {
    console.log(
        'input',
        table.selectedColumn,
        table.selectedRow,
        table.selectedData
    );
});

table.on('click', () => {
    console.log(
        'click',
        table.selectedColumn,
        table.selectedRow,
        table.selectedData
    );
});
```
