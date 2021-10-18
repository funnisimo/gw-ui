export function isTruthy(v: any): boolean {
    if (!v) return false;
    if (typeof v === 'string') {
        if (v === 'false' || v === '0') return false;
    }
    return true;
}

export interface Selectable {
    tag: string;
    classes: string[];

    attr(name: string): string | undefined;
    prop(name: string): boolean | number | undefined;
    parent: Selectable | null;
    children: Selectable[];
}

export type MatchFn = (el: Selectable) => boolean;

function matchTag(tag: string): MatchFn {
    return (el: Selectable) => el.tag === tag;
}

function matchClass(cls: string): MatchFn {
    return (el: Selectable) => el.classes.includes(cls);
}

function matchProp(prop: string): MatchFn {
    if (prop.startsWith('first')) {
        return matchFirst();
    } else if (prop.startsWith('last')) {
        return matchLast();
    }

    return (el: Selectable) => !!el.prop(prop);
}

function matchId(id: string): MatchFn {
    return (el: Selectable) => el.attr('id') === id;
}

function matchFirst(): MatchFn {
    return (el: Selectable) => !!el.parent && el.parent.children[0] === el;
}

function matchLast(): MatchFn {
    return (el: Selectable) =>
        !!el.parent && el.parent.children[el.parent.children.length - 1] === el;
}

function matchNot(fn: MatchFn): MatchFn {
    return (el: Selectable) => !fn(el);
}

export class Selector {
    text: string;
    priority = 0;
    match: MatchFn[] = [];

    constructor(text: string) {
        if (text.startsWith(':') || text.startsWith('.')) {
            text = '*' + text;
        }

        this.text = text;

        let nextIndex = 0;
        if (text.startsWith('*')) {
            // global
            nextIndex = 1;
        } else if (text.startsWith('#')) {
            // id
            this.priority += 1000;

            const match = text.match(/#([^\.:]+)/);
            if (!match)
                throw new Error(
                    'Invalid selector - Failed to match ID: ' + text
                );
            nextIndex = match[0].length;
            // console.log('match ID - ', match[1], match);
            this.match.push(matchId(match[1]));
        } else if (text.startsWith('$')) {
            // self
            this.priority += 10000;
            nextIndex = 1;
        } else {
            // tag
            this.priority += 10;
            const match = text.match(/([^\.:]+)/);
            if (!match)
                throw new Error(
                    'Invalid selector - Failed to match tag: ' + text
                );
            nextIndex = match[0].length;
            // console.log('match Tag - ', match[1], match);
            this.match.push(matchTag(match[1]));
        }

        // console.log(nextIndex);

        const filterExp = new RegExp(
            /(?:\.([^\.:]+))|(?::(?:(?:not\(\.([^\)]+)\))|(?:not\(:([^\)]+)\))|([^\.:]+)))/g
        );
        // const propExp = new RegExp(/:([^:]+)/g);
        filterExp.lastIndex = nextIndex;
        let match = filterExp.exec(text);
        while (match) {
            // console.log(match);

            let fn: MatchFn;
            if (match[1]) {
                this.priority += 100;
                fn = matchClass(match[1]);
            } else if (match[2]) {
                this.priority += 100; // class
                fn = matchNot(matchClass(match[2]));
            } else if (match[3]) {
                this.priority += 1; // prop
                fn = matchNot(matchProp(match[3]));
            } else {
                this.priority += 1; // prop
                fn = matchProp(match[4]);
            }

            this.match.push(fn);

            match = filterExp.exec(text);
        }
    }

    matches(obj: Selectable): boolean {
        return this.match.every((fn) => fn(obj));
        // if (this.tag.length && obj.tag !== this.tag) return false;
        // if (this.id.length && obj.id !== this.id) return false;
        // if (this.class.length && !obj.classes.includes(this.class))
        //     return false;
        // if (this.prop.length) {
        //     const v = obj.prop(this.prop) || false;
        //     if (!isTruthy(v)) return false;
        // }
        // return true;
    }
}

export function selector(text: string): Selector {
    return new Selector(text);
}
