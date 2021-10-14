import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Layer from './layer';

describe('Layer', () => {
    let ui: UICore;
    let layer: Layer.Layer;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        layer = new Layer.Layer(ui);
    });

    test('get root', () => {
        const s = layer.$('layer');
        expect(s.selected).toEqual([layer.root]);

        const t = layer.$();
        expect(t.selected).toEqual([layer.root]);
    });

    test('computeStyles', () => {
        expect(layer.styles.dirty).toBeTruthy();
        expect(layer.root.style().dirty).toBeFalsy();
        expect(layer.root.used().dirty).toBeFalsy();
        expect(layer.root.used('fg')).toBeUndefined();
        expect(layer.root.used('bg')).toBeUndefined();
        expect(layer.root.used('width')).toEqual(50);
        expect(layer.root.used('height')).toEqual(30);
        expect(layer.root.style('fg')).toBeUndefined();
        expect(layer.root.style('bg')).toBeUndefined();
        expect(layer.root.style('width')).toEqual(50);
        expect(layer.root.style('height')).toEqual(30);

        layer.computeStyles();
        expect(layer.styles.dirty).toBeFalsy();
        expect(layer.root.style().dirty).toBeFalsy();
        expect(layer.root.used().dirty).toBeFalsy();

        expect(layer.root.used('fg')).toEqual('white');
        expect(layer.root.used('bg')).toEqual('black');
        expect(layer.root.used('width')).toEqual(50);
        expect(layer.root.used('height')).toEqual(30);
        expect(layer.root.style('fg')).toBeUndefined();
        expect(layer.root.style('bg')).toBeUndefined();
        expect(layer.root.style('width')).toEqual(50);
        expect(layer.root.style('height')).toEqual(30);
    });

    test('updateLayout - simple text box', () => {
        layer.$('<text>').text('test').appendTo('layer');

        layer.draw();

        const root = layer.root;
        const [a] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(a.bounds).toMatchObject({ x: 0, y: 0, width: 50, height: 1 });
    });

    test('updateLayout - simple text box with style', () => {
        layer
            .$('<text>')
            .text('test')
            .style({ fg: 'red', bg: 'white' })
            .appendTo('layer');

        layer.draw();

        const root = layer.root;
        const [a] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(a.bounds).toMatchObject({ x: 0, y: 0, width: 50, height: 1 });
    });

    test('updateLayout - 3 simple text boxes', () => {
        layer
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .appendTo('layer');

        layer.computeStyles();
        layer.updateLayout();

        const root = layer.root;
        const [a, b, c] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(a.bounds).toMatchObject({ x: 0, y: 0, width: 50, height: 1 });
        expect(b.bounds).toMatchObject({ x: 0, y: 1, width: 50, height: 1 });
        expect(c.bounds).toMatchObject({ x: 0, y: 2, width: 50, height: 1 });
    });

    test('updateLayout - boxes with padding', () => {
        layer
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .style('padding', 1)
            .appendTo('layer');

        layer.computeStyles();
        layer.updateLayout();

        const root = layer.root;
        const [a, b, c] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(a.bounds).toMatchObject({ x: 0, y: 0, width: 50, height: 3 });
        expect(b.bounds).toMatchObject({ x: 0, y: 3, width: 50, height: 3 });
        expect(c.bounds).toMatchObject({ x: 0, y: 6, width: 50, height: 3 });
    });

    test('updateLayout - root with padding', () => {
        layer
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .appendTo('layer');

        layer.$().style('padding', 1);

        layer.computeStyles();
        layer.updateLayout();

        const root = layer.root;
        const [a, b, c] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(root.used('padLeft')).toEqual(1);
        expect(root.used('padRight')).toEqual(1);
        expect(root.used('padTop')).toEqual(1);
        expect(root.used('padBottom')).toEqual(1);

        expect(a.bounds).toMatchObject({ x: 1, y: 1, width: 48, height: 1 });
        expect(b.bounds).toMatchObject({ x: 1, y: 2, width: 48, height: 1 });
        expect(c.bounds).toMatchObject({ x: 1, y: 3, width: 48, height: 1 });
    });

    test('updateLayout - root + widgets with padding', () => {
        layer
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .style('padding', 1)
            .appendTo('layer');

        layer.$().style('padding', 1);

        layer.computeStyles();
        layer.updateLayout();

        const root = layer.root;
        const [a, b, c] = root.children;

        expect(root.bounds).toMatchObject({
            x: 0,
            y: 0,
            width: 50,
            height: 30, // so that it will fill the screen (unique to root widget)
        });
        expect(root.used('padLeft')).toEqual(1);
        expect(root.used('padRight')).toEqual(1);
        expect(root.used('padTop')).toEqual(1);
        expect(root.used('padBottom')).toEqual(1);

        expect(a.bounds).toMatchObject({ x: 1, y: 1, width: 48, height: 3 });
        expect(b.bounds).toMatchObject({ x: 1, y: 4, width: 48, height: 3 });
        expect(c.bounds).toMatchObject({ x: 1, y: 7, width: 48, height: 3 });
    });
});
