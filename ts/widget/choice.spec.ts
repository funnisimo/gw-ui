import * as UTILS from '../../test/utils';

import * as Choice from './choice';
import { UI } from '../ui';
import { Layer } from '../ui/layer';

describe('Prompt', () => {
    test('basic', () => {
        // fields
        const p = new Choice.Prompt('question?')
            .choice('a')
            .choice('b')
            .choice('c');
        expect(p.field()).toEqual('');
        expect(p.prompt()).toEqual('question?');
        expect(p.choices()).toEqual(['a', 'b', 'c']);
        expect(p._infos).toEqual(['', '', '']);
    });

    test('basic - choice only', () => {
        const p2 = new Choice.Prompt('question?', 'field').choices([
            'a',
            'b',
            'c',
        ]);
        expect(p2.field()).toEqual('field');
        expect(p2.prompt()).toEqual('question?');
        expect(p2.choices()).toEqual(['a', 'b', 'c']);
        expect(p2._infos).toEqual(['', '', '']);
    });

    test('basic - object', () => {
        const q = new Choice.Prompt('question?', 'field').choices({
            A: 'text A',
            B: 'text B',
            C: 'text C',
        });

        expect(q.field()).toEqual('field');
        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
    });

    test('basic - array', () => {
        const q = new Choice.Prompt('question?', 'field').choices(
            ['A', 'B', 'C'],
            ['text A', 'text B', 'text C']
        );

        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
        expect(q.selection).toEqual(-1);
        expect(q.next()).toBeNull();
    });

    test('basic - build', () => {
        const q = new Choice.Prompt('question?', 'field')
            .choice('A', 'text A')
            .choice('B', 'text B')
            .choice('C', 'text C');

        expect(q.field()).toEqual('field');
        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
    });

    test('next - individual', () => {
        const q = new Choice.Prompt('question?', {
            field: 'field',
            next: 'NEXT',
            id: 'ID',
        })
            .choice('A', { info: 'text A', next: 'A', value: 'TACO' })
            .choice('B', { info: 'text B', next: 'B', value: 'MILK' })
            .choice('C', 'text C');

        expect(q.prompt()).toEqual('question?');
        expect(q.choices()).toEqual(['A', 'B', 'C']);
        expect(q._infos).toEqual(['text A', 'text B', 'text C']);
        expect(q.next()).toEqual('NEXT');
        expect(q.id()).toEqual('ID');

        q.selection = 0;
        expect(q.next()).toEqual('A');

        q.selection = 1;
        expect(q.next()).toEqual('B');

        q.selection = 2;
        expect(q.next()).toEqual('NEXT');
    });
});

describe('Choice', () => {
    let ui: UI;
    let layer: Layer;

    beforeEach(() => {
        ui = UTILS.mockUI(100, 38);
        layer = ui.startNewLayer();
    });

    afterEach(() => {
        ui.stop();
    });

    test('create', async () => {
        const choice = new Choice.Choice(layer, {
            width: 60,
            choiceWidth: 20,
            height: 20,
        });

        layer.draw(); // sets focusWidget
        expect(layer.focusWidget).toBe(choice.list); // enables keypress,dir

        const prompt = new Choice.Prompt('question?').choices(['A', 'B', 'C']);
        expect(prompt.selection).toEqual(-1);

        const changeFn = jest.fn();
        choice.on('change', changeFn);

        const inputFn = jest.fn();
        choice.on('input', inputFn);

        const promise = choice.showPrompt(prompt);
        expect(changeFn).not.toHaveBeenCalled();
        expect(inputFn).toHaveBeenCalledWith('input', choice, prompt);
        expect(prompt.selection).toEqual(0);
        expect(prompt.value()).toEqual('A');

        layer.draw(); // in case we want to test click

        inputFn.mockClear();
        await UTILS.pushEvent(ui.loop, UTILS.dir('down'));
        expect(changeFn).not.toHaveBeenCalled();
        expect(inputFn).toHaveBeenCalledWith('input', choice, prompt);
        expect(prompt.selection).toEqual(1);
        expect(prompt.value()).toEqual('B');

        inputFn.mockClear();
        await UTILS.pushEvent(ui.loop, UTILS.keypress('Enter'));
        expect(inputFn).not.toHaveBeenCalled();
        expect(changeFn).toHaveBeenCalledWith('change', choice, prompt);
        expect(prompt.selection).toEqual(1);
        expect(prompt.value()).toEqual('B');

        expect(await promise).toEqual('B');
    });
});

describe('Inquiry', () => {});
