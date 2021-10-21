import 'jest-extended';
// import * as GWU from 'gw-utils';
import * as UTILS from '../../test/utils';
import { UICore } from '../types';
// import * as Element from './element';
import * as FieldSet from './fieldset';
import * as Document from './document';
// import * as Parser from './parser';

describe('Element', () => {
    let ui: UICore;
    let doc: Document.Document;

    // function mockDocument(ui: UICore) {
    //     const body = new Element.Element('body').style({
    //         width: ui.buffer.width,
    //         height: ui.buffer.height,
    //         position: 'fixed',
    //     });
    //     body.updateLayout();

    //     return {
    //         body,
    //         ui,
    //         nextTabStop: jest.fn(),
    //         _fireEvent: jest.fn(),
    //         setActiveElement: jest.fn(),
    //     } as unknown as Document.Document;
    // }

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        doc = new Document.Document(ui);
    });

    test('create obj', () => {
        const e = new FieldSet.FieldSet('fieldset');
        expect(e.tag).toEqual('fieldset');
        e.attr('legend', 'LEGEND');
        e.style('border', 'red');
        e.pos(5, 5);
        e.size(30, 10);

        e.updateLayout();
        expect(e.innerLeft).toEqual(6);
        expect(e.innerTop).toEqual(6);

        expect(e.bounds).toMatchObject({ x: 5, y: 5, width: 30, height: 10 });

        e.draw(ui.buffer);

        // ui.buffer.dump();
    });

    test('add children', () => {
        expect(doc.stylesheet.get('fieldset')).not.toBeNull();

        const $fs = doc
            .create('<fieldset legend=LEGEND>')
            .pos(10, 5)
            .appendTo('body');
        for (let i = 0; i < 5; ++i) {
            $fs.append('<div>Testing</div>');
        }

        doc.computeStyles();
        doc.updateLayout();
        doc.draw();

        const fs = $fs.get(0);

        expect(fs.bounds).toMatchObject({
            x: 10,
            y: 5,
            width: 13,
            height: 11,
        });
        expect(fs.used('marginTop')).toEqual(1);
        expect(fs.used('marginRight')).toEqual(1);
        expect(fs.used('marginBottom')).toEqual(1);
        expect(fs.used('marginLeft')).toEqual(1);
        expect(fs.used('padTop')).toEqual(1);
        expect(fs.used('padRight')).toEqual(1);
        expect(fs.used('padBottom')).toEqual(1);
        expect(fs.used('padLeft')).toEqual(1);
        expect(fs.used('border')).toEqual('dark_gray');
    });

    test('local style', () => {
        expect(doc.stylesheet.get('fieldset')).not.toBeNull();

        const $fs = doc
            .create('<fieldset legend=LEGEND style="marginTop:0">')
            .pos(10, 5)
            .appendTo('body');
        for (let i = 0; i < 5; ++i) {
            $fs.append('<div>Testing</div>');
        }

        doc.computeStyles();
        doc.updateLayout();
        doc.draw();

        const fs = $fs.get(0);

        expect(fs.used('marginTop')).toEqual(0);
        expect(fs.used('marginRight')).toEqual(1);
        expect(fs.used('marginBottom')).toEqual(1);
        expect(fs.used('marginLeft')).toEqual(1);
        expect(fs.used('padTop')).toEqual(1);
        expect(fs.used('padRight')).toEqual(1);
        expect(fs.used('padBottom')).toEqual(1);
        expect(fs.used('padLeft')).toEqual(1);
        expect(fs.used('border')).toEqual('dark_gray');

        expect(fs.bounds).toMatchObject({
            x: 10,
            y: 5,
            width: 13,
            height: 10,
        });

        // ui.buffer.dump();
    });
});
