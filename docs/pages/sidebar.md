# Sidebar

The Sidebar shows the interesting things around the focal point (usually the player).

## Basics

This is a sidebar showing tiles scattered around the map randomly. Move the mouse around and notice that the list of tiles changes to show the ones closest to the mouse at the top.

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
    lock: true,
});
const sidebar = new GWI.Sidebar({
    x: 80,
    y: 0,
    width: 20,
    height: 38,
    ui,
    bg: 0x234,
});
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

for (let i = 0; i < 20; ++i) {
    const ch = String.fromCharCode(65 + i);
    const tile = GWM.tile.make({
        extends: 'FLOOR',
        ch,
        fg: GWU.rng.random.number(0x1000),
        flags: 'L_LIST_IN_SIDEBAR',
        name: 'Tile ' + ch,
    });
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

const player = GWM.actor.from({ ch: '@', fg: 'white', name: 'Actor' });
map.addActor(1, 1, player);

sidebar.follow = player;
viewport.follow = player;

viewport.drawFor(player);
sidebar.draw();
ui.render();

LOOP.run({
    mousemove(e) {
        if (!viewport.contains(e)) return;
        map.removeActor(player);
        map.addActor(viewport.toMapX(e.x), viewport.toMapY(e.y), player);

        viewport.drawFor(player);
        sidebar.draw();
        ui.render();
    },
});
```

## Actors and Items, FOV

Now lets add some actors, items, and FOV into the mix...

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

const player = GWM.actor.from({
    ch: '@',
    fg: 'white',
    name: 'Player',
    flags: 'HAS_MEMORY, IS_PLAYER, USES_FOV',
    vision: 5,
});

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({
    x: 0,
    y: 4,
    width: 80,
    height: 34,
    ui,
    lock: true,
});
const sidebar = new GWI.Sidebar({
    x: 80,
    y: 0,
    width: 20,
    height: 38,
    ui,
    bg: 0x234,
});

for (let i = 0; i < 20; ++i) {
    const ch = String.fromCharCode(65 + i);
    const tile = GWM.tile.make({
        extends: 'FLOOR',
        ch,
        fg: GWU.rng.random.number(0x1000),
        flags: 'L_LIST_IN_SIDEBAR',
        name: 'Tile ' + ch,
    });
    const x = GWU.rng.random.number(map.width - 2) + 1;
    const y = GWU.rng.random.number(map.height - 2) + 1;
    map.setTile(x, y, tile);
}

map.addActor(40, 17, player);

const fov = player.fov;
fov.update();

sidebar.follow = player;
viewport.follow = player;

viewport.draw();
sidebar.draw();
ui.render();

let needsDraw = true;
LOOP.run({
    dir(e) {
        sidebar.clearHighlight();
        const newX = player.x + e.dir[0];
        const newY = player.y + e.dir[1];
        if (map.hasXY(newX, newY)) {
            map.removeActor(player);
            map.addActor(newX, newY, player);
            fov.update();
            needsDraw = true;
        }
    },
    mousemove(e) {
        if (sidebar.highlight) {
            fov.clearCursor(sidebar.highlight.x, sidebar.highlight.y);
            sidebar.clearHighlight();
            needsDraw = true;
        }
        if (sidebar.contains(e)) {
            if (sidebar.updateHighlight(e)) {
                fov.setCursor(sidebar.highlight.x, sidebar.highlight.y);
                needsDraw = true;
            }
        }
    },
    draw() {
        if (!needsDraw) return;
        needsDraw = false;
        viewport.draw();
        sidebar.draw();
        ui.render();
    },
});
```
