# Sidebar

The Sidebar shows the interesting things around the focal point (usually the player).

## Basics

This is a sidebar showing tiles scattered around the map randomly. Move the mouse around and notice that the list of tiles changes to show the ones closest to the mouse at the top.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const viewport = new GWI.Viewport({ x: 0, y: 4, width: 80, height: 34, ui });
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

viewport.draw(map);
sidebar.draw(map, 40, 17);
ui.render();

LOOP.run({
    mousemove(e) {
        sidebar.draw(map, viewport.toMapX(e.x), viewport.toMapY(e.y));
        ui.render();
    },
});
```
