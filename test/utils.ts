import * as Map from '../ts/map';
import { Actor, ActorKind } from '../ts/actor';
import { Item, ItemKind } from '../ts/item';

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

export function countTile(map: Map.Map, tile: string) {
    let count = 0;
    map.cells.forEach((cell) => {
        if (cell.hasTile(tile)) ++count;
    });
    return count;
}

export function mockCell(): Map.Cell {
    const cell = new Map.Cell();
    jest.spyOn(cell, 'tileFlags').mockReturnValue(0);
    jest.spyOn(cell, 'tileMechFlags').mockReturnValue(0);
    return cell;
}

export function mockMap(w = 10, h = 10): Map.Map {
    const map = Map.make(w, h);
    jest.spyOn(map, 'isVisible').mockReturnValue(true);
    return map;
}

export function mockActor(): Actor {
    const kind = new ActorKind({ name: 'mock' });
    const actor = new Actor(kind);
    actor.sprite.ch = 'a';
    jest.spyOn(actor, 'isPlayer').mockReturnValue(false);
    jest.spyOn(actor, 'forbidsCell').mockReturnValue(false);
    jest.spyOn(actor, 'blocksVision').mockReturnValue(false);
    return actor;
}

export function mockPlayer(): Actor {
    const player = mockActor();
    player.sprite.ch = '@';
    // @ts-ignore
    player.isPlayer.mockReturnValue(true);
    return player;
}

export function mockItem(): Item {
    const kind = new ItemKind({ name: 'mock', ch: '!' });
    const item = new Item(kind);
    jest.spyOn(item, 'forbidsCell').mockReturnValue(false);
    jest.spyOn(item, 'blocksVision').mockReturnValue(false);
    return item;
}
