# Basic Events

## Hover

By default, the Term will watch for mousemove events and will set enable hover style for widgets.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.styles
    .add('text', { fg: 'green' })
    .add('text:hover', { fg: 'lighter_blue' });

term.pos(5, 5).text('Hello World.');
term.pos(5, 7).text('More Text.');

ui.loop.run(term);
```

## Mouse : Enter, Move, Leave

You can capture the mouse events over a widget with the mouseenter, mousemove, and mouseleave events.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.styles
    .add('text', { fg: 'green', bg: 'gray' })
    .add('text:hover', { fg: 'lighter_blue' })
    .add('.results', { fg: 'red', bg: -1 });

const enter = term.pos(30, 5).text('').addClass('results');
const move = term.pos(30, 7).text('').addClass('results');
const leave = term.pos(30, 9).text('').addClass('results');

term.pos(5, 5)
    .text('Hello World.', {
        width: 20,
        height: 5,
        valign: 'middle',
    })
    .on('mouseenter', () => {
        enter.incProp('count');
        enter.text('Mouse Enter - ' + enter.prop('count'));
    })
    .on('mousemove', (n, w, e) => {
        move.text('Mouse Move = ' + e.x + ',' + e.y);
    })
    .on('mouseleave', () => {
        leave.incProp('count');
        leave.text('Mouse leave - ' + leave.prop('count'));
    });

ui.loop.run(term);
```
