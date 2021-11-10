# Handling User Input

There are some functions in the UI library that allow you to accept use input.

## Input Widget

This function allows you to read text from the user at a provided location on the current screen. It will return the text that you provided and will cleanup the screen after itself. If you want the text to remain, just draw it back after the return.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('.result', { fg: 'teal' });

const name = layer.pos(40, 5).text('...', { class: 'result' });

layer.pos(5, 5).text('Name:');
layer
    .pos(11, 5)
    .input({ width: 20, placeholder: 'Type here...' })
    .on('change', (n, w, e) => {
        name.text(w.text());
    });

const age = layer.pos(40, 9).text('...', { class: 'result' });

layer.pos(5, 9).text('Age:');
layer
    .pos(11, 9)
    .input({ numbersOnly: true, min: 15, max: 99, placeholder: '15-99' })
    .on('change', (n, w, e) => {
        age.text(w.text());
    });
```
