// import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as UTILS from '../test/utils';

import * as Flavor from './flavor';
import { UIType } from './types';

describe('Flavor', () => {
    describe('getFlavorText', () => {
        let map: GWM.map.Map;
        let ui: UIType;
        let flavor: Flavor.Flavor;

        beforeEach(() => {
            ui = UTILS.mockUI();
            map = GWM.map.make(20, 20, {
                tile: 'FLOOR',
                boundary: 'WALL',
                fov: true,
            });
            map.fov.update(5, 5, 10);
            flavor = new Flavor.Flavor({ ui, x: 0, y: 4, width: 80 });
        });

        test('Basics', () => {
            expect(map.fov.isAnyKindOfVisible(0, 0)).toBeTruthy();
            expect(map.fov.isAnyKindOfVisible(1, 1)).toBeTruthy();
            expect(map.fov.isAnyKindOfVisible(2, 2)).toBeTruthy();
            expect(map.fov.isAnyKindOfVisible(3, 3)).toBeTruthy();
            expect(map.fov.isRevealed(0, 0)).toBeTruthy();
            expect(map.fov.isRevealed(1, 1)).toBeTruthy();
            expect(map.fov.isRevealed(2, 2)).toBeTruthy();
            expect(map.fov.isRevealed(3, 3)).toBeTruthy();

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
