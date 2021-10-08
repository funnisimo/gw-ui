import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Widget from './index';
import { UICore } from '../types';

describe('Button Widget', () => {
    let ui: UICore;
    let dialog: UTILS.MockWidgetRunner;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
        dialog = UTILS.mockDialog(ui);
    });

    test('create - text required', () => {
        expect(() => new Widget.Button('ID', { fg: 'red' })).toThrow();
    });

    test('create', () => {
        let widget = new Widget.Button('ID', { text: 'Button' });
        expect(widget.bounds.x).toEqual(-1);
        expect(widget.bounds.y).toEqual(-1);
        expect(widget.bounds.width).toEqual(6);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Button');

        widget.bounds.x = widget.bounds.y = 0;

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Button');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.white);
        expect(buffer.get(0, 0).bg).toEqual(GWU.color.colors.black);
    });

    test('hover', () => {
        let widget = new Widget.Button('ID', {
            text: 'Button',
            fg: 'red',
            bg: 'gray',
            activeFg: 'blue',
            activeBg: 'light_gray',
            x: 0,
            y: 0,
        });
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(6);
        expect(widget.bounds.height).toEqual(1);

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Button');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 0).bg).toEqual(GWU.color.colors.gray);

        widget.mousemove(UTILS.mousemove(0, 0), dialog);
        expect(widget.hovered).toBeTruthy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Button');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.blue);
        expect(buffer.get(0, 0).bg).toEqual(GWU.color.colors.light_gray);

        widget.mousemove(UTILS.mousemove(10, 10), dialog);
        expect(widget.hovered).toBeFalsy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Button');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 0).bg).toEqual(GWU.color.colors.gray);
    });

    test('hover - wide + tall', () => {
        let widget = new Widget.Button('ID', {
            text: 'Button',
            fg: 'red',
            bg: 'gray',
            activeFg: 'blue',
            activeBg: 'light_gray',
            width: 10,
            height: 2,
            x: 0,
            y: 0,
        });

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.gray);

        widget.mousemove(UTILS.mousemove(0, 0), dialog);
        expect(widget.hovered).toBeTruthy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.blue);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.light_gray);

        widget.mousemove(UTILS.mousemove(10, 10), dialog);
        expect(widget.hovered).toBeFalsy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.gray);
    });

    test('Enter', async () => {
        let widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            x: 0,
            y: 0,
        });

        expect(widget.keypress(UTILS.keypress('Enter'), dialog)).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        dialog.fireAction.mockClear();
        dialog.fireAction.mockResolvedValue(void 0);

        const r = widget.keypress(UTILS.keypress('Enter'), dialog);
        // @ts-ignore
        expect(r.then).toBeDefined(); // function
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        dialog.fireAction.mockClear();
        dialog.fireAction.mockReturnValue(void 0);

        widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            action: 'DONE',
        });

        expect(widget.keypress(UTILS.keypress('Enter'), dialog)).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('DONE', widget);
    });

    test('Click', async () => {
        let widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            x: 0,
            y: 0,
        });

        expect(widget.keypress(UTILS.keypress('Enter'), dialog)).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        dialog.fireAction.mockClear();
        dialog.fireAction.mockResolvedValue(void 0);

        const r = widget.click(UTILS.click(0, 0), dialog);
        // @ts-ignore
        expect(r.then).toBeDefined(); // function
        expect(dialog.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        dialog.fireAction.mockClear();
        dialog.fireAction.mockReturnValue(void 0);

        widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            action: 'DONE',
            x: 0,
            y: 0,
        });

        expect(widget.click(UTILS.click(0, 0), dialog)).toBeTruthy();
        expect(dialog.fireAction).toHaveBeenCalledWith('DONE', widget);
    });
});
