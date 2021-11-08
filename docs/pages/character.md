# Build a Character

This is a series of examples that show how you might layout a character building experience.

## Basics

Lets get some basic information about the avatar - gender, kind, role.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();
```
