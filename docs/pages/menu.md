# Menu

A menu is a horizontal menu like the file menu in desktop applications. It allows you to add buttons that can invoke actions when clicked.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

function clickHandler(e, ui, button) {
    ui.baseBuffer.fillRect(40, 15, 20, 5, 0, 0, 0);
    const text = GWU.text.center(button.text, 16);
    ui.baseBuffer.drawText(42, 17, text, 'white');
    return true;
}

const ui = new GWI.UI({ canvas, loop: LOOP });
const topMenu = new GWI.Menu('TOP_MENU', {
    x: 0,
    y: 0,
    width: 80,
    bg: 'red',
    fg: 'yellow',
    activeFg: 'white',
    activeBg: 'dark_red',
    buttons: {
        File: clickHandler,
        Insert: {
            Apple: clickHandler,
            Banana: {
                Sliced: clickHandler,
                'Chocolate Covered': clickHandler,
                Whole: clickHandler,
            },
            Carrot: clickHandler,
        },
        Window: {
            Automobile: clickHandler,
            Biplane: clickHandler,
            ChooChoo: clickHandler,
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
    buttons: {
        Add: clickHandler,
        Remove: {
            Airplane: clickHandler,
            Bicycle: clickHandler,
            Car: clickHandler,
        },
        Test: {
            Automobile: clickHandler,
            Biplane: clickHandler,
            ChooChoo: clickHandler,
        },
    },
});

let needDraw = true;
LOOP.run({
    async click(e) {
        if (await topMenu.click(e, ui)) {
            needDraw = true;
        }
        if (await bottomMenu.click(e, ui)) {
            needDraw = true;
        }
    },
    mousemove(e) {
        // Need to do both so that hover gets cleared correctly
        let handled = topMenu.mousemove(e, ui);
        handled = bottomMenu.mousemove(e, ui) || handled;
        needDraw |= handled;
    },
    draw() {
        needDraw = topMenu.draw(ui.buffer) || needDraw;
        needDraw = bottomMenu.draw(ui.buffer) || needDraw;
        if (needDraw) {
            ui.render();
        }
    },
});
```
