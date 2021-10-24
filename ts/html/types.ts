export interface Size {
    width: number;
    height: number;
}

export type PropType = string | number | boolean;

export interface Selectable {
    tag: string;
    classes: string[];

    attr(name: string): string | undefined;
    prop(name: string): PropType | undefined;
    parent: Selectable | null;
    children?: Selectable[];
}
