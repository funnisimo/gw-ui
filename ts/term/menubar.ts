import * as Widget from './widget';
import { Term } from './term';

export interface MenubarOptions extends Widget.WidgetOptions {}

export class Menubar extends Widget.WidgetGroup {
    constructor(term: Term, opts: MenubarOptions) {
        super(term, opts);
    }
}
