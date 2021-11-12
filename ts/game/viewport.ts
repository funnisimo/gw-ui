import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import { UISubject } from '../types';
import * as Widget from '../widget';
import { Layer } from '../layer';

export type ViewFilterFn = (
    mixer: GWU.sprite.Mixer,
    x: number,
    y: number,
    map: GWM.map.Map
) => void;

export interface ViewportOptions extends Widget.WidgetOptions {
    snap?: boolean;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}

export class Viewport extends Widget.Widget {
    filter!: ViewFilterFn | null;
    offsetX = 0;
    offsetY = 0;
    _subject: UISubject | null = null;

    constructor(layer: Layer, opts: ViewportOptions) {
        super(layer, opts);
        this.attr('snap', opts.snap || false);
        this.attr('center', opts.center || false);
        this.filter = opts.filter || null;
        this.attr('lockX', opts.lock || opts.lockX || false);
        this.attr('lockY', opts.lock || opts.lockY || false);
    }

    get subject(): UISubject | null {
        return this._subject;
    }
    set subject(subject: UISubject | null) {
        this.attr('center', !!subject);
        if (subject) {
            this.offsetX = subject.x - this.halfWidth();
            this.offsetY = subject.y - this.halfHeight();
        }
        this._subject = subject;
    }

    set lock(v: boolean) {
        this.attr('lockX', v);
        this.attr('lockY', v);
    }

    toMapX(x: number): number {
        return x + this.offsetX - this.bounds.x;
    }

    toMapY(y: number): number {
        return y + this.offsetY - this.bounds.y;
    }

    toInnerX(x: number): number {
        return x - this.bounds.x;
    }

    toInnerY(y: number): number {
        return y - this.bounds.y;
    }

    halfWidth(): number {
        return Math.floor(this.bounds.width / 2);
    }

    halfHeight(): number {
        return Math.floor(this.bounds.height / 2);
    }

    centerOn(map: GWM.map.Map, x: number, y: number) {
        this.attr('center', true);
        this.subject = { x, y, map };
    }

    showMap(map: GWM.map.Map, x = 0, y = 0) {
        this.subject = { x, y, map };
        this.offsetX = x;
        this.offsetY = y;
        this.attr('center', false);
        this.attr('snap', false);
    }

    updateOffset() {
        if (!this._subject) {
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }

        const subject = this._subject;
        const map = subject.memory || subject.map;
        const bounds = map;

        if (subject && map.hasXY(subject.x, subject.y)) {
            if (this._attrBool('snap')) {
                let left = this.offsetX;
                let right = this.offsetX + this.bounds.width;
                let top = this.offsetY;
                let bottom = this.offsetY + this.bounds.height;

                // auto center if outside the viewport
                if (subject.x < left || subject.x > right) {
                    left = this.offsetX = subject.x - this.halfWidth();
                    right = left + this.bounds.width;
                }
                if (subject.y < top || subject.y > bottom) {
                    top = this.offsetY = subject.y - this.halfHeight();
                    bottom = top + this.bounds.height;
                }

                const edgeX = Math.floor(this.bounds.width / 5);
                const edgeY = Math.floor(this.bounds.height / 5);

                const thirdW = Math.floor(this.bounds.width / 3);
                if (left + edgeX >= subject.x) {
                    this.offsetX = Math.max(
                        0,
                        subject.x + thirdW - this.bounds.width
                    );
                } else if (right - edgeX <= subject.x) {
                    this.offsetX = Math.min(
                        subject.x - thirdW,
                        bounds.width - this.bounds.width
                    );
                }

                const thirdH = Math.floor(this.bounds.height / 3);
                if (top + edgeY >= subject.y) {
                    this.offsetY = Math.max(
                        0,
                        subject.y + thirdH - this.bounds.height
                    );
                } else if (bottom - edgeY <= subject.y) {
                    this.offsetY = Math.min(
                        subject.y - thirdH,
                        bounds.height - this.bounds.height
                    );
                }
            } else if (this._attrBool('center')) {
                this.offsetX = subject.x - this.halfWidth();
                this.offsetY = subject.y - this.halfHeight();
            } else {
                this.offsetX = subject.x;
                this.offsetY = subject.y;
            }
        }

        if (this._attrBool('lockX') && map) {
            this.offsetX = GWU.clamp(
                this.offsetX,
                0,
                map.width - this.bounds.width
            );
        }
        if (this._attrBool('lockY') && map) {
            this.offsetY = GWU.clamp(
                this.offsetY,
                0,
                map.height - this.bounds.height
            );
        }
    }

    draw(buffer: GWU.buffer.Buffer): boolean {
        buffer.blackOutRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            this._used.bg
        );

        if (!this._subject) {
            return false;
        }

        this.updateOffset();
        const map = this._subject.memory || this._subject.map;
        const fov = this._subject.fov;

        const mixer = new GWU.sprite.Mixer();
        for (let x = 0; x < this.bounds.width; ++x) {
            for (let y = 0; y < this.bounds.height; ++y) {
                const mapX = x + this.offsetX;
                const mapY = y + this.offsetY;
                if (map.hasXY(mapX, mapY)) {
                    const cell = map.cell(mapX, mapY);
                    map.drawer.drawCell(mixer, cell, fov);
                } else {
                    mixer.draw(' ', this._used.bg, this._used.bg); // blackOut
                }

                if (this.filter) {
                    this.filter(mixer, mapX, mapY, map);
                }

                buffer.drawSprite(x + this.bounds.x, y + this.bounds.y, mixer);
            }
        }

        // map.clearMapFlag(GWM.flags.Map.MAP_CHANGED);
        return true;
    }
}
