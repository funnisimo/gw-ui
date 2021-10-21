import 'jest-extended';
// import * as GWU from 'gw-utils';
import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Element from './element';
import * as CheckBox from './checkbox';
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
            setActiveElement: jest.fn(),
        } as unknown as Document.Document;
    }

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        doc = mockDocument(ui);
    });

    test('create obj', () => {
        const e = new CheckBox.CheckBox('checkbox');
        expect(e.tag).toEqual('checkbox');
        expect(e.attr('value')).toEqual('on');
        expect(e.val()).toEqual('on');
        expect(e.attr('check')).toEqual('\u2612');
        expect(e.attr('uncheck')).toEqual('\u2610');
    });

    test('make', () => {
        const e = Parser.parse('<checkbox check=A uncheck=B value=val>');
        expect(e).toBeInstanceOf(CheckBox.CheckBox);
        expect(e.attr('value')).toEqual('val');
        expect(e.val()).toEqual('val');
        expect(e.attr('check')).toEqual('A');
        expect(e.attr('uncheck')).toEqual('B');
    });

    test('keypress', () => {
        const el = Parser.parse('<checkbox>') as CheckBox.CheckBox;
        expect(el).toBeInstanceOf(CheckBox.CheckBox);

        expect(el.prop('checked')).toBeFalsy();
        el.keypress(doc, el, UTILS.keypress(' '));
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');
        expect(el.prop('checked')).toBeTruthy();

        // @ts-ignore
        doc._fireEvent.mockClear();
        el.keypress(doc, el, UTILS.keypress(' '));
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');
        expect(el.prop('checked')).toBeFalsy();
    });

    test('click', () => {
        const el = Parser.parse('<checkbox>') as CheckBox.CheckBox;
        expect(el).toBeInstanceOf(CheckBox.CheckBox);

        el.updateLayout();
        expect(el.contains(0, 0)).toBeTruthy();

        expect(el.prop('checked')).toBeFalsy();
        el.click(doc, el, UTILS.click(0, 0));
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');
        expect(doc.setActiveElement).toHaveBeenCalledWith(el);
        expect(el.prop('checked')).toBeTruthy();

        // @ts-ignore
        doc._fireEvent.mockClear();
        el.click(doc, el, UTILS.click(0, 0));
        expect(doc._fireEvent).toHaveBeenCalledWith(
            el,
            'input',
            expect.anything()
        );
        expect(doc._fireEvent).not.toHaveBeenCalledWith(el, 'change');
        expect(el.prop('checked')).toBeFalsy();
    });
});
