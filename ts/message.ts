import * as GWU from 'gw-utils';
import { UIType } from './types';

export interface MessageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    ui: UIType;
    bg?: GWU.color.ColorBase;
    fg?: GWU.color.ColorBase;
}

export class Messages {
    bounds: GWU.xy.Bounds;
    cache: GWU.message.MessageCache;
    ui: UIType;
    bg: GWU.color.Color;
    fg: GWU.color.Color;

    constructor(opts: MessageOptions) {
        const buffer = opts.ui.buffer;

        this.bounds = new GWU.xy.Bounds(
            opts.x,
            opts.y,
            Math.min(opts.width || buffer.width, buffer.width - opts.x),
            Math.min(opts.height || buffer.height, buffer.height - opts.y)
        );
        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: buffer.height,
        });
        this.ui = opts.ui;
        this.bg = GWU.color.from(opts.bg || 'black');
        this.fg = GWU.color.from(opts.fg || 'white');
    }

    contains(x: number, y: number): boolean {
        return this.bounds.contains(x, y);
    }

    get needsUpdate() {
        return this.cache.needsUpdate;
    }

    get buffer(): GWU.canvas.DataBuffer {
        return this.ui.buffer;
    }

    draw(force = false) {
        if (!force && !this.cache.needsUpdate) return false;

        let messageColor: GWU.color.Color;
        const tempColor = GWU.color.make();
        const isOnTop = this.bounds.y < 10;

        // black out the message area
        this.buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            ' ',
            0,
            this.bg
        );

        this.cache.forEach((msg, confirmed, i) => {
            if (i >= this.bounds.height) return;
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

    toBufferY(y: number): number {
        return this.bounds.y + y;
    }

    toBufferX(x: number): number {
        return this.bounds.x + x;
    }

    async showArchive() {
        let reverse,
            fadePercent,
            currentMessageCount = 0;
        let fastForward;

        // Count the number of lines in the archive.
        let totalMessageCount = 0;
        this.cache.forEach(() => ++totalMessageCount);

        if (totalMessageCount <= this.bounds.height) return;

        const isOnTop = this.bounds.y < 10;
        const dbuf = this.ui.startDialog();

        // Pull-down/pull-up animation:
        for (reverse = 0; reverse <= 1; reverse++) {
            fastForward = false;
            for (
                currentMessageCount = reverse
                    ? totalMessageCount
                    : this.bounds.height;
                reverse
                    ? currentMessageCount >= this.bounds.height
                    : currentMessageCount <= totalMessageCount;
                currentMessageCount += reverse ? -1 : 1
            ) {
                this.ui.resetDialogBuffer(dbuf);

                // Print the message archive text to the dbuf.
                this.cache.forEach((msg, _confirmed, j) => {
                    if (j >= currentMessageCount || j >= dbuf.height) return;

                    const y = isOnTop ? j : dbuf.height - j - 1;

                    fadePercent = Math.floor(
                        (50 * (currentMessageCount - j)) / currentMessageCount
                    );
                    const fg = this.fg.clone().mix(this.bg, fadePercent);

                    dbuf.wrapText(
                        this.toBufferX(0),
                        y,
                        this.bounds.width,
                        msg,
                        fg,
                        this.bg
                    );
                });

                dbuf.render();

                if (
                    !fastForward &&
                    (await this.ui.loop.pause(reverse ? 15 : 45))
                ) {
                    fastForward = true;
                    // dequeueEvent();
                    currentMessageCount = reverse
                        ? this.bounds.height + 1
                        : totalMessageCount - 1; // skip to the end
                }
            }

            if (!reverse) {
                const y = isOnTop ? 0 : dbuf.height - 1;
                const x =
                    this.bounds.x > 8
                        ? this.bounds.x - 8 // to left of box
                        : Math.min(
                              this.bounds.x + this.bounds.width, // just to right of box
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
