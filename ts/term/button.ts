import { Term } from '.';
import * as Widget from './widget';

export interface ButtonOptions extends Widget.WidgetOptions {}

export class Button extends Widget.Widget {
    constructor(term: Term, opts: ButtonOptions) {
        super(term, opts);
    }
}
