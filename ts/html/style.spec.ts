import 'jest-extended';
import * as Style from './style';

describe('style', () => {
    let sheet: Style.Sheet;

    beforeEach(() => {
        sheet = new Style.Sheet();
    });

    test('style', () => {
        const style = new Style.Style('*', { fg: 'white', bg: 'black' });
        expect(style.fg).toEqual('white');
        expect(style.bg).toEqual('black');
        expect(style.dirty).toBeFalsy();

        style.set({ fg: 'red', bg: 'white' });
        expect(style.fg).toEqual('red');
        expect(style.bg).toEqual('white');
        expect(style.dirty).toBeTruthy();

        style.dirty = false;
        expect(style.dirty).toBeFalsy();

        style.set({ fg: 'blue', bg: 'yellow' }, false);
        expect(style.fg).toEqual('blue');
        expect(style.bg).toEqual('yellow');
        expect(style.dirty).toBeFalsy();

        const other = new Style.Style('tag', { fg: 'white', bg: 'black' });
        style.set(other);
        expect(style.fg).toEqual('white');
        expect(style.bg).toEqual('black');
        expect(style.dirty).toBeTruthy();
    });

    test('set', () => {
        const style = new Style.Style('*', { fg: 'white', bg: 'black' });
        expect(style.fg).toEqual('white');
        expect(style.bg).toEqual('black');
        expect(style.dirty).toBeFalsy();

        style.set('fg', 'red');
        expect(style.fg).toEqual('red');
        expect(style.bg).toEqual('black');
        expect(style.dirty).toBeTruthy();

        style.dirty = false;
        style.set('fg', 'blue', false);
        expect(style.fg).toEqual('blue');
        expect(style.bg).toEqual('black');
        expect(style.dirty).toBeFalsy();

        style.unset('fg');
        expect(style.fg).toBeUndefined();
        expect(style.dirty).toBeTruthy();
    });

    test('default', () => {
        const def = sheet.get('*')!;
        expect(def.selector.text).toEqual('*');
        expect(def.selector.priority).toEqual(0);

        expect(def).toBeObject();
        expect(def.fg).toEqual('white');
        expect(def.bg).toEqual('black');
        expect(def.align).toEqual('left');
        expect(def.valign).toEqual('top');
    });

    test('tag rule', () => {
        const textOptions: Style.StyleOptions = {
            fg: 'red',
        };

        const textStyle: Style.Style = sheet.add('text', textOptions);
        expect(textStyle).toBeObject();
        expect(textStyle.fg).toEqual('red');
        expect(textStyle.bg).toBeUndefined();

        expect(textStyle.selector.text).toEqual('text');
        expect(textStyle.selector.priority).toEqual(10);
    });
});
