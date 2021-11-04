# Menu

A menu is a horizontal menu like the file menu in desktop applications. It allows you to add buttons that can invoke actions when clicked.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('menu', { fg: 'yellow', bg: 'red' });
layer.styles.add('mi', { fg: 'yellow', bg: 'red' });
layer.styles.add('mi:hover', { fg: 'teal', bg: 'blue' });
layer.styles.add('mi:focus', { fg: 'white', bg: 'dark_red' });

const topMenu = layer.menubar({
    id: 'TOP_MENU',
    x: 0,
    y: 0,
    width: 80,
    buttons: {
        File: 'PRINT',
        Insert: {
            Apple: 'PRINT',
            Banana: {
                Sliced: 'PRINT',
                'Chocolate Covered': 'PRINT',
                Whole: 'PRINT',
            },
            Carrot: 'PRINT',
        },
        Window: {
            Automobile: 'PRINT',
            Biplane: 'PRINT',
            ChooChoo: 'PRINT',
        },
    },
});

const bottomMenu = layer.menubar({
    id: 'BOTTOM_MENU',
    width: 80,
    x: 0,
    y: layer.height - 1,

    buttons: {
        Add: 'PRINT',
        Remove: {
            Airplane: 'PRINT',
            Bicycle: 'PRINT',
            Car: 'PRINT',
            Donkey: {
                Sliced: 'PRINT',
                'Chocolate Covered': 'PRINT',
                Whole: 'PRINT',
            },
        },
        Test: {
            Automobile: 'PRINT',
            Biplane: 'PRINT',
            ChooChoo: 'PRINT',
        },
    },
});

const text = layer.text('Try out the menu!', {
    id: 'OUTPUT',
    x: 30,
    y: 15,
    width: 40,
});

layer.on('PRINT', (action, button) => {
    topMenu.collapse();
    bottomMenu.collapse();
    text.text(button.text());
    return true;
});

layer.on('click', () => {
    topMenu.collapse();
    bottomMenu.collapse();
    return true;
});
```
