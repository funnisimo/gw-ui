# Utilities

Here are some utility function examples...

## fadeTo

FadeTo allows you to fade the entire screen to a color over a set time. It is useful for transitions.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

canvas.buffer.drawText(20, 17, 'Click the canvas to fade it.', 'yellow');
canvas.render();

let color = 'green';
LOOP.run({
    async click() {
        await ui.fadeTo(color, 1000);
    },
});
```
