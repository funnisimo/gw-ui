# Sidebar

The Sidebar shows the interesting things around the focal point (usually the player).

## Basics

This is a sidebar showing tiles scattered around the map randomly. Move the mouse around and notice that the list of tiles changes to show the ones closest to the mouse at the top.

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
    width: 80,
    height: 34,
    lock: true,
});
const sidebar = new GWI.Sidebar(layer, {
    id: 'SIDE',
    x: 80,
    y: 0,
    width: 20,
    height: 38,
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

const player = GWM.actor.from({
    ch: '@',
    fg: 'white',
    name: 'Actor',
    flags: 'USES_FOV, IS_PLAYER',
});
map.addActor(1, 1, player);
const fov = player.fov;
fov.makeAlwaysVisible();

sidebar.subject = player;
viewport.subject = player;
sidebar.update();

sidebar.on('mousemove', (n, w, e) => {
    if (sidebar.highlight) {
        fov.setCursor(sidebar.highlight.x, sidebar.highlight.y);
    } else {
        fov.clearCursor();
    }
    layer.needsDraw = true;
});

sidebar.on('mouseleave', () => {
    fov.clearCursor();
    layer.needsDraw = true;
});

viewport.on('mousemove', (n, w, e) => {
    map.removeActor(player);
    map.addActor(viewport.toMapX(e.x), viewport.toMapY(e.y), player);
    sidebar.update();
    layer.needsDraw = true;
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
const layer = ui.startNewLayer();
const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 80,
    height: 34,
    lock: true,
});
const sidebar = new GWI.Sidebar(layer, {
    id: 'SIDE',
    x: 80,
    y: 0,
    width: 20,
    height: 38,
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

sidebar.subject = player;
viewport.subject = player;

const fov = player.fov;
fov.update();
sidebar.update();

layer.on('dir', (n, w, e) => {
    sidebar.clearHighlight();
    const newX = player.x + e.dir[0];
    const newY = player.y + e.dir[1];
    if (map.hasXY(newX, newY)) {
        map.removeActor(player);
        map.addActor(newX, newY, player);
        fov.update();
        sidebar.update();
        layer.needsDraw = true;
    }
});

sidebar.on('mousemove', (n, w, e) => {
    if (sidebar.highlight) {
        fov.setCursor(sidebar.highlight.x, sidebar.highlight.y);
    } else {
        fov.clearCursor();
    }
    layer.needsDraw = true;
});

sidebar.on('mouseleave', () => {
    fov.clearCursor();
    layer.needsDraw = true;
});
```
