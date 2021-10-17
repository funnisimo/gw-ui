# HTML Events

You can handle any of the main IO events on elements.

## click

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('body', { bg: 'darkest_red', padding: 1 });
document.stylesheet.add('div', { fg: 'green', bg: 'dark_gray' });
document.stylesheet.add('.blink', { bg: 'green', fg: 'dark_gray' });

document
    .create('<div>')
    .text('Testing')
    .on('click', (doc, el, e) => {
        el.toggleClass('blink');
    })
    .appendTo('body');

document.nextTabStop();
document.updateLayout();

LOOP.run(document); // We can pass the document directly to the LOOP!
```

## keypress

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('body', { bg: 'darkest_red', padding: 1 });
document.stylesheet.add('div', { fg: 'green', bg: 'dark_gray' });
document.stylesheet.add('.blink', { bg: 'green', fg: 'dark_gray' });

document
    .create('<div>')
    .text('Testing')
    .prop('tabindex', true)
    .on('Enter', (doc, el, e) => {
        el.toggleClass('blink');
    })
    .appendTo('body');

document.nextTabStop();
document.updateLayout();

LOOP.run(document); // We can pass the document directly to the LOOP!
```
