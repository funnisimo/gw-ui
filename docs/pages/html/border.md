# HTML Borders

Elements can have a solid border around them.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document
    .create('<div id=A>')
    .style({ border: 'red', padding: 1, margin: 1 })
    .pos(0, 0, 'fixed')
    .appendTo('body');

document.create('<text>').text('Element - Fixed').appendTo('#A');

document.create('<text>').text('Element 2').appendTo('#A');

document.draw();
```
