import * as Style from './style';
import * as Element from './element';

export class Input extends Element.Element {
    constructor(tag: string, sheet: Style.Sheet) {
        super(tag, sheet);
    }

    // No text
    text(): string;
    text(v: string): this;
    text(v?: string): this | string {
        if (v === undefined) return this._text;
        return this;
    }
}
