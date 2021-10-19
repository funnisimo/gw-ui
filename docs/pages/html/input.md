# HTML Input

Here is an example of an HTML style input field:

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);
document.stylesheet.add('input', { fg: 'black', bg: 'gray' });
document.stylesheet.add('input:focus', { fg: 'white', bg: 'dark_teal' });
document.stylesheet.add('input:empty', { fg: 'lighter_green' }); // placeholder color
document.stylesheet.add('input:valid', { fg: 'blue' });

const t = document
    .create('<div>')
    .pos(10, 3)
    .text('events')
    .style('fg', 'red')
    .appendTo('body');

document
    .create('<input id=A>')
    .pos(10, 5)
    .on('input', (d, l, e) => {
        t.text('input = ' + e.key);
    })
    .on('change', (d, l) => {
        t.text('change = ' + l.val());
    })
    .appendTo('body');

document
    .create('<input id=B type=number min=5 max=300 placeholder="5-300">')
    .pos(10, 7)
    .appendTo('body');

document
    .create(
        '<input id=C size=20 minLength=4 maxLength=15 placeholder="type here">'
    )
    .pos(10, 9)
    .appendTo('body');

LOOP.run(document);
```
