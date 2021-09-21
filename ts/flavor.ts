import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import { UIType } from './types';

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);

export interface FlavorOptions {
    ui: UIType;
    x: number;
    y: number;
    width: number;
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    promptFg?: GWU.color.ColorBase;
}

export class Flavor {
    ui: UIType;
    bounds: GWU.xy.Bounds;
    text: string = '';
    needsUpdate = false;
    isPrompt = false;
    overflow = false;
    fg: GWU.color.Color;
    bg: GWU.color.Color;
    promptFg: GWU.color.Color;

    constructor(opts: FlavorOptions) {
        this.ui = opts.ui;
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, 1);
        this.fg = GWU.color.from(opts.fg ?? 'flavorText');
        this.bg = GWU.color.from(opts.bg ?? 'black');
        this.promptFg = GWU.color.from(opts.promptFg ?? 'flavorPrompt');
    }

    showText(text: string) {
        this.text = GWU.text.capitalize(text);
        this.needsUpdate = true;
        this.isPrompt = false;
        this.draw();
    }

    clear() {
        this.text = '';
        this.needsUpdate = true;
        this.isPrompt = false;
        this.draw();
    }

    showPrompt(text: string) {
        this.text = GWU.text.capitalize(text);
        this.needsUpdate = true;
        this.isPrompt = true;
        this.draw();
    }

    draw(force = false): boolean {
        if (!force && !this.needsUpdate) return false;

        const buffer = this.ui.buffer;
        const color = this.isPrompt ? this.fg : this.promptFg;
        const nextY = buffer.wrapText(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.text,
            color,
            this.bg
        );
        this.overflow = nextY !== this.bounds.y + 1;
        this.ui.render();
        this.needsUpdate = false;
        return true;
    }

    getFlavorText(map: GWM.map.Map, x: number, y: number): string {
        const cell = map.cellInfo(x, y, true);
        let buf;

        // let magicItem;
        // let standsInTerrain;
        // let subjectMoving;
        // let prepositionLocked = false;

        // let subject;
        // let verb;
        // let preposition;
        let object = '';
        // let adjective;

        const isAnyKindOfVisible = map.fov.isAnyKindOfVisible(x, y);
        const isDirectlyVisible =
            map.fov.isDirectlyVisible(x, y) ||
            (!map.fov.isEnabled && isAnyKindOfVisible);
        const isRemembered = map.fov.isRevealed(x, y);
        const isMapped = map.fov.isMagicMapped(x, y);

        let intro: string;
        if (isDirectlyVisible) {
            intro = 'you see';
        } else if (isAnyKindOfVisible) {
            intro = 'you sense';
        } else if (isRemembered) {
            intro = 'you remember';
        } else if (isMapped) {
            intro = 'you expect to see';
        } else {
            return '';
        }

        const actor = cell.actor || null;
        // const player = actor?.isPlayer() ? actor : null;
        const theItem = cell.item;

        const standsInTile = cell.hasTileFlag(GWM.flags.Tile.T_STAND_IN_TILE);

        let needObjectArticle = false;
        if (actor) {
            object = actor.getFlavor({
                color: false,
                article: true,
                action: true,
            });
            needObjectArticle = true;
        } else if (theItem) {
            object = theItem.getFlavor({ color: false, article: true });
            needObjectArticle = true;
        }

        let article = standsInTile ? ' in ' : ' on ';

        const groundTile =
            cell.depthTile(GWM.flags.Depth.GROUND) || GWM.tile.tiles.NULL;
        const surfaceTile = cell.depthTile(GWM.flags.Depth.SURFACE);
        const liquidTile = cell.depthTile(GWM.flags.Depth.LIQUID);
        // const gasTile = cell.depthTile(GWM.flags.Depth.GAS);

        let surface = '';
        if (surfaceTile) {
            const tile = surfaceTile;
            if (needObjectArticle) {
                needObjectArticle = false;
                object += ' on ';
            }
            if (tile.hasTileFlag(GWM.flags.Tile.T_BRIDGE)) {
                article = ' over ';
            }
            surface = surfaceTile.getFlavor() + article;
        }

        let liquid = '';
        if (liquidTile) {
            liquid = liquidTile.getFlavor() + ' covering ';
            if (needObjectArticle) {
                needObjectArticle = false;
                object += ' in ';
            }
        }

        if (needObjectArticle) {
            needObjectArticle = false;
            object += ' on ';
        }
        let ground = groundTile.getFlavor({ article: true });

        buf = GWU.text.apply('§intro§ §text§.', {
            intro,
            text: object + surface + liquid + ground,
        });

        return buf;
    }
}
