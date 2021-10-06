import * as GWU from 'gw-utils';
import { UICore } from '.';
import * as Widget from './widget';

export interface MessageOptions extends Widget.WidgetOptions {
    length?: number;
}

export class Messages extends Widget.Widget {
    cache!: GWU.message.MessageCache;

    constructor(id: string, opts?: MessageOptions) {
        super(id, opts);
    }

    init(opts: MessageOptions) {
        super.init(opts);
        if (!this.bounds.height)
            throw new Error('Must provde a height for messages widget.');

        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: opts.length || 40,
            match: (_x, _y) => {
                if (this.parent) this.parent.requestRedraw();
                return true;
            },
        });
    }

    click(e: GWU.io.Event, ui: UICore): boolean | Promise<boolean> {
        if (!this.contains(e)) return false;
        return this.showArchive(ui).then(() => true);
    }

    draw(buffer: GWU.canvas.DataBuffer) {
        const isOnTop = this.bounds.y < 10;

        // black out the message area
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            ' ',
            this.bg,
            this.bg
        );

        this.cache.forEach((line, confirmed, i) => {
            if (i >= this.bounds.height) return;

            const localY = isOnTop ? this.bounds.height - i - 1 : i;
            const y = localY + this.bounds.y;

            buffer.drawText(this.bounds.x, y, line, this.fg);
            if (confirmed) {
                buffer.mix(this.bg, 50, this.bounds.x, y, this.bounds.width, 1);
            }
        });

        return true;
    }

    async showArchive(ui: UICore): Promise<boolean> {
        let reverse,
            fadePercent = 0;
        let fastForward;

        // Count the number of lines in the archive.
        let totalMessageCount = this.cache.length;
        if (totalMessageCount <= this.bounds.height) return false;

        const isOnTop = this.bounds.y < 10;
        const dbuf = ui.startDialog();
        const fg = GWU.color.from(this.fg);

        totalMessageCount = Math.min(
            totalMessageCount,
            isOnTop ? dbuf.height - this.bounds.top : this.bounds.bottom + 1
        );

        // Pull-down/pull-up animation:
        for (reverse = 0; reverse <= 1; reverse++) {
            fastForward = false;

            const dM = reverse ? -1 : 1;
            const startM = reverse ? totalMessageCount : this.bounds.height;
            const endM = reverse
                ? this.bounds.height + dM + 1
                : totalMessageCount + dM;

            // console.log(
            //     `setting up draw - startM=${startM}, endM=${endM}, dM=${dM}`
            // );

            for (let currentM = startM; currentM != endM; currentM += dM) {
                const startY = isOnTop
                    ? this.bounds.y + currentM - 1
                    : this.bounds.bottom - currentM + 1;
                const endY = isOnTop ? this.bounds.y : this.bounds.bottom;
                const dy = isOnTop ? -1 : 1;
                ui.resetDialogBuffer(dbuf);

                // console.log(
                //     `draw archive - count=${i}, startY=${startY}, endY=${endY}, dy=${dy}`
                // );

                dbuf.fillRect(
                    this.bounds.x,
                    Math.min(startY, endY),
                    this.bounds.width,
                    currentM,
                    ' ',
                    this.bg,
                    this.bg
                );

                this.cache.forEach((line, _confirmed, j) => {
                    const y = startY + j * dy;
                    if (isOnTop) {
                        if (y < endY) return;
                    } else if (y > endY) return;

                    fadePercent = Math.floor((50 * j) / currentM);
                    const fgColor = fg.clone().mix(this.bg, fadePercent);

                    dbuf.drawText(this.bounds.x, y, line, fgColor, this.bg);
                });

                dbuf.render();

                if (!fastForward) {
                    if (await ui.loop.pause(reverse ? 15 : 45)) {
                        fastForward = true;
                        currentM = endM - 2 * dM; // skip to the end-1
                    }
                }
            }

            if (!reverse) {
                const y = isOnTop ? 0 : dbuf.height - 1;
                const x =
                    this.bounds.x > 8
                        ? this.bounds.x - 8 // to left of box
                        : Math.min(
                              this.bounds.x + this.bounds.width, // just to right of box
                              dbuf.width - 8 // But definitely on the screen - overwrite some text if necessary
                          );
                dbuf.wrapText(x, y, 8, '--DONE--', this.bg, this.fg);
                dbuf.render();

                await ui.loop.waitForAck();
            }
        }
        ui.finishDialog();

        this.cache.confirmAll();
        if (this.parent) this.parent.requestRedraw(); // everything is confirmed
        return true;
    }
}
