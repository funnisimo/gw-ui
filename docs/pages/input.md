# Handling User Input

There are some functions in the UI library that allow you to accept use input.

## getInputAt

This function allows you to read text from the user at a provided location on the current screen. It will return the text that you provided and will cleanup the screen after itself. If you want the text to remain, just draw it back after the return.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

(async () => {
    canvas.buffer.drawText(5, 5, 'Name: ', 'white');
    canvas.render();

    const text = await ui.getInputAt(11, 5, 20, {
        bg: 'gray',
        fg: 'white',
        minLength: 5,
    });
    if (text && text.length) {
        canvas.buffer.drawText(11, 5, text, 'yellow');
        canvas.render();
    } else {
        canvas.buffer.drawText(11, 5, 'CANCELED', 'red');
        canvas.render();
    }

    canvas.buffer.drawText(5, 6, 'Age: ', 'white');
    canvas.render();

    const age = await ui.getInputAt(11, 6, 20, {
        bg: 'gray',
        fg: 'white',
        numbersOnly: true,
        min: 15,
        max: 99,
    });
    if (age && age.length) {
        canvas.buffer.drawText(11, 6, age, 'yellow');
        canvas.render();
    } else {
        canvas.buffer.drawText(11, 6, 'CANCELED', 'red');
        canvas.render();
    }
})();
```
