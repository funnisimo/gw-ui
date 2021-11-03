# Grid

The layer can hold grid information to make tables easier to fill out.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

const data = [
    ['', 'Fruit', 'Vegetable', 'Grain'],
    ['Tim', 'Apple', 'Brocolli', 'Rice'],
    ['Marcus', 'Banana', 'Carrot', 'Oatmeal'],
    ['Sally', 'Cherry', 'Eggplant', 'Farro'],
    ['Kim', 'Dragonfruit', 'Tomato', 'Barley'],
];

layer.styles.add('.header', { bg: 'light_blue' });
layer.styles.add('.data:hover', { fg: 'red' });

// move to 1,1 - start a grid with 4 13 width columns and 5 2 height rows
const grid = layer.pos(1, 1).grid().cols(4, 13).rows(5);

data.forEach((row, i) => {
    grid.row(i);
    const classes = i == 0 ? 'header' : 'data';

    row.forEach((col, j) => {
        grid.col(j);
        layer.border({ width: 14, height: 3, fg: 'light_blue', ascii: true });
        layer.move(2, 1).text(col, { classes });
    });
    grid.endRow(2);
});
```
