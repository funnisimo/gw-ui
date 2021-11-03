import * as UTILS from '../test/utils';
import * as GWU from 'gw-utils';
import * as UI from './ui';

describe('UI', () => {
    let canvas: GWU.canvas.BaseCanvas;
    let loop: UTILS.MockLoop;

    beforeEach(() => {
        loop = UTILS.mockLoop();
        canvas = UTILS.mockCanvas(50, 30) as unknown as GWU.canvas.BaseCanvas;
    });

    test('construct', () => {
        const ui = new UI.UI({ loop, canvas });
        expect(ui.loop).toBe(loop);
        expect(ui.canvas).toBe(canvas);
        expect(ui.layer).toBeNull();
    });

    test('stop layer', async () => {
        const ui = new UI.UI({ loop, canvas });
        const layer = ui.startNewLayer();
        jest.spyOn(layer, 'click');

        expect(ui.layer).toBe(layer);

        await loop.pushEvent(UTILS.click(2, 2));

        layer.finish();
        expect(layer.click).toHaveBeenCalled();

        expect(ui._done).toBeTruthy();
        await ui.stop();

        expect(ui.layer).toBeNull();
    });

    test('multiple layers', async () => {
        const ui = new UI.UI({ loop, canvas });

        const layer = ui.startNewLayer();
        jest.spyOn(layer, 'click');
        expect(ui.layer).toBe(layer);

        const layer2 = ui.startNewLayer();
        jest.spyOn(layer2, 'click');
        expect(ui.layer).toBe(layer2);

        await loop.pushEvent(UTILS.click(2, 2));

        layer2.finish();
        layer.finish();

        expect(ui._done).toBeTruthy();
        await ui.stop();

        expect(layer.click).not.toHaveBeenCalled();
        expect(layer2.click).toHaveBeenCalled();
    });

    test('multiple layers 2', async () => {
        const ui = new UI.UI({ loop, canvas });
        const layer = ui.startNewLayer();
        jest.spyOn(layer, 'click');

        // @ts-ignore
        layer.click.mockImplementation(() => {
            layer.finish('TACO');
        });
        expect(ui.layer).toBe(layer);

        const layer2 = ui.startNewLayer();
        jest.spyOn(layer2, 'click');
        expect(ui.layer).toBe(layer2);

        // @ts-ignore
        layer2.click.mockImplementation(() => {
            layer2.finish(null);
        });

        const e2 = UTILS.click(2, 2);
        const e3 = UTILS.click(3, 3);

        await UTILS.pushEvent(ui.loop, e2);
        expect(ui.layer).toBe(layer);

        await UTILS.pushEvent(ui.loop, e3);

        expect(ui._done).toBeTruthy();
        await ui.stop();

        expect(layer.result).toEqual('TACO');
        expect(layer2.result).toEqual(null);

        expect(layer2.click).toHaveBeenCalledWith(e2);
        expect(layer.click).toHaveBeenCalledWith(e3);
    });

    test('stop multiple layers', async () => {
        const ui = new UI.UI({ loop, canvas });
        const layer = ui.startNewLayer();
        jest.spyOn(layer, 'click');
        expect(ui.layer).toBe(layer);

        const layer2 = ui.startNewLayer();
        jest.spyOn(layer2, 'click');
        expect(ui.layer).toBe(layer2);

        await ui.stop();

        expect(layer.result).toBeUndefined();
        expect(layer2.result).toBeUndefined();
    });
});
