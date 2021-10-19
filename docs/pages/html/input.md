# HTML Input

Here is an example of an HTML style input field:

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);
document.stylesheet.add('input', { fg: 'black', bg: 'gray' });
document.stylesheet.add('input:focus', { fg: 'white', bg: 'dark_teal' });

document.create('<input id=A>').pos(10, 5).appendTo('body');
document.create('<input id=B size=20>').pos(10, 7).appendTo('body');
document.create('<input id=C>').pos(10, 9).appendTo('body');

LOOP.run(document);
```
