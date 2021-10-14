export type Cb = (...args: any[]) => any | Promise<any>;

export class Callbacks {
    _items: Cb[] = [];
    _disabled = false;
    _fired = false;

    _once = false;
    // _memory = false;
    _stopOnFalse = false;
    _unique = false;

    constructor(flags: string) {
        const f = flags.split(' ');
        this._once = f.includes('once');
        // this._memory = f.includes('memory');
        this._stopOnFalse = f.includes('stopOnFalse');
        this._unique = f.includes('unique');
    }

    add(cb: Cb | Cb[]): this {
        if (Array.isArray(cb)) {
            cb.forEach((c) => this.add(c));
        } else {
            if (!this._unique || !this._items.includes(cb)) {
                this._items.push(cb);
            }
        }
        return this;
    }

    disable(): this {
        this._disabled = true;
        return this;
    }

    disabled(): boolean {
        return !this._disabled;
    }

    empty(): this {
        this._items.length = 0;
        return this;
    }

    async fire(...args: any[]): Promise<this> {
        if (this._disabled) return this;
        if (this._once && this._fired) return this;

        this._fired = true;
        for (let cb of this._items) {
            const r = await cb(...args);
            if (this._stopOnFalse && r === false) {
                break;
            }
        }
        return this;
    }

    fired(): boolean {
        return this._fired;
    }

    async fireWith(obj: object, args: any[]): Promise<this> {
        if (this._disabled) return this;
        if (this._once && this._fired) return this;

        this._fired = true;
        for (let cb of this._items) {
            const r = await cb.apply(obj, args);
            if (this._stopOnFalse && r === false) {
                break;
            }
        }
        return this;
    }

    has(cb: Cb): boolean {
        return this._items.includes(cb);
    }

    // lock - I am not sure what this does or why it is there

    // locked

    remove(cb: Cb): this {
        const index = this._items.indexOf(cb);
        if (index >= 0) {
            this._items.splice(index, 1);
        }
        return this;
    }
}
