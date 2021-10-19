# HTML CheckBox

Here is an example of an HTML style checkbox field. Notice that it is a <checkbox> element and not <input type=checkbox>.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('checkbox:hover', { fg: 'teal' });
document.stylesheet.add('checkbox:focus', { fg: 'dark_teal' });

const t = document
    .create('<div>')
    .pos(10, 3)
    .text('events')
    .style('fg', 'red')
    .appendTo('body');

document
    .create('<checkbox id=A value=custom>This is a checkbox.</checkbox>')
    .pos(10, 5)
    .on('input', (d, l, e) => {
        t.text('input = ' + e.key);
    })
    .on('change', (d, l) => {
        if (l.prop('checked')) {
            t.text('change = ' + l.val());
        } else {
            t.text('change = unchecked');
        }
    })
    .appendTo('body');

document
    .create(
        '<checkbox id=B check=A uncheck=B checked>This is another checkbox.</checkbox>'
    )
    .pos(10, 7)
    .appendTo('body');

LOOP.run(document);
```
