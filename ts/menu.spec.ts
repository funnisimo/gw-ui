// import * as GWU from 'gw-utils';
// import * as GWM from 'gw-map';
import * as UTILS from '../test/utils';

import * as Menu from './Menu';
import { UICore } from '.';
// import { UICore } from './types';

describe('Menu', () => {
    let ui: UICore;
    let dialog: UTILS.MockWidgetRunner;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
        dialog = UTILS.mockDialog(ui);
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

    test('action buttons', async () => {
        const widget = new Menu.Menu('MENU', {
            width: 80,
            height: 1,
            x: 0,
            y: 0,
            bg: 'red',
            fg: 'blue',
            buttons: {
                Apple: 'APPLE',
                Banana: 'BANANA',
                Carrot: 'CARROT',
            },
        });

        expect(widget.buttons).toHaveLength(3);

        widget.draw(ui.buffer);

        expect(UTILS.getBufferText(ui.buffer, 0, 0, 40)).toEqual(
            'Apple | Banana | Carrot |'
        );

        widget.activate();
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(0);
        expect(
            await widget.keypress(UTILS.keypress('Tab'), dialog)
        ).toBeTruthy(); // eat it
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(1);
        expect(
            await widget.keypress(UTILS.keypress('Tab'), dialog)
        ).toBeTruthy(); // eat it
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(2);
        expect(
            await widget.keypress(UTILS.keypress('Tab'), dialog)
        ).toBeFalsy(); // Not me anymore
        expect(widget.active).toBeFalsy();
        expect(widget.activeIndex).toEqual(-1);

        widget.activate(true);
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(2);
        expect(
            await widget.keypress(UTILS.keypress('TAB'), dialog)
        ).toBeTruthy(); // eat it
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(1);
        expect(
            await widget.keypress(UTILS.keypress('TAB'), dialog)
        ).toBeTruthy(); // eat it
        expect(widget.active).toBeTruthy();
        expect(widget.activeIndex).toEqual(0);
        expect(
            await widget.keypress(UTILS.keypress('TAB'), dialog)
        ).toBeFalsy(); // Not me anymore
        expect(widget.active).toBeFalsy();
        expect(widget.activeIndex).toEqual(-1);
    });
});
