import * as GWU from 'gw-utils';
import { Layer } from '../layer';
import * as Text from './text';
import * as Widget from './widget';
import { BorderType } from './datatable';
import { drawBorder } from './border';
import { DataList } from './datalist';

////////////////////////////////////////////////////////////////////////////////
// PROMPT

export type NextType = string | null;

export interface PromptChoice {
    text?: string;
    next?: string;
    value?: any;
}

export interface PromptOptions {
    field?: string;
    next?: string;
    id?: string;
}

export class Prompt {
    _id: string | null = null;
    _field: string;
    _prompt: string;

    _choices: string[];
    _infos!: string[];
    _next: NextType[];
    _values: any[];

    _defaultNext: NextType = null;
    selection = -1;

    constructor(question: string, field: string | PromptOptions = {}) {
        if (typeof field === 'string') {
            field = { field };
        }
        this._prompt = question;
        this._field = field.field || '';
        this._choices = [];
        this._infos = [];
        this._values = [];
        this._next = [];
        this._defaultNext = field.next || null;
        this._id = field.id || field.field || '';
    }

    field(): string;
    field(v: string): this;
    field(v?: string): this | string {
        if (v === undefined) return this._field;
        this._field = v;
        return this;
    }

    id(): string | null;
    id(v: string | null): this;
    id(v?: string | null): this | string | null {
        if (v === undefined) return this._id;
        this._id = v;
        return this;
    }

    prompt(): string;
    prompt(v: string): this;
    prompt(v?: string): this | string {
        if (v === undefined) return this._prompt;
        this._prompt = v;
        return this;
    }

    next(): string | null;
    next(v: string | null): this;
    next(v?: string | null): this | string | null {
        if (v === undefined)
            return this._next[this.selection] || this._defaultNext;
        this._defaultNext = v;
        return this;
    }

    choices(): string[];
    choices(choices: Record<string, string>): this;
    choices(choices: string[], infos?: string[]): this;
    choices(
        choice?: string[] | Record<string, string>,
        info?: string[]
    ): this | string[] {
        if (choice === undefined) return this._choices;

        if (!Array.isArray(choice)) {
            info = Object.values(choice);
            choice = Object.keys(choice);
        } else if (!Array.isArray(info)) {
            info = new Array(choice.length).fill('');
        }
        if (choice.length !== info.length)
            throw new Error('Choices and Infos must have same length.');

        choice.forEach((c, i) => {
            this.choice(c, info![i]);
        });
        return this;
    }

    choice(choice: string, info: string | PromptChoice = {}): this {
        if (typeof info === 'string') {
            info = { text: info };
        }
        this._choices.push(choice);
        this._infos.push(info.text || '');
        this._next.push(info.next || null);
        this._values.push(info.value || choice);
        return this;
    }

    infos(): string[] {
        return this._infos;
    }

    info(n: number): string {
        return this._infos[n];
    }

    choose(n: number): this {
        this.selection = n;
        return this;
    }

    value(): any {
        return this._values[this.selection];
    }
}

////////////////////////////////////////////////////////////////////////////////
// CHOICE

export interface ChoiceOptions extends Widget.WidgetOptions {
    width: number;
    height: number;
    choiceWidth: number;

    border?: BorderType;

    promptTag?: string;
    promptClass?: string;

    choiceTag?: string;
    choiceClass?: string;

    infoTag?: string;
    infoClass?: string;

    prompt?: Prompt;
}

export class Choice extends Widget.Widget {
    static default = {
        tag: 'choice',
        border: 'ascii',
        promptTag: 'prompt',
        promptClass: '',

        choiceTag: 'choice',
        choiceClass: '',

        infoTag: 'info',
        infoClass: '',
    };

    choiceWidth: number;
    prompt!: Widget.Widget;
    list!: DataList;
    info!: Text.Text;
    _prompt: Prompt | null = null;
    _done: null | ((v: any) => void) = null;

