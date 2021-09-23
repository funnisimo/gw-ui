import 'jest-extended';
import * as UTILS from '../test/utils';
import * as GWM from 'gw-map';
import * as GWU from 'gw-utils';
import * as Sidebar from './sidebar';
import { UIType } from './types';

describe('Sidebar', () => {
    let ui: UIType;
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
});
