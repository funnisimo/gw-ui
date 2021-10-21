import 'jest-extended';
import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as DataList from './datalist';
import * as Document from './document';

describe('DataList', () => {
    let ui: UICore;
    let doc: Document.Document;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        doc = new Document.Document(ui);
    });

    test('constructor', () => {
        const dl = new DataList.DataList('datalist');
        expect(dl).toBeInstanceOf(DataList.DataList);
    });

    test('default', () => {
        const $dl = doc.create('<datalist>').pos(10, 5).appendTo('body');
        const dl = $dl.get(0);
        doc.draw(); // calculateStyles, updateLayout, draw

        // ui.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 1 }); // default width
        expect(UTILS.getBufferText(ui.buffer, 10, 5, 10)).toEqual('-'); // default empty text

        $dl.data(['Taco', 'Salad', 'Sandwich']);
        expect(dl.dirty).toBeTruthy();
        doc.draw();

        // ui.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 8, height: 3 }); // width, height from content
        expect(UTILS.getBufferText(ui.buffer, 10, 5, 10)).toEqual('Taco');
        expect(UTILS.getBufferText(ui.buffer, 10, 6, 10)).toEqual('Salad');
        expect(UTILS.getBufferText(ui.buffer, 10, 7, 10)).toEqual('Sandwich');
    });

    test.skip('legend', () => {
        const $dl = doc
            .create('<datalist legend=Foods>')
            .pos(10, 5)
            .appendTo('body');
        const dl = $dl.get(0);
        doc.draw(); // calculateStyles, updateLayout, draw

        // ui.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 2 }); // default width, height=legend + empty
        expect(UTILS.getBufferText(ui.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(UTILS.getBufferText(ui.buffer, 10, 6, 10)).toEqual('-'); // default empty text

        $dl.data(['Taco', 'Salad', 'Sandwich']);
        expect(dl.dirty).toBeTruthy();
        doc.draw();

        // ui.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 8, height: 4 }); // width, height from content + legend
        expect(UTILS.getBufferText(ui.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(UTILS.getBufferText(ui.buffer, 10, 6, 10)).toEqual('Taco');
        expect(UTILS.getBufferText(ui.buffer, 10, 7, 10)).toEqual('Salad');
        expect(UTILS.getBufferText(ui.buffer, 10, 8, 10)).toEqual('Sandwich');
    });
});
