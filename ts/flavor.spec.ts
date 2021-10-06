import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
// import * as UTILS from '../test/utils';

import * as Flavor from './flavor';
// import { UICore } from './types';

describe('Flavor', () => {
    describe('getFlavorText', () => {
        let map: GWM.map.Map;
        // let ui: UICore;
        let flavor: Flavor.Flavor;
        let fov: GWU.fov.FovSystem;

        beforeEach(() => {
            // ui = UTILS.mockUI();
            map = GWM.map.make(20, 20, {
                tile: 'FLOOR',
                boundary: 'WALL',
                // fov: true,
            });
            fov = new GWU.fov.FovSystem(map);
            fov.update(5, 5, 10);
            flavor = new Flavor.Flavor('FLAVOR', { x: 0, y: 4, width: 80 });
        });

        test('Basics', () => {
            expect(fov.isAnyKindOfVisible(0, 0)).toBeTruthy();
            expect(fov.isAnyKindOfVisible(1, 1)).toBeTruthy();
            expect(fov.isAnyKindOfVisible(2, 2)).toBeTruthy();
            expect(fov.isAnyKindOfVisible(3, 3)).toBeTruthy();
            expect(fov.isRevealed(0, 0)).toBeTruthy();
            expect(fov.isRevealed(1, 1)).toBeTruthy();
            expect(fov.isRevealed(2, 2)).toBeTruthy();
            expect(fov.isRevealed(3, 3)).toBeTruthy();

            expect(GWM.tile.tiles.WALL.getFlavor()).toEqual(
                'a rough stone wall'
            );

            let text = flavor.getFlavorText(map, 0, 0);
            expect(text).toEqual('you see a rough stone wall.');

            expect(GWM.tile.tiles.FLOOR.getFlavor()).toEqual('the stone floor');
            text = flavor.getFlavorText(map, 1, 1);
            expect(text).toEqual('you see the stone floor.');

            expect(GWM.tile.tiles.DOOR.getFlavor()).toEqual('a closed door');
            map.setTile(2, 2, 'DOOR');
            text = flavor.getFlavorText(map, 2, 2);
            expect(text).toEqual('you see a closed door.');

            expect(GWM.tile.tiles.LAKE.getFlavor()).toEqual('some deep water');
            map.setTile(3, 3, 'LAKE');
            text = flavor.getFlavorText(map, 3, 3);
            expect(text).toEqual('you see some deep water.');
        });
    });
});
