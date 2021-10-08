# Box

A box is what the name says - it draws a box.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const box = new GWI.Box('BOX', {
    width: 20,
    height: 28,
    bg: 'gray',
    fg: 'white',
    hoverBg: 'yellow',
    hoverFg: 'black',
    title: 'Box',
    borderBg: 'dark_gray',
});

ui.showWidget(box);
```
