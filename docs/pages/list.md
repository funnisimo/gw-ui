# List

The List widget shows a list of choices.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const list = new GWI.List('LIST', {
    // x: 10,
    // y: 5,
    width: 20,
    height: 28,
    bg: -1,
    fg: 'white',
    headerBg: 'light_blue',
    headerFg: 'white',
    hoverBg: 'yellow',
    hoverFg: 'black',

    header: 'Food Items',
    align: 'center',
});

list.setData(['Taco', 'Burger', 'Salad', 'Fruit Cup']);

ui.showWidget(list, {
    async LIST() {
        if (!list.selectedData) return;
        await ui.alert(2000, 'You chose : ' + list.selectedData);
    },
});
```
