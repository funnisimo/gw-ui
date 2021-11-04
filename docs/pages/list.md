# List

The List widget shows a list of choices.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('th', { bg: 'light_teal', fg: 'dark_blue' });
layer.styles.add('td', { bg: 'darker_gray' });
layer.styles.add('td:hover', { bg: 'gray' });

const list = layer.datalist({
    id: 'LIST',
    x: 10,
    y: 5,
    width: 20,
    height: 28,

    header: 'Food Items',
    align: 'center',
});

const text = layer.text('Choose.', {
    x: 10,
    y: 3,
});

list.data(['Taco', 'Burger', 'Salad', 'Fruit Cup']);

list.on('input', () => {
    if (!list.selectedData) return;
    text.text('You are looking at : ' + list.selectedData);
});

layer.on('LIST', () => {
    if (!list.selectedData) return;
    text.text('You chose : ' + list.selectedData);
});
```
