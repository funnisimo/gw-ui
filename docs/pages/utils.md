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
                box: {
                    bg: 'darkest_teal',
                    borderBg: 'dark_gray',
                    padX: 2,
                    padY: 2,
                    title: 'My Alert',
                    titleFg: 'dark_yellow',
                },
                fg: 'green',
                width: 50,
            },
            'This is a custom alert that ΩredΩspans∆ many Ωlightest_blueΩlines of text∆ and has ΩtealΩcolors∆.\n\nIt is capable of showing lots of information.\n\nEven newlines are allowed.'
        );
    },
});
```

## confirm

confirm shows a message to the player until they confirm it. You can allow the player to confirm or cancel the alert. You can even change the text of the buttons to do something like a Yes or No dialog.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

canvas.buffer.drawText(20, 17, 'Click the canvas to see a confirm.', 'yellow');
canvas.buffer.drawText(
    20,
    19,
    'Press a key to see a more custom confirm.',
    'yellow'
);
canvas.render();

LOOP.run({
    async click() {
        await ui.confirm('This is fairly simple.');
    },
    async keypress() {
        await ui.confirm(
            {
                width: 20,
                box: {
                    bg: 'white',
                    borderBg: 'light_gray',
                    pad: 2,
                    title: 'TACOS!',
                },
                fg: 'blue',
            },
            'This is a much more complex confirmation dialog.  It can include text that spans more than one line.  It can also include ΩredΩcolors∆!'
        );
    },
});
```
