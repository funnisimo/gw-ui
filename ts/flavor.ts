import * as GWU from 'gw-utils';
import * as GWM from 'gw-map';
import * as Widget from './widget';

GWU.color.install('flavorText', 50, 40, 90);
GWU.color.install('flavorPrompt', 100, 90, 20);

export interface FlavorOptions extends Widget.TextOptions {
    promptFg?: GWU.color.ColorBase;
    overflow?: boolean;
}

export class Flavor extends Widget.Text {
    isPrompt!: boolean;
    overflow!: boolean;
    promptFg!: GWU.color.Color;

    constructor(id: string, opts?: FlavorOptions) {
        super(id, opts);
    }

    init(opts: FlavorOptions) {
        opts.fg = opts.fg || 'flavorText';
        opts.bg = opts.bg || 'black';
        super.init(opts);
        this.promptFg = GWU.color.from(opts.promptFg || 'flavorPrompt');
        this.overflow = opts.overflow || false;
        this.isPrompt = false;
    }

    showText(text: string) {
        this.text = GWU.text.capitalize(text);
        const len = GWU.text.length(this.text);
        if (len > this.bounds.width) {
            this.lines = GWU.text.splitIntoLines(this.text, this.bounds.width);
            if (!this.overflow && this.lines.length > this.bounds.height) {
                if (this.bounds.height == 1) {
                    this.text = GWU.text.truncate(this.text, this.bounds.width);
                    this.lines = [this.text];
                } else {
                    this.lines.length = this.bounds.height;
                }
            }
        } else {
            this.lines = [this.text];
        }
        this.isPrompt = false;
        if (this.parent) this.parent.requestRedraw();
    }

    clear() {
        this.text = '';
        this.lines = [''];
        this.isPrompt = false;
        if (this.parent) this.parent.requestRedraw();
    }

    showPrompt(text: string) {
        this.showText(text);
        this.isPrompt = true;
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            ' ',
            this.bg,
            this.bg
        );
        super.draw(buffer);
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
