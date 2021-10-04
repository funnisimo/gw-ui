import * as GWU from 'gw-utils';
import * as Widget from './widget';

export interface InputOptions extends Widget.WidgetOptions {
    errorFg?: GWU.color.ColorBase;

    hint?: string;
    hintFg?: GWU.color.ColorBase;

    default?: string;
    minLength?: number;

    numbersOnly?: boolean;
    min?: number;
    max?: number;
}

export class Input extends Widget.Widget {
    hint!: string;
    hintFg!: GWU.color.ColorBase;
    errorFg!: GWU.color.ColorBase;
    default!: string;
    minLength!: number;
    numbersOnly!: boolean;
    min!: number;
    max!: number;

    constructor(id: string, opts?: InputOptions) {
        super(id, opts);
    }

    init(opts: InputOptions) {
        opts.tabStop = opts.tabStop ?? true; // Need to receive input
        super.init(opts);

        this.default = opts.default || '';

        this.errorFg = opts.errorFg || this.fg;
        this.hint = opts.hint || '';
        this.hintFg = opts.hintFg || this.errorFg;

        this.minLength = opts.minLength || 1;
        this.numbersOnly = opts.numbersOnly || false;
        this.min = opts.min ?? Number.MIN_SAFE_INTEGER;
        this.max = opts.max ?? Number.MAX_SAFE_INTEGER;

        if (!this.bounds.width) {
            if (this.hint) this.bounds.width = this.hint.length;
            if (this.default) this.bounds.width = this.default.length;
        }
        if (!this.bounds.height) {
            this.bounds.height = 1;
        }

        this.reset();
    }

    reset() {
        this.text = this.default;
    }

    isValid(): boolean {
        if (this.numbersOnly) {
            const val = Number.parseInt(this.text);
            if (this.min !== undefined && val < this.min) return false;
            if (this.max !== undefined && val > this.max) return false;
            return val > 0;
        }
        return this.text.length >= this.minLength;
    }

    get value(): string | number {
        if (this.numbersOnly) return Number.parseInt(this.text);
        return this.text;
    }

    keypress(ev: GWU.io.Event): boolean | Promise<boolean> {
        const textEntryBounds = this.numbersOnly ? ['0', '9'] : [' ', '~'];

        if (!ev.key) return false;

        if (ev.key === 'Enter' && this.isValid()) {
            const r = this.parent.fireAction(this.action, this);
            if (r) return r.then(() => true);
            return true;
        }
        if (ev.key == 'Delete' || ev.key == 'Backspace') {
            if (this.text.length) {
                this.text = GWU.text.spliceRaw(
                    this.text,
                    this.text.length - 1,
                    1
                );
            }
            return true;
        } else if (ev.key.length > 1) {
            // ignore other special keys...
            return false;
        }

        // eat/use all other keys
        if (ev.key >= textEntryBounds[0] && ev.key <= textEntryBounds[1]) {
            // allow only permitted input
            if (this.text.length < this.bounds.width) {
                this.text += ev.key;
            }
        }
        return true;
    }

    draw(buffer: GWU.canvas.DataBuffer, offsetX = 0, offsetY = 0) {
        const x = this.bounds.x + offsetX;
        const y = this.bounds.y + offsetY;
        buffer.fillRect(x, y, this.bounds.width, 1, ' ', this.fg, this.bg);

        if (!this.text.length && this.hint && this.hint.length) {
            buffer.drawText(x, y, this.hint, this.hintFg);
        } else {
            const color = this.isValid() ? this.fg : this.errorFg;
            buffer.drawText(x, y, this.text, color);
        }
    }
}
