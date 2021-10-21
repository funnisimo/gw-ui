import 'jest-extended';
// import * as GWU from 'gw-utils';
import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Element from './element';
import * as Input from './input';
import * as Document from './document';
import * as Parser from './parser';

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
            _fireEvent: jest.fn(),
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
        const e = Parser.parse(
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
        const el = Parser.parse('<input>') as Input.Input;
        expect(el).toBeInstanceOf(Input.Input);

        el.keypress(doc, el, UTILS.keypress('t'));
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');

        el.keypress(doc, el, UTILS.keypress('e'));
        el.keypress(doc, el, UTILS.keypress('s'));
        el.keypress(doc, el, UTILS.keypress('t'));
        expect(doc._fireEvent).toHaveBeenCalledTimes(4);

        expect(el.val()).toEqual('test');

        // @ts-ignore
        doc._fireEvent.mockClear();
        el.keypress(doc, el, UTILS.keypress('Backspace'));
        expect(el.val()).toEqual('tes');
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');

        // @ts-ignore
        doc._fireEvent.mockClear();
        el.onblur(doc);
        expect(doc._fireEvent).not.toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).toHaveBeenCalledWith(el, 'change');
    });

    describe('isValid', () => {
        test('basic text', () => {
            const el = Parser.parse('<input>') as Input.Input;
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeTruthy();

            el.val('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.val('');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('min/max Length', () => {
            const el = Parser.parse(
                '<input minLength=3 maxLength=6>'
            ) as Input.Input;
            expect(el.val()).toEqual('');
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeFalsy();

            el.val('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.val('te');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeFalsy();

            el.val('');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('required', () => {
            const el = Parser.parse('<input required>') as Input.Input;
            // console.log(el._props, el._attrs);
            expect(el.val()).toEqual('');
            expect(el.prop('required')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeFalsy();

            el.prop('required', false);
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();

            el.prop('required', true);
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();

            el.val('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.val('');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('min/max', () => {
            const el = Parser.parse(
                '<input type=number min=3 max=16>'
            ) as Input.Input;
            expect(el.val()).toEqual('');
            expect(el.prop('valid')).toBeFalsy();

            el.val('5');
            expect(el.prop('valid')).toBeTruthy();

            el.val('15');
            expect(el.prop('valid')).toBeTruthy();

            el.val('2');
            expect(el.prop('valid')).toBeFalsy();
            el.val('21');
            expect(el.prop('valid')).toBeFalsy();
            el.val('');
            expect(el.prop('valid')).toBeFalsy();
        });

        test('min/max - text ignores', () => {
            const el = Parser.parse('<input min=3 max=16>') as Input.Input;
            expect(el.val()).toEqual('');
            expect(el.prop('valid')).toBeTruthy();

            el.val('5');
            expect(el.prop('valid')).toBeTruthy();

            el.val('15');
            expect(el.prop('valid')).toBeTruthy();

            el.val('2');
            expect(el.prop('valid')).toBeTruthy();
            el.val('21');
            expect(el.prop('valid')).toBeTruthy();
            el.val('');
            expect(el.prop('valid')).toBeTruthy();
        });
    });
});
