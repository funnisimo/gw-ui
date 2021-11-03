# Terminal

You can draw into the canvas like a terminal.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.text('Hello World.');

// move to 3,2 and draw a border 16x5 in red
layer.pos(3, 2).border({ width: 16, height: 5, bg: 'red' });
// move to 5,4 and draw "Hello again." in bright blue
layer.pos(5, 4).fg('blue').bright(50).text('Hello again.');
// reset the style to the default (white text)
layer.reset();

layer.pos(0, 8).text('Third text.');
```

## Using Borders

You can use borders to create table-like displays:

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

data.forEach((row, i) => {
    row.forEach((col, j) => {
        let x = 1 + j * 13;
        let y = 1 + i * 2;
        layer.pos(x, y).border({
            width: 14,
            height: 3,
            fg: 'darker_blue',
        });
        layer.pos(x + 2, y + 1).text(col);
    });
});
```
