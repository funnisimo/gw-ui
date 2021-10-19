import 'jest-extended';
// import * as GWU from 'gw-utils';
import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Element from './element';
import * as Input from './input';
import * as Document from './document';

describe('Element', () => {
    let ui: UICore;
    let doc: Document.Document;

    function mockDocument(ui: UICore) {
        const body = new Element.Element('body').style({
            width: ui.buffer.width,
            height: ui.buffer.height,
            position: 'fixed',
        });
        body.updateLayout();

        return {
            body,
            ui,
            nextTabStop: jest.fn(),
        } as unknown as Document.Document;
    }

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        doc = mockDocument(ui);
    });

    test('create obj', () => {
        const e = new Input.Input('input');
        expect(e.tag).toEqual('input');
    });

    test('make', () => {
        const e = Element.makeElement(
            '<input type=text value=val min=4 max=100 minLength=3 maxLength=10 placeholder=Taco required disabled>'
        );
        expect(e).toBeInstanceOf(Input.Input);
        expect(e.attr('type')).toEqual('text');
        expect(e.attr('value')).toEqual('val');
        expect(e.val()).toEqual('val');
        expect(e.attr('min')).toEqual('4');
        expect(e.attr('max')).toEqual('100');
        expect(e.attr('minLength')).toEqual('3');
        expect(e.attr('maxLength')).toEqual('10');
        expect(e.attr('placeholder')).toEqual('Taco');
        expect(e.prop('required')).toBeTruthy();
        expect(e.prop('disabled')).toBeTruthy();
    });

    test('typing', () => {
        const el = Element.makeElement('<input type=text>') as Input.Input;
        expect(el).toBeInstanceOf(Input.Input);

        el.keypress(doc, el, UTILS.keypress('t'));
        el.keypress(doc, el, UTILS.keypress('e'));
        el.keypress(doc, el, UTILS.keypress('s'));
        el.keypress(doc, el, UTILS.keypress('t'));

        expect(el.val()).toEqual('test');

        el.keypress(doc, el, UTILS.keypress('Backspace'));
        expect(el.val()).toEqual('tes');
    });
});
