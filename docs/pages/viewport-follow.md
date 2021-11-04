# Viewport

The viewport can also follow an object's position as it moves (like a camera).

## Follow Mouse

In this example, you can move the mouse around the viewport to see different parts of the map.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();
const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    bg: 'black',
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const camera = { x: 1, y: 1, map };
viewport.subject = camera;

viewport.on('mousemove', (n, w, e) => {
    camera.x = Math.round(
        (map.width * viewport.toInnerX(e.x)) / viewport.bounds.width
    );
    camera.y = Math.round(
        (map.height * viewport.toInnerY(e.y)) / viewport.bounds.height
    );
    layer.needsDraw = true;
});
```

## Follow Mouse with Lock

Compare the previous example with this one, where we lock the viewport so that it does show anything outside of our map.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    lock: true,
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const camera = { x: 1, y: 1, map };
viewport.subject = camera;

viewport.on('mousemove', (n, w, e) => {
    camera.x = Math.round(
        (map.width * viewport.toInnerX(e.x)) / viewport.bounds.width
    );
    camera.y = Math.round(
        (map.height * viewport.toInnerY(e.y)) / viewport.bounds.height
    );
    layer.needsDraw = true;
});
```

## Follow Player

In this example, you can press the arrow keys to move the marker around. Notice that the player stays in the middle of the viewport until it gets close to a wall, then the lock setting kicks in an does not allow the map to scroll anymore so the player moves towards the wall.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    lock: true, // lock edge of map to boundary
    center: true, // keep player in center
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const player = GWM.actor.from({
    ch: '@',
    fg: 'yellow',
});
viewport.subject = player;

map.addActor(40, 17, player);

layer.on('dir', (n, w, e) => {
    const d = e.dir;
    if (d) {
        map.removeActor(player);
        map.addActor(player.x + d[0], player.y + d[1], player);
        layer.needsDraw = true;
    }
});
```

## Snap

In this example, you can press the arrow keys to move the player around. Notice that the player moves around on the screen, but will snap back into the center area if it gets too close to the edge of the viewport. This setting works well if you are sending all the UI data over the network, but want to minimize the traffic.

The snap setting also automatically behaves like lock is turned on as well.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();
const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    snap: true,
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const player = GWM.actor.from({
    ch: '@',
    fg: 'yellow',
});

map.addActor(40, 17, player);
viewport.subject = player;

layer.on('dir', (n, w, e) => {
    const d = e.dir;
    if (d) {
        const newX = player.x + d[0];
        const newY = player.y + d[1];
        if (map.hasXY(newX, newY)) {
            map.removeActor(player);
            map.addActor(newX, newY, player);
            layer.needsDraw = true;
        }
    }
});
```
