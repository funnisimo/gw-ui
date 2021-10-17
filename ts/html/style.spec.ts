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

    test('padding and margin', () => {
        const a = new Style.Style('a', { padding: 1, margin: 2 });
        expect(a.padTop).toEqual(1);
        expect(a.padRight).toEqual(1);
        expect(a.padBottom).toEqual(1);
        expect(a.padLeft).toEqual(1);
        expect(a.marginTop).toEqual(2);
        expect(a.marginRight).toEqual(2);
        expect(a.marginBottom).toEqual(2);
        expect(a.marginLeft).toEqual(2);

        a.set({ padding: [11], margin: [12] });
        expect(a.padTop).toEqual(11);
        expect(a.padRight).toEqual(11);
        expect(a.padBottom).toEqual(11);
        expect(a.padLeft).toEqual(11);
        expect(a.marginTop).toEqual(12);
        expect(a.marginRight).toEqual(12);
        expect(a.marginBottom).toEqual(12);
        expect(a.marginLeft).toEqual(12);

        a.set({ padding: [1, 2], margin: [3, 4] });
        expect(a.padTop).toEqual(1);
        expect(a.padRight).toEqual(2);
        expect(a.padBottom).toEqual(1);
        expect(a.padLeft).toEqual(2);
        expect(a.marginTop).toEqual(3);
        expect(a.marginRight).toEqual(4);
        expect(a.marginBottom).toEqual(3);
        expect(a.marginLeft).toEqual(4);

        a.set({ padding: [5, 6, 7], margin: [8, 9, 10] });
        expect(a.padTop).toEqual(5);
        expect(a.padRight).toEqual(6);
        expect(a.padBottom).toEqual(7);
        expect(a.padLeft).toEqual(6);
        expect(a.marginTop).toEqual(8);
        expect(a.marginRight).toEqual(9);
        expect(a.marginBottom).toEqual(10);
        expect(a.marginLeft).toEqual(9);

        a.set({ padding: [1, 2, 3, 4], margin: [5, 6, 7, 8] });
        expect(a.padTop).toEqual(1);
        expect(a.padRight).toEqual(2);
        expect(a.padBottom).toEqual(3);
        expect(a.padLeft).toEqual(4);
        expect(a.marginTop).toEqual(5);
        expect(a.marginRight).toEqual(6);
        expect(a.marginBottom).toEqual(7);
        expect(a.marginLeft).toEqual(8);
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

    test('multi rule', () => {
        const textOptions: Style.StyleOptions = {
            fg: 'red',
        };

        const divStyle: Style.Style = sheet.add('text, div', textOptions); // returns last one
        const textStyle: Style.Style = sheet.add('text', { bg: 'blue' });

        expect(sheet.get('text')).toBe(textStyle);
        expect(sheet.get('div')).toBe(divStyle);

        expect(divStyle).toBeObject();
        expect(divStyle.selector.text).toEqual('div');
        expect(divStyle.selector.priority).toEqual(10);
        expect(divStyle.fg).toEqual('red');
        expect(divStyle.bg).toBeUndefined();

        expect(textStyle.selector.text).toEqual('text');
        expect(textStyle.selector.priority).toEqual(10);
        expect(textStyle.fg).toEqual('red');
        expect(textStyle.bg).toEqual('blue');
    });
});
