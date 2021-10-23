import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Term from './term';

describe('Term', () => {
    let ui: UICore;
    let term: Term.Term;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        term = new Term.Term(ui);
    });

    test('drawText', () => {
        term.clear('black').pos(2, 3).drawText('Hello World.').render();

        expect(UTILS.getBufferText(ui.buffer, 2, 3, 20)).toEqual(
            'Hello World.'
        );
        expect(UTILS.getBufferFg(ui.buffer, 2, 3)).toEqual(0xfff); // white
        expect(UTILS.getBufferBg(ui.buffer, 2, 3)).toEqual(0x000); // black
    });
});
