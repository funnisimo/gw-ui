import 'jest-extended';
// import '@types/jest';

import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Widget from './index';
import { UICore } from '..';

describe('Input Widget', () => {
    let ui: UICore;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 50);
    });

    test('create', () => {
        const widget = new Widget.Input('ID', { default: 'Test' });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(10); // default
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Test');

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.text = '';
        widget.keypress(UTILS.keypress('e'), ui);
        widget.keypress(UTILS.keypress('a'), ui);
        widget.keypress(UTILS.keypress('t'), ui);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('eat');
        expect(widget.text).toEqual('eat');
        expect(widget.isValid()).toBeTruthy();
    });

    test('backspace + delete', () => {
        const widget = new Widget.Input('ID', { width: 15, default: 'Test' });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(15);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Test');

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.keypress(UTILS.keypress('Backspace'), ui);
        widget.keypress(UTILS.keypress('Delete'), ui);
        widget.keypress(UTILS.keypress('Backspace'), ui);
        widget.keypress(UTILS.keypress('a'), ui);
        widget.keypress(UTILS.keypress('c'), ui);
        widget.keypress(UTILS.keypress('o'), ui);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Taco');
        expect(widget.text).toEqual('Taco');
        expect(widget.isValid()).toBeTruthy();
    });

    test('Enter', async () => {
        const container = {
            fireAction: jest.fn(),
            requestRedraw: jest.fn(),
            ui: UTILS.mockUI(100, 40),
        };

        let widget = new Widget.Input('ID', { width: 10, default: 'Test' });
        widget.parent = container;

        expect(widget.keypress(UTILS.keypress('Enter'), ui)).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        container.fireAction.mockClear();
        container.fireAction.mockResolvedValue(void 0);

        const r = widget.keypress(UTILS.keypress('Enter'), ui);
        // @ts-ignore
        expect(r.then).toBeDefined(); // function
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        container.fireAction.mockClear();
        container.fireAction.mockReturnValue(void 0);

        widget = new Widget.Input('ID', {
            width: 10,
            default: 'Test',
            action: 'DONE',
        });
        widget.parent = container;

        expect(widget.keypress(UTILS.keypress('Enter'), ui)).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('DONE', widget);
    });
});
