import * as UTILS from '../../test/utils';
// import * as GWU from 'gw-utils';
import * as Fieldset from './fieldset';
import * as Layer from '../layer';
// import { Widget } from '.';

describe('Fieldset Widget', () => {
    let layer: Layer.Layer;

    beforeEach(() => {
        layer = UTILS.mockLayer(50, 30);
    });

    test('create obj', () => {
        const e = new Fieldset.Fieldset(layer, {
            width: 30,
            height: 10,
            x: 5,
            y: 5,
            legend: 'LEGEND',
        });

        expect(e.bounds).toMatchObject({ x: 5, y: 5, width: 30, height: 10 });

        layer.draw();

        expect(UTILS.getBufferText(layer.buffer, 7, 5, 20)).toEqual('LEGEND');
        // layer.buffer.dump();
    });

    // function info(w: Widget) {
    //     let base = `${w.tag}(${w.text()}) @ ${w.bounds.toString()}`;
    //     return base;
    // }

    test('add children', () => {
        // console.log(layer.allWidgets.map((w) => info(w)));

        const fs = layer.fieldset({
            legend: 'LEGEND',
            x: 10,
            y: 5,
        });

        // console.log(layer.allWidgets.map((w) => info(w)));

        for (let i = 0; i < 5; ++i) {
            layer.text('Field ' + i, { parent: fs });
        }

        // console.log(layer.allWidgets.map((w) => info(w)));
        layer.draw();

        // layer.buffer.dump();

        expect(UTILS.getBufferText(layer.buffer, 12, 5, 20)).toEqual('LEGEND');
        expect(UTILS.getBufferText(layer.buffer, 12, 7, 20)).toEqual('Field 0');
        expect(UTILS.getBufferText(layer.buffer, 12, 8, 20)).toEqual('Field 1');
        expect(UTILS.getBufferText(layer.buffer, 12, 9, 20)).toEqual('Field 2');
        expect(UTILS.getBufferText(layer.buffer, 12, 10, 20)).toEqual(
            'Field 3'
        );
        expect(UTILS.getBufferText(layer.buffer, 12, 11, 20)).toEqual(
            'Field 4'
        );

        expect(fs.bounds).toMatchObject({
            x: 10,
            y: 5,
            width: 11,
            height: 9,
        });
    });

    // test('local style', () => {
    //     expect(doc.stylesheet.get('fieldset')).not.toBeNull();

    //     const $fs = doc
    //         .create('<fieldset legend=LEGEND style="marginTop:0">')
    //         .pos(10, 5)
    //         .appendTo('body');
    //     for (let i = 0; i < 5; ++i) {
    //         $fs.append('<div>Testing</div>');
    //     }

    //     doc.computeStyles();
    //     doc.updateLayout();
    //     doc.draw();

    //     const fs = $fs.get(0);

    //     expect(fs.used('marginTop')).toEqual(0);
    //     expect(fs.used('marginRight')).toEqual(1);
    //     expect(fs.used('marginBottom')).toEqual(1);
    //     expect(fs.used('marginLeft')).toEqual(1);
    //     expect(fs.used('padTop')).toEqual(1);
    //     expect(fs.used('padRight')).toEqual(1);
    //     expect(fs.used('padBottom')).toEqual(1);
    //     expect(fs.used('padLeft')).toEqual(1);
    //     expect(fs.used('border')).toEqual('dark_gray');

    //     expect(fs.bounds).toMatchObject({
    //         x: 10,
    //         y: 5,
    //         width: 13,
    //         height: 10,
    //     });

    //     // ui.buffer.dump();
    // });
});
