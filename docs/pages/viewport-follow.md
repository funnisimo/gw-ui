# Viewport

The viewport can also follow an object's position as it moves (like a camera).

## Follow Mouse

In this example, you can move the mouse around the viewport to see different parts of the map.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({ x: 0, y: 4, width: 40, height: 17, ui });
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const camera = { x: 20, y: 17 };
viewport.follow = camera;

viewport.draw(map);
ui.render();

LOOP.run({
    mousemove(e) {
        if (!viewport.contains(e.x, e.y)) return;
        camera.x = Math.round(
            (map.width * viewport.toInnerX(e.x)) / (viewport.bounds.width - 1)
        );
        camera.y = Math.round(
            (map.height * viewport.toInnerY(e.y)) / (viewport.bounds.height - 1)
        );
        viewport.draw(map);
        ui.render();
    },
});
```

## Follow Mouse with Lock

Compare the previous example with this one, where we lock the viewport so that it does show anything outside of our map.

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
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 40; ++i) {
    const tile = GWU.rng.random.item(GWM.tile.tiles);
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const camera = { x: 20, y: 17 };
viewport.follow = camera;

viewport.draw(map);
ui.render();

LOOP.run({
    mousemove(e) {
        if (!viewport.contains(e.x, e.y)) return;
        camera.x = Math.round(
            (map.width * viewport.toInnerX(e.x)) / (viewport.bounds.width - 1)
        );
        camera.y = Math.round(
            (map.height * viewport.toInnerY(e.y)) / (viewport.bounds.height - 1)
        );
        viewport.draw(map);
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
viewport.follow = player;

map.addActor(40, 17, player);
viewport.draw(map);
ui.render();

LOOP.run({
    async dir(e) {
        const d = e.dir;
        if (d) {
            await map.removeActor(player);
            await map.addActor(player.x + d[0], player.y + d[1], player);
            viewport.draw(map);
            ui.render();
        }
    },
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
const viewport = new GWI.Viewport({
    x: 0,
    y: 4,
    width: 40,
    height: 17,
    ui,
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
viewport.follow = player;
viewport.draw(map, player.x, player.y);
ui.render();

LOOP.run({
    dir(e) {
        const d = e.dir;
        if (d) {
            const newX = player.x + d[0];
            const newY = player.y + d[1];
            if (map.hasXY(newX, newY)) {
                map.removeActor(player);
                map.addActor(newX, newY, player);
                viewport.draw(map);
                ui.render();
            }
        }
    },
});
```
