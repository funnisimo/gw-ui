import 'jest-extended';
import * as UTILS from '../test/utils';
// import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as Viewport from './viewport';
import { UICore } from './types';

describe('Viewport', () => {
    let ui: UICore;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 40);
    });

    test('empty', () => {
        const widget = new Viewport.Viewport('VIEW', {
            width: 80,
            height: 34,
            bg: 'red',
        });
        expect(widget.bounds.x).toEqual(0);
        expect(widget.bounds.y).toEqual(0);
        expect(widget.bg).toEqual('red');

        widget.draw(ui.buffer);
        expect(ui.buffer.get(0, 0)).toEqual({
            glyph: 0,
            fg: 0xf00,
            bg: 0xf00,
        });
    });

    test('showMap', () => {
        const widget = new Viewport.Viewport('VIEW', {
            width: 80,
            height: 34,
            bg: 'red',
        });
        expect(widget.lockX).toBeFalsy();
        expect(widget.lockY).toBeFalsy();

        const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

        widget.showMap(map);

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 0, 0, 10)).toEqual('##########');
        expect(UTILS.getBufferText(ui.buffer, 0, 1, 10)).toEqual('#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ');
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷ#'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            '##########'
        );

        widget.showMap(map, -5, -5);

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 5, 5, 10)).toEqual('##########');
        expect(UTILS.getBufferText(ui.buffer, 5, 6, 10)).toEqual('#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ');
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );

        // lockX

        widget.lockX = true;

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 0, 5, 10)).toEqual('##########');
        expect(UTILS.getBufferText(ui.buffer, 0, 6, 10)).toEqual('#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ');
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷ#'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷ#'
        );

        // lockY

        widget.lockY = true;

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 0, 0, 10)).toEqual('##########');
        expect(UTILS.getBufferText(ui.buffer, 0, 1, 10)).toEqual('#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ');
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷ#'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            '##########'
        );
    });

    test('centerOn', () => {
        const widget = new Viewport.Viewport('VIEW', {
            width: 80,
            height: 34,
            bg: 'red',
        });
        expect(widget.lockX).toBeFalsy();
        expect(widget.lockY).toBeFalsy();

        const map = GWM.map.make(80, 34, 'FLOOR', 'WALL');

        widget.centerOn(map, 0, 0);

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 40, 17, 10)).toEqual(
            '##########'
        );
        expect(UTILS.getBufferText(ui.buffer, 40, 18, 10)).toEqual(
            '#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );

        widget.centerOn(map, 10, 10);

        widget.draw(ui.buffer);

        // ui.buffer.dump();
        expect(UTILS.getBufferText(ui.buffer, 30, 7, 10)).toEqual('##########');
        expect(UTILS.getBufferText(ui.buffer, 30, 8, 10)).toEqual('#ﾷﾷﾷﾷﾷﾷﾷﾷﾷ');
        expect(UTILS.getBufferText(ui.buffer, 70, 32, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );
        expect(UTILS.getBufferText(ui.buffer, 70, 33, 10)).toEqual(
            'ﾷﾷﾷﾷﾷﾷﾷﾷﾷﾷ'
        );
    });
});
