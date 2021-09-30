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

## Field of View

Oftentimes you will want to just reveal what the player sees. You do this through using Memory and FOV. The player will have a memory of what they have seen and the FOV is what calculates that view.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({
    x: 0,
    y: 4,
    width: 80,
    height: 34,
    ui,
    lock: true, // Necessary if you are going to center on the player and use the mouse to move them around
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

const player = GWM.actor.from({
    ch: '@',
    fg: 'white',
    name: 'Player',
    flags: 'HAS_MEMORY, USES_FOV, IS_PLAYER',
    vision: 5,
});
map.addActor(1, 1, player);
player.fov.update();
viewport.follow = player;

viewport.draw();
ui.render();

LOOP.run({
    mousemove(e) {
        if (!viewport.contains(e)) return;
        const x = viewport.toMapX(e.x);
        const y = viewport.toMapY(e.y);
        map.removeActor(player);
        map.addActor(x, y, player);

        player.fov.update();
        viewport.draw();
        ui.render();
    },
});
```
