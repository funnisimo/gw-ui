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
