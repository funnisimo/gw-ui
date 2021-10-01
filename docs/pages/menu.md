# Menu

A menu is a horizontal menu like the file menu in desktop applications. It allows you to add buttons that can invoke actions when clicked.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

function clickHandler(button) {
    canvas.buffer.fillRect(40, 15, 20, 5, 0, 0, 0);
    const text = GWU.text.center(button.text, 16);
    canvas.buffer.drawText(42, 17, text, 'white');
    return true;
}

const ui = new GWI.UI({ canvas, loop: LOOP });
const topMenu = new GWI.Menu({
    ui,
    x: 0,
    y: 0,
    width: 80,
    bg: 'red',
    fg: 'yellow',
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

const bottomMenu = new GWI.Menu({
    ui,
    x: 0,
    y: canvas.height - 1,
    width: 80,
    bg: 'blue',
    fg: 'white',
    hoverFg: 'gold',
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
        if (await topMenu.handleClick(e)) {
            needDraw = true;
        }
        if (await bottomMenu.handleClick(e)) {
            needDraw = true;
        }
    },
    mousemove(e) {
        // Need to do both so that hover gets cleared correctly
        let handled = topMenu.handleMouse(e);
        handled = bottomMenu.handleMouse(e) || handled;
        needDraw |= handled;
    },
    draw() {
        needDraw = topMenu.draw() || needDraw;
        needDraw = bottomMenu.draw() || needDraw;
        if (needDraw) {
            ui.render();
        }
    },
});
```
