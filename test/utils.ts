import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as UI from '../ts/ui';
import * as Layer from '../ts/layer';

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

// @ts-ignore
export interface MockLoop extends GWU.io.Loop {
    run: jest.Mock<Promise<void>, [GWU.io.IOMap, number]>;
    stop: jest.Mock<void>;
}

export function mockLoop() {
    // @ts-ignore
    const loop: MockLoop = new GWU.io.Loop();
    jest.spyOn(loop, 'run');
    jest.spyOn(loop, 'stop');
    return loop;
}

export interface MockCanvas {
    readonly width: number;
    readonly height: number;
    render: jest.Mock<void>;
    copyTo: jest.Mock<void, [GWU.canvas.DataBuffer]>;
    draw: jest.Mock<boolean>;
    toGlyph: jest.Mock<number, [number | string]>;
    buffer: GWU.canvas.Buffer;
}

export function mockCanvas(w: number, h: number): MockCanvas {
    const canvas = {
        width: w,
        height: h,
        render: jest.fn(),
        copyTo: jest.fn(),
        draw: jest.fn(),
        toGlyph: jest.fn().mockImplementation((ch: string | number) => {
            if (typeof ch === 'number') return ch;
            return ch.charCodeAt(0);
        }),
    };

    const buffer = new GWU.canvas.Buffer(canvas);
    buffer.render = jest.fn();
    (<MockCanvas>canvas).buffer = buffer;

    return canvas as MockCanvas;
}

export function mockUI(width = 100, height = 38) {
    // @ts-ignore
    const loop = mockLoop();
    const canvas = mockCanvas(width, height);

    return new UI.UI({
        loop: loop as unknown as GWU.io.Loop,
        canvas: canvas as unknown as GWU.canvas.BaseCanvas,
    });
}

export function mockLayer(w: number, h: number): Layer.Layer {
    const ui = mockUI(w, h);
    const layer = new Layer.Layer(ui);
    return layer;
}

export function getBufferText(
    buffer: GWU.canvas.DataBuffer,
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
    buffer: GWU.canvas.DataBuffer,
    x: number,
    y: number
): number {
    const data = buffer.info(x, y);
    return data.fg;
}

export function getBufferBg(
    buffer: GWU.canvas.DataBuffer,
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
    loop.pushEvent(event);
    do {
        await wait(10);
    } while (loop.events.length);
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
