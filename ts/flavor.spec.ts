import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as Flavor from './flavor';
import { UIType } from './types';

describe('Flavor', () => {
    describe('getFlavorText', () => {
        let map: GWM.map.Map;
        let ui: UIType;
        let flavor: Flavor.Flavor;

        beforeEach(() => {
            ui = {
                buffer: new GWU.canvas.DataBuffer(20, 20),
                loop: GWU.loop,
                render: jest.fn(),
                startDialog: jest.fn(),
                finishDialog: jest.fn(),
                resetDialogBuffer: jest.fn(),
            };
            map = GWM.map.make(20, 20, 'FLOOR', 'WALL');
            flavor = new Flavor.Flavor({ ui, x: 0, y: 4, width: 80 });
        });

        test('Basics', () => {
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
