# Menu

A menu is a horizontal menu like the file menu in desktop applications. It allows you to add buttons that can invoke actions when clicked.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const topMenu = new GWI.Menu('TOP_MENU', {
    x: 0,
    y: 0,
    width: 80,
    fg: 'yellow',
    bg: 'red',
    activeFg: 'white',
    activeBg: 'dark_red',
    hoverFg: 'teal',
    hoverBg: 'blue',
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

const bottomMenu = new GWI.Menu('BOTTOM_MENU', {
    x: 0,
    y: canvas.height - 1,
    width: 80,
    bg: 'blue',
    fg: 'white',
    activeFg: 'gold',
    hoverFg: 'teal',
    hoverBg: 'blue',

    buttons: {
        Add: 'PRINT',
        Remove: {
            Airplane: 'PRINT',
            Bicycle: 'PRINT',
            Car: 'PRINT',
        },
        Test: {
            Automobile: 'PRINT',
            Biplane: 'PRINT',
            ChooChoo: 'PRINT',
        },
    },
});

const text = new GWI.Text('OUTPUT', {
    x: 20,
    y: 10,
    wrap: 60,
    height: 18,
    text: 'Try out the menu!',
    valign: 'middle',
    align: 'center',
});

const builder = GWI.buildDialog(ui, {
    width: canvas.width,
    height: canvas.height,
});
builder.with(topMenu);
builder.with(text);
builder.with(bottomMenu);
const dialog = builder.done();

dialog.setEventHandlers({
    PRINT: (action, dialog, menu) => {
        const button = menu.actionButton;
        text.setText(button.text);
        dialog.requestRedraw();
        return true;
    },
});

dialog.show();
```
