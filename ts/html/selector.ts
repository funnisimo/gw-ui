export function isTruthy(v: any): boolean {
    if (!v) return false;
    if (typeof v === 'string') {
        if (v === 'false' || v === '0') return false;
    }
    return true;
}

export interface Selectable {
    tag: string;
    id: string;
    classes: string[];
    props: Record<string, any>;
}

const MATCH = /^(\*|\#\w+|\$|\w+)(\.(\w+))?(\:(\w+))?$/;

export class Selector {
    tag = '';
    id = '';
    class = '';
    prop = '';

    text: string;
    priority = 0;

    constructor(text: string) {
        if (text.startsWith(':') || text.startsWith('.')) {
            text = '*' + text;
        }

        const info = text.match(MATCH);
        if (!info) throw new Error('Invalid selector - ' + text);

        this.text = text;

        if (info[1] === '*') {
        } else if (info[1] === '$') {
            this.priority += 10000;
        } else if (info[1].startsWith('#')) {
            this.priority += 1000;
            this.id = info[1].substring(1);
        } else {
            this.tag = info[1];
            this.priority += 10;
        }

        if (info[3]) {
            this.class = info[3];
            this.priority += 100;
        }
        if (info[5]) {
            this.prop = info[5];
            this.priority += 1;
        }
    }

    matches(obj: Selectable): boolean {
        if (this.tag.length && obj.tag !== this.tag) return false;
        if (this.id.length && obj.id !== this.id) return false;
        if (this.class.length && !obj.classes.includes(this.class))
            return false;
        if (this.prop.length) {
            const v = obj.props[this.prop] || false;
            if (!isTruthy(v)) return false;
        }
        return true;
    }
}

export function selector(text: string): Selector {
    return new Selector(text);
}
