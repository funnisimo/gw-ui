# Animate

You can animate widgets as well.

## Position

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

const widget = layer
    .pos(20, 17)
    .text('Click the canvas to slide it in.', { fg: 'yellow' });

layer.on('click', () => {
    const tween = GWU.tween
        .make({ x: -20 })
        .to({ x: 20 })
        .duration(1000)
        .onUpdate((info) => {
            widget.bounds.x = info.x;
            layer.needsDraw = true;
        });
    layer.animate(tween);

    return true;
});
```

## Color

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

const widget = layer
    .pos(20, 17)
    .text('Click the canvas to fade it in.', { fg: 'yellow' });

layer.on('click', () => {
    const tween = GWU.tween
        .make({ pct: 0 })
        .to({ pct: 100 })
        .duration(1000)
        .onUpdate((info) => {
            widget._used._fg = GWU.color.from(widget._used._fg).alpha(info.pct);
            layer.needsDraw = true;
        });
    layer.animate(tween);

    return true;
});
```
