# Utilities

Here are some utility function examples...

## fadeTo

FadeTo allows you to fade the entire screen to a color over a set time. It is useful for transitions.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

canvas.buffer.drawText(20, 17, 'Click the canvas to fade it.', 'yellow');
canvas.render();

LOOP.run({
    async click() {
        await ui.fadeTo('green', 1000);
    },
});
```

## alert

alert shows a message to the player for a given duration. There are a number of options for the alert that allow you to customize it's appearance.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

canvas.buffer.drawText(
    20,
    17,
    'Click the canvas to see a simple alert.',
    'yellow'
);
canvas.buffer.drawText(
    20,
    19,
    'Press a key to see a more custom/complex alert.',
    'yellow'
);
canvas.render();

LOOP.run({
    async click() {
        await ui.alert(3000, 'This is fairly simple.');
    },
    async keypress() {
        await ui.alert(
            {
                duration: 3000,
                fg: 'green',
                bg: 'darkest_teal',
                borderBg: 'dark_gray',
                x: 5,
                y: 5,
                title: 'My Alert',
                titleFg: 'dark_yellow',
                width: 50,
            },
            'This is a custom alert that ΩredΩspans∆ many Ωlightest_blueΩlines of text∆ and has ΩtealΩcolors∆.\n\nIt is capable of showing lots of information.\n\nEven newlines are allowed.'
        );
    },
});
```
