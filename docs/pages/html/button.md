# HTML Button

Buttons are there for you to click!

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('button:hover', { fg: 'teal', bg: 'gray' });
document.stylesheet.add('button:focus', { fg: 'dark_teal', bg: 'light_gray' });
document.stylesheet.add('#B:focus', { fg: 'yellow', bg: 'dark_gray' });

const t = document
    .create('<div>')
    .pos(10, 3)
    .text('events')
    .style('fg', 'red')
    .appendTo('body');

document
    .create('<button id=A value=custom>This is a button.</button>')
    .pos(10, 5)
    .on('click', (d, l) => {
        t.text('clicked = ' + l.attr('id'));
    })
    .appendTo('body');

document
    .create('<button id=B clickfocus>This is another button.</button>')
    .pos(10, 7)
    .on('click', (d, l) => {
        t.text('clicked = ' + l.attr('id'));
    })
    .appendTo('body');

LOOP.run(document);
```
