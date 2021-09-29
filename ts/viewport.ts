import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import { UICore, UISubject } from './types';

export type ViewFilterFn = (
    mixer: GWU.sprite.Mixer,
    x: number,
    y: number,
    map: GWM.map.Map
) => void;

export interface ViewportOptions {
    snap?: boolean;
    ui: UICore;
    x: number;
    y: number;
    width: number;
    height: number;
    filter?: ViewFilterFn;
    lockX?: boolean;
    lockY?: boolean;
    lock?: boolean;
    center?: boolean;
}

export class Viewport {
    ui: UICore;
    center = false;
    snap = false;
    bounds: GWU.xy.Bounds;
    filter: ViewFilterFn | null = null;
    offsetX = 0;
    offsetY = 0;
    lockX = false;
    lockY = false;
    _follow: UISubject | null = null;

    constructor(opts: ViewportOptions) {
        this.ui = opts.ui;
        this.snap = opts.snap || false;
        this.bounds = new GWU.xy.Bounds(
            opts.x,
            opts.y,
            opts.width,
            opts.height
        );
        this.filter = opts.filter || null;
        if (opts.lock) {
            this.lockX = true;
            this.lockY = true;
        } else {
            if (opts.lockX) {
                this.lockX = true;
            }
            if (opts.lockY) {
                this.lockY = true;
            }
        }
    }

    get follow(): UISubject | null {
        return this._follow;
    }
    set follow(subject: UISubject | null) {
        this.center = !!subject;
        if (subject) {
            this.offsetX = subject.x - this.halfWidth();
            this.offsetY = subject.y - this.halfHeight();
            this.centerOn(subject.x, subject.y, subject.map);
        }
        this._follow = subject;
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

    contains(x: number, y: number): boolean {
        return this.bounds.contains(x, y);
    }

    halfWidth(): number {
        return Math.floor(this.bounds.width / 2);
    }

    halfHeight(): number {
        return Math.floor(this.bounds.height / 2);
    }

    centerOn(x: number, y: number, map?: GWU.xy.Size) {
        this.center = true;
        this.updateOffset({ x, y }, map);
    }

    updateOffset(focus: GWU.xy.XY | null, map?: GWU.xy.Size) {
        const bounds = map || this.bounds;
        if (focus && GWU.xy.contains(bounds, focus.x, focus.y)) {
            if (this.snap) {
                let left = this.offsetX;
                let right = this.offsetX + this.bounds.width;
                let top = this.offsetY;
                let bottom = this.offsetY + this.bounds.height;

                // auto center if outside the viewport
                if (focus.x < left || focus.x > right) {
                    left = this.offsetX = focus.x - this.halfWidth();
                    right = left + this.bounds.width;
                }
                if (focus.y < top || focus.y > bottom) {
                    top = this.offsetY = focus.y - this.halfHeight();
                    bottom = top + this.bounds.height;
                }

                const edgeX = Math.floor(this.bounds.width / 5);
                const edgeY = Math.floor(this.bounds.height / 5);

                const thirdW = Math.floor(this.bounds.width / 3);
                if (left + edgeX >= focus.x) {
                    this.offsetX = Math.max(
                        0,
                        focus.x + thirdW - this.bounds.width
                    );
                } else if (right - edgeX <= focus.x) {
                    this.offsetX = Math.min(
                        focus.x - thirdW,
                        bounds.width - this.bounds.width
                    );
                }

                const thirdH = Math.floor(this.bounds.height / 3);
                if (top + edgeY >= focus.y) {
                    this.offsetY = Math.max(
                        0,
                        focus.y + thirdH - this.bounds.height
                    );
                } else if (bottom - edgeY <= focus.y) {
                    this.offsetY = Math.min(
                        focus.y - thirdH,
                        bounds.height - this.bounds.height
                    );
                }
            } else if (this.center) {
                this.offsetX = focus.x - this.halfWidth();
                this.offsetY = focus.y - this.halfHeight();
            } else {
                this.offsetX = focus.x;
                this.offsetY = focus.y;
            }
        }

        if (this.lockX && map) {
            this.offsetX = GWU.clamp(
                this.offsetX,
                0,
                map.width - this.bounds.width
            );
        }
        if (this.lockY && map) {
            this.offsetY = GWU.clamp(
                this.offsetY,
                0,
                map.height - this.bounds.height
            );
        }
    }

    drawFor(subject: UISubject): boolean {
        if (!subject.map) throw new Error('No map!');
        return this.draw(subject.memory || subject.map, subject.fov);
    }

    draw(map?: GWM.map.Map, fov?: GWU.fov.FovTracker): boolean {
        if (!map) {
            if (!this._follow)
                throw new Error('Either map or follow must be set.');
            return this.drawFor(this._follow);
        }
        // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;

        this.updateOffset(this._follow, map);

        const mixer = new GWU.sprite.Mixer();
        for (let x = 0; x < this.bounds.width; ++x) {
            for (let y = 0; y < this.bounds.height; ++y) {
                const mapX = x + this.offsetX;
                const mapY = y + this.offsetY;
                if (map.hasXY(mapX, mapY)) {
                    const cell = map.cell(mapX, mapY);
                    map.drawer.drawCell(mixer, cell, fov);
                } else {
                    mixer.blackOut();
                }

                if (this.filter) {
                    this.filter(mixer, mapX, mapY, map);
                }

                this.ui.buffer.drawSprite(
                    x + this.bounds.x,
                    y + this.bounds.y,
                    mixer
                );
            }
        }

        // map.clearMapFlag(GWM.flags.Map.MAP_CHANGED);
        return true;
    }
}
