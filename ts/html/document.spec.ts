import * as UTILS from '../../test/utils';
// import * as GWU from 'gw-utils';

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

    test('createElement', () => {
        const div = document.createElement(
            '<div id=A style="fg:red;bg:white" hover>'
        );
        expect(div.tag).toEqual('div');
        expect(div.id).toEqual('A');
        expect(div.style('fg')).toEqual('red');
        expect(div.style('bg')).toEqual('white');
        expect(div.prop('hover')).toBeTruthy();
    });

    test('createElement with text', () => {
        const div = document.createElement(
            '<div id=A style="fg:red;bg:white" hover>Text</div>'
        );
        expect(div.tag).toEqual('div');
        expect(div.id).toEqual('A');
        expect(div.style('fg')).toEqual('red');
        expect(div.style('bg')).toEqual('white');
        expect(div.prop('hover')).toBeTruthy();
        expect(div.text()).toEqual('Text');
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

    describe('events', () => {
        test('basic click', () => {
            const clickFn = jest.fn();
            const div = document
                .create('<div>')
                .pos(0, 0)
                .text('CLICK ME')
                .on('click', clickFn)
                .appendTo('body')
                .get(0);

            document.updateLayout();

            expect(document.elementFromPoint(0, 0)).toBe(div);
            expect(div.events.click).toEqual([clickFn]);

            document.click(UTILS.click(0, 0));
            expect(clickFn).toHaveBeenCalled();
            clickFn.mockClear();

            document.click(UTILS.click(5, 5));
            expect(clickFn).not.toHaveBeenCalled();

            const bodyClick = jest.fn();
            document.select('body').on('click', bodyClick);
            clickFn.mockClear();

            document.click(UTILS.click(0, 0));
            expect(clickFn).toHaveBeenCalled();
            expect(bodyClick).toHaveBeenCalled();

            clickFn.mockClear().mockReturnValueOnce(true); // handled
            bodyClick.mockClear();

            document.click(UTILS.click(0, 0));
            expect(clickFn).toHaveBeenCalled();
            expect(bodyClick).not.toHaveBeenCalled();
        });

        test('mousemove - basic + hover', () => {
            const moveFn = jest.fn();
            const div = document
                .create('<div id=A>CLICK ME</div>')
                .on('mousemove', moveFn)
                .appendTo('body')
                .get(0);
            const div2 = document
                .create('<div id=B>CLICK ME</div>')
                .on('mousemove', moveFn)
                .appendTo('body')
                .get(0);

            document.updateLayout();

            expect(div.prop('hover')).toBeFalsy();
            expect(document.body.prop('hover')).toBeFalsy();
            expect(document.elementFromPoint(0, 0)).toBe(div);
            expect(div.events.mousemove).toEqual([moveFn]);

            document.mousemove(UTILS.mousemove(0, 0));
            expect(moveFn).toHaveBeenCalled();
            moveFn.mockClear();
            expect(div.prop('hover')).toBeTruthy();
            expect(document.body.prop('hover')).toBeTruthy();
            expect(div2.prop('hover')).toBeFalsy(); // not over this element

            document.mousemove(UTILS.mousemove(5, 5));
            expect(moveFn).not.toHaveBeenCalled();
            expect(div.prop('hover')).toBeFalsy();

            const bodyMove = jest.fn();
            document.select('body').on('mousemove', bodyMove);
            moveFn.mockClear();

            document.mousemove(UTILS.mousemove(0, 0));
            expect(moveFn).toHaveBeenCalled();
            expect(bodyMove).toHaveBeenCalled();
            expect(document.body.prop('hover')).toBeTruthy();

            moveFn.mockClear().mockReturnValueOnce(true); // handled
            bodyMove.mockClear();

            document.mousemove(UTILS.mousemove(0, 0));
            expect(moveFn).toHaveBeenCalled();
            expect(bodyMove).not.toHaveBeenCalled();
        });

        test('dir - basic', () => {
            const divFn = jest.fn();
            const div = document
                .create('<div id=A>MOVE ME</div>')
                .on('dir', divFn)
                .appendTo('body')
                .get(0);
            expect(div.prop('tabindex')).toBeFalsy(); // not set

            const bodyFn = jest.fn();
            document.select('body').on('dir', bodyFn);
            expect(document.body.prop('tabindex')).toBeFalsy(); // not set

            document.nextTabStop();
            document.updateLayout();
            expect(document.activeElement).toBeNull(); // no active element set

            document.dir(UTILS.dir('left'));
            expect(divFn).not.toHaveBeenCalled(); // not a tabindex
            expect(bodyFn).toHaveBeenCalled(); // called, even though not a tabstop (root element)

            bodyFn.mockClear();
            document.select('#A').prop('tabindex', true);
            expect(div.prop('tabindex')).toBeTruthy(); // set

            expect(document.activeElement).toBeNull(); // no active element set
            document.dir(UTILS.dir('left'));
            expect(divFn).not.toHaveBeenCalled(); // now a tabindex, but not active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            document.nextTabStop();
            bodyFn.mockClear();

            expect(document.activeElement).toBe(div);
            document.dir(UTILS.dir('left'));
            expect(divFn).toHaveBeenCalled(); // active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            divFn.mockClear();
            bodyFn.mockClear();
            divFn.mockReturnValue(true);

            document.dir(UTILS.dir('left'));
            expect(divFn).toHaveBeenCalled(); // now handles event
            expect(bodyFn).not.toHaveBeenCalled();
        });

        test('keypress - keypress', () => {
            const divFn = jest.fn();
            const div = document
                .create('<div id=A>MOVE ME</div>')
                .on('keypress', divFn)
                .appendTo('body')
                .get(0);
            expect(div.prop('tabindex')).toBeFalsy(); // not set

            const bodyFn = jest.fn();
            document.select('body').on('keypress', bodyFn);
            expect(document.body.prop('tabindex')).toBeFalsy(); // not set

            document.nextTabStop();
            document.updateLayout();
            expect(document.activeElement).toBeNull(); // no active element set

            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).not.toHaveBeenCalled(); // not a tabindex
            expect(bodyFn).toHaveBeenCalled(); // called, even though not a tabstop (root element)

            bodyFn.mockClear();
            document.select('#A').prop('tabindex', true);
            expect(div.prop('tabindex')).toBeTruthy(); // set

            expect(document.activeElement).toBeNull(); // no active element set
            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).not.toHaveBeenCalled(); // now a tabindex, but not active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            document.nextTabStop();
            bodyFn.mockClear();

            expect(document.activeElement).toBe(div);
            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).toHaveBeenCalled(); // active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            divFn.mockClear();
            bodyFn.mockClear();
            divFn.mockReturnValue(true);

            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).toHaveBeenCalled(); // now handles event
            expect(bodyFn).not.toHaveBeenCalled();
        });

        test('keypress - Enter', () => {
            const divFn = jest.fn();
            const div = document
                .create('<div id=A>MOVE ME</div>')
                .on('Enter', divFn)
                .appendTo('body')
                .get(0);
            expect(div.prop('tabindex')).toBeFalsy(); // not set

            const bodyFn = jest.fn();
            document.select('body').on('keypress', bodyFn);
            expect(document.body.prop('tabindex')).toBeFalsy(); // not set

            document.nextTabStop();
            document.updateLayout();
            expect(document.activeElement).toBeNull(); // no active element set

            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).not.toHaveBeenCalled(); // not a tabindex
            expect(bodyFn).toHaveBeenCalled(); // called, even though not a tabstop (root element)

            bodyFn.mockClear();
            document.select('#A').prop('tabindex', true);
            expect(div.prop('tabindex')).toBeTruthy(); // set

            expect(document.activeElement).toBeNull(); // no active element set
            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).not.toHaveBeenCalled(); // now a tabindex, but not active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            document.nextTabStop();
            bodyFn.mockClear();

            expect(document.activeElement).toBe(div);
            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).toHaveBeenCalled(); // active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            divFn.mockClear();
            bodyFn.mockClear();
            divFn.mockReturnValue(true);

            document.keypress(UTILS.keypress('Enter'));
            expect(divFn).toHaveBeenCalled(); // now handles event
            expect(bodyFn).not.toHaveBeenCalled();
        });

        test('keypress - a', () => {
            const divFn = jest.fn();
            const div = document
                .create('<div id=A>MOVE ME</div>')
                .on('a', divFn)
                .appendTo('body')
                .get(0);
            expect(div.prop('tabindex')).toBeFalsy(); // not set

            const bodyFn = jest.fn();
            document.select('body').on('keypress', bodyFn);
            expect(document.body.prop('tabindex')).toBeFalsy(); // not set

            document.nextTabStop();
            document.updateLayout();
            expect(document.activeElement).toBeNull(); // no active element set

            document.keypress(UTILS.keypress('a'));
            expect(divFn).not.toHaveBeenCalled(); // not a tabindex
            expect(bodyFn).toHaveBeenCalled(); // called, even though not a tabstop (root element)

            bodyFn.mockClear();
            document.select('#A').prop('tabindex', true);
            expect(div.prop('tabindex')).toBeTruthy(); // set

            expect(document.activeElement).toBeNull(); // no active element set
            document.keypress(UTILS.keypress('a'));
            expect(divFn).not.toHaveBeenCalled(); // now a tabindex, but not active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            document.nextTabStop();
            bodyFn.mockClear();

            expect(document.activeElement).toBe(div);
            document.keypress(UTILS.keypress('a'));
            expect(divFn).toHaveBeenCalled(); // active element
            expect(bodyFn).toHaveBeenCalled(); // called because div did not return true

            divFn.mockClear();
            bodyFn.mockClear();
            divFn.mockReturnValue(true);

            document.keypress(UTILS.keypress('a'));
            expect(divFn).toHaveBeenCalled(); // now handles event
            expect(bodyFn).not.toHaveBeenCalled();
        });
    });

    describe('focus', () => {
        test('set focus automatically', () => {
            document.create('<div id=A>A</div>').appendTo('body').get(0);

            const divB = document
                .create('<div id=B tabindex>B</div>')
                .appendTo('body')
                .get(0);

            const divC = document
                .create('<div id=C tabindex>C</div>')
                .appendTo('body')
                .get(0);

            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);
            document.nextTabStop();
            expect(document.activeElement).toBe(divC);

            // wraps
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            // prev
            document.prevTabStop();
            expect(document.activeElement).toBe(divC);
            document.prevTabStop();
            expect(document.activeElement).toBe(divB);
        });

        test('click to set focus', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .appendTo('body')
                .get(0);

            const divC = document
                .create('<div id=C tabindex>C DIV</div>')
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            // click C
            expect(document.elementFromPoint(2, 2)).toBe(divC);
            document.click(UTILS.click(2, 2));
            expect(document.activeElement).toBe(divC);

            // click nothing
            expect(document.elementFromPoint(5, 5)).toBe(document.body);
            document.click(UTILS.click(5, 5));
            expect(document.activeElement).toBe(divC); // does not change

            // click B
            expect(document.elementFromPoint(2, 1)).toBe(divB);
            document.click(UTILS.click(2, 1));
            expect(document.activeElement).toBe(divB);
        });

        test('tab + TAB - next/prev focus', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .appendTo('body')
                .get(0);

            const divC = document
                .create('<div id=C tabindex>C DIV</div>')
                .appendTo('body')
                .get(0);

            document.create('<div id=D>D DIV</div>').appendTo('body');

            const divE = document
                .create('<div id=E tabindex>E DIV</div>')
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            // tab
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divC);
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divE);
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divB);

            // TAB - reverse
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divE);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divC);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divB);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divE);
        });

        test('element eats tab and TAB to stop change', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const keypressFn = jest.fn().mockReturnValue(true); // We handled this keypress
            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .on('keypress', keypressFn)
                .appendTo('body')
                .get(0);

            const divC = document
                .create('<div id=C tabindex>C DIV</div>')
                .on('keypress', keypressFn)
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            // tab
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divB);
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divB);
            keypressFn.mockReturnValue(false); // Now we let the key pass
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divC);

            // TAB - reverse
            keypressFn.mockReturnValue(true); // we handle
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divC);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divC);
            keypressFn.mockReturnValue(false);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divB);
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divC);
        });

        test('focus event.  blur event.', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const blurFn = jest.fn();
            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .on('blur', blurFn)
                .appendTo('body')
                .get(0);

            const focusFn = jest.fn();
            const divC = document
                .create('<div id=C tabindex>C DIV</div>')
                .on('focus', focusFn)
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divC);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('blur event cancels', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const blurFn = jest.fn().mockReturnValue(true); // We handled - stop the focus change
            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .on('blur', blurFn)
                .appendTo('body')
                .get(0);

            const focusFn = jest.fn();
            document
                .create('<div id=C tabindex>C DIV</div>')
                .on('focus', focusFn)
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).not.toHaveBeenCalled();
        });

        test('focus event cancels?', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const blurFn = jest.fn();
            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .on('blur', blurFn)
                .appendTo('body')
                .get(0);

            const focusFn = jest.fn().mockReturnValue(true); // We handled - stop the focus change
            document
                .create('<div id=C tabindex>C DIV</div>')
                .on('focus', focusFn)
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('disabled elements skipped', () => {
            document.create('<div id=A>A div</div>').appendTo('body');

            const divB = document
                .create('<div id=B tabindex>B DIV</div>')
                .appendTo('body')
                .get(0);

            const divC = document
                .create('<div id=C tabindex>C DIV</div>')
                .prop('disabled', true)
                .appendTo('body')
                .get(0);

            document.create('<div id=D>D DIV</div>').appendTo('body');

            const divE = document
                .create('<div id=E tabindex>E DIV</div>')
                .appendTo('body')
                .get(0);

            // initial value
            document.updateLayout();
            expect(document.activeElement).toBeNull();
            document.nextTabStop();
            expect(document.activeElement).toBe(divB);

            // tab
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divE); // Skips C

            // TAB - reverse
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divB); // Skips C

            divC.prop('disabled', false);
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divC); // Now it is there
            document.keypress(UTILS.keypress('Tab'));
            expect(document.activeElement).toBe(divE);

            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divC); // Now it is there
            document.keypress(UTILS.keypress('TAB'));
            expect(document.activeElement).toBe(divB);
        });
    });
});
