# Messages

The Messages class encapsulates showing game messages. It is configured with the bounds of the display and the canvas to display on. It also allows you to show the cache of all historical messages using a nice animation.

## Background

Lets generically add some messages to the system every so often...

```js
let count = 0;
setInterval(() => {
    GWU.message.add('Test ' + count);
    ++count;
}, 2000);
```

## Basic Usage

The messages component is given a UI component to draw into and its bounds when it is created.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const messages = new GWI.Messages('MSG', {
    x: 0,
    y: 0,
    width: 80,
    height: 4,
    bg: 'red',
    fg: 'yellow',
});
const dialog = new GWI.Dialog(ui);
dialog.widgets.push(messages);
dialog.show();
```

## Positioning

The messages component can also be positioned at the bottom of the canvas. If you do, the order of the messages is automatically set with the most recent at the top.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const messages = new GWI.Messages('MSG', {
    x: 20,
    y: canvas.height - 4,
    width: 80,
    height: 4,
    bg: 'teal',
    fg: 'black',
});

const dialog = new GWI.Dialog(ui);
dialog.widgets.push(messages);
dialog.show();
```
