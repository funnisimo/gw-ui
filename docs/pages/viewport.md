# ViewPort

The viewport shows the map. It can be configured to either:

-   autoCenter around a map location (the player usually) - this will recenter the map if the location gets too close to the edge.
-   follow the location by always placing it in the center.
-   just draw with a given offset

All three of these are available all the time.

## Whole Map

This is a plain viewport that covers the whole map.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({ x: 0, y: 4, width: 80, height: 34, ui });
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

viewport.draw(map);
ui.render();
```

## Part of Map

In this example, you can move the mouse around the viewport to see different parts of the map.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({ x: 0, y: 4, width: 40, height: 17, ui });
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

viewport.draw(map);
ui.render();

LOOP.run({
    mousemove(e) {
        if (!viewport.contains(e.x, e.y)) return;
        const offsetX = Math.round(
            (viewport.bounds.width * viewport.toInnerX(e.x)) /
                (viewport.bounds.width - 1)
        );
        const offsetY = Math.round(
            (viewport.bounds.height * viewport.toInnerY(e.y)) /
                (viewport.bounds.height - 1)
        );
        viewport.draw(map, offsetX, offsetY);
        ui.render();
    },
});
```

## Follow Player

In this example, you can press the arrow keys to move the marker around. Notice that the player stays in the middle of the viewport until it gets close to a wall, then the lock setting kicks in an does not allow the map to scroll anymore so the player moves towards the wall.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    ui,
    lock: true,
    follow: true,
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

const player = GWM.actor.from({
    ch: '@',
    fg: 'yellow',
});

LOOP.run({
    async start() {
        await map.addActor(40, 17, player);
        viewport.draw(map, player.x, player.y);
        ui.render();
    },
    async dir(e) {
        const d = e.dir;
        if (d) {
            await map.moveActor(player.x + d[0], player.y + d[1], player);
            viewport.draw(map, player.x, player.y);
            ui.render();
        }
    },
});
```

## Snap

In this example, you can press the arrow keys to move the marker around. Notice that the player moves around on the screen, but will snap back into the center area if it gets too close to the edge of the viewport.

The snap setting also automatically behaves like lock is turned on as well.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    ui,
    snap: true,
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

const player = GWM.actor.from({
    ch: '@',
    fg: 'yellow',
});

LOOP.run({
    async start() {
        await map.addActor(40, 17, player);
        viewport.draw(map, player.x, player.y);
        ui.render();
    },
    async dir(e) {
        const d = e.dir;
        if (d) {
            await map.moveActor(player.x + d[0], player.y + d[1], player);
            viewport.draw(map, player.x, player.y);
            ui.render();
        }
    },
});
```
