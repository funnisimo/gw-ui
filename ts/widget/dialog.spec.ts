import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import { buildDialog } from './dialog';
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
        const dlg = buildDialog(ui, {
            width: 20,
            height: 5,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        })
            .with(
                new Widget.Text('PROMPT', {
                    x: 2,
                    y: 1,
                    text: 'Hello World!',
                    fg: 'green',
                })
            )
            .with(
                new Widget.Button('OK', {
                    x: 2,
                    y: 3,
                    text: 'OK',
                    width: 10,
                    fg: 'green',
                    activeFg: 'light_green',
                    activeBg: 'darkest_green',
                })
            )
            .center()
            .done();

        dlg.setActionHandlers({
            OK: () => {
                dlg.close(true);
            },
        });

        expect(dlg.bounds.x).toEqual(20);
        expect(dlg.bounds.y).toEqual(17);
        const ok = dlg.getWidget('OK')!;

        // OK - Enter

        let result = dlg.show();
        expect(dlg.activeWidget).toBe(ok);

        ui.loop.pushEvent(UTILS.keypress('Enter'));

        expect(await result).toBeTruthy();

        // OK - Click

        result = dlg.show();
        expect(dlg.activeWidget).toBe(ok);

        expect(ok.contains(24, 20)).toBeTruthy();
        ui.loop.pushEvent(UTILS.click(24, 20));

        expect(await result).toBeTruthy();
    });

    test('build - confirm or cancel', async () => {
        const dlg = buildDialog(ui, {
            width: 50,
            height: 5,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        })
            .with(
                new Widget.Text('PROMPT', {
                    x: 2,
                    y: 1,
                    text: 'Hello World!',
                    fg: 'green',
                })
            )
            .with(
                new Widget.Button('OK', {
                    x: 2,
                    y: 3,
                    text: 'OK',
                    fg: 'green',
                    activeFg: 'light_green',
                    activeBg: 'darkest_green',
                    width: 10,
                })
            )
            .with(
                new Widget.Button('CANCEL', {
                    x: -2,
                    y: 3,
                    text: 'CANCEL',
                    fg: 'green',
                    activeFg: 'light_green',
                    activeBg: 'darkest_green',
                    width: 10,
                })
            )
            .center()
            .done();

        dlg.setActionHandlers({
            OK: () => {
                dlg.close(true);
            },
            CANCEL: () => {
                dlg.close(false);
            },
        });

        expect(dlg.bounds.x).toEqual(5);
        expect(dlg.bounds.y).toEqual(17);
        const ok = dlg.getWidget('OK')!;
        const cancel = dlg.getWidget('CANCEL')!;

        // OK HANDLERS

        let result = dlg.show();

        expect(dlg.activeWidget).toBe(ok);

        ui.loop.pushEvent(UTILS.keypress('Enter'));
        expect(await result).toBeTruthy();

        result = dlg.show();

        expect(dlg.activeWidget).toBe(ok);
        expect(ok.contains(9, 20)).toBeTruthy();
        ui.loop.pushEvent(UTILS.click(9, 20));

        expect(await result).toBeTruthy();

        // CANCEL HANDLERS

        result = dlg.show();

        expect(dlg.activeWidget).toBe(ok);
        ui.loop.pushEvent(UTILS.keypress('Tab'));
        ui.loop.pushEvent(UTILS.keypress('Enter'));
        expect(await result).toBeFalsy();
        expect(dlg.activeWidget).toBe(cancel);

        result = dlg.show();

        expect(dlg.activeWidget).toBe(ok);
        expect(dlg.widgetAt(43, 20)).toBe(cancel);
        ui.loop.pushEvent(UTILS.click(43, 20));
        expect(await result).toBeFalsy();
        expect(dlg.activeWidget).toBe(cancel);
    });

    test('build - alert', async () => {
        const dlg = buildDialog(ui, {
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
            width: 50, // TODO - Figure out how to dynamically size?
        })
            .with(
                new Widget.Text('PROMPT', {
                    x: 2,
                    y: 1,
                    text: 'Hello World!',
                    fg: 'green',
                    wrap: 46,
                })
            )
            .center()
            .done();

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

        let result = await dlg.show();
        expect(result).toBeFalsy(); // not interrupted

        // MUST set timeout again
        dlg.setTimeout('DONE', 500);

        result = dlg.show();
        ui.loop.pushEvent(UTILS.keypress('a'));
        expect(await result).toBeTruthy(); // interrupted
    });

    test('input box - confirm or cancel', async () => {
        const dlg = buildDialog(ui, {
            width: 50,
            height: 7,
            bg: 'blue',
            borderBg: 'dark_blue',
            title: 'Dialog',
            titleFg: 'yellow',
        })
            .with(
                new Widget.Text('PROMPT', {
                    x: 2,
                    y: 1,
                    text: 'What is your name?',
                    fg: 'green',
                })
            )
            .with(new Widget.Text('LABEL', { x: 2, y: 3, text: 'Name:' }))
            .with(
                new Widget.Input('INPUT', {
                    x: 8,
                    y: 3,
                    hint: 'length 5',
                    minLength: 5,
                    width: 10,
                })
            )
            .with(
                new Widget.Button('OK', {
                    x: 2,
                    y: 6,
                    text: 'OK',
                    fg: 'green',
                    activeFg: 'light_green',
                    activeBg: 'darkest_green',
                    width: 10,
                })
            )
            .with(
                new Widget.Button('CANCEL', {
                    x: -2, // 12 from right
                    y: 6,
                    text: 'CANCEL',
                    fg: 'green',
                    activeFg: 'light_green',
                    activeBg: 'darkest_green',
                    width: 10,
                })
            )
            .center()
            .done();

        const input = dlg.getWidget('INPUT') as Widget.Input;

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

        let result = dlg.show();
        expect(dlg.activeWidget).toBe(input);

        for (let letter of 'testing') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Enter'));

        expect(await result).toEqual('testing');

        // Cancel

        result = dlg.show();
        expect(dlg.activeWidget).toBe(input);
        expect(input.text).toEqual(''); // resets on second display of dialog

        for (let letter of 'testing') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Escape'));
        expect(await result).toEqual(null);

        // Too short (Does not submit)
        result = dlg.show();
        expect(dlg.activeWidget).toBe(input);
        expect(input.text).toEqual(''); // resets on second display of dialog

        for (let letter of 'test') {
            ui.loop.pushEvent(UTILS.keypress(letter));
        }
        ui.loop.pushEvent(UTILS.keypress('Enter'));
        ui.loop.pushEvent(UTILS.keypress('Escape'));
        expect(await result).toEqual(null);
    });

    test('build - pad=1', () => {
        const dlg = Widget.buildDialog(ui, {})
            .with(
                new Widget.Text('TEXT', {
                    text: 'This is a simple example.',
                    wrap: 40,
                })
            )
            .center()
            .done();

        const text = dlg.getWidget('TEXT') as Widget.Button;
        expect(text.bounds.width).toEqual(40);
        expect(text.bounds.height).toEqual(1);

        expect(dlg.bounds.height).toEqual(3);
        expect(dlg.bounds.width).toEqual(42);
    });

    test('build - pad=1, 2 texts', () => {
        const dlg = Widget.buildDialog(ui, {})
            .with(
                new Widget.Text('A', {
                    text: 'This is a simple example.',
                    wrap: 40,
                })
            )
            .with(
                new Widget.Text('B', {
                    text: 'This is a simple example.',
                    wrap: 30,
                })
            )
            .center()
            .done();

        const textA = dlg.getWidget('A') as Widget.Button;
        expect(textA.bounds.width).toEqual(40);
        expect(textA.bounds.height).toEqual(1);

        const textB = dlg.getWidget('B') as Widget.Button;
        expect(textB.bounds.width).toEqual(30);
        expect(textB.bounds.height).toEqual(1);

        expect(dlg.bounds.height).toEqual(5);
        expect(dlg.bounds.width).toEqual(42);
    });

    test.only('build - negative x, y, pad=1', () => {
        const builder = Widget.buildDialog(ui, { height: 5, width: 42 });

        builder.with(
            new Widget.Text('TEXT', {
                text: 'This is a simple example.',
            })
        );
        builder.with(new Widget.Button('OK', { text: 'OK', y: -1 }));
        builder.with(
            new Widget.Button('CANCEL', { text: 'CANCEL', x: -1, y: -1 })
        );
        builder.center();
        const dlg = builder.done();

        const ok = dlg.getWidget('OK') as Widget.Button;
        const cancel = dlg.getWidget('CANCEL') as Widget.Button;

        // console.log('dialog', dlg.bounds, dlg.bounds.right, dlg.bounds.bottom);
        // console.log('text', dlg.getWidget('TEXT')!.bounds);
        // console.log('ok', ok.bounds);
        // console.log(
        //     'cancel',
        //     cancel.bounds,
        //     cancel.bounds.right,
        //     cancel.bounds.bottom
        // );

        expect(dlg.bounds.height).toEqual(5);
        expect(dlg.bounds.width).toEqual(42);

        expect(ok.bounds.x).toEqual(dlg.bounds.x + 1);
        expect(ok.bounds.y).toEqual(dlg.bounds.bottom - 1);
        expect(cancel.bounds.y).toEqual(dlg.bounds.bottom - 1);
        expect(cancel.bounds.right).toEqual(dlg.bounds.right - 1);
    });
});
