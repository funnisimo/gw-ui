import * as UTILS from '../../test/utils';
// import * as GWU from 'gw-utils';
import * as DataList from './datalist';
import * as Layer from '../layer';

describe('List Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('constructor', () => {
        const dl = new DataList.DataList(layer, {});
        expect(dl.columns).toHaveLength(1);
        expect(dl.columns[0]).toMatchObject({ width: 10 });
    });

    test('default', () => {
        const dl = layer.datalist({
            x: 10,
            y: 5,
            empty: '-',
        });

        layer.draw();
        // layer.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 1 }); // default width, height
        expect(UTILS.getBufferText(layer.buffer, 10, 5, 10)).toEqual('-'); // default empty text

        dl.data(['Taco', 'Salad', 'Sandwich']);
        layer.draw();

        // layer.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 3 }); // width, height from content
        expect(UTILS.getBufferText(layer.buffer, 10, 5, 10)).toEqual('Taco');
        expect(UTILS.getBufferText(layer.buffer, 10, 6, 10)).toEqual('Salad');
        expect(UTILS.getBufferText(layer.buffer, 10, 7, 10)).toEqual(
            'Sandwich'
        );
    });

    test('legend', () => {
        const dl = layer.pos(10, 5).datalist({ header: 'Foods' });

        layer.draw(); // calculateStyles, updateLayout, draw

        // layer.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 2 }); // default width, height=legend + empty
        expect(UTILS.getBufferText(layer.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(UTILS.getBufferText(layer.buffer, 10, 6, 10)).toEqual('-'); // default empty text

        dl.data(['Taco', 'Salad', 'Sandwich']);
        layer.draw();

        // layer.buffer.dump();

        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 4 }); // width, height from content + legend
        expect(UTILS.getBufferText(layer.buffer, 10, 5, 10)).toEqual('Foods'); // legend
        expect(UTILS.getBufferText(layer.buffer, 10, 6, 10)).toEqual('Taco');
        expect(UTILS.getBufferText(layer.buffer, 10, 7, 10)).toEqual('Salad');
        expect(UTILS.getBufferText(layer.buffer, 10, 8, 10)).toEqual(
            'Sandwich'
        );
    });

    test('data', () => {
        const dl = new DataList.DataList(layer, {
            x: 10,
            y: 5,
            data: ['Apple', 'Banana', 'Carrot'],
        });

        expect(dl._data).toHaveLength(3);
        expect(dl.children).toHaveLength(3);

        expect(layer._depthOrder.includes(dl.children[0]));
        expect(layer._depthOrder.includes(dl.children[1]));
        expect(layer._depthOrder.includes(dl.children[2]));

        expect(dl.children[0].tag).toEqual('td');
        expect(dl.children[0].text()).toEqual('Apple');
        expect(dl.children[1].tag).toEqual('td');
        expect(dl.children[1].text()).toEqual('Banana');
        expect(dl.children[2].tag).toEqual('td');
        expect(dl.children[2].text()).toEqual('Carrot');

        layer.draw();
        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 3 });

        expect(layer._depthOrder).toContain(dl.children[0]);
        expect(layer._depthOrder).toContain(dl.children[1]);
        expect(layer._depthOrder).toContain(dl.children[2]);

        const oldChildren = dl.children.slice();

        dl.data(['1234567890', 'HUMMINGBIRD', 'CRANE', 'BLUE-JAY', 'ROBIN']);
        expect(dl.data()).toHaveLength(5);
        expect(dl.children).toHaveLength(5);

        expect(layer._depthOrder).not.toContain(oldChildren[0]);
        expect(layer._depthOrder).not.toContain(oldChildren[1]);
        expect(layer._depthOrder).not.toContain(oldChildren[2]);

        layer.draw();
        expect(layer._depthOrder).toContain(dl.children[0]);
        expect(layer._depthOrder).toContain(dl.children[1]);
        expect(layer._depthOrder).toContain(dl.children[2]);
        expect(layer._depthOrder).toContain(dl.children[3]);
        expect(layer._depthOrder).toContain(dl.children[4]);
        expect(dl.bounds).toMatchObject({ x: 10, y: 5, width: 10, height: 5 });

        expect(UTILS.getBufferText(layer.buffer, 10, 5, 20)).toEqual(
            '1234567890'
        );
        expect(UTILS.getBufferText(layer.buffer, 10, 6, 20)).toEqual(
            'HUMMINGBI-'
        ); // truncated!
        expect(UTILS.getBufferText(layer.buffer, 10, 7, 20)).toEqual('CRANE');
        expect(UTILS.getBufferText(layer.buffer, 10, 8, 20)).toEqual(
            'BLUE-JAY'
        );
        expect(UTILS.getBufferText(layer.buffer, 10, 9, 20)).toEqual('ROBIN');
    });
});
