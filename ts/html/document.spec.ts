import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Document from './document';

describe('Document', () => {
    let ui: UICore;
    let document: Document.Document;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        document = new Document.Document(ui);
    });

    test('get body', () => {
        const s = document.$('body');
        expect(s.selected).toEqual([document.body]);

        const t = document.$();
        expect(t.selected).toEqual([document.body]);
    });

    test('computeStyles', () => {
        expect(document.stylesheet.dirty).toBeTruthy();
        expect(document.body.style().dirty).toBeFalsy();
        expect(document.body.used().dirty).toBeFalsy();
        expect(document.body.used('fg')).toBeUndefined();
        expect(document.body.used('bg')).toBeUndefined();
        expect(document.body.used('width')).toEqual(50);
        expect(document.body.used('height')).toEqual(30);
        expect(document.body.style('fg')).toBeUndefined();
        expect(document.body.style('bg')).toBeUndefined();
        expect(document.body.style('width')).toEqual(50);
        expect(document.body.style('height')).toEqual(30);

        document.computeStyles();
        expect(document.stylesheet.dirty).toBeFalsy();
        expect(document.body.style().dirty).toBeFalsy();
        expect(document.body.used().dirty).toBeFalsy();

        expect(document.body.used('fg')).toEqual('white');
        expect(document.body.used('bg')).toEqual('black');
        expect(document.body.used('width')).toEqual(50);
        expect(document.body.used('height')).toEqual(30);
        expect(document.body.style('fg')).toBeUndefined();
        expect(document.body.style('bg')).toBeUndefined();
        expect(document.body.style('width')).toEqual(50);
        expect(document.body.style('height')).toEqual(30);
    });

    test('updateLayout - simple text box', () => {
        document.$('<text>').text('test').appendTo('body');

        document.draw();

        const root = document.body;
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
        document
            .$('<text>')
            .text('test')
            .style({ fg: 'red', bg: 'white' })
            .appendTo('body');

        document.draw();

        const root = document.body;
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
        document
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .appendTo('body');

        document.computeStyles();
        document.updateLayout();

        const root = document.body;
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
        document
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .style('padding', 1)
            .appendTo('body');

        document.computeStyles();
        document.updateLayout();

        const root = document.body;
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
        document
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .appendTo('body');

        document.$().style('padding', 1);

        document.computeStyles();
        document.updateLayout();

        const root = document.body;
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
        document
            .$('<text>')
            .add('<text>')
            .add('<text>')
            .text('test')
            .style('padding', 1)
            .appendTo('body');

        document.$().style('padding', 1);

        document.computeStyles();
        document.updateLayout();

        const root = document.body;
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