    constructor(layer: Layer, opts: ChoiceOptions) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || Choice.default.tag;
                return opts;
            })()
        );
        this.choiceWidth = opts.choiceWidth;
        this.attr('border', opts.border || Choice.default.border);
        this.attr('promptTag', opts.promptTag || Choice.default.promptTag);
        this.attr(
            'promptClass',
            opts.promptClass || Choice.default.promptClass
        );
        this.attr('choiceTag', opts.choiceTag || Choice.default.choiceTag);

        this.attr(
            'choiceClass',
            opts.choiceClass || Choice.default.choiceClass
        );
        this.attr('infoTag', opts.infoTag || Choice.default.infoTag);
        this.attr('infoClass', opts.infoClass || Choice.default.infoClass);

        this._addLegend();
        this._addList();
        this._addInfo();

        if (opts.prompt) {
            this.showPrompt(opts.prompt);
        }
    }

    showPrompt(prompt: Prompt): Promise<any> {
        this._prompt = prompt;
        prompt.choose(0);
        this.prompt.text(prompt.prompt());
        this.list.data(prompt.choices());
        this.info.text(prompt.info(prompt.selection));

        this._bubbleEvent('input', this, this._prompt);
        return new Promise((resolve) => (this._done = resolve));
    }

    _addList(): this {
        this.list = new DataList(this.layer, {
            height: this.bounds.height - 2,
            x: this.bounds.x + 1,
            width: this.choiceWidth,
            y: this.bounds.y + 1,
            dataTag: this._attrStr('choiceTag'),
            dataClass: this._attrStr('choiceClass'),
            tabStop: true,
            border: 'none',
            hover: 'select',
        });
        this.list.setParent(this);
        this.list.on('input', () => {
            if (!this._prompt) return false;
            const p = this._prompt;
            const row = this.list.selectedRow;
            p.choose(row);
            if (row == -1) {
                this.info.text('');
            } else {
                this.info.text(p.info(row));
            }
            this._bubbleEvent('input', this, p);
            return true; // I want to eat this event
        });
        this.list.on('change', () => {
            if (!this._prompt) return false;
            const p = this._prompt;
            p.choose(this.list.selectedRow);
            this._bubbleEvent('change', this, p);
            this._done!(p.value());
            return true; // eat this event
        });
        return this;
    }

    _addInfo(): this {
        this.info = new Text.Text(this.layer, {
            text: '',
            x: this.bounds.x + this.choiceWidth + 2,
            y: this.bounds.y + 1,
            width: this.bounds.width - this.choiceWidth - 3,
            height: this.bounds.height - 2,
            tag: this._attrStr('infoTag'),
            class: this._attrStr('infoClass'),
        });

        this.info.setParent(this);
        return this;
    }

    _addLegend(): this {
        this.prompt = new Text.Text(this.layer, {
            text: '',
            width: this.bounds.width - 4,
            x: this.bounds.x + 2,
            y: this.bounds.y,
            tag: this._attrStr('promptTag'),
            class: this._attrStr('promptClass'),
        });

        this.prompt.setParent(this);
        return this;
    }

    _draw(buffer: GWU.canvas.DataBuffer): boolean {
        let w = this.choiceWidth + 2;
        const h = this.bounds.height;
        let x = this.bounds.x;
        const y = this.bounds.y;
        const ascii = this.attr('border') === 'ascii';

        drawBorder(buffer, x, y, w, h, this._used, ascii);

        w = this.bounds.width - this.choiceWidth - 1;
        x = this.bounds.x + this.choiceWidth + 1;
        drawBorder(buffer, x, y, w, h, this._used, ascii);

        return true;
    }
}

// extend Layer

export type AddChoiceOptions = ChoiceOptions &
    Widget.SetParentOptions & { parent?: Widget.Widget };

declare module '../layer' {
    interface Layer {
        choice(opts?: AddChoiceOptions): Choice;
    }
}
Layer.prototype.choice = function (opts: AddChoiceOptions): Choice {
    const options = Object.assign({}, this._opts, opts) as ChoiceOptions;
    const widget = new Choice(this, options);
    if (opts.parent) {
        widget.setParent(opts.parent, opts);
    }
    return widget;
};

////////////////////////////////////////////////////////////////////////////////
// INQUIRY

export class Inquiry {
    widget: Choice;
    _prompts: Prompt[] = [];

    constructor(widget: Choice) {
        this.widget = widget;
    }

    prompt(p: Prompt): this {
        this._prompts.push(p);
        return this;
    }
}
