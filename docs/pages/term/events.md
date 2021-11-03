# Basic Events

## Hover

By default, the Term will watch for mousemove events and will set enable hover style for widgets.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles
    .add('text', { fg: 'green' })
    .add('text:hover', { fg: 'lighter_blue' });

layer.pos(5, 5).text('Hello World.');
layer.pos(5, 7).text('More Text.');
```

## Action

You can assign an action to a widget so that when the widget is clicked, the action is fired. The action will bubble up through the elements until it hits the layer.

You can also assign an ID to a widget. If you do so, then that will be used as the action for click purposes (if no action provided).

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles
    .add('text', { fg: 'green' })
    .add('text:hover', { fg: 'lighter_blue' })
    .add('.result', { fg: 'blue' });

layer.pos(5, 5).text('Click Me!', { action: 'ACTION' });
layer.pos(5, 7).text('...Or Me!', { id: 'ID' });

const result = layer.pos(5, 9).text('...', { class: 'result' });
layer.on('ACTION', () => {
    result.text('Action clicked!');
});
layer.on('ID', () => {
    result.text('ID clicked!');
});
```

## Mouse : Enter, Move, Leave

You can capture the mouse events over a widget with the mouseenter, mousemove, and mouseleave events.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles
    .add('text', { fg: 'green', bg: 'gray' })
    .add('text:hover', { fg: 'lighter_blue' })
    .add('.results', { fg: 'red', bg: -1 });

const enter = layer.pos(30, 5).text('').addClass('results');
const move = layer.pos(30, 7).text('').addClass('results');
const leave = layer.pos(30, 9).text('').addClass('results');

layer
    .pos(5, 5)
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
```
