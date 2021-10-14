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

    test('updateLayout - fixed elements take no height', () => {
        document.body.style('padding', 1);

        document.create('<text>').id('a').text('static').appendTo('body');
        document
            .create('<text>')
            .id('b')
            .text('fixed')
            .pos(5, 5, 'fixed')
            .appendTo('body');
        document.create('<text>').id('c').text('static').appendTo('body');

        document.computeStyles();
        document.updateLayout();

        const root = document.body;
        const [a, b, c] = root.children;

        expect(a.id).toEqual('a');
        expect(a.used('position')).toEqual('static');
        expect(b.id).toEqual('b');
        expect(b.used('position')).toEqual('fixed');
        expect(b.used('left')).toEqual(5);
        expect(b.used('top')).toEqual(5);
        expect(c.id).toEqual('c');
        expect(c.used('position')).toEqual('static');

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
        expect(b.bounds).toMatchObject({ x: 5, y: 5, width: 5, height: 1 });
        expect(c.bounds).toMatchObject({ x: 1, y: 2, width: 48, height: 1 });
    });

    test('updateLayout - fixed elements take no height', () => {
        document.body.style('padding', 1);

        const a = document
            .create('<div>')
            .text('12345678901234567890')
            .style({
                position: 'fixed',
                left: 5,
                top: 10,
                bg: 'red',
                fg: 'white',
                padding: 1,
            })
            .appendTo('body')
            .get(0);

        document.updateLayout();

        expect(a.bounds).toMatchObject({ x: 5, y: 10, width: 22, height: 3 });
    });
});
