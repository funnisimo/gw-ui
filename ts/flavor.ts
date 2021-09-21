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
        const cell = map.cell(x, y);
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

        const actor = cell.actor || null;
        const player = actor?.isPlayer() ? actor : null;
        const theItem = cell.item;

        const standsInTile = cell.hasTileFlag(GWM.flags.Tile.T_STAND_IN_TILE);

        if (player && x == player.x && y == player.y) {
            if (player.hasStatus('levitating')) {
                buf = GWU.text.apply('you are hovering above §flavor§.', {
                    actor: player,
                    flavor: cell.getFlavor(),
                });
            } else {
                // if (theItem) {
                // 	buf = ITEM.getFlavor(theItem);
                // }
                // else {
                buf = GWU.text.apply('you see yourself.', { actor });
                // }
            }
            return buf;
        }
        //
        // // detecting magical items
        // magicItem = null;
        // if (theItem && !playerCanSeeOrSense(x, y)
        // 	&& GW.item.isDetected(theItem))
        // {
        // 	magicItem = theItem;
        // } else if (monst && !playerCanSeeOrSense(x, y)
        // 		   && monst.carriedItem
        // 		   && GW.item.isDetected(monst.carriedItem))
        // {
        // 	magicItem = monst.carriedItem;
        // }
        // if (magicItem) {
        // 	return GW.item.detectedText(magicItem);
        // }
        //
        // // telepathy
        // if (monst
        //       && !(cell.flags & VISIBLE) 					 // && !GW.player.canSeeMonster(monst)
        // 			&& (cell.flags & TELEPATHIC_VISIBLE)) // GW.actor.telepathicallyRevealed(monst))
        // {
        // 	return GW.actor.telepathyText(monst);
        // }
        //
        // if (monst && !playerCanSeeOrSense(x, y)) {
        //       // Monster is not visible.
        // 	monst = null;
        // }

        if (!map.fov.isAnyKindOfVisible(x, y)) {
            buf = '';
            if (map.fov.isRevealed(x, y)) {
                // memory
                const cellInfo = map.cellInfo(x, y, true);
                if (cellInfo.item) {
                    // if (player.status.hallucinating && !GW.GAME.playbackOmniscience) {
                    //     object = GW.item.describeHallucinatedItem();
                    // } else {
                    object = cellInfo.item.getName({
                        color: false,
                        article: true,
                    });
                    // object = GW.item.describeItemBasedOnParameters(cell.rememberedItemCategory, cell.rememberedItemKind, cell.rememberedItemQuantity);
                    // }
                } else if (cellInfo.actor) {
                    object = cellInfo.actor.getName({
                        color: false,
                        article: true,
                    });
                } else {
                    object = cellInfo.tile.getFlavor();
                }
                buf = GWU.text.apply('you remember seeing §object§ here.', {
                    actor,
                    object,
                });
            } else if (map.fov.isMagicMapped(x, y)) {
                // magic mapped
                const cellInfo = map.cellInfo(x, y, true);
                buf = GWU.text.apply('you expect §text§ to be here.', {
                    actor,
                    text: cellInfo.tile.getFlavor(),
                });
            }
            return buf;
        }

        let needObjectArticle = false;
        if (actor) {
            object =
                actor.getName({ color: false, article: true }) + ' standing';
            needObjectArticle = true;
        } else if (theItem) {
            object = theItem.getName({ color: false, article: true });
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

        buf = GWU.text.apply('you §action§ §text§.', {
            actor,
            action: map.isVisible(x, y) ? 'see' : 'sense',
            text: object + surface + liquid + ground,
        });

        return buf;
    }
}
