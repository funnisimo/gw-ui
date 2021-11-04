# Flavor Bar

The Flavor Bar gives you a place to show contextual information to the player. It is generally used to give mouseover type information - like 'you see a tall, hungry bear.'.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas);
canvas.buffer.fill('teal');

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('flavor', { fg: 'purple', bg: 'black' });

const viewport = new GWI.Viewport(layer, {
    id: 'VIEW',
    x: 0,
    y: 4,
    width: 80,
    height: 34,
});
const flavor = new GWI.Flavor(layer, { id: 'FLAVOR', x: 0, y: 3, width: 80 });
const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

const tiles = Object.values(GWM.tile.tiles);
for (let x = 1; x < map.width - 2; ++x) {
    for (let y = 1; y < map.height - 2; ++y) {
        if (map.rng.chance(20)) {
            const tile = map.rng.item(tiles);
            map.setTile(x, y, tile);
        }
    }
}

viewport.showMap(map);

viewport.on('mousemove', (n, w, e) => {
    if (!viewport.contains(e)) return;
    const mapX = viewport.toMapX(e.x);
    const mapY = viewport.toMapY(e.y);
    const text = flavor.getFlavorText(map, mapX, mapY);
    flavor.showText(text);
});
```
