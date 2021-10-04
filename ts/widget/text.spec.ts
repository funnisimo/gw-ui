import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Widget from './index';

describe('Text Widget', () => {
    test('text required', () => {
        expect(() => new Widget.Text('TEST', { fg: 'red' })).toThrow();
    });

    test('text width', () => {
        // Takes everything
        let widget = new Widget.Text('TEST', {
            text: 'Testing a long message.',
        });
        expect(widget.text).toEqual('Testing a long message.');
        expect(widget.bounds.width).toEqual(23);
        expect(widget.bounds.height).toEqual(1);

        // Truncates
        widget = new Widget.Text('TEST', {
            text: 'Testing a long message.',
            width: 20,
        });
        expect(widget.text).toEqual('Testing a long messa');
        expect(widget.bounds.width).toEqual(20);
        expect(widget.bounds.height).toEqual(1);

        // Wraps
        widget = new Widget.Text('TEST', {
            text: 'Testing a long message.',
            wrap: 20,
        });
        expect(widget.text).toEqual('Testing a long message.');
        expect(widget.bounds.width).toEqual(20);
        expect(widget.bounds.height).toEqual(2);
        expect(widget.lines).toEqual(['Testing a long', 'message.']);

        const buffer = new GWU.canvas.DataBuffer(100, 40);
        widget.draw(buffer);
        // buffer.dump();
        expect(UTILS.getBufferText(buffer, 0, 0, 20)).toEqual('Testing a long');
        expect(UTILS.getBufferText(buffer, 0, 1, 20)).toEqual('message.');
    });

    test('draw', () => {
        const widget = new Widget.Text('TEST', { text: 'Test', fg: 'red' });
        expect(widget.text).toEqual('Test');
        expect(widget.lines).toEqual(['Test']);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(4);
        expect(widget.bounds.height).toEqual(1);

        const buffer = new GWU.canvas.DataBuffer(100, 40);
        widget.draw(buffer);
        // buffer.dump();
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test');
        expect(buffer.get(0, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(1, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(2, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(3, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.get(4, 0).fg).toEqual(GWU.color.colors.black);
    });
});
