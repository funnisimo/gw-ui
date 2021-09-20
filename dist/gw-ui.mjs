import * as GWU from 'gw-utils';

class UI {
    constructor(opts = {}) {
        this.layers = [];
        this.freeBuffers = [];
        this.inDialog = false;
        if (!opts.canvas)
            throw new Error('Need a canvas.');
        this.canvas = opts.canvas;
        this.buffer = opts.canvas.buffer;
        this.loop = opts.loop || GWU.loop;
    }
    render() {
        this.buffer.render();
    }
    startDialog() {
        this.inDialog = true;
        const base = this.buffer || this.canvas.buffer;
        this.layers.push(base);
        this.buffer =
            this.freeBuffers.pop() || new GWU.canvas.Buffer(this.canvas);
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
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, Math.min(opts.width || buffer.width, buffer.width - opts.x), Math.min(opts.height || buffer.height, buffer.height - opts.y));
        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: buffer.height,
        });
        this.ui = opts.ui;
        this.bg = GWU.color.from(opts.bg || 'black');
        this.fg = GWU.color.from(opts.fg || 'white');
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
        const tempColor = GWU.color.make();
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
            GWU.text.eachChar(msg, (c, color, _bg, j) => {
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
        this.bounds = new GWU.xy.Bounds(opts.x, opts.y, opts.width, opts.height);
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
        return x + this.offsetX;
    }
    toMapY(y) {
        return y + this.offsetY;
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
            this.offsetX = GWU.clamp(this.offsetX, 0, map.width - this.bounds.width);
        }
        if (this.lockY) {
            this.offsetY = GWU.clamp(this.offsetY, 0, map.height - this.bounds.height);
        }
        const mixer = new GWU.sprite.Mixer();
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

export { Messages, UI, Viewport };
