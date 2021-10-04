import * as UTILS from '../../test/utils';
import { UICore } from '../types';
// import * as GWU from 'gw-utils';
import * as Widget from './index';

describe('Dialog', () => {
    let ui: UICore;

    beforeEach(() => {
        ui = UTILS.mockUI(60, 40);
    });

    afterEach(() => {
        ui.loop.stop();
    });

    test('build - confirm', async () => {
        const dlg = new Widget.Dialog('TEST', {
            width: 20,
            height: 5,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        });
        dlg.addWidget(
            2,
            1,
            new Widget.Text('PROMPT', { text: 'Hello World!', fg: 'green' })
        );
        const ok = dlg.addWidget(
            2,
            3,
            new Widget.Button('OK', {
                text: 'OK',
                width: 10,
                fg: 'green',
                activeFg: 'light_green',
                activeBg: 'darkest_green',
            })
        );
        dlg.setActionHandlers({
            OK: () => {
                dlg.close(true);
            },
        });
        // dlg.setKeyHandlers({
        //     Escape: () => {
        //         dlg.close(false);
        //     },
        // });

        expect(dlg.bounds.x).toEqual(-1);
        expect(dlg.bounds.y).toEqual(-1);

        let result = dlg.show(ui);

        expect(dlg.bounds.x).toEqual(20);
        expect(dlg.bounds.y).toEqual(17);
        expect(dlg.activeWidget).toBe(ok);

        ui.loop.pushEvent(UTILS.keypress('Enter'));

        expect(await result).toBeTruthy();

        result = dlg.show(ui);

        expect(dlg.bounds.x).toEqual(20);
        expect(dlg.bounds.y).toEqual(17);
        expect(dlg.activeWidget).toBe(ok);

        expect(ok.contains(24 - dlg.bounds.x, 20 - dlg.bounds.y)).toBeTruthy();
        ui.loop.pushEvent(UTILS.click(24, 20));

        expect(await result).toBeTruthy();
    });

    test('build - confirm or cancel', async () => {
        const dlg = new Widget.Dialog('TEST', {
            width: 50,
            height: 5,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        });
        dlg.addWidget(
            2,
            1,
            new Widget.Text('PROMPT', { text: 'Hello World!', fg: 'green' })
        );
        const ok = dlg.addWidget(
            2,
            -2, // From bottom
            new Widget.Button('OK', {
                text: 'OK',
                fg: 'green',
                activeFg: 'light_green',
                activeBg: 'darkest_green',
                width: 10,
            })
        );
        const cancel = dlg.addWidget(
            -12, // 12 from right
            -2,
            new Widget.Button('CANCEL', {
                text: 'CANCEL',
                fg: 'green',
                activeFg: 'light_green',
                activeBg: 'darkest_green',
                width: 10,
            })
        );
        dlg.setActionHandlers({
            OK: () => {
                dlg.close(true);
            },
            CANCEL: () => {
                dlg.close(false);
            },
        });

        expect(dlg.bounds.x).toEqual(-1);
        expect(dlg.bounds.y).toEqual(-1);

        // OK HANDLERS

        let result = dlg.show(ui);

        expect(dlg.bounds.x).toEqual(5);
        expect(dlg.bounds.y).toEqual(17);
        expect(dlg.activeWidget).toBe(ok);

        ui.loop.pushEvent(UTILS.keypress('Enter'));
        expect(await result).toBeTruthy();

        result = dlg.show(ui);

        expect(dlg.bounds.x).toEqual(5);
        expect(dlg.bounds.y).toEqual(17);
        expect(dlg.activeWidget).toBe(ok);

        expect(ok.contains(9 - dlg.bounds.x, 20 - dlg.bounds.y)).toBeTruthy();
        ui.loop.pushEvent(UTILS.click(9, 20));

        expect(await result).toBeTruthy();

        // CANCEL HANDLERS

        result = dlg.show(ui);

        expect(dlg.activeWidget).toBe(ok);
        ui.loop.pushEvent(UTILS.keypress('Tab'));
        ui.loop.pushEvent(UTILS.keypress('Enter'));
        expect(await result).toBeFalsy();
        expect(dlg.activeWidget).toBe(cancel);

        result = dlg.show(ui);

        expect(dlg.activeWidget).toBe(ok);
        expect(dlg.widgetAt(43, 20)).toBe(cancel);
        ui.loop.pushEvent(UTILS.click(43, 20));
        expect(await result).toBeFalsy();
        expect(dlg.activeWidget).toBe(cancel);
    });

    test('build - alert', async () => {
        const dlg = new Widget.Dialog('TEST', {
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
            width: 50, // TODO - Figure out how to dynamically size?
        });
        dlg.addWidget(
            2,
            1,
            new Widget.Text('PROMPT', {
                text: 'Hello World!',
                fg: 'green',
                wrap: 46,
            })
        );
        dlg.setActionHandlers({
            DONE: () => {
                dlg.close(false);
            }, // not interrupted
        });
        dlg.setKeyHandlers({
            keypress: () => {
                dlg.close(true);
            }, // interrupted
        });

        dlg.setTimeout('DONE', 500);

        let result = await dlg.show(ui);
        expect(result).toBeFalsy(); // not interrupted

        // MUST set timeout again
        dlg.setTimeout('DONE', 500);

        result = dlg.show(ui);
        ui.loop.pushEvent(UTILS.keypress('a'));
        expect(await result).toBeTruthy(); // interrupted
    });

    test.only('input box - confirm or cancel', async () => {
        const dlg = new Widget.Dialog('TEST', {
            width: 50,
            height: 7,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        });
        dlg.addWidget(
            2,
            1,
            new Widget.Text('PROMPT', {
                text: 'What is your name?',
                fg: 'green',
            })
        );

        dlg.addWidget(2, 3, new Widget.Text('LABEL', { text: 'Name:' }));
        const input: Widget.Input = dlg.addWidget(
            8,
            3,
            new Widget.Input('INPUT', {
                hint: 'length 5',
                minLength: 5,
                width: 10,
            })
        );
        dlg.addWidget(
            2,
            -2,
            new Widget.Button('OK', {
                text: 'OK',
                fg: 'green',
                activeFg: 'light_green',
                activeBg: 'darkest_green',
                width: 10,
            })
        );
        dlg.addWidget(
            -12, // 12 from right
            -2,
            new Widget.Button('CANCEL', {
                text: 'CANCEL',
                fg: 'green',
                activeFg: 'light_green',
                activeBg: 'darkest_green',
                width: 10,
            })
        );
        dlg.setKeyHandlers({
            Enter: () => {
                if (input.isValid()) dlg.close(input.value);
            },
            Escape: () => {
                dlg.close(null);
            },
        });
        dlg.setActionHandlers({
            OK: () => {
                if (input.isValid()) dlg.close(input.value);
            },
            CANCEL: () => {
                dlg.close(null);
            },
        });

        // OK

        let result = dlg.show(ui);
        expect(dlg.activeWidget).toBe(input);

        for (let letter of 'testing') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Enter'));

        expect(await result).toEqual('testing');

        // Cancel

        result = dlg.show(ui);
        expect(dlg.activeWidget).toBe(input);
        expect(input.text).toEqual(''); // resets on second display of dialog

        for (let letter of 'testing') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Escape'));
        expect(await result).toEqual(null);

        // Too short (Does not submit)
        result = dlg.show(ui);
        expect(dlg.activeWidget).toBe(input);
        expect(input.text).toEqual(''); // resets on second display of dialog

        for (let letter of 'test') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Enter'));
        ui.loop.pushEvent(UTILS.keypress('Escape'));
        expect(await result).toEqual(null);
    });
});
