import 'jest-extended';
import * as UTILS from '../test/utils';
import * as GWM from 'gw-map';
import * as GWU from 'gw-utils';
import * as Sidebar from './sidebar';
import { UICore } from './types';

describe('Sidebar', () => {
    let ui: UICore;
    let sidebar: Sidebar.Sidebar;

    beforeAll(() => {
        GWM.tile.install('SIGN', {
            extends: 'FLOOR',
            flags: 'L_LIST_IN_SIDEBAR',
            name: 'A sign',
            ch: '!',
            fg: 'white',
        });

        ui = UTILS.mockUI(100, 38);

        sidebar = new Sidebar.Sidebar({
            ui,
            x: 0,
            y: 0,
            width: 20,
            height: 38,
        });
    });

    test('gather cells - everything is visible', () => {
        const map = GWM.map.make(20, 20, 'FLOOR', 'WALL');

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(0);

        map.setTile(10, 10, 'SIGN');
        map.setTile(1, 1, 'SIGN');
        map.setTile(18, 18, 'SIGN');
        expect(
            map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)
        ).toBeTruthy();

        expect(
            map.cell(1, 1).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map.cell(10, 10).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map.cell(18, 18).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(3);
    });

    test('gather cells - only center is visible, others not revealed', () => {
        const map = GWM.map.make(20, 20, {
            tile: 'FLOOR',
            boundary: 'WALL',
        });
        const memory = new GWM.memory.Memory(map);
        const fov = new GWU.fov.FovSystem(map, {
            onFovChange: memory,
        });

        map.setTile(10, 10, 'SIGN');
        map.setTile(1, 1, 'SIGN');
        map.setTile(18, 18, 'SIGN');

        sidebar.updateCellCache(memory);
        expect(sidebar.cellCache).toHaveLength(0);

        fov.update(10, 10, 5);

        // by default everything is visible
        expect(
            map.cell(1, 1).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map.cell(10, 10).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map.cell(18, 18).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();

        expect(fov.isAnyKindOfVisible(1, 1)).toBeFalsy();
        expect(fov.isRevealed(1, 1)).toBeFalsy();
        expect(fov.isAnyKindOfVisible(10, 10)).toBeTruthy();
        expect(fov.isAnyKindOfVisible(19, 19)).toBeFalsy();
        expect(fov.isRevealed(19, 19)).toBeFalsy();

        expect(
            map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)
        ).toBeTruthy();

        expect(
            memory.cell(1, 1).hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeFalsy();
        expect(
            memory
                .cell(10, 10)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            memory
                .cell(18, 18)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeFalsy();

        sidebar.updateCellCache(memory);
        expect(sidebar.cellCache).toHaveLength(1);
    });

    test('collecting entries', async () => {
        const map = GWM.map.make(20, 20, {
            tile: 'FLOOR',
            boundary: 'WALL',
        });
        const memory = new GWM.memory.Memory(map);
        const fov = new GWU.fov.FovSystem(map, {
            onFovChange: memory,
            visible: true,
        });

        // These will be visible...
        map.setTile(2, 2, 'SIGN');
        const a1 = GWM.actor.from({ ch: 'a', name: 'Actor 1' });
        await map.addActor(3, 3, a1);
        const i1 = GWM.item.from({ ch: 'b', name: 'Item 1' });
        await map.addItem(4, 4, i1);

        // These will be revealed...
        map.setTile(7, 7, 'SIGN');
        const a2 = GWM.actor.from({ ch: 'a', name: 'Actor 2' });
        await map.addActor(8, 8, a2);
        const i2 = GWM.item.from({ ch: 'b', name: 'Item 2' });
        await map.addItem(9, 9, i2);

        fov.update(1, 1, 5);

        // These will not be known (not in memory)
        map.setTile(16, 16, 'SIGN');
        const a3 = GWM.actor.from({ ch: 'a', name: 'Actor 3' });
        await map.addActor(17, 17, a3);
        const i3 = GWM.item.from({ ch: 'b', name: 'Item 3' });
        await map.addItem(18, 18, i3);

        expect(memory.actors).toHaveLength(1); // 1 not visible + known actor
        expect(map.actors).toHaveLength(3);

        expect(memory.items).toHaveLength(1); // 1 not visible + known item
        expect(map.items).toHaveLength(3);

        let count = 0;
        memory.eachActor(() => ++count);
        expect(count).toEqual(2); // 1 visible, 1 known
        count = 0;
        memory.eachItem(() => ++count);
        expect(count).toEqual(2); // 1 visible, 1 known

        sidebar.updateCellCache(memory);
        expect(sidebar.cellCache).toHaveLength(2);

        sidebar.findEntries(memory, 1, 1, fov);
        expect(sidebar.entries).toHaveLength(6); // visible sign + actor + item, revealed sign + actor + item
    });
});
