import 'jest-extended';
// import '@types/jest';

import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Widget from './index';
import { UICore } from '..';

describe('Input Widget', () => {
    let ui: UICore;
    let dialog: UTILS.MockWidgetRunner;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 50);
        dialog = UTILS.mockDialog(ui);
    });

    test('create', () => {
        const widget = new Widget.Input('ID', { default: 'Test' });

        expect(widget.bounds.x).toEqual(-1);
        expect(widget.bounds.y).toEqual(-1);
        expect(widget.bounds.width).toEqual(10); // default
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Test');

        widget.bounds.x = widget.bounds.y = 0;

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.text = '';
        widget.keypress(UTILS.keypress('e'), dialog);
        widget.keypress(UTILS.keypress('a'), dialog);
        widget.keypress(UTILS.keypress('t'), dialog);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('eat');
        expect(widget.text).toEqual('eat');
        expect(widget.isValid()).toBeTruthy();
    });

    test('backspace + delete', () => {
        const widget = new Widget.Input('ID', {
            width: 15,
            default: 'Test',
            x: 0,
            y: 0,
        });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(15);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Test');

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.keypress(UTILS.keypress('Backspace'), dialog);
        widget.keypress(UTILS.keypress('Delete'), dialog);
        widget.keypress(UTILS.keypress('Backspace'), dialog);
        widget.keypress(UTILS.keypress('a'), dialog);
        widget.keypress(UTILS.keypress('c'), dialog);
        widget.keypress(UTILS.keypress('o'), dialog);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Taco');
        expect(widget.text).toEqual('Taco');
        expect(widget.isValid()).toBeTruthy();
    });

    test('Enter', async () => {
        let widget = new Widget.Input('ID', { width: 10, default: 'Test' });
        expect(widget.action).toEqual('ID');

        expect(
            await widget.keypress(UTILS.keypress('Enter'), dialog)
        ).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        dialog.fireAction.mockClear();
        dialog.fireAction.mockResolvedValue(void 0);

        const r = widget.keypress(
            UTILS.keypress('Enter'),
            dialog
        ) as Promise<boolean>;
        expect(r.then).toBeDefined(); // function
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        dialog.fireAction.mockClear();
        dialog.fireAction.mockReturnValue(void 0);

        widget = new Widget.Input('ID', {
            width: 10,
            default: 'Test',
            action: 'DONE',
        });

        expect(widget.keypress(UTILS.keypress('Enter'), dialog)).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('DONE', widget);
    });
});
