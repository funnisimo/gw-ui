import * as Parser from './parser';

describe('Parser', () => {
    test('<div>', () => {
        const e = Parser.parse('<div>');
        expect(e.tag).toEqual('div');
    });

    test('<div>Text</div>', () => {
        const e = Parser.parse('<div>Text</div>');
        expect(e.tag).toEqual('div');
        expect(e.text()).toEqual('Text');
    });

    test('<div>Text', () => {
        const e = Parser.parse('<div>Text');
        expect(e.tag).toEqual('div');
        expect(e.text()).toEqual('Text');
    });

    test('<div id=A>', () => {
        const e = Parser.parse('<div id=A>');
        expect(e.tag).toEqual('div');
        expect(e.attr('id')).toEqual('A');
    });

    test('<div id=A style="bg: black">', () => {
        const e = Parser.parse('<div id=A style="bg: black">');
        expect(e.tag).toEqual('div');
        expect(e.attr('id')).toEqual('A');
        expect(e.style('bg')).toEqual('black');
        expect(e.attr('style')).toEqual('bg: black');
    });

    test('<div id=A style="bg: black"></div>', () => {
        const e = Parser.parse('<div id=A style="bg: black"></div>');
        expect(e.tag).toEqual('div');
        expect(e.attr('id')).toEqual('A');
        expect(e.style('bg')).toEqual('black');
        expect(e.attr('style')).toEqual('bg: black');
    });

    test('<div id=A style="bg: black">Text</div>', () => {
        const e = Parser.parse('<div id=A style="bg: black">Text</div>');
        expect(e.tag).toEqual('div');
        expect(e.attr('id')).toEqual('A');
        expect(e.style('bg')).toEqual('black');
        expect(e.attr('style')).toEqual('bg: black');
        expect(e.text()).toEqual('Text');
    });

    test('<div><div><div>', () => {
        const a = Parser.parse('<div><div><div>');
        expect(a.tag).toEqual('div');
        expect(a.children).toHaveLength(1);
        const b = a.children[0];
        expect(b.tag).toEqual('div');
        expect(b.children).toHaveLength(1);
        const c = b.children[0];
        expect(c.tag).toEqual('div');
        expect(c.children).toHaveLength(0);
    });

    test('<div><div><div>', () => {
        const a = Parser.parse('<div><div><div>');
        expect(a.tag).toEqual('div');
        expect(a.children).toHaveLength(1);
        const b = a.children[0];
        expect(b.tag).toEqual('div');
        expect(b.children).toHaveLength(1);
        const c = b.children[0];
        expect(c.tag).toEqual('div');
        expect(c.children).toHaveLength(0);
    });

    // closedBy = ul, ol
    test('<ul><li>A</li><li>B</ul>', () => {
        const ul = Parser.parse('<ul><li>A</li><li>B</ul>');
        expect(ul.tag).toEqual('ul');
        expect(ul.children).toHaveLength(2);
        const a = ul.children[0];
        expect(a.tag).toEqual('li');
        expect(a.text()).toEqual('A');
        expect(a.children).toHaveLength(0);
        const b = ul.children[1];
        expect(b.tag).toEqual('li');
        expect(b.text()).toEqual('B');
        expect(b.children).toHaveLength(0);
    });
});
