import * as UTILS from '../test/utils';
import { UI } from './ui';
import * as Widget from './widget';
import * as Layer from './layer';

describe('Layer', () => {
    let ui: UI;
    let layer: Layer.Layer;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        layer = new Layer.Layer(ui);
    });

    test('constructor', () => {
        expect(layer.body).toBeInstanceOf(Widget.Widget);
        expect(layer.body._parent).toBeNull();
    });

    test('drawText', () => {
        layer.clear('black').pos(2, 3).text('Hello World.');
        layer.draw();

        // layer.buffer.dump();

        expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual(
            'Hello World.'
        );
        expect(UTILS.getBufferFg(layer.buffer, 2, 3)).toEqual(0xfff); // white
        expect(UTILS.getBufferBg(layer.buffer, 2, 3)).toEqual(0x000); // black
    });

    test('hidden widgets do not draw', () => {
        layer.clear('black');
        const text = layer.pos(2, 3).text('Hello World.');
        text.hidden = true;
        layer.draw();

        expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual('');
        expect(UTILS.getBufferFg(layer.buffer, 2, 3)).toEqual(0x000); // black
        expect(UTILS.getBufferBg(layer.buffer, 2, 3)).toEqual(0x000); // black

        text.hidden = false;
        layer.draw();
        expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual(
            'Hello World.'
        );
        expect(UTILS.getBufferFg(layer.buffer, 2, 3)).toEqual(0xfff); // white
        expect(UTILS.getBufferBg(layer.buffer, 2, 3)).toEqual(0x000); // black
    });

    describe('depth drawing', () => {
        test('same depth - latest wins', () => {
            layer.clear('black');
            const A = layer.pos(2, 3).text('AAAAAAAAAA', { id: 'A' });
            const B = layer.pos(2, 3).text('BBBBBBBBBB', { id: 'B' });
            layer.draw();

            expect(A.depth).toEqual(0);
            expect(B.depth).toEqual(0);
            expect(layer._depthOrder.map((w) => w.attr('id'))).toEqual([
                'B',
                'A',
                'BODY',
            ]);

            expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual(
                'BBBBBBBBBB'
            );
        });

        test('higher depth first', () => {
            layer.clear('black');
            const A = layer.pos(2, 3).text('AAAAAAAAAA', { id: 'A', depth: 1 });
            const B = layer.pos(2, 3).text('BBBBBBBBBB', { id: 'B' });
            layer.draw();

            expect(A.depth).toEqual(1);
            expect(B.depth).toEqual(0);
            expect(layer._depthOrder.map((w) => w.attr('id'))).toEqual([
                'A',
                'B',
                'BODY',
            ]);

            expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual(
                'AAAAAAAAAA'
            );
        });

        test('higher depth last', () => {
            layer.clear('black');
            const A = layer.pos(2, 3).text('AAAAAAAAAA', { id: 'A' });
            const B = layer.pos(2, 3).text('BBBBBBBBBB', { id: 'B', depth: 1 });
            layer.draw();

            expect(A.depth).toEqual(0);
            expect(B.depth).toEqual(1);
            expect(layer._depthOrder.map((w) => w.attr('id'))).toEqual([
                'B',
                'A',
                'BODY',
            ]);

            expect(UTILS.getBufferText(layer.buffer, 2, 3, 20)).toEqual(
                'BBBBBBBBBB'
            );
        });
    });

    describe('focus', () => {
        test('set focus automatically', () => {
            layer.clear('black');

            layer.text('A');
            const divB = layer.pos(0, 1).text('B', { tabStop: true });
            const divC = layer.pos(0, 2).text('C', { tabStop: true });

            expect(layer._focusWidget).toBe(divB);
            layer.nextTabStop();
            expect(layer._focusWidget).toBe(divC);

            // wraps
            layer.nextTabStop();
            expect(layer._focusWidget).toBe(divB);

            // prev
            layer.prevTabStop();
            expect(layer._focusWidget).toBe(divC);
            layer.prevTabStop();
            expect(layer._focusWidget).toBe(divB);
        });

        test('click to set focus', () => {
            layer.text('DIV A');
            const divB = layer.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = layer.pos(0, 2).text('DIV C', { tabStop: true });

            // initial value
            expect(layer._focusWidget).toBe(divB);

            // click C
            expect(layer.widgetAt(2, 2)).toBe(divC);
            layer.click(UTILS.click(2, 2));
            expect(layer._focusWidget).toBe(divC);

            // click nothing
            expect(layer.widgetAt(5, 5)).toBe(layer.body);
            layer.click(UTILS.click(5, 5));
            expect(layer._focusWidget).toBe(divC); // does not change

            // click B
            expect(layer.widgetAt(2, 1)).toBe(divB);
            layer.click(UTILS.click(2, 1));
            expect(layer._focusWidget).toBe(divB);
        });

        test('tab + TAB - next/prev focus', () => {
            layer.text('DIV A');
            const divB = layer.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = layer.pos(0, 2).text('DIV C', { tabStop: true });
            layer.pos(0, 3).text('DIV D');
            const divE = layer.pos(0, 4).text('DIV E', { tabStop: true });

            // initial value
            expect(layer._focusWidget).toBe(divB);

            // tab
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divC);
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divE);
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divB);

            // TAB - reverse
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divE);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divE);
        });

        test('element eats tab and TAB to stop change', () => {
            const keypressFn = jest.fn().mockReturnValue(true); // We handled this keypress

            layer.text('DIV A');
            const divB = layer
                .pos(0, 1)
                .text('DIV B', { tabStop: true })
                .on('keypress', keypressFn);
            const divC = layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true })
                .on('keypress', keypressFn);

            // initial value
            expect(layer._focusWidget).toBe(divB);

            // tab
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divB);
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divB);
            keypressFn.mockReturnValue(false); // Now we let the key pass
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divC);

            // TAB - reverse
            keypressFn.mockReturnValue(true); // we handle
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC);
            keypressFn.mockReturnValue(false);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB);
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC);
        });

        test('focus event.  blur event.', () => {
            const blurFn = jest.fn();
            const focusFn = jest.fn();

            layer.text('DIV A');
            const divB = layer
                .pos(0, 1)
                .text('DIV B', { tabStop: true })
                .on('blur', blurFn);
            const divC = layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true })
                .on('focus', focusFn);

            // initial value
            expect(layer._focusWidget).toBe(divB);

            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divC);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('blur event cancels', () => {
            const blurFn = jest.fn().mockReturnValue(true); // We handled - stop the focus change
            const focusFn = jest.fn();

            layer.text('DIV A');
            const divB = layer
                .pos(0, 1)
                .text('DIV B', { tabStop: true })
                .on('blur', blurFn);
            layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true })
                .on('focus', focusFn);

            // initial value
            expect(layer._focusWidget).toBe(divB);

            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).not.toHaveBeenCalled();
        });

        test('focus event cancels?', () => {
            const blurFn = jest.fn();
            const focusFn = jest.fn().mockReturnValue(true); // We handled - stop the focus change

            layer.text('DIV A');
            const divB = layer
                .pos(0, 1)
                .text('DIV B', { tabStop: true })
                .on('blur', blurFn);
            layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true })
                .on('focus', focusFn);

            // initial value
            expect(layer._focusWidget).toBe(divB);

            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divB);

            expect(blurFn).toHaveBeenCalled();
            expect(focusFn).toHaveBeenCalled();
        });

        test('disabled elements skipped', () => {
            layer.text('DIV A');
            const divB = layer.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true, disabled: true });
            layer.pos(0, 3).text('DIV D');
            const divE = layer.pos(0, 4).text('DIV E', { tabStop: true });

            // initial value
            expect(layer._focusWidget).toBe(divB);

            // tab
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divE); // Skips C

            // TAB - reverse
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB); // Skips C

            divC.prop('disabled', false);
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divC); // Now it is there
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divE);

            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC); // Now it is there
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB);
        });

        test('hidden elements skipped', () => {
            layer.text('DIV A');
            const divB = layer.pos(0, 1).text('DIV B', { tabStop: true });
            const divC = layer
                .pos(0, 2)
                .text('DIV C', { tabStop: true, hidden: true });
            layer.pos(0, 3).text('DIV D');
            const divE = layer.pos(0, 4).text('DIV E', { tabStop: true });

            // initial value
            expect(layer._focusWidget).toBe(divB);

            // tab
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divE); // Skips C

            // TAB - reverse
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB); // Skips C

            divC.hidden = false;
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divC); // Now it is there
            layer.keypress(UTILS.keypress('Tab'));
            expect(layer._focusWidget).toBe(divE);

            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divC); // Now it is there
            layer.keypress(UTILS.keypress('TAB'));
            expect(layer._focusWidget).toBe(divB);
        });
    });
});
