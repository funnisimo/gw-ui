import * as UTILS from '../../test/utils';
import { UICore } from '../types';
import * as Document from './document';
import * as Element from './element';

describe('body', () => {
    let ui: UICore;
    let document: Document.Document;

    beforeEach(() => {
        ui = UTILS.mockUI(50, 30);
        document = new Document.Document(ui);
    });

    test('get root', () => {
        const s = document.$('body');
        expect(s.selected).toEqual([document.body]);

        const t = document.$();
        expect(t.selected).toEqual([document.body]);
    });

    test('new widget', () => {
        const s = document.$('<text>');
        expect(s.selected).toHaveLength(1);
        expect(s.get(0)).toBeInstanceOf(Element.Element);
        expect(s.get(0).tag).toEqual('text');
        expect(s.get(0)._attached).toBeFalsy();
    });

    // test('add widget to layer', () => {
    //     expect(layer.children).toHaveLength(1);

    //     const s = layer.add('<text>');
    //     expect(s.selected).toHaveLength(1);
    //     expect(layer.children).toHaveLength(2);
    //     expect(layer.children[1]).toBe(s.selected[0]);
    //     expect(s.get(0)._attached).toBeTruthy();
    // });

    test('add', () => {
        const s = document.$('<text>').add('<text>').add('<text>');
        expect(s.length()).toEqual(3);
        s.forEach((w) => {
            expect(w.tag).toEqual('text');
        });

        s.appendTo('body');
        expect(document.children).toHaveLength(4);
        s.forEach((w) => {
            expect(w.parent).toBe(document.body);
            expect(w._attached).toBeTruthy();
        });

        s.detach();
        expect(document.children).toHaveLength(1);
        s.forEach((w) => {
            expect(w.parent).toBeNull();
            expect(w._attached).toBeFalsy();
        });
    });

    test('after', () => {
        const t = document.$('<text>').appendTo('body');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(document.body);
        expect(t.get(0)._attached).toBeTruthy();
        expect(document.children).toHaveLength(2);
        expect(document.children[1]).toBe(t.get(0));
        expect(document.body.children[0]).toBe(t.get(0));

        const orig = t.get(0);

        t.after('<text>');
        expect(document.children).toHaveLength(3);
        expect(document.children[1]).toBe(t.get(0));
        expect(document.children[2]).not.toBe(t.get(0));
        expect(document.body.children[0]).toBe(t.get(0));
        expect(document.body.children[1]).not.toBe(t.get(0));

        const next = document.children[2];

        t.after('<text>');
        expect(document.children).toHaveLength(4);
        expect(document.children[1]).toBe(orig);
        expect(document.children[2]).toBe(next);
        expect(document.body.children[0]).toBe(orig);
        expect(document.body.children[1]).not.toBe(next);
        expect(document.body.children[2]).toBe(next);
    });

    test('append', () => {
        const l = document.$().append('<text>');
        expect(l.length()).toEqual(1);
        expect(document.children).toHaveLength(2);

        const t = document.$('text');
        expect(t.length()).toEqual(1);
        expect(t.get(0).parent).toBe(document.body);
        expect(t.get(0)._attached).toBeTruthy();
        expect(document.children.includes(t.get(0))).toBeTruthy();
    });

    test('appendTo', () => {
        const t = document.$('<text>').appendTo('body');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(document.body);
        expect(t.get(0)._attached).toBeTruthy();
        expect(document.children).toHaveLength(2);
    });

    test('before - first child', () => {
        const t = document.$('<text>').appendTo('body');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(document.body);
        expect(t.get(0)._attached).toBeTruthy();
        expect(document.children).toHaveLength(2);
        expect(document.children[1]).toBe(t.get(0));
        expect(document.body.children[0]).toBe(t.get(0));

        t.before('<text>');
        expect(document.children).toHaveLength(3);
        expect(document.children[1]).toBe(t.get(0));
        expect(document.children[2]).not.toBe(t.get(0));
        expect(document.body.children[0]).not.toBe(t.get(0));
        expect(document.body.children[1]).toBe(t.get(0));
    });

    test('detach - not attached', () => {
        expect(document.children).toHaveLength(1);
        const t = document.$('<text>');
        expect(document.children).toHaveLength(1);
        t.detach(); // quietly does nothing
        expect(document.children).toHaveLength(1);
    });

    test('detach - cannot detach root', () => {
        expect(document.children).toHaveLength(1);
        const t = document.$().append('<text>');
        expect(document.children).toHaveLength(2);
        expect(() => t.detach()).toThrow(); // error - cannot detach root
        expect(document.children).toHaveLength(2);
    });

    test('detach', () => {
        const t = document.$('<text>').appendTo('body');
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBe(document.body);
        expect(t.get(0)._attached).toBeTruthy();
        expect(document.children).toHaveLength(2);

        t.detach();
        expect(t.get(0).tag).toEqual('text');
        expect(t.get(0).parent).toBeNull();
        expect(t.get(0)._attached).toBeFalsy();
        expect(document.children).toHaveLength(1);
    });

    test('empty', () => {
        const s = document.$('<text>').add('<text>').add('<text>');
        expect(s.length()).toEqual(3);
        s.forEach((w) => {
            expect(w.tag).toEqual('text');
        });

        s.appendTo('body');
        document.body.text('test');
        expect(document.body.children).toHaveLength(3);
        expect(document.body.text()).toEqual('test');

        document.$().empty();
        expect(document.children).toHaveLength(1);
        expect(document.body.children).toHaveLength(0);
        expect(document.body.text()).toEqual('');
    });
});
