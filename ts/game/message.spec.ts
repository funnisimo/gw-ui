import 'jest-extended';
import * as UTILS from '../../test/utils';
import * as GWU from 'gw-utils';
import * as Message from './message';
import { UI } from '../ui';
import { Layer } from '../layer';

describe('Message', () => {
    let ui: UI;
    let layer: Layer;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
        layer = ui.startNewLayer();
    });

    test('basic - on top', () => {
        const widget = new Message.Messages(layer, {
            id: 'MSG',
            width: 80,
            height: 4,
        });
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        expect(widget.cache).toBeDefined();
        expect(widget.cache.length).toEqual(0);

        GWU.message.add('Testing');
        expect(widget.cache.length).toEqual(1);

        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 0, 3, 10)).toEqual('Testing'); // draws at bottom of widget
    });

    test('basic - on bottom', () => {
        const widget = new Message.Messages(layer, {
            id: 'MSG',
            x: 20,
            y: 36,
            width: 80,
            height: 4,
        });
        expect(widget.bounds.x).toEqual(20);
        expect(widget.bounds.y).toEqual(36);

        expect(widget.cache).toBeDefined();
        expect(widget.cache.length).toEqual(0);

        GWU.message.add('Testing');
        expect(widget.cache.length).toEqual(1);

        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 20, 36, 10)).toEqual(
            'Testing'
        ); // draws at top of widget
    });

    test('show archive - top', async () => {
        // @ts-ignore -- turn off automatic TICK events
        ui.loop._startTicks.mockReturnValue(true);

        const widget = new Message.Messages(layer, {
            id: 'MSG',
            width: 80,
            height: 4,
        });

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);

        for (let i = 0; i < 50; ++i) {
            GWU.message.add('Testing ' + i);
        }
        expect(widget.cache.length).toBeGreaterThan(10);

        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 0, 0, 20)).toEqual(
            'Testing 46'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 1, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 2, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 3, 20)).toEqual(
            'Testing 49'
        );

        jest.spyOn(widget, 'showArchive');

        const p = widget.click(UTILS.click(1, 1));

        expect(widget.showArchive).toHaveBeenCalled();

        for (let i = 0; i < 5; ++i) {
            await UTILS.pushEvent(ui.loop, UTILS.tick(50)); // expand 1 row
        }

        expect(UTILS.getBufferText(layer.buffer, 0, 0, 20)).toEqual(
            'Testing 41'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 8, 20)).toEqual(
            'Testing 49'
        );

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // expand all of the messags

        expect(UTILS.getBufferText(layer.buffer, 0, 0, 20)).toEqual(
            'Testing 10'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 39, 20)).toEqual(
            'Testing 49'
        );

        // layer.buffer.dump();

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // start collapse

        for (let i = 0; i < 5; ++i) {
            await UTILS.pushEvent(ui.loop, UTILS.tick(50)); // collapse 1 row
        }

        expect(UTILS.getBufferText(layer.buffer, 0, 31, 20)).toEqual(
            'Testing 46'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 32, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 33, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 34, 20)).toEqual(
            'Testing 49'
        );

        // layer.buffer.dump();

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // fast forward

        await p;

        layer.buffer.blackOut();
        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 0, 0, 20)).toEqual(
            'Testing 46'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 1, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 2, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 3, 20)).toEqual(
            'Testing 49'
        );

        // layer.buffer.dump();
    });

    test('show archive - bottom', async () => {
        const widget = new Message.Messages(layer, {
            id: 'MSG',
            width: 80,
            height: 4,
            y: 36,
        });

        // @ts-ignore
        ui.loop._stopTicks();
        // layer.buffer.dump();

        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(36);

        for (let i = 0; i < 50; ++i) {
            GWU.message.add('Testing ' + i);
        }
        expect(widget.cache.length).toBeGreaterThan(10);

        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 0, 36, 20)).toEqual(
            'Testing 49'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 37, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 38, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 39, 20)).toEqual(
            'Testing 46'
        );

        // layer.buffer.dump();

        jest.spyOn(widget, 'showArchive');

        const p = widget.click(UTILS.click(1, 38));
        expect(widget.showArchive).toHaveBeenCalled();

        // layer.buffer.dump();

        for (let i = 0; i < 5; ++i) {
            await UTILS.pushEvent(ui.loop, UTILS.tick(50)); // expand 1 row
        }

        // layer.buffer.dump();
        expect(UTILS.getBufferText(layer.buffer, 0, 31, 20)).toEqual(
            'Testing 49'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 39, 20)).toEqual(
            'Testing 41'
        );

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // expand all of the messags

        // layer.buffer.dump();
        expect(UTILS.getBufferText(layer.buffer, 0, 0, 20)).toEqual(
            'Testing 49'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 39, 20)).toEqual(
            'Testing 10'
        );

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // start collapse

        for (let i = 0; i < 5; ++i) {
            await UTILS.pushEvent(ui.loop, UTILS.tick(50)); // collapse 1 row
        }

        // layer.buffer.dump();
        expect(UTILS.getBufferText(layer.buffer, 0, 5, 20)).toEqual(
            'Testing 49'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 6, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 7, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 8, 20)).toEqual(
            'Testing 46'
        );

        await UTILS.pushEvent(ui.loop, UTILS.keypress('a')); // fast forward

        await p;

        layer.buffer.blackOut();
        widget.draw(layer.buffer);
        expect(UTILS.getBufferText(layer.buffer, 0, 36, 20)).toEqual(
            'Testing 49'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 37, 20)).toEqual(
            'Testing 48'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 38, 20)).toEqual(
            'Testing 47'
        );
        expect(UTILS.getBufferText(layer.buffer, 0, 39, 20)).toEqual(
            'Testing 46'
        );

        // layer.buffer.dump();
    });
});
