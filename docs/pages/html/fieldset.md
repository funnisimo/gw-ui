# HTML FieldSet

FieldSets allow you to group things.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

const f = document
    .create('<fieldset id=F legend=Tacos>')
    .style('width', 30)
    .style('align', 'center')
    .style('fg', 'yellow')
    .appendTo('body');

f.append('<checkbox>Option 1</div>');
f.append('<checkbox>Option 2</div>');
f.append('<checkbox>Option 3</div>');
f.append('<checkbox>Option 4</div>');

LOOP.run(document);
```
