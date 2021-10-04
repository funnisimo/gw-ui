import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Widget from './index';

describe('Button Widget', () => {
    test('create - text required', () => {
        expect(() => new Widget.Button('ID', { fg: 'red' })).toThrow();
    });

    test('create', () => {
        let widget = new Widget.Button('ID', { text: 'Button' });
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(6);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text).toEqual('Button');

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

        widget.mousemove(0, 0);
        expect(widget.active).toBeTruthy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Button');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.blue);
        expect(buffer.get(0, 0).bg).toEqual(GWU.color.colors.light_gray);

        widget.mousemove(10, 10);
        expect(widget.active).toBeFalsy();
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
        });

        const buffer = new GWU.canvas.DataBuffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.gray);

        widget.mousemove(0, 0);
        expect(widget.active).toBeTruthy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.blue);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.light_gray);

        widget.mousemove(10, 10);
        expect(widget.active).toBeFalsy();
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 1, 10)).toEqual('Button');
        expect(buffer.get(0, 1).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(0, 1).bg).toEqual(GWU.color.colors.gray);
    });

    test('Enter', async () => {
        const container = {
            fireAction: jest.fn(),
        };

        let widget = new Widget.Button('ID', { width: 10, text: 'Test' });
        widget.parent = container;

        expect(widget.keypress(UTILS.keypress('Enter'))).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        container.fireAction.mockClear();
        container.fireAction.mockResolvedValue(void 0);

        const r = widget.keypress(UTILS.keypress('Enter'));
        // @ts-ignore
        expect(r.then).toBeDefined(); // function
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        container.fireAction.mockClear();
        container.fireAction.mockReturnValue(void 0);

        widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            action: 'DONE',
        });
        widget.parent = container;

        expect(widget.keypress(UTILS.keypress('Enter'))).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('DONE', widget);
    });

    test('Click', async () => {
        const container = {
            fireAction: jest.fn(),
        };

        let widget = new Widget.Button('ID', { width: 10, text: 'Test' });
        widget.parent = container;

        expect(widget.keypress(UTILS.keypress('Enter'))).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        container.fireAction.mockClear();
        container.fireAction.mockResolvedValue(void 0);

        const r = widget.click(UTILS.click(0, 0));
        // @ts-ignore
        expect(r.then).toBeDefined(); // function
        expect(container.fireAction).toHaveBeenCalledWith('ID', widget);

        expect(await r).toBeTruthy();

        container.fireAction.mockClear();
        container.fireAction.mockReturnValue(void 0);

        widget = new Widget.Button('ID', {
            width: 10,
            text: 'Test',
            action: 'DONE',
        });
        widget.parent = container;

        expect(widget.click(UTILS.click(0, 0))).toBeTruthy();
        expect(container.fireAction).toHaveBeenCalledWith('DONE', widget);
    });
});
