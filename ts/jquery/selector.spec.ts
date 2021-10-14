import * as Selector from './selector';

describe('selector', () => {
    function mockSelectable(
        opts: Partial<Selector.Selectable> = {}
    ): Selector.Selectable {
        return {
            id: opts.id || 'id',
            tag: opts.tag || 'tag',
            props: opts.props || {},
            classes: opts.classes ? opts.classes.slice() : [],
        };
    }

    test('priority', () => {
        // global
        expect(Selector.selector('*').priority).toEqual(0);
        expect(Selector.selector('*:hovered').priority).toEqual(1);
        expect(Selector.selector(':hovered').priority).toEqual(1);

        // tag (+/- class)
        expect(Selector.selector('text').priority).toEqual(10);
        expect(Selector.selector('text:hovered').priority).toEqual(11);
        expect(Selector.selector('text.class').priority).toEqual(110);
        expect(Selector.selector('text.class:hovered').priority).toEqual(111);

        // class
        expect(Selector.selector('.class').priority).toEqual(100);
        expect(Selector.selector('.class:hovered').priority).toEqual(101);

        // id
        expect(Selector.selector('#id').priority).toEqual(1000);
        expect(Selector.selector('#id.class').priority).toEqual(1100);
        expect(Selector.selector('#id.class:hovered').priority).toEqual(1101);
        expect(Selector.selector('#id:hovered').priority).toEqual(1001);

        // local
        expect(Selector.selector('$').priority).toEqual(10000);
    });

    test('default', () => {
        const s = new Selector.Selector('*');

        const obj = mockSelectable();
        expect(s.matches(obj)).toBeTruthy();
    });

    test('tag', () => {
        const s = new Selector.Selector('text');
        expect(s.tag).toEqual('text');

        const obj = mockSelectable({ tag: 'tag' });
        expect(s.matches(obj)).toBeFalsy();

        obj.tag = 'text';
        expect(s.matches(obj)).toBeTruthy();

        obj.classes = ['a', 'b', 'c'];
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: 1, b: 1, c: 1 };
        expect(s.matches(obj)).toBeTruthy();
    });

    test('tag.className', () => {
        const s = new Selector.Selector('text.a');
        expect(s.tag).toEqual('text');

        const obj = mockSelectable({ tag: 'tag' });
        expect(s.matches(obj)).toBeFalsy();

        obj.tag = 'text';
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 1, b: 1, c: 1 };
        expect(s.matches(obj)).toBeFalsy();

        obj.classes = ['a', 'b', 'c'];
        expect(s.matches(obj)).toBeTruthy();

        obj.props = {};
        expect(s.matches(obj)).toBeTruthy();
    });

    test('tag:prop', () => {
        const s = new Selector.Selector('text:a');
        expect(s.tag).toEqual('text');

        const obj = mockSelectable({ tag: 'tag' });
        expect(s.matches(obj)).toBeFalsy();

        obj.tag = 'text';
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 1, b: 1, c: 1 };
        expect(s.matches(obj)).toBeTruthy();

        obj.classes = ['a', 'b', 'c'];
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: false };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 0 };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: '0' };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 'false' };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 'anything' };
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: 3 };
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: true };
        expect(s.matches(obj)).toBeTruthy();
    });

    test('tag.class:prop', () => {
        const s = new Selector.Selector('text.b:a');
        expect(s.tag).toEqual('text');

        const obj = mockSelectable({ tag: 'tag' });
        expect(s.matches(obj)).toBeFalsy();

        obj.tag = 'text';
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 1, b: 1, c: 1 };
        expect(s.matches(obj)).toBeFalsy();

        obj.classes = ['a', 'b', 'c'];
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: false };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: true };
        expect(s.matches(obj)).toBeTruthy();

        obj.classes = ['a', 'c'];
        expect(s.matches(obj)).toBeFalsy();
    });

    test('#id.class:prop', () => {
        const s = new Selector.Selector('#id.b:a');
        expect(s.tag).toEqual('');
        expect(s.id).toEqual('id');

        const obj = mockSelectable({ id: 'other' });
        expect(s.matches(obj)).toBeFalsy();

        obj.id = 'id';
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: 1, b: 1, c: 1 };
        expect(s.matches(obj)).toBeFalsy();

        obj.classes = ['a', 'b', 'c'];
        expect(s.matches(obj)).toBeTruthy();

        obj.props = { a: false };
        expect(s.matches(obj)).toBeFalsy();

        obj.props = { a: true };
        expect(s.matches(obj)).toBeTruthy();

        obj.classes = ['a', 'c'];
        expect(s.matches(obj)).toBeFalsy();
    });
});
