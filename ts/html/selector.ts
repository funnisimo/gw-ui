import * as GWU from 'gw-utils';
import { Selectable } from './types';

export type MatchFn = (el: Selectable) => boolean;
type BuildFn = (next: MatchFn, e: Selectable) => boolean;

export class Selector {
    text: string;
    priority = 0;
    matchFn: MatchFn;

    constructor(text: string) {
        if (text.startsWith(':') || text.startsWith('.')) {
            text = '*' + text;
        }

        this.text = text;
        this.matchFn = this._parse(text);
    }

    protected _parse(text: string): MatchFn {
        const parts = text.split(/ +/g).map((p) => p.trim());
        const matches = [];
        for (let i = 0; i < parts.length; ++i) {
            let p = parts[i];
            if (p === '>') {
                matches.push(this._parentMatch());
                ++i;
                p = parts[i];
            } else if (i > 0) {
                matches.push(this._ancestorMatch());
            }

            matches.push(this._matchElement(p));
        }

        return matches.reduce(
            (out, fn) => fn.bind(undefined, out),
            GWU.TRUE as MatchFn
        );
    }

    protected _parentMatch(): BuildFn {
        return function parentM(next: MatchFn, e: Selectable) {
            // console.log('parent', e.parent);
            if (!e.parent) return false;
            return next(e.parent);
        };
    }

    protected _ancestorMatch(): BuildFn {
        return function ancestorM(next, e) {
            let current = e.parent;
            while (current) {
                if (next(current)) return true;
            }
            return false;
        };
    }

    protected _matchElement(text: string): BuildFn {
        const CSS_RE =
            /(?:(\w+|\*|\$)|#(\w+)|\.([^\.: ]+))|(?::(?:(?:not\(\.([^\)]+)\))|(?:not\(:([^\)]+)\))|([^\.: ]+)))/g;

        const parts: MatchFn[] = [];
        const re = new RegExp(CSS_RE, 'g');
        let match = re.exec(text);
        while (match) {
            if (match[1]) {
                const fn = this._matchTag(match[1]);
                if (fn) {
                    parts.push(fn);
                }
            } else if (match[2]) {
                parts.push(this._matchId(match[2]));
            } else if (match[3]) {
                parts.push(this._matchClass(match[3]));
            } else if (match[4]) {
                parts.push(this._matchNot(this._matchClass(match[4])));
            } else if (match[5]) {
                parts.push(this._matchNot(this._matchProp(match[5])));
            } else {
                parts.push(this._matchProp(match[6]));
            }

            match = re.exec(text);
        }

        return (next: MatchFn, e: Selectable) => {
            if (!parts.every((fn) => fn(e))) return false;
            return next(e);
        };
    }

    protected _matchTag(tag: string): MatchFn | null {
        if (tag === '*') return null;
        if (tag === '$') {
            this.priority += 10000;
            return null;
        }
        this.priority += 10;
        return (el: Selectable) => el.tag === tag;
    }

    protected _matchClass(cls: string): MatchFn {
        this.priority += 100;
        return (el: Selectable) => el.classes.includes(cls);
    }

    protected _matchProp(prop: string): MatchFn {
        if (prop.startsWith('first')) {
            return this._matchFirst();
        } else if (prop.startsWith('last')) {
            return this._matchLast();
        } else if (prop === 'invalid') {
            return this._matchNot(this._matchProp('valid'));
        } else if (prop === 'optional') {
            return this._matchNot(this._matchProp('required'));
        } else if (prop === 'enabled') {
            return this._matchNot(this._matchProp('disabled'));
        } else if (prop === 'unchecked') {
            return this._matchNot(this._matchProp('checked'));
        }

        this.priority += 1; // prop
        return (el: Selectable) => !!el.prop(prop);
    }

    protected _matchId(id: string): MatchFn {
        this.priority += 1000;
        return (el: Selectable) => el.attr('id') === id;
    }

    protected _matchFirst(): MatchFn {
        this.priority += 1; // prop
        return (el: Selectable) => !!el.parent && el.parent.children[0] === el;
    }

    protected _matchLast(): MatchFn {
        this.priority += 1; // prop
        return (el: Selectable) =>
            !!el.parent &&
            el.parent.children[el.parent.children.length - 1] === el;
    }

    protected _matchNot(fn: MatchFn): MatchFn {
        return (el: Selectable) => !fn(el);
    }

    matches(obj: Selectable): boolean {
        return this.matchFn(obj);
    }
}

export function compile(text: string): Selector {
    return new Selector(text);
}
