import 'jest-extended';
// import * as GWU from 'gw-utils';
import * as Element from './element';

describe('Element', () => {
    let root: Element.Element;

    beforeEach(() => {
        root = new Element.Element('root').style({
            width: 50,
            height: 30,
            position: 'fixed',
        });
        root.updateLayout();
    });

    test('create', () => {
        const w = new Element.Element('text');
        expect(w.tag).toEqual('text');
        expect(w.style().dirty).toBeFalsy();
        expect(w.used('left')).toBeUndefined();
        expect(w.used('top')).toBeUndefined();
        expect(w.used('width')).toBeUndefined();
        expect(w.used('height')).toBeUndefined();
        expect(w.used().dirty).toBeFalsy();
        expect(w.dirty).toBeFalsy();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });

        w.text('Testing');
        expect(w.dirty).toBeTruthy();
        w.updateLayout();
        expect(w.dirty).toBeTruthy(); // still needs style to be updated
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 7, height: 1 });
    });

    // CLONE

    test('clone', () => {
        const a = new Element.Element('text');
        const b = new Element.Element('text');
        a.dirty = false;
        b.dirty = false;
        expect(a.dirty).toBeFalsy();
        expect(b.dirty).toBeFalsy();

        a.addChild(b);
        expect(a.dirty).toBeTruthy();
        expect(b.dirty).toBeTruthy();

        expect(b.parent).toBe(a);
        expect(a.children).toHaveLength(1);

        const c = a.clone();
        expect(c.children).toHaveLength(1);
        expect(c.children[0]).not.toBe(b);
        expect(c.dirty).toBeTruthy();
        expect(c.children[0].dirty).toBeTruthy();
    });

    // CHILDREN

    test('addChild', () => {
        const a = new Element.Element('text');
        const b = new Element.Element('text');
        a.dirty = false;
        b.dirty = false;
        expect(a.dirty).toBeFalsy();
        expect(b.dirty).toBeFalsy();

        a.addChild(b);
        expect(a.dirty).toBeTruthy();
        expect(b.dirty).toBeTruthy();

        expect(b.parent).toBe(a);
        expect(a.children).toHaveLength(1);

        // does nothing if already there
        a.addChild(b);
        expect(b.parent).toBe(a);
        expect(a.children).toHaveLength(1);
    });

    test('removeChild', () => {
        const a = new Element.Element('text');
        const b = new Element.Element('text');

        a.addChild(b);
        expect(b.parent).toBe(a);
        expect(a.children).toHaveLength(1);

        a.dirty = false;
        b.dirty = false;
        expect(a.dirty).toBeFalsy();
        expect(b.dirty).toBeFalsy();

        a.removeChild(b);
        expect(a.dirty).toBeTruthy();
        expect(b.dirty).toBeTruthy();

        expect(a.children).toHaveLength(0);
        expect(b.parent).toBeNull();

        // does nothing if not there
        a.removeChild(b);
        expect(a.children).toHaveLength(0);
        expect(b.parent).toBeNull();
    });

    // POSITION

    test('left', () => {
        const w = new Element.Element('text');
        expect(w.style('left')).toBeUndefined();
        expect(w.bounds.x).toEqual(0);

        w.style('left', 4);
        w.updateLayout();
        expect(w.style('left')).toEqual(4);
        expect(w.bounds.x).toEqual(0); // position: static

        w.style('position', 'relative');
        w.updateLayout();
        expect(w.style('left')).toEqual(4);
        expect(w.bounds.x).toEqual(4);
    });

    test('right', () => {
        const w = new Element.Element('text');
        root.addChild(w);

        expect(w.used('right')).toBeUndefined();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });
        expect(w.bounds.right).toEqual(0);

        root.updateLayout();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 50, height: 0 });
        expect(w.bounds.right).toEqual(50);

        w.style('right', 4);
        w.style('position', 'relative');
        root.updateLayout();
        expect(w.used('right')).toEqual(4);
        expect(w.bounds).toMatchObject({
            x: -4,
            y: 0,
            width: 50,
            height: 0,
        });
        expect(w.bounds.right).toEqual(root.bounds.right - 4);

        w.style('right', 6);
        root.updateLayout();
        expect(w.used('right')).toEqual(6);
        expect(w.bounds).toMatchObject({
            x: -6,
            y: 0,
            width: 50,
            height: 0,
        });
        expect(w.bounds.right).toEqual(root.bounds.right - 6);
    });

    test('top', () => {
        const w = new Element.Element('text');
        expect(w.used('position')).toBeUndefined();
        expect(w.used('top')).toBeUndefined();
        expect(w.bounds.y).toEqual(0);

        w.style('top', 4);
        w.updateLayout();
        expect(w.used('top')).toEqual(4);
        expect(w.bounds.y).toEqual(0); // static positioning ignores "top"

        w.style('position', 'relative');
        w.updateLayout();
        expect(w.used('top')).toEqual(4);
        expect(w.used('position')).toEqual('relative');
        expect(w.bounds.y).toEqual(4);
    });

    test('bottom', () => {
        const w = new Element.Element('text');
        expect(w.used('position')).toBeUndefined();
        expect(w.used('bottom')).toBeUndefined();

        w.updateLayout();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });

        w.style('bottom', 4);
        expect(w.used('bottom')).toEqual(4);
        w.updateLayout();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 0, height: 0 }); // static

        w.style('position', 'relative');
        w.updateLayout();
        expect(w.bounds).toMatchObject({ x: 0, y: -4, width: 0, height: 0 });
        expect(w.bounds.bottom).toEqual(-4);
    });

    test('pos', () => {
        const w = new Element.Element('text');
        w.pos({ left: 4, bottom: 2 });
        expect(w.used('left')).toEqual(4);
        expect(w.used('bottom')).toEqual(2);

        w.updateLayout();
        expect(w.pos()).toMatchObject({ x: 4, y: 0, width: 0, height: 0 });

        w.style('position', 'relative');
        w.updateLayout();
        expect(w.pos()).toMatchObject({ x: 4, y: -2, width: 0, height: 0 });
    });

    // SIZE

    test('size', () => {
        const w = new Element.Element('text');

        w.size({ width: 9, minHeight: 4 });
        expect(w.used('minWidth')).toBeUndefined();
        expect(w.used('maxWidth')).toBeUndefined();
        expect(w.used('width')).toEqual(9);
        expect(w.used('minHeight')).toEqual(4);
        expect(w.used('maxHeight')).toBeUndefined();
        expect(w.used('height')).toBeUndefined();

        w.updateLayout();
        expect(w.bounds.width).toEqual(9);
        expect(w.bounds.height).toEqual(4);
        expect(w.bounds.x).toEqual(0);
        expect(w.bounds.y).toEqual(0);
    });

    test('width', () => {
        const w = new Element.Element('text');

        w.style('width', 9);
        expect(w.dirty).toBeTruthy();
        expect(w.used('minWidth')).toBeUndefined();
        expect(w.used('maxWidth')).toBeUndefined();
        expect(w.used('width')).toEqual(9);

        w.updateLayout();
        expect(w.bounds.width).toEqual(9);
        expect(w.bounds.x).toEqual(0);
        expect(w.dirty).toBeFalsy();

        w.text('taco');
        w.updateLayout();
        expect(w.used('width')).toEqual(9);
        expect(w.bounds.width).toEqual(9);

        w.text('12345678901234567890');
        w.updateLayout();
        expect(w.used('width')).toEqual(9);
        expect(w.dirty).toBeTruthy(); // needs style to be updated
        // w._update();
        // expect(w.dirty).toBeFalsy();
        // expect(w._lines).toEqual(['12345678-', '90123456-', '7890']);
        // expect(w.bounds.width).toEqual(9);

        // w.text('taco');
        // expect(w.style('width')).toEqual(9);
        // expect(w.bounds.width).toEqual(9);
    });

    test('minWidth', () => {
        const w = new Element.Element('text');
        w.style('minWidth', 10);
        expect(w.used('minWidth')).toEqual(10);
        expect(w.used('width')).toBeUndefined();

        w.updateLayout();
        expect(w.bounds.width).toEqual(10);

        w.style('width', 9);
        expect(w.used('minWidth')).toEqual(10);
        expect(w.used('width')).toEqual(9);

        w.updateLayout();
        expect(w.bounds.width).toEqual(10);

        w.text('taco');
        w.updateLayout();
        expect(w.used('width')).toEqual(9);
        expect(w.bounds.width).toEqual(10);
        expect(w.bounds.height).toEqual(1);
        expect(w._lines).toEqual(['taco']);

        w.text('12345678901234567890');
        w.updateLayout();
        expect(w.used('minWidth')).toEqual(10);
        expect(w.used('width')).toEqual(9);
        expect(w.bounds.width).toEqual(10);
        expect(w.bounds.height).toEqual(3);
        expect(w._lines).toEqual(['123456789-', '012345678-', '90']);

        w.text('taco');
        w.updateLayout();
        expect(w.used('width')).toEqual(9);
        expect(w.bounds.width).toEqual(10);
        expect(w.bounds.height).toEqual(1);
        expect(w._lines).toEqual(['taco']);
    });

    test('maxWidth', () => {
        const w = new Element.Element('text');
        w.style('maxWidth', 15);
        expect(w.used('minWidth')).toBeUndefined();
        expect(w.used('maxWidth')).toEqual(15);
        expect(w.used('width')).toBeUndefined();
        expect(w.bounds.width).toEqual(0);

        w.style('width', 9);
        w.updateLayout();
        expect(w.used('width')).toEqual(9);
        expect(w.used('maxWidth')).toEqual(15);
        expect(w.bounds.width).toEqual(9);

        w.style('width', 20);
        w.updateLayout();
        expect(w.used('width')).toEqual(20);
        expect(w.used('maxWidth')).toEqual(15);
        expect(w.bounds.width).toEqual(15);

        w.text('taco');
        w.updateLayout();
        expect(w.used('width')).toEqual(20);
        expect(w.used('maxWidth')).toEqual(15);
        expect(w.bounds.width).toEqual(15);

        w.text('12345678901234567890');
        w.updateLayout();
        expect(w.used('width')).toEqual(20);
        expect(w.used('maxWidth')).toEqual(15);
        expect(w.used('height')).toBeUndefined();
        expect(w.text()).toEqual('12345678901234567890');
        expect(w.bounds.width).toEqual(15);
        expect(w.bounds.height).toEqual(2);
        expect(w._lines).toEqual(['12345678901234-', '567890']);

        w.text('taco');
        w.updateLayout();
        expect(w.used('width')).toEqual(20);
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.width).toEqual(15);
        expect(w.bounds.height).toEqual(1);
        expect(w._lines).toEqual(['taco']);
    });

    test('height', () => {
        const w = new Element.Element('text');
        expect(w.used('minHeight')).toBeUndefined();
        expect(w.used('maxHeight')).toBeUndefined();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(0);

        w.text('taco');
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(1);

        w.text('taco\nsalad');
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(2);

        w.style('height', 4);
        w.updateLayout();
        expect(w.used('height')).toEqual(4);
        expect(w.bounds.height).toEqual(4);
        expect(w._lines).toEqual(['taco', 'salad']);
    });

    test('minHeight', () => {
        const w = new Element.Element('text');
        expect(w.style('minHeight')).toBeUndefined();
        expect(w.style('maxHeight')).toBeUndefined();
        expect(w.style('height')).toBeUndefined();
        expect(w.style().position).toBeUndefined();
        expect(w.style().dirty).toBeFalsy();
        expect(w.used('minHeight')).toBeUndefined();
        expect(w.used('maxHeight')).toBeUndefined();
        expect(w.used('height')).toBeUndefined();
        expect(w.used().position).toBeUndefined();
        expect(w.used().dirty).toBeFalsy();
        expect(w.bounds).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });
        expect(w._dirty).toBeFalsy();
        expect(w.dirty).toBeFalsy();

        w.style('minHeight', 4);
        expect(w._dirty).toBeTruthy();
        expect(w.used().dirty).toBeFalsy();
        expect(w.style().dirty).toBeFalsy();
        expect(w.dirty).toBeTruthy();

        expect(w.style('minHeight')).toEqual(4);
        expect(w.used('minHeight')).toEqual(4);

        w.updateLayout();
        expect(w.bounds.height).toEqual(4);
        expect(w._dirty).toBeFalsy();
        expect(w.dirty).toBeFalsy();

        w.text('taco');
        expect(w.dirty).toBeTruthy();
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(4);
        expect(w.dirty).toBeTruthy(); // still needs style to be updated

        w.text('1\n2\n3\n4\n5\n6\n');
        expect(w.dirty).toBeTruthy();
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.used('minHeight')).toEqual(4);
        expect(w.bounds.height).toEqual(6);

        w.text('taco');
        expect(w.dirty).toBeTruthy();
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(4);
    });

    test('maxHeight', () => {
        const w = new Element.Element('text');
        expect(w.used('minHeight')).toBeUndefined();
        expect(w.used('maxHeight')).toBeUndefined();
        expect(w.used('height')).toBeUndefined();
        expect(w.used('width')).toBeUndefined();
        expect(w.bounds.height).toEqual(0);

        w.style('maxHeight', 4);
        w.updateLayout();
        expect(w.used('minHeight')).toBeUndefined();
        expect(w.used('maxHeight')).toEqual(4);
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(0);

        w.text('taco');
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.bounds.height).toEqual(1);
        expect(w.bounds.width).toEqual(4); // no parent to set otherwise

        w.text('1\n2\n3\n4\n5\n6\n');
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.used('maxHeight')).toEqual(4);
        expect(w.bounds.height).toEqual(4);
        expect(w.bounds.width).toEqual(1); // no parent to set otherwise
        expect(w._lines).toEqual(['1', '2', '3', '4']);

        w.text('taco');
        w.updateLayout();
        expect(w.used('height')).toBeUndefined();
        expect(w.used('maxHeight')).toEqual(4);
        expect(w.bounds.height).toEqual(1);
    });
});
