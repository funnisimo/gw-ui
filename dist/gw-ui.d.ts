import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

interface UIType {
    buffer: GWU.canvas.Buffer;
    loop: GWU.io.Loop;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}

interface UIOptions {
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
}
declare class UI implements UIType {
    buffer: GWU.canvas.Buffer;
    canvas: GWU.canvas.BaseCanvas;
    loop: GWU.io.Loop;
    layers: GWU.canvas.Buffer[];
    freeBuffers: GWU.canvas.Buffer[];
    inDialog: boolean;
    constructor(opts?: Partial<UIOptions>);
    render(): void;
    startDialog(): GWU.canvas.Buffer;
    resetDialogBuffer(dest: GWU.canvas.Buffer): void;
    finishDialog(): void;
}

interface MessageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    ui: UIType;
    bg?: GWU.color.ColorBase;
    fg?: GWU.color.ColorBase;
}
declare class Messages {
    bounds: GWU.xy.Bounds;
    cache: GWU.message.MessageCache;
    ui: UIType;
    bg: GWU.color.Color;
    fg: GWU.color.Color;
    constructor(opts: MessageOptions);
    contains(x: number, y: number): boolean;
    get needsUpdate(): boolean;
    get buffer(): GWU.canvas.Buffer;
    draw(force?: boolean): boolean;
    toBufferY(y: number): number;
    toBufferX(x: number): number;
    showArchive(): Promise<void>;
}

declare type ViewFilterFn = (mixer: GWU.sprite.Mixer, x: number, y: number, map: GWM.map.Map) => void;
interface ViewportOptions {
    snap?: boolean;
    follow?: boolean;
    ui: UIType;
    x: number;
    y: number;
    width: number;
    height: number;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
}
declare class Viewport {
    ui: UIType;
    follow: boolean;
    snap: boolean;
    bounds: GWU.xy.Bounds;
    filter: ViewFilterFn | null;
    offsetX: number;
    offsetY: number;
    lockX: boolean;
    lockY: boolean;
    constructor(opts: ViewportOptions);
    toMapX(x: number): number;
    toMapY(y: number): number;
    toInnerX(x: number): number;
    toInnerY(y: number): number;
    contains(x: number, y: number): boolean;
    halfWidth(): number;
    halfHeight(): number;
    draw(map: GWM.map.Map, playerX?: number, playerY?: number): boolean;
}

export { MessageOptions, Messages, UI, UIOptions, UIType, ViewFilterFn, Viewport, ViewportOptions };
