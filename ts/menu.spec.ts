// import * as GWU from 'gw-utils';
// import * as GWM from 'gw-map';
import * as UTILS from '../test/utils';

import * as Menu from './Menu';
import { UICore } from '.';
// import { UICore } from './types';

describe('Menu', () => {
    let ui: UICore;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
    });

    test('empty', () => {
        const widget = new Menu.Menu('MENU', {
            width: 80,
            height: 1,
            x: 0,
            y: 0,
            bg: 'red',
            fg: 'blue',
            buttons: {},
        });

        widget.draw(ui.buffer);

        expect(UTILS.getBufferText(ui.buffer, 0, 0, 20)).toEqual('');
    });

    test('action buttons', () => {
        const widget = new Menu.Menu('MENU', {
            width: 80,
            height: 1,
            x: 0,
            y: 0,
            bg: 'red',
            fg: 'blue',
            buttons: {
                Apple: 'APPLE',
                Banana: () => true,
                Carrot: 'CARROT',
            },
        });

        expect(widget.buttons).toHaveLength(3);

        widget.draw(ui.buffer);

        expect(UTILS.getBufferText(ui.buffer, 0, 0, 40)).toEqual(
            'Apple | Banana | Carrot |'
        );
    });
});
