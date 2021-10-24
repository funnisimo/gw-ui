# Grid

The term can hold grid information to make tables easier to fill out.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

const data = [
    ['', 'Fruit', 'Vegetable', 'Grain'],
    ['Tim', 'Apple', 'Brocolli', 'Rice'],
    ['Marcus', 'Banana', 'Carrot', 'Oatmeal'],
    ['Sally', 'Cherry', 'Eggplant', 'Farro'],
    ['Kim', 'Dragonfruit', 'Tomato', 'Barley'],
];

// move to 1,1 - start a grid with 4 13 width columns and 5 2 height rows
term.pos(1, 1).grid().cols(4, 13).rows(5);

data.forEach((row, i) => {
    term.row(i);
    if (i == 0) {
        term.style({ bg: 'light_blue' });
    } else {
        term.style({ bg: -1 });
        term.hoverStyle({ fg: 'red' });
    }
    row.forEach((col, j) => {
        term.col(j);
        term.border(14, 3, 'light_blue', true);
        term.move(2, 1).text(col);
    });
    term.endRow(2);
});

term.endGrid();

LOOP.run(term);
```
