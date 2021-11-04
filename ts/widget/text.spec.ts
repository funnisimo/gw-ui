import 'jest-extended';
import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Text from './text';
import * as Layer from '../layer';

describe('Text Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('text create empty', () => {
        // Takes everything
        let widget = new Text.Text(layer, {
            id: 'TEST',
            width: 30,
            text: '',
        });
        expect(widget.text()).toEqual('');
        expect(widget.bounds.width).toEqual(30);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        expect(widget.parent).toBe(layer.body);
        expect(layer._depthOrder).toContain(widget);
        expect(layer._attachOrder).toContain(widget);
    });

    test('text create', () => {
        // Takes everything
        let widget = new Text.Text(layer, {
            id: 'TEST',
            text: 'Testing a long message.',
        });
        expect(widget.text()).toEqual('Testing a long message.');
        expect(widget.bounds.width).toEqual(23);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        expect(widget.parent).toBe(layer.body);
        expect(layer._depthOrder).toContain(widget);
        expect(layer._attachOrder).toContain(widget);
    });

    test('text width', () => {
        // Takes everything
        let widget = layer.text('Testing a long message.', { id: 'TEST' });
        expect(widget.text()).toEqual('Testing a long message.');
        expect(widget.bounds.width).toEqual(23);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        // Truncates
        widget = layer.text('Testing a long message.', {
            id: 'TEST',
            width: 20,
            height: 1,
        });
        expect(widget.text()).toEqual('Testing a long message.');
        expect(widget._lines).toEqual(['Testing a long']);
        expect(widget.bounds.width).toEqual(20);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        // Wraps
        widget = layer.text('Testing a long message.', {
            id: 'TEST',
            width: 20,
            x: 0,
            y: 0,
        });
        expect(widget.text()).toEqual('Testing a long message.');
        expect(widget.bounds.width).toEqual(20);
        expect(widget.bounds.height).toEqual(2);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        expect(widget._lines).toEqual(['Testing a long', 'message.']);

        const buffer = new GWU.canvas.DataBuffer(100, 40);
        widget.draw(buffer);
        // buffer.dump();
        expect(UTILS.getBufferText(buffer, 0, 0, 20)).toEqual('Testing a long');
        expect(UTILS.getBufferText(buffer, 0, 1, 20)).toEqual('message.');
    });

    test('draw', () => {
        const widget = layer.text('Test', {
            id: 'TEST',
            fg: 'red',
            x: 0,
            y: 0,
        });
        expect(widget.text()).toEqual('Test');
        expect(widget._lines).toEqual(['Test']);
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(4);
        expect(widget.bounds.height).toEqual(1);

        const buffer = new GWU.canvas.DataBuffer(100, 40);
        widget.draw(buffer);
        // buffer.dump();
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test');
        expect(buffer.info(0, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.info(1, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.info(2, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.info(3, 0).fg).toEqual(GWU.color.colors.red);
        expect(buffer.info(4, 0).fg).toEqual(GWU.color.colors.black);
    });
});
