# Menu

A menu is a horizontal menu like the file menu in desktop applications. It allows you to add buttons that can invoke actions when clicked.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

function clickHandler(button) {
    canvas.buffer.fillRect(40, 15, 20, 5, 0, 0, 0);
    const text = GWU.text.center(button.text, 16);
    canvas.buffer.drawText(42, 17, text, 'white');
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
        Insert: clickHandler,
        Window: { fn: clickHandler },
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
        Remove: clickHandler,
        Test: { fn: clickHandler },
    },
});

LOOP.run({
    async click(e) {
        if (await topMenu.handleClick(e)) return;
        if (await bottomMenu.handleClick(e)) return;
    },
    mousemove(e) {
        // Need to do both so that hover gets cleared correctly
        let handled = topMenu.handleMouse(e);
        handled = bottomMenu.handleMouse(e) || handled;
    },
    draw() {
        let needDraw = topMenu.draw();
        needDraw = bottomMenu.draw() || needDraw;
        if (needDraw) {
            ui.render();
        }
    },
});
```
