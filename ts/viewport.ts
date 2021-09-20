import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import { UIType } from './types';

export type ViewFilterFn = (
    mixer: GWU.sprite.Mixer,
    x: number,
    y: number,
    map: GWM.map.Map
) => void;

export interface ViewportOptions {
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

export class Viewport {
    ui: UIType;
    follow = false;
    snap = false;
    bounds: GWU.xy.Bounds;
    filter: ViewFilterFn | null = null;
    offsetX = 0;
    offsetY = 0;
    lockX = false;
    lockY = false;

    constructor(opts: ViewportOptions) {
        this.ui = opts.ui;
        this.follow = opts.follow || false;
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

    toMapX(x: number): number {
        return x + this.offsetX;
    }

    toMapY(y: number): number {
        return y + this.offsetY;
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

    draw(map: GWM.map.Map, playerX?: number, playerY?: number): boolean {
        if (!map) return false;
        // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;

        if (this.follow && playerX !== undefined && playerY !== undefined) {
            this.offsetX = playerX - this.halfWidth();
            this.offsetY = playerY - this.halfHeight();
        } else if (
            this.snap &&
            playerX !== undefined &&
            playerY !== undefined
        ) {
            const left = this.offsetX;
            const right = this.offsetX + this.bounds.width;
            const top = this.offsetY;
            const bottom = this.offsetY + this.bounds.height;

            const edgeX = Math.floor(this.bounds.width / 5);
            const edgeY = Math.floor(this.bounds.height / 5);

            const thirdW = Math.floor(this.bounds.width / 3);
            if (left + edgeX >= playerX) {
                this.offsetX = Math.max(
                    0,
                    playerX + thirdW - this.bounds.width
                );
            } else if (right - edgeX <= playerX) {
                this.offsetX = Math.min(
                    playerX - thirdW,
                    map.width - this.bounds.width
                );
            }

            const thirdH = Math.floor(this.bounds.height / 3);
            if (top + edgeY >= playerY) {
                this.offsetY = Math.max(
                    0,
                    playerY + thirdH - this.bounds.height
                );
            } else if (bottom - edgeY <= playerY) {
                this.offsetY = Math.min(
                    playerY - thirdH,
                    map.height - this.bounds.height
                );
            }
        } else if (playerX !== undefined && playerY !== undefined) {
            this.offsetX = playerX;
            this.offsetY = playerY;
        }

        if (this.lockX) {
            this.offsetX = GWU.clamp(
                this.offsetX,
                0,
                map.width - this.bounds.width
            );
        }
        if (this.lockY) {
            this.offsetY = GWU.clamp(
                this.offsetY,
                0,
                map.height - this.bounds.height
            );
        }

        const mixer = new GWU.sprite.Mixer();
        for (let x = 0; x < this.bounds.width; ++x) {
            for (let y = 0; y < this.bounds.height; ++y) {
                const mapX = x + this.offsetX;
                const mapY = y + this.offsetY;
                if (map.hasXY(mapX, mapY)) {
                    map.getAppearanceAt(mapX, mapY, mixer);
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
