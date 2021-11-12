# Utilities

Here are some utility function examples...

## fadeTo

FadeTo allows you to fade the entire screen to a color over a set time. It is useful for transitions.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.pos(20, 17).text('Click the canvas to fade it.', { fg: 'yellow' });

layer.on('click', () => {
    layer.fadeTo('green', 1000);
    return true;
});
```

## alert

alert shows a message to the player for a given duration. There are a number of options for the alert that allow you to customize it's appearance.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('body', { bg: 'dark_gray' });
layer.styles.add('dialog', { bg: 'blue' });

layer.text('Click the canvas to see a simple alert.', {
    x: 20,
    y: 17,
    fg: 'dark_yellow',
});

layer.text('Press a key to see a more custom/complex alert.', {
    x: 20,
    y: 19,
    fg: 'dark_yellow',
});

layer.on('click', () => {
    layer.alert(3000, 'This is fairly simple.');
    return true;
});

layer.on('keypress', () => {
    layer.alert(
        {
            duration: 3000,
            fg: 'green',
            width: 50,
            legend: ' ALERT! ',
            legendAlign: 'center',
        },
        'This is a custom alert that ΩredΩspans∆ many Ωlightest_blueΩlines of text∆ and has ΩtealΩcolors∆.\n\nIt is capable of showing lots of information.\n\nEven newlines are allowed.'
    );
    return true;
});
```

## confirm

confirm shows a message to the player until they confirm it. You can allow the player to confirm or cancel the alert. You can even change the text of the buttons to do something like a Yes or No dialog.

```js
// const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
// SHOW(canvas.node);

// const ui = new GWI.UI({ canvas, loop: LOOP });

// canvas.buffer.drawText(20, 17, 'Click the canvas to see a confirm.', 'yellow');
// canvas.buffer.drawText(
//     20,
//     19,
//     'Press a key to see a more custom confirm.',
//     'yellow'
// );
// canvas.render();

// LOOP.run({
//     async click() {
//         await ui.confirm('This is fairly simple.');
//     },
//     async keypress() {
//         await ui.confirm(
//             {
//                 width: 20,
//                 box: {
//                     bg: 'white',
//                     borderBg: 'light_gray',
//                     pad: 2,
//                     title: 'TACOS!',
//                 },
//                 fg: 'blue',
//             },
//             'This is a much more complex confirmation dialog.  It can include text that spans more than one line.  It can also include ΩredΩcolors∆!'
//         );
//     },
// });
```
