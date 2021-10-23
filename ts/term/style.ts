import * as GWU from 'gw-utils';

export interface StyleOptions {
    fg?: GWU.color.ColorBase;
    bg?: GWU.color.ColorBase;
    align?: GWU.text.Align;
    valign?: GWU.text.VAlign;
}

export interface Style {
    fg: GWU.color.ColorBase;
    bg: GWU.color.ColorBase;
    align: GWU.text.Align;
    valign: GWU.text.VAlign;
}
