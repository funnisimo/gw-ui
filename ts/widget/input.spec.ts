import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Input from './input';
import * as Layer from '../layer';

describe('Input Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('create', () => {
        const widget = new Input.Input(layer, { id: 'ID', text: 'Test' });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(10); // default
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text()).toEqual('Test');

        widget.bounds.x = widget.bounds.y = 0;

        const buffer = new GWU.buffer.Buffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.text('');
        widget.keypress(UTILS.keypress('e'));
        widget.keypress(UTILS.keypress('a'));
        widget.keypress(UTILS.keypress('t'));
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('eat');
        expect(widget.text()).toEqual('eat');
        expect(widget.isValid()).toBeTruthy();
    });

    test('make', () => {
        const e = layer.input({
            id: 'ID',
            text: 'val',
            min: 4,
            max: 100,
            minLength: 3,
            maxLength: 10,
            placeholder: 'Taco',
            required: true,
            disabled: true,
        });
        expect(e).toBeInstanceOf(Input.Input);
        expect(e.attr('default')).toEqual('val');
        expect(e.text()).toEqual('val');
        expect(e.min).toEqual(0);
        expect(e.max).toEqual(0);
        expect(e.numbersOnly).toBeFalsy();
        expect(e.minLength).toEqual(3);
        expect(e.maxLength).toEqual(10);
        expect(e.attr('placeholder')).toEqual('Taco');
        expect(e.prop('required')).toBeTruthy();
        expect(e.prop('disabled')).toBeTruthy();
    });

    test('make - numbersOnly', () => {
        const e = layer.input({
            id: 'ID',
            text: 'val',
            numbersOnly: true,
            min: 4,
            max: 100,
            minLength: 3,
            maxLength: 10,
            placeholder: 'Taco',
            required: true,
            disabled: true,
        });
        expect(e).toBeInstanceOf(Input.Input);
        expect(e.attr('default')).toEqual('val');
        expect(e.text()).toEqual('val');
        expect(e.min).toEqual(4);
        expect(e.max).toEqual(100);
        expect(e.numbersOnly).toBeTruthy();
        expect(e.minLength).toEqual(0);
        expect(e.maxLength).toEqual(0);
        expect(e.attr('placeholder')).toEqual('Taco');
        expect(e.prop('required')).toBeTruthy();
        expect(e.prop('disabled')).toBeTruthy();
    });

    test('typing', () => {
        const el = layer.input({ width: 10, id: 'ID' });
        jest.spyOn(el, '_fireEvent');
        el.focus();
        // @ts-ignore
        el._fireEvent.mockClear();

        el.keypress(UTILS.keypress('t'));
        expect(el._fireEvent).toHaveBeenCalledWith('input', el);
        expect(el._fireEvent).not.toHaveBeenCalledWith(el, 'change');

        el.keypress(UTILS.keypress('e'));
        el.keypress(UTILS.keypress('s'));
        el.keypress(UTILS.keypress('t'));
        expect(el._fireEvent).toHaveBeenCalledTimes(4);

        expect(el.text()).toEqual('test');

        // @ts-ignore
        el._fireEvent.mockClear();
        el.keypress(UTILS.keypress('Backspace'));
        expect(el.text()).toEqual('tes');
        expect(el._fireEvent).toHaveBeenCalledWith('input', el);
        expect(el._fireEvent).not.toHaveBeenCalledWith(el, 'change');

        // @ts-ignore
        el._fireEvent.mockClear();
        el.blur();
        expect(el._fireEvent).not.toHaveBeenCalledWith('input', el);
        expect(el._fireEvent).toHaveBeenCalledWith('change', el);
    });

    test('backspace + delete', () => {
        const widget = new Input.Input(layer, {
            id: 'ID',
            width: 15,
            text: 'Test',
            x: 0,
            y: 0,
        });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bounds.width).toEqual(15);
        expect(widget.bounds.height).toEqual(1);
        expect(widget.text()).toEqual('Test');

        const buffer = new GWU.buffer.Buffer(40, 40);
        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Test'); // default

        widget.keypress(UTILS.keypress('Backspace'));
        widget.keypress(UTILS.keypress('Delete'));
        widget.keypress(UTILS.keypress('Backspace'));
        widget.keypress(UTILS.keypress('a'));
        widget.keypress(UTILS.keypress('c'));
        widget.keypress(UTILS.keypress('o'));
        expect(widget.text()).toEqual('Taco');

        widget.draw(buffer);
        expect(UTILS.getBufferText(buffer, 0, 0, 10)).toEqual('Taco');
        expect(widget.isValid()).toBeTruthy();
    });

    test('Enter - fire Event', async () => {
        let widget = new Input.Input(layer, {
            id: 'ID',
            width: 10,
            text: 'Test',
        });
        jest.spyOn(widget, '_fireEvent');
        expect(widget.attr('action')).toEqual('ID');

        expect(widget.keypress(UTILS.keypress('Enter'))).toBeTruthy();
        expect(widget._fireEvent).toHaveBeenCalledWith('ID', widget);

        // @ts-ignore
        widget._fireEvent.mockClear();
        // @ts-ignore
        widget._fireEvent.mockResolvedValue(void 0);

        widget.keypress(UTILS.keypress('Enter'));
        expect(widget._fireEvent).toHaveBeenCalledWith('ID', widget);

        // @ts-ignore
        widget._fireEvent.mockClear();
        // @ts-ignore
        widget._fireEvent.mockReturnValue(void 0);

        widget = new Input.Input(layer, {
            id: 'ID',
            width: 10,
            text: 'Test',
            action: 'DONE',
        });
        jest.spyOn(widget, '_fireEvent');

        expect(widget.keypress(UTILS.keypress('Enter'))).toBeTruthy();
        expect(widget._fireEvent).toHaveBeenCalledWith('DONE', widget);
    });

    describe('isValid', () => {
        test('basic text', () => {
            const el = layer.input({ id: 'ID ' });
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeTruthy();

            el.text('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.text('');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('min/max Length', () => {
            const el = layer.input({
                id: 'ID',
                minLength: 3,
                maxLength: 6,
            }) as Input.Input;

            expect(el.maxLength).toEqual(6);
            expect(el.minLength).toEqual(3);

            expect(el.text()).toEqual('');
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeFalsy();

            el.text('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.text('te');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeFalsy();

            el.text('');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('required', () => {
            const el = layer.input({ id: 'ID', required: true });
            // console.log(el._props, el._attrs);
            expect(el.text()).toEqual('');
            expect(el.prop('required')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();
            expect(el.prop('valid')).toBeFalsy();

            el.prop('required', false);
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeTruthy();

            el.prop('required', true);
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();

            el.text('test');
            expect(el.prop('valid')).toBeTruthy();
            expect(el.prop('empty')).toBeFalsy();

            el.text('');
            expect(el.prop('valid')).toBeFalsy();
            expect(el.prop('empty')).toBeTruthy();
        });

        test('min/max', () => {
            const el = layer.input({
                id: 'ID',
                numbersOnly: true,
                min: 3,
                max: 16,
            });
            expect(el.text()).toEqual('');
            expect(el.prop('valid')).toBeFalsy();

            el.text('5');
            expect(el.prop('valid')).toBeTruthy();

            el.text('15');
            expect(el.prop('valid')).toBeTruthy();

            el.text('2');
            expect(el.prop('valid')).toBeFalsy();
            el.text('21');
            expect(el.prop('valid')).toBeFalsy();
            el.text('');
            expect(el.prop('valid')).toBeFalsy();
        });

        test('min/max - text ignores', () => {
            const el = layer.input({ id: 'ID', min: 3, max: 16 });
            expect(el.text()).toEqual('');
            expect(el.prop('valid')).toBeTruthy();

            el.text('5');
            expect(el.prop('valid')).toBeTruthy();

            el.text('15');
            expect(el.prop('valid')).toBeTruthy();

            el.text('2');
            expect(el.prop('valid')).toBeTruthy();
            el.text('21');
            expect(el.prop('valid')).toBeTruthy();
            el.text('');
            expect(el.prop('valid')).toBeTruthy();
        });
    });
});
