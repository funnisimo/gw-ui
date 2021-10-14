import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Layer from './document';
import * as Widget from './widget';

describe('Layer', () => {
    let ui: UICore;
    let layer: Layer.Layer;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        layer = new Layer.Layer(ui);
    });

    test('get root', () => {
        const s = layer.$('layer');
        expect(s.selected).toEqual([layer.root]);

        const t = layer.$();
        expect(t.selected).toEqual([layer.root]);
    });

    test('new widget', () => {
        const s = layer.$('<text>');
        expect(s.selected).toHaveLength(1);
        expect(s.get(0)).toBeInstanceOf(Widget.Widget);
        expect(s.get(0).tag).toEqual('text');
        expect(s.get(0)._attached).toBeFalsy();
    });

    // test('add widget to layer', () => {
    //     expect(layer.allWidgets).toHaveLength(1);

    //     const s = layer.add('<text>');
    //     expect(s.selected).toHaveLength(1);
    //     expect(layer.allWidgets).toHaveLength(2);
    //     expect(layer.allWidgets[1]).toBe(s.selected[0]);
    //     expect(s.get(0)._attached).toBeTruthy();
    // });

    test('add', () => {
        const s = layer.$('<text>').add('<text>').add('<text>');
        expect(s.length()).toEqual(3);
        s.forEach((w) => {
            expect(w.tag).toEqual('text');
        });

        s.appendTo('layer');
        expect(layer.allWidgets).toHaveLength(4);
        s.forEach((w) => {
            expect(w.parent).toBe(layer.root);
            expect(w._attached).toBeTruthy();
        });

        s.detach();
        expect(layer.allWidgets).toHaveLength(1);
        s.forEach((w) => {
            expect(w.parent).toBeNull();
            expect(w._attached).toBeFalsy();
        });
    });

    test('after', () => {
        const t = layer.$('<text>').appendTo('layer');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(layer.root);
        expect(t.get(0)._attached).toBeTruthy();
        expect(layer.allWidgets).toHaveLength(2);
        expect(layer.allWidgets[1]).toBe(t.get(0));
        expect(layer.root.children[0]).toBe(t.get(0));

        const orig = t.get(0);

        t.after('<text>');
        expect(layer.allWidgets).toHaveLength(3);
        expect(layer.allWidgets[1]).toBe(t.get(0));
        expect(layer.allWidgets[2]).not.toBe(t.get(0));
        expect(layer.root.children[0]).toBe(t.get(0));
        expect(layer.root.children[1]).not.toBe(t.get(0));

        const next = layer.allWidgets[2];

        t.after('<text>');
        expect(layer.allWidgets).toHaveLength(4);
        expect(layer.allWidgets[1]).toBe(orig);
        expect(layer.allWidgets[2]).toBe(next);
        expect(layer.root.children[0]).toBe(orig);
        expect(layer.root.children[1]).not.toBe(next);
        expect(layer.root.children[2]).toBe(next);
    });

    test('append', () => {
        const l = layer.$().append('<text>');
        expect(l.length()).toEqual(1);
        expect(layer.allWidgets).toHaveLength(2);

        const t = layer.$('text');
        expect(t.length()).toEqual(1);
        expect(t.get(0).parent).toBe(layer.root);
        expect(t.get(0)._attached).toBeTruthy();
        expect(layer.allWidgets.includes(t.get(0))).toBeTruthy();
    });

    test('appendTo', () => {
        const t = layer.$('<text>').appendTo('layer');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(layer.root);
        expect(t.get(0)._attached).toBeTruthy();
        expect(layer.allWidgets).toHaveLength(2);
    });

    test('before - first child', () => {
        const t = layer.$('<text>').appendTo('layer');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(layer.root);
        expect(t.get(0)._attached).toBeTruthy();
        expect(layer.allWidgets).toHaveLength(2);
        expect(layer.allWidgets[1]).toBe(t.get(0));
        expect(layer.root.children[0]).toBe(t.get(0));

        t.before('<text>');
        expect(layer.allWidgets).toHaveLength(3);
        expect(layer.allWidgets[1]).toBe(t.get(0));
        expect(layer.allWidgets[2]).not.toBe(t.get(0));
        expect(layer.root.children[0]).not.toBe(t.get(0));
        expect(layer.root.children[1]).toBe(t.get(0));
    });

    test('detach - not attached', () => {
        expect(layer.allWidgets).toHaveLength(1);
        const t = layer.$('<text>');
        expect(layer.allWidgets).toHaveLength(1);
        t.detach(); // quietly does nothing
        expect(layer.allWidgets).toHaveLength(1);
    });

    test('detach - cannot detach root', () => {
        expect(layer.allWidgets).toHaveLength(1);
        const t = layer.$().append('<text>');
        expect(layer.allWidgets).toHaveLength(2);
        expect(() => t.detach()).toThrow(); // error - cannot detach root
        expect(layer.allWidgets).toHaveLength(2);
    });

    test('detach', () => {
        const t = layer.$('<text>').appendTo('layer');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(layer.root);
        expect(t.get(0)._attached).toBeTruthy();
        expect(layer.allWidgets).toHaveLength(2);

        t.detach();
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBeNull();
        expect(t.get(0)._attached).toBeFalsy();
        expect(layer.allWidgets).toHaveLength(1);
    });

    test('empty', () => {
        const s = layer.$('<text>').add('<text>').add('<text>');
        expect(s.length()).toEqual(3);
        s.forEach((w) => {
            expect(w.tag).toEqual('text');
        });

        s.appendTo('layer');
        layer.root.text('test');
        expect(layer.root.children).toHaveLength(3);
        expect(layer.root.text()).toEqual('test');

        layer.$().empty();
        expect(layer.allWidgets).toHaveLength(1);
        expect(layer.root.children).toHaveLength(0);
        expect(layer.root.text()).toEqual('');
    });
});
