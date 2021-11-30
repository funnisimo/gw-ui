import * as GWU from 'gw-utils';

export interface MessageOptions extends GWU.widget.WidgetOptions {
    length?: number;
}

export class Messages extends GWU.widget.Widget {
    cache!: GWU.message.MessageCache;

    constructor(layer: GWU.widget.WidgetLayer, opts: MessageOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'messages';
                return opts;
            })()
        );

        if (!this.bounds.height)
            throw new Error('Must provde a height for messages widget.');

        this.cache = new GWU.message.MessageCache({
            width: this.bounds.width,
            length: opts.length || 40,
            match: (_x, _y) => {
                this.layer.needsDraw = true;
                return true;
            },
        });
    }

    click(e: GWU.io.Event): boolean {
        if (!this.contains(e)) return false;
        this.showArchive();
        return true;
    }

    draw(buffer: GWU.buffer.Buffer) {
        const isOnTop = this.bounds.y < 10;

        // black out the message area
        buffer.fillRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            ' ',
            this._used.bg,
            this._used.bg
        );

        this.cache.forEach((line, confirmed, i) => {
            if (i >= this.bounds.height) return;

            const localY = isOnTop ? this.bounds.height - i - 1 : i;
            const y = localY + this.bounds.y;

            buffer.drawText(this.bounds.x, y, line, this._used.fg);
            if (confirmed && this._used.bg) {
                buffer.mix(
                    this._used.bg,
                    50,
                    this.bounds.x,
                    y,
                    this.bounds.width,
                    1
                );
            }
        });

        return true;
    }

    showArchive(): void {
        if (this.cache.length <= this.bounds.height) return;

        const layer = this.layer.ui.startNewLayer();
        // @ts-ignore
        const w = new MessageArchive(layer, this);
    }
}

export type ArchiveMode = 'forward' | 'ack' | 'reverse';

export class MessageArchive extends GWU.widget.Widget {
    source: Messages;
    totalCount: number;
    isOnTop: boolean;
    mode: ArchiveMode = 'forward';
    shown: number;

    constructor(layer: GWU.widget.WidgetLayer, source: Messages) {
        super(layer, {
            id: 'ARCHIVE',
            tag: 'messages',
            class: source.classes.concat('archive').join(' '),
            height: source.bounds.height,
            width: source.bounds.width,
            x: 0,
            y: 0,
            tabStop: true,
            depth: 100, // I'm on top
        });
        this.source = source;
        this.isOnTop = this.source.bounds.y < 10;
        this.bounds.height = this.isOnTop
            ? layer.height - source.bounds.y
            : source.bounds.bottom;

        this.totalCount = Math.min(
            source.cache.length,
            this.isOnTop
                ? layer.height - this.source.bounds.top
                : this.source.bounds.bottom
        );

        this.shown = source.bounds.height;
        this.layer.setTimeout(() => this._forward(), 16);

        // confirm them as they are right now...
        this.source.cache.confirmAll();
    }

    contains(): boolean {
        return true; // Eat all mouse activity
    }

    finish() {
        this.layer.finish();
    }

    keypress(_e: GWU.io.Event): boolean {
        if (this.mode === 'ack') {
            this.mode = 'reverse';
            this.layer.needsDraw = true;
            this.layer.setTimeout(() => this._reverse(), 16);
        } else if (this.mode === 'reverse') {
            this.finish();
            return true;
        } else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            this.layer.clearTimeout('FORWARD');
            this.layer.needsDraw = true;
        }
        return true; // eat all events
    }

    click(_e: GWU.io.Event): boolean {
        if (this.mode === 'ack') {
            this.mode = 'reverse';
            this.layer.needsDraw = true;
            this.layer.setTimeout(() => this._reverse(), 16);
        } else if (this.mode === 'reverse') {
            this.finish();
        } else {
            this.mode = 'ack';
            this.shown = this.totalCount;
            this.layer.needsDraw = true;
        }
        return true;
    }

    _forward(): boolean {
        ++this.shown;
        this.layer.needsDraw = true;
        if (this.shown < this.totalCount) {
            this.layer.setTimeout(() => this._forward(), 16);
        } else {
            this.mode = 'ack';
            this.shown = this.totalCount;
        }
        return true;
    }

    _reverse(): boolean {
        --this.shown;
        if (this.shown <= this.source.bounds.height) {
            this.finish();
        } else {
            this.layer.needsDraw = true;
            this.layer.setTimeout(() => this._reverse(), 16);
        }
        return true;
    }

    _draw(buffer: GWU.buffer.Buffer): boolean {
        let fadePercent = 0;
        // let reverse = this.mode === 'reverse';

        // Count the number of lines in the archive.
        // let totalMessageCount = this.totalCount;
        const isOnTop = this.isOnTop;
        const dbuf = buffer;
        const fg = GWU.color.from(this.source._used.fg);

        // const dM = reverse ? -1 : 1;
        // const startM = reverse ? totalMessageCount : this.bounds.height;
        // const endM = reverse
        //     ? this.bounds.height + dM + 1
        //     : totalMessageCount + dM;

        const startY = isOnTop
            ? this.shown - 1
            : this.bounds.bottom - this.shown;
        const endY = isOnTop ? 0 : this.bounds.bottom - 1;
        const dy = isOnTop ? -1 : 1;

        dbuf.fillRect(
            this.source.bounds.x,
            Math.min(startY, endY),
            this.bounds.width,
            this.shown,
            ' ',
            this._used.bg,
            this._used.bg
        );

        this.source.cache.forEach((line, _confirmed, j) => {
            const y = startY + j * dy;
            if (isOnTop) {
                if (y < endY) return;
            } else if (y > endY) return;
            fadePercent = Math.floor((50 * j) / this.shown);
            const fgColor = fg.mix(this._used.bg!, fadePercent);
            dbuf.drawText(
                this.source.bounds.x,
                y,
                line,
                fgColor,
                this._used.bg
            );
        });

        if (this.mode === 'ack') {
            const y = this.isOnTop ? 0 : dbuf.height - 1;
            const x =
                this.source.bounds.x > 8
                    ? this.source.bounds.x - 8 // to left of box
                    : Math.min(
                          this.source.bounds.x + this.bounds.width, // just to right of box
                          dbuf.width - 8 // But definitely on the screen - overwrite some text if necessary
                      );
            dbuf.wrapText(x, y, 8, '--DONE--', this._used.bg, this._used.fg);
        }

        return true;
    }
}
