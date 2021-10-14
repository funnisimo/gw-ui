# HTML Positioning

THe UI library allows element positioning similar to HTML.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document
    .create('<div>')
    .text('1st Element - 1st Line - Static')
    .appendTo('body');

document
    .create('<div>')
    .text('2nd Element - Fixed')
    .style({
        position: 'fixed',
        left: 5,
        top: 7,
        bg: 'red',
        fg: 'white',
        padding: 1,
    })
    .appendTo('body');

document
    .create('<div>')
    .text('3rd Element - 2nd Line - Static')
    .appendTo('body');

document
    .create('<div>')
    .text(
        '4th Element - absolute - but parent is body so it acts just like fixed'
    )
    .pos(8, 11, 'absolute')
    .style({ fg: 'blue', bg: 'white', padding: 1 })
    .appendTo('body');

document
    .create('<div>')
    .text('5th Element - 3rd line - Static')
    .appendTo('body');

document
    .create('<div>')
    .text(
        '6th Element - Relative - Starts on 4th line, but is moved.  Still takes up space there.'
    )
    .pos(11, 5, 'relative')
    .style({ fg: 'green', bg: 'gray', padding: 1 })
    .appendTo('body');

document
    .create('<div>')
    .text(
        '7th Element - 7th line - Static (3 above are from 6th element + padding)'
    )
    .appendTo('body');

document.draw();
```
