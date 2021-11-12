import * as GWU from 'gw-utils';
import * as Widget from './widget';
import { Layer } from '../ui/layer';

export class Body extends Widget.Widget {
    constructor(layer: Layer) {
        super(layer, {
            tag: 'body',
            id: 'BODY',
            depth: -1,
            width: layer.width,
            height: layer.height,
        });
    }

    _drawFill(buffer: GWU.buffer.Buffer) {
        buffer.blend(this._used.bg!);
    }
}
