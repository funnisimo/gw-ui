import * as Widget from './widget';
import { Layer } from '../ui/layer';

export type WidgetFactoryFn = (layer: Layer, opts: any) => Widget.Widget;
export const widgets: Record<string, WidgetFactoryFn> = {};

export function installWidget(tag: string, fn: WidgetFactoryFn): void {
    widgets[tag] = fn;
}

export function createWidget(
    tag: string,
    layer: Layer,
    opts: any
): Widget.Widget {
    const fn = widgets[tag];
    if (!fn) throw new Error('Unknown tag = ' + tag);

    return fn(layer, opts);
}
