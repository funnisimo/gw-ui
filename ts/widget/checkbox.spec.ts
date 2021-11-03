import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Checkbox from './checkbox';
import * as Layer from '../layer';
import { createWidget } from './make';

describe('Checkbox Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('create obj', () => {
        const e = new Checkbox.Checkbox(layer, { text: 'checkbox' });
        expect(e.tag).toEqual('checkbox');
        expect(e.attr('value')).toEqual('on');
        expect(e.attr('check')).toEqual('\u2612');
        expect(e.attr('uncheck')).toEqual('\u2610');
    });

    test('make', () => {
        const e = createWidget('checkbox', layer, {
            text: 'checkbox',
            value: 'val',
            check: 'A',
            uncheck: 'B',
        });
        expect(e).toBeInstanceOf(Checkbox.Checkbox);
        expect(e.attr('value')).toEqual('val');
        expect(e.attr('check')).toEqual('A');
        expect(e.attr('uncheck')).toEqual('B');
    });

    test('keypress', () => {
        const el = new Checkbox.Checkbox(layer, { text: 'checkbox' });
        jest.spyOn(el, '_fireEvent');

        expect(el.prop('checked')).toBeFalsy();
        el.keypress(UTILS.keypress(' '));
        expect(el._fireEvent).toHaveBeenCalledWith(
            'input',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el._fireEvent).not.toHaveBeenCalledWith(
            'change',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el.prop('checked')).toBeTruthy();

        // @ts-ignore
        el._fireEvent.mockClear();
        el.keypress(UTILS.keypress(' '));
        expect(el._fireEvent).toHaveBeenCalledWith(
            'input',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el._fireEvent).not.toHaveBeenCalledWith(
            'change',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el.prop('checked')).toBeFalsy();
    });

    test('click', () => {
        const el = new Checkbox.Checkbox(layer, { text: 'checkbox' });
        jest.spyOn(el, '_fireEvent');

        expect(el.contains(0, 0)).toBeTruthy();

        expect(el.prop('checked')).toBeFalsy();
        el.click(UTILS.click(0, 0));
        expect(el._fireEvent).toHaveBeenCalledWith(
            'input',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el._fireEvent).not.toHaveBeenCalledWith(
            'change',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el.focused).toBeTruthy();
        expect(layer._focusWidget).toBe(el);
        expect(el.prop('checked')).toBeTruthy();

        // @ts-ignore
        el._fireEvent.mockClear();
        el.click(UTILS.click(0, 0));
        expect(el._fireEvent).toHaveBeenCalledWith(
            'input',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el._fireEvent).not.toHaveBeenCalledWith(
            'change',
            el,
            expect.any(GWU.io.Event)
        );
        expect(el.prop('checked')).toBeFalsy();
    });
});
