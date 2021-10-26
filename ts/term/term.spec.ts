import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Widget from './widget';
import * as Term from './term';

describe('Term', () => {
    let ui: UICore;
    let term: Term.Term;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        term = new Term.Term(ui);
    });

    test('constructor', () => {
        expect(term.body).toBeInstanceOf(Widget.Widget);
        expect(term.body.parent).toBeNull();
    });

    test('drawText', () => {
        term.clear('black').pos(2, 3).text('Hello World.');
        term.draw();

        expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
            'Hello World.'
        );
        expect(UTILS.getBufferFg(ui.buffer, 2, 3)).toEqual(0xfff); // white
        expect(UTILS.getBufferBg(ui.buffer, 2, 3)).toEqual(0x000); // black
    });

    test('hidden widgets do not draw', () => {
        term.clear('black');
        const text = term.pos(2, 3).text('Hello World.');
        text.hidden = true;
        term.draw();

        expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual('');
        expect(UTILS.getBufferFg(ui.buffer, 2, 3)).toEqual(0x000); // black
        expect(UTILS.getBufferBg(ui.buffer, 2, 3)).toEqual(0x000); // black

        text.hidden = false;
        term.draw();
        expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
            'Hello World.'
        );
        expect(UTILS.getBufferFg(ui.buffer, 2, 3)).toEqual(0xfff); // white
        expect(UTILS.getBufferBg(ui.buffer, 2, 3)).toEqual(0x000); // black
    });

    describe('depth drawing', () => {
        test('same depth - latest wins', () => {
            term.clear('black');
            const A = term.pos(2, 3).text('AAAAAAAAAA', { id: 'A' });
            const B = term.pos(2, 3).text('BBBBBBBBBB', { id: 'B' });
            term.draw();

            expect(A.depth).toEqual(0);
            expect(B.depth).toEqual(0);
            expect(term.allWidgets.map((w) => w.attr('id'))).toEqual([
                'B',
                'A',
                'BODY',
            ]);

            expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
                'BBBBBBBBBB'
            );
        });

        test('higher depth first', () => {
            term.clear('black');
            const A = term.pos(2, 3).text('AAAAAAAAAA', { id: 'A', depth: 1 });
            const B = term.pos(2, 3).text('BBBBBBBBBB', { id: 'B' });
            term.draw();

            expect(A.depth).toEqual(1);
            expect(B.depth).toEqual(0);
            expect(term.allWidgets.map((w) => w.attr('id'))).toEqual([
                'A',
                'B',
                'BODY',
            ]);

            expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
                'AAAAAAAAAA'
            );
        });

        test('higher depth last', () => {
            term.clear('black');
            const A = term.pos(2, 3).text('AAAAAAAAAA', { id: 'A' });
            const B = term.pos(2, 3).text('BBBBBBBBBB', { id: 'B', depth: 1 });
            term.draw();

            expect(A.depth).toEqual(0);
            expect(B.depth).toEqual(1);
            expect(term.allWidgets.map((w) => w.attr('id'))).toEqual([
                'B',
                'A',
                'BODY',
            ]);

            expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
                'BBBBBBBBBB'
            );
        });
    });
});
