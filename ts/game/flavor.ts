import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);

export interface FlavorOptions extends GWU.widget.WidgetOptions {
    overflow?: boolean;
}

export class Flavor extends GWU.widget.Text {
    isPrompt!: boolean;
    overflow!: boolean;
    promptFg!: GWU.color.Color;

    constructor(layer: GWU.widget.WidgetLayer, opts: FlavorOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'flavor';
                (<GWU.widget.TextOptions>opts).text = '';
                return opts as GWU.widget.TextOptions;
            })()
        );

        this.overflow = opts.overflow || false;
        this.isPrompt = false;
    }

    showText(text: string): this {
        this.text(text);
        this.removeClass('prompt');
        return this;
    }

    clear(): this {
        this.text('');
        this.removeClass('prompt');
        return this;
    }

    showPrompt(text: string): this {
        this.showText(text);
        this.addClass('prompt');
        return this;
    }

    getFlavorText(
        map: GWM.map.Map,
        x: number,
        y: number,
        fov?: GWU.fov.FovSystem
    ): string {
        const cell = map.cell(x, y); // KNOWLEDGE / MEMORY !!!
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

        const isAnyKindOfVisible = fov ? fov.isAnyKindOfVisible(x, y) : true;
        const isDirectlyVisible = fov ? fov.isDirectlyVisible(x, y) : true;
        const isRemembered = fov ? fov.isRevealed(x, y) : false;
        const isMapped = fov ? fov.isMagicMapped(x, y) : false;

        let intro: string;
        if (isDirectlyVisible) {
            intro = 'You see';
        } else if (isAnyKindOfVisible) {
            intro = 'You sense';
        } else if (isRemembered) {
            intro = 'You remember';
        } else if (isMapped) {
            intro = 'You expect to see';
        } else {
            return '';
        }

        const actor = cell.hasActor() ? map.actorAt(x, y) : null;
        // const player = actor?.isPlayer() ? actor : null;
        const theItem = cell.hasItem() ? map.itemAt(x, y) : null;

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
