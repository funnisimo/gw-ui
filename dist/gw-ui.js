(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('gw-utils'), require('gw-map')) :
    typeof define === 'function' && define.amd ? define(['exports', 'gw-utils', 'gw-map'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.GWI = {}, global.GWU, global.GWM));
}(this, (function (exports, GWU, GWM) { 'use strict';

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var GWU__namespace = /*#__PURE__*/_interopNamespace(GWU);
    var GWM__namespace = /*#__PURE__*/_interopNamespace(GWM);

    class UI {
        constructor(opts = {}) {
            this.layers = [];
            this.freeBuffers = [];
            this.inDialog = false;
            if (!opts.canvas)
                throw new Error('Need a canvas.');
            this.canvas = opts.canvas;
            this.buffer = opts.canvas.buffer;
            this.loop = opts.loop || GWU__namespace.loop;
        }
        render() {
            this.buffer.render();
        }
        startDialog() {
            this.inDialog = true;
            const base = this.buffer || this.canvas.buffer;
            this.layers.push(base);
            this.buffer =
                this.freeBuffers.pop() || new GWU__namespace.canvas.Buffer(this.canvas);
            // UI_OVERLAY._data.forEach( (c) => c.opacity = 0 );
            this.buffer.copy(base);
            return this.buffer;
        }
        resetDialogBuffer(dest) {
            const base = this.layers[this.layers.length - 1] || this.canvas.buffer;
            dest.copy(base);
        }
        finishDialog() {
            if (!this.inDialog)
                return;
            if (this.buffer !== this.canvas.buffer) {
                this.freeBuffers.push(this.buffer);
            }
            this.buffer = this.layers.pop() || this.canvas.buffer;
            this.buffer.render();
            this.inDialog = this.layers.length > 0;
        }
    }

    class Messages {
        constructor(opts) {
            const buffer = opts.ui.buffer;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, Math.min(opts.width || buffer.width, buffer.width - opts.x), Math.min(opts.height || buffer.height, buffer.height - opts.y));
            this.cache = new GWU__namespace.message.MessageCache({
                width: this.bounds.width,
                length: buffer.height,
            });
            this.ui = opts.ui;
            this.bg = GWU__namespace.color.from(opts.bg || 'black');
            this.fg = GWU__namespace.color.from(opts.fg || 'white');
        }
        contains(x, y) {
            return this.bounds.contains(x, y);
        }
        get needsUpdate() {
            return this.cache.needsUpdate;
        }
        get buffer() {
            return this.ui.buffer;
        }
        draw(force = false) {
            if (!force && !this.cache.needsUpdate)
                return false;
            let messageColor;
            const tempColor = GWU__namespace.color.make();
            const isOnTop = this.bounds.y < 10;
            // black out the message area
            this.buffer.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, ' ', 0, this.bg);
            this.cache.forEach((msg, confirmed, i) => {
                if (i >= this.bounds.height)
                    return;
                messageColor = tempColor;
                messageColor.copy(this.fg);
                if (confirmed) {
                    messageColor.mix(this.bg, 50);
                    messageColor.mix(this.bg, (75 * i) / (2 * this.bounds.height));
                }
                const localY = isOnTop ? this.bounds.height - i - 1 : i;
                const y = this.toBufferY(localY);
                GWU__namespace.text.eachChar(msg, (c, color, _bg, j) => {
                    const x = this.toBufferX(j);
                    if (color && messageColor !== color && confirmed) {
                        color.mix(this.bg, 50);
                        color.mix(this.bg, (75 * i) / (2 * this.bounds.height));
                    }
                    messageColor = color || tempColor;
                    this.buffer.draw(x, y, c, messageColor, this.bg);
                });
                // for (let j = GWU.text.length(msg); j < this.bounds.width; j++) {
                //     const x = this.toBufferX(j);
                //     this.buffer.draw(x, y, ' ', this.bg, this.bg);
                // }
            });
            this.cache.needsUpdate = false;
            return true;
        }
        toBufferY(y) {
            return this.bounds.y + y;
        }
        toBufferX(x) {
            return this.bounds.x + x;
        }
        async showArchive() {
            let reverse, fadePercent, currentMessageCount = 0;
            let fastForward;
            // Count the number of lines in the archive.
            let totalMessageCount = 0;
            this.cache.forEach(() => ++totalMessageCount);
            if (totalMessageCount <= this.bounds.height)
                return;
            const isOnTop = this.bounds.y < 10;
            const dbuf = this.ui.startDialog();
            // Pull-down/pull-up animation:
            for (reverse = 0; reverse <= 1; reverse++) {
                fastForward = false;
                for (currentMessageCount = reverse
                    ? totalMessageCount
                    : this.bounds.height; reverse
                    ? currentMessageCount >= this.bounds.height
                    : currentMessageCount <= totalMessageCount; currentMessageCount += reverse ? -1 : 1) {
                    this.ui.resetDialogBuffer(dbuf);
                    // Print the message archive text to the dbuf.
                    this.cache.forEach((msg, _confirmed, j) => {
                        if (j >= currentMessageCount || j >= dbuf.height)
                            return;
                        const y = isOnTop ? j : dbuf.height - j - 1;
                        fadePercent = Math.floor((50 * (currentMessageCount - j)) / currentMessageCount);
                        const fg = this.fg.clone().mix(this.bg, fadePercent);
                        dbuf.wrapText(this.toBufferX(0), y, this.bounds.width, msg, fg, this.bg);
                    });
                    dbuf.render();
                    if (!fastForward &&
                        (await this.ui.loop.pause(reverse ? 15 : 45))) {
                        fastForward = true;
                        // dequeueEvent();
                        currentMessageCount = reverse
                            ? this.bounds.height + 1
                            : totalMessageCount - 1; // skip to the end
                    }
                }
                if (!reverse) {
                    const y = isOnTop ? 0 : dbuf.height - 1;
                    const x = this.bounds.x > 8
                        ? this.bounds.x - 8 // to left of box
                        : Math.min(this.bounds.x + this.bounds.width, // just to right of box
                        this.buffer.width - 8 // But definitely on the screen - overwrite some text if necessary
                        );
                    dbuf.wrapText(x, y, 8, '--DONE--', this.bg, this.fg);
                    dbuf.render();
                    await this.ui.loop.waitForAck();
                }
            }
            this.ui.finishDialog();
            this.cache.confirmAll();
            this.cache.needsUpdate = true;
        }
    }

    class Viewport {
        constructor(opts) {
            this.follow = false;
            this.snap = false;
            this.filter = null;
            this.offsetX = 0;
            this.offsetY = 0;
            this.lockX = false;
            this.lockY = false;
            this.ui = opts.ui;
            this.follow = opts.follow || false;
            this.snap = opts.snap || false;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
            this.filter = opts.filter || null;
            if (opts.lock) {
                this.lockX = true;
                this.lockY = true;
            }
            else {
                if (opts.lockX) {
                    this.lockX = true;
                }
                if (opts.lockY) {
                    this.lockY = true;
                }
            }
        }
        toMapX(x) {
            return x + this.offsetX - this.bounds.x;
        }
        toMapY(y) {
            return y + this.offsetY - this.bounds.y;
        }
        toInnerX(x) {
            return x - this.bounds.x;
        }
        toInnerY(y) {
            return y - this.bounds.y;
        }
        contains(x, y) {
            return this.bounds.contains(x, y);
        }
        halfWidth() {
            return Math.floor(this.bounds.width / 2);
        }
        halfHeight() {
            return Math.floor(this.bounds.height / 2);
        }
        draw(map, playerX, playerY) {
            if (!map)
                return false;
            // if (!map.hasMapFlag(GWM.flags.Map.MAP_CHANGED)) return false;
            if (this.follow && playerX !== undefined && playerY !== undefined) {
                this.offsetX = playerX - this.halfWidth();
                this.offsetY = playerY - this.halfHeight();
            }
            else if (this.snap &&
                playerX !== undefined &&
                playerY !== undefined) {
                const left = this.offsetX;
                const right = this.offsetX + this.bounds.width;
                const top = this.offsetY;
                const bottom = this.offsetY + this.bounds.height;
                const edgeX = Math.floor(this.bounds.width / 5);
                const edgeY = Math.floor(this.bounds.height / 5);
                const thirdW = Math.floor(this.bounds.width / 3);
                if (left + edgeX >= playerX) {
                    this.offsetX = Math.max(0, playerX + thirdW - this.bounds.width);
                }
                else if (right - edgeX <= playerX) {
                    this.offsetX = Math.min(playerX - thirdW, map.width - this.bounds.width);
                }
                const thirdH = Math.floor(this.bounds.height / 3);
                if (top + edgeY >= playerY) {
                    this.offsetY = Math.max(0, playerY + thirdH - this.bounds.height);
                }
                else if (bottom - edgeY <= playerY) {
                    this.offsetY = Math.min(playerY - thirdH, map.height - this.bounds.height);
                }
            }
            else if (playerX !== undefined && playerY !== undefined) {
                this.offsetX = playerX;
                this.offsetY = playerY;
            }
            if (this.lockX) {
                this.offsetX = GWU__namespace.clamp(this.offsetX, 0, map.width - this.bounds.width);
            }
            if (this.lockY) {
                this.offsetY = GWU__namespace.clamp(this.offsetY, 0, map.height - this.bounds.height);
            }
            const mixer = new GWU__namespace.sprite.Mixer();
            for (let x = 0; x < this.bounds.width; ++x) {
                for (let y = 0; y < this.bounds.height; ++y) {
                    const mapX = x + this.offsetX;
                    const mapY = y + this.offsetY;
                    if (map.hasXY(mapX, mapY)) {
                        map.getAppearanceAt(mapX, mapY, mixer);
                    }
                    else {
                        mixer.blackOut();
                    }
                    if (this.filter) {
                        this.filter(mixer, mapX, mapY, map);
                    }
                    this.ui.buffer.drawSprite(x + this.bounds.x, y + this.bounds.y, mixer);
                }
            }
            // map.clearMapFlag(GWM.flags.Map.MAP_CHANGED);
            return true;
        }
    }

    GWU__namespace.color.install('flavorText', 50, 40, 90);
    GWU__namespace.color.install('flavorPrompt', 100, 90, 20);
    class Flavor {
        constructor(opts) {
            var _a, _b, _c;
            this.text = '';
            this.needsUpdate = false;
            this.isPrompt = false;
            this.overflow = false;
            this.ui = opts.ui;
            this.bounds = new GWU__namespace.xy.Bounds(opts.x, opts.y, opts.width, 1);
            this.fg = GWU__namespace.color.from((_a = opts.fg) !== null && _a !== void 0 ? _a : 'flavorText');
            this.bg = GWU__namespace.color.from((_b = opts.bg) !== null && _b !== void 0 ? _b : 'black');
            this.promptFg = GWU__namespace.color.from((_c = opts.promptFg) !== null && _c !== void 0 ? _c : 'flavorPrompt');
        }
        setFlavorText(text) {
            this.text = GWU__namespace.text.capitalize(text);
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
        showPrompt(text) {
            this.text = GWU__namespace.text.capitalize(text);
            this.needsUpdate = true;
            this.isPrompt = true;
            this.draw();
        }
        draw(force = false) {
            if (!force && !this.needsUpdate)
                return false;
            const buffer = this.ui.buffer;
            const color = this.isPrompt ? this.fg : this.promptFg;
            const nextY = buffer.wrapText(this.bounds.x, this.bounds.y, this.bounds.width, this.text, color, this.bg);
            this.overflow = nextY !== this.bounds.y + 1;
            this.ui.render();
            this.needsUpdate = false;
            return true;
        }
        getFlavorText(map, x, y) {
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
            const player = (actor === null || actor === void 0 ? void 0 : actor.isPlayer()) ? actor : null;
            const theItem = cell.item;
            const standsInTile = cell.hasTileFlag(GWM__namespace.flags.Tile.T_STAND_IN_TILE);
            if (player && x == player.x && y == player.y) {
                if (player.hasStatus('levitating')) {
                    buf = GWU__namespace.text.apply('you are hovering above §flavor§.', {
                        actor: player,
                        flavor: cell.getFlavor(),
                    });
                }
                else {
                    // if (theItem) {
                    // 	buf = ITEM.getFlavor(theItem);
                    // }
                    // else {
                    buf = GWU__namespace.text.apply('you see yourself.', { actor });
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
                    }
                    else if (cellInfo.actor) {
                        object = cellInfo.actor.getName({
                            color: false,
                            article: true,
                        });
                    }
                    else {
                        object = cellInfo.tile.getFlavor();
                    }
                    buf = GWU__namespace.text.apply('you remember seeing §object§ here.', {
                        actor,
                        object,
                    });
                }
                else if (map.fov.isMagicMapped(x, y)) {
                    // magic mapped
                    const cellInfo = map.cellInfo(x, y, true);
                    buf = GWU__namespace.text.apply('you expect §text§ to be here.', {
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
            }
            else if (theItem) {
                object = theItem.getName({ color: false, article: true });
                needObjectArticle = true;
            }
            let article = standsInTile ? ' in ' : ' on ';
            const groundTile = cell.depthTile(GWM__namespace.flags.Depth.GROUND) || GWM__namespace.tile.tiles.NULL;
            const surfaceTile = cell.depthTile(GWM__namespace.flags.Depth.SURFACE);
            const liquidTile = cell.depthTile(GWM__namespace.flags.Depth.LIQUID);
            // const gasTile = cell.depthTile(GWM.flags.Depth.GAS);
            let surface = '';
            if (surfaceTile) {
                const tile = surfaceTile;
                if (needObjectArticle) {
                    needObjectArticle = false;
                    object += ' on ';
                }
                if (tile.hasTileFlag(GWM__namespace.flags.Tile.T_BRIDGE)) {
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
            buf = GWU__namespace.text.apply('you §action§ §text§.', {
                actor,
                action: map.isVisible(x, y) ? 'see' : 'sense',
                text: object + surface + liquid + ground,
            });
            return buf;
        }
    }

    exports.Flavor = Flavor;
    exports.Messages = Messages;
    exports.UI = UI;
    exports.Viewport = Viewport;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=gw-ui.js.map
