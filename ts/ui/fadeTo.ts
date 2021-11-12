import * as GWU from 'gw-utils';
import { Layer } from './layer';

// extend Layer

declare module './layer' {
    interface Layer {
        fadeTo(color?: GWU.color.ColorBase, time?: number): Promise<void>;
    }
}

// Effects

Layer.prototype.fadeTo = function (
    color: GWU.color.ColorBase = 0,
    time = 1000
): Promise<void> {
    const layer = this.ui.startNewLayer();

    let elapsed = 0;

    layer.on('tick', (_n, _w, e) => {
        elapsed += e.dt;

        const pct = GWU.clamp(Math.round((100 * elapsed) / time), 0, 100);
        this.ui.copyUIBuffer(layer.buffer);
        layer.buffer.mix(color, pct);
        layer.buffer.render();
        // layer.needsDraw = true;

        if (pct >= 100) {
            layer.finish();
        }
        return true;
    });

    return layer.promise;
};
