// import * as GWU from 'gw-utils';
// import * as GWM from 'gw-map';
import * as UTILS from '../../test/utils';

import * as Menu from './Menu';
import { UICore } from '../types';

describe('Menu', () => {
    let ui: UICore;
    let dialog: UTILS.MockWidgetRunner;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
        dialog = UTILS.mockDialog(ui);
    });

    afterEach(() => {
        ui.loop.stop();
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

    test('click + dirs', async () => {
        const widget = new Menu.Menu('MENU', {
            width: 80,
            height: 1,
            x: 0,
            y: 0,
            bg: 'red',
            fg: 'blue',
            buttons: {
                Apple: 'APPLE',
                Banana: {
                    Sliced: 'SLICED',
                    Whole: 'WHOLE',
                    Frozen: 'FROZEN',
                },
                Carrot: 'CARROT',
            },
        });
        const banana = widget.buttons[1] as Menu.DropDownButton;

        widget.draw(ui.buffer);

        await widget.click(UTILS.click(4, 0), dialog);
        expect(widget.active).not.toBeTruthy(); // handled by dialog
        expect(dialog.fireAction).toHaveBeenCalledWith('APPLE', widget);

        dialog.fireAction.mockClear();

        // console.log('show banana');

        const showBanana = widget.click(UTILS.click(12, 0), dialog);
        widget.draw(ui.buffer);

        expect(widget.activeIndex).toEqual(1);

        // showing a menu does not select any items on the menu right away
        banana.buttons.forEach((b) => {
            expect(b.hovered).toBeFalsy();
        });

        // console.log('click down');

        // Pressing the down arrow highlights the first item
        await UTILS.pushEvent(ui.loop, UTILS.dir('down'));
        widget.draw(ui.buffer);
        expect(banana.buttons[0].hovered).toBeTruthy();

        // Pressing the down arrow highlights the next item
        await UTILS.pushEvent(ui.loop, UTILS.dir('down'));
        widget.draw(ui.buffer);
        expect(banana.buttons[1].hovered).toBeTruthy();

        // Pressing the down arrow highlights the last item
        await UTILS.pushEvent(ui.loop, UTILS.dir('down'));
        widget.draw(ui.buffer);
        expect(banana.buttons[2].hovered).toBeTruthy();

        // last item is sticky
        await UTILS.pushEvent(ui.loop, UTILS.dir('down'));
        widget.draw(ui.buffer);
        expect(banana.buttons[2].hovered).toBeTruthy();

        // Pressing the up arrow highlights the last item
        await UTILS.pushEvent(ui.loop, UTILS.dir('up'));
        widget.draw(ui.buffer);
        expect(banana.buttons[1].hovered).toBeTruthy();

        // Pressing the up arrow highlights the last item
        await UTILS.pushEvent(ui.loop, UTILS.dir('up'));
        widget.draw(ui.buffer);
        expect(banana.buttons[0].hovered).toBeTruthy();

        // Pressing the up arrow closes the menu
        await UTILS.pushEvent(ui.loop, UTILS.dir('up'));
        widget.draw(ui.buffer);
        expect(banana.buttons[0].hovered).toBeFalsy();

        // the click is over
        await showBanana;

        expect(widget.activeIndex).toEqual(1);
    });
});
