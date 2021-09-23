import 'jest-extended';
import * as UTILS from '../test/utils';
import * as GWM from 'gw-map';
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
        expect(map.fov.isAnyKindOfVisible(10, 10)).toBeTruthy();
        expect(map.fov.isAnyKindOfVisible(1, 1)).toBeTruthy();
        expect(map.fov.isAnyKindOfVisible(19, 19)).toBeTruthy();

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(0);

        map.setTile(10, 10, 'SIGN');
        map.setTile(1, 1, 'SIGN');
        map.setTile(18, 18, 'SIGN');
        expect(
            map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)
        ).toBeTruthy();

        expect(
            map
                .knowledge(1, 1)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map
                .knowledge(10, 10)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map
                .knowledge(18, 18)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(3);
    });

    test('gather cells - only center is visible, others not revealed', () => {
        const map = GWM.map.make(20, 20, {
            tile: 'FLOOR',
            boundary: 'WALL',
            fov: true,
        });
        map.fov.update(10, 10, 5);
        expect(map.fov.isAnyKindOfVisible(1, 1)).toBeFalsy();
        expect(map.fov.isRevealed(1, 1)).toBeFalsy();
        expect(map.fov.isAnyKindOfVisible(10, 10)).toBeTruthy();
        expect(map.fov.isAnyKindOfVisible(19, 19)).toBeFalsy();
        expect(map.fov.isRevealed(19, 19)).toBeFalsy();

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(0);

        map.setTile(10, 10, 'SIGN');
        map.setTile(1, 1, 'SIGN');
        map.setTile(18, 18, 'SIGN');
        expect(
            map.hasMapFlag(GWM.flags.Map.MAP_SIDEBAR_TILES_CHANGED)
        ).toBeTruthy();

        expect(
            map
                .knowledge(1, 1)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeFalsy();
        expect(
            map
                .knowledge(10, 10)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeTruthy();
        expect(
            map
                .knowledge(18, 18)
                .hasEntityFlag(GWM.flags.Entity.L_LIST_IN_SIDEBAR)
        ).toBeFalsy();

        sidebar.updateCellCache(map);
        expect(sidebar.cellCache).toHaveLength(1);
    });
});
