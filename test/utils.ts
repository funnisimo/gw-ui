import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
// import * as UI from '../ts/ui/ui';
// import * as Layer from '../ts/ui/layer';

// export const rnd = jest.fn();
// export const counts = new Array(100).fill(0);

// export let v = 0;
// let index = 0;
// const addends = [3, 17, 37, 5, 59];

// export function mockRandom() {
//     v = 0;
//     rnd.mockImplementation(() => {
//         index = (index + 1) % addends.length;
//         const add = addends[index];
//         v = (v + add) % 100;
//         counts[v] += 1;
//         return v / 100;
//     });
//     const make = jest.fn().mockImplementation(() => {
//         counts.fill(0);
//         index = 0;
//         return rnd;
//     });
//     // @ts-ignore
//     Random.configure({ make });
//     make.mockClear();
//     return rnd;
// }

export async function alwaysAsync(fn: Function, count = 1000) {
    for (let i = 0; i < count; ++i) {
        await fn();
    }
}

export function countTile(map: GWM.map.Map, tile: string) {
    let count = 0;
    map.cells.forEach((cell) => {
        if (cell.hasTile(tile)) ++count;
    });
    return count;
}

export function mockCell(map: GWM.map.Map, x: number, y: number): GWM.map.Cell {
    const cell = new GWM.map.Cell(map, x, y);
    jest.spyOn(cell, 'tileFlags').mockReturnValue(0);
    jest.spyOn(cell, 'tileMechFlags').mockReturnValue(0);
    jest.spyOn(cell, 'drawStatus');
    return cell;
}

export function mockMap(w = 10, h = 10): GWM.map.Map {
    const map = GWM.map.make(w, h);
    return map;
}

export function mockActor(): GWM.actor.Actor {
    const kind = new GWM.actor.ActorKind({ name: 'mock' });
    const actor = new GWM.actor.Actor(kind);
    actor.sprite.ch = 'a';
    jest.spyOn(actor, 'isPlayer').mockReturnValue(false);
    jest.spyOn(actor, 'forbidsCell').mockReturnValue(false);
    jest.spyOn(actor, 'blocksVision').mockReturnValue(false);
    jest.spyOn(actor, 'drawStatus');
    return actor;
}

export function mockPlayer(): GWM.actor.Actor {
    const player = mockActor();
    player.sprite.ch = '@';
    // @ts-ignore
    player.isPlayer.mockReturnValue(true);
    return player;
}

export function mockItem(): GWM.item.Item {
    const kind = new GWM.item.ItemKind({ name: 'mock', ch: '!' });
    const item = new GWM.item.Item(kind);
    jest.spyOn(item, 'forbidsCell').mockReturnValue(false);
    jest.spyOn(item, 'blocksVision').mockReturnValue(false);
    jest.spyOn(item, 'drawStatus');
    return item;
}
export function bufferStack(w: number, h: number): GWU.ui.BufferStack {
    const target: GWU.canvas.BufferTarget = {
        width: w,
        height: h,
        copyTo: jest.fn(),
        toGlyph(ch: string | number): number {
            if (typeof ch === 'string') return ch.charCodeAt(0);
            return ch;
        },
        draw: jest.fn(),
    };

    const loop = new GWU.io.Loop();

    const buffer = new GWU.canvas.Buffer(target);

    return {
        buffer,
        parentBuffer: buffer,
        pushBuffer() {
            return buffer;
        },
        popBuffer() {},
        loop,
    };
}

export function mockUI(width = 100, height = 38) {
    // @ts-ignore
    const canvas = bufferStack(width, height);

    return new GWU.ui.UI({
        loop: canvas.loop,
        canvas: canvas as GWU.canvas.BaseCanvas,
        layer: false,
    });
}

export function mockLayer(w: number, h: number): GWU.ui.Layer {
    const canvas = mockUI(w, h);
    const layer = new GWU.ui.Layer(canvas);
    return layer;
}

export function mockWidgetLayer(w: number, h: number): GWU.widget.WidgetLayer {
    const canvas = mockUI(w, h);
    const layer = new GWU.widget.WidgetLayer(canvas);
    return layer;
}

export function getBufferText(
    buffer: GWU.buffer.Buffer,
    x: number,
    y: number,
    width: number
): string {
    let text = '';
    for (let i = 0; i < width; ++i) {
        const data = buffer.info(x + i, y);
        if (!data.glyph) data.glyph = 32;
        text += String.fromCharCode(data.glyph);
    }
    return text.trim();
}

export function getBufferFg(
    buffer: GWU.buffer.Buffer,
    x: number,
    y: number
): number {
    const data = buffer.info(x, y);
    return data.fg;
}

export function getBufferBg(
    buffer: GWU.buffer.Buffer,
    x: number,
    y: number
): number {
    const data = buffer.info(x, y);
    return data.bg;
}

export async function pushEvent(
    loop: GWU.io.Loop,
    event: GWU.io.Event
): Promise<void> {
    loop.enqueue(event);
    do {
        await wait(10);
        // @ts-ignore
    } while (loop.currentHandler && loop.currentHandler._events.length);
}

export function keypress(key: string): GWU.io.Event {
    return GWU.io.makeKeyEvent({
        key,
        code: 'KEY_' + key.toUpperCase(),
    } as KeyboardEvent);
}

export function dir(name: 'up' | 'down' | 'left' | 'right'): GWU.io.Event {
    return GWU.io.makeKeyEvent({
        key: 'arrow' + name,
        code: 'ARROW' + name.toUpperCase(),
    } as KeyboardEvent);
}

export function click(x: number, y: number): GWU.io.Event {
    return GWU.io.makeMouseEvent({ buttons: 1 } as MouseEvent, x, y);
}

export function mousemove(x: number, y: number): GWU.io.Event {
    return GWU.io.makeMouseEvent({} as MouseEvent, x, y);
}

export function tick(dt = 16): GWU.io.Event {
    return GWU.io.makeTickEvent(dt);
}

export async function wait(dt = 1): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, dt));
}
