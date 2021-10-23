# Terminal

You can draw into the canvas like a terminal.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.text('Hello World.');

term.pos(3, 2).border(16, 5, 'red');
term.pos(5, 4).fg('blue').bright(50).text('Hello again.').reset();

term.render();
```

## Gridwork

To make filling out displays with grid oriented data, there are a few helper functions:

-   column(x, width) - defines a column
-   col(n) - moves to a column by index
-   wrap(text) - draws text in the current column with the column width as the wrap length
-   nextLine() - Moves to the beginning of the next line

So filling out a grid can look something like this:

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

data.forEach((row, i) => {
    row.forEach((col, j) => {
        let x = 1 + j * 13;
        let y = 1 + i * 2;
        term.pos(x, y).border(14, 3, 'darker_blue');
        term.pos(x + 2, y + 1).text(col, 'white');
    });
});

term.render();
```
