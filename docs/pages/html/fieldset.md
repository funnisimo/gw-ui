# HTML FieldSet

FieldSets allow you to group things.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('field', { fg: 'light_blue' });
layer.styles.add('fieldset', { fg: 'green' });
layer.styles.add('legend', { fg: 'gold' });
layer.styles.add('label', { fg: 'pink' });

const f = layer
    .fieldset({
        x: 5,
        y: 4,
        width: 20,
        dataWidth: 10,
        legend: 'FIELDSET',
    })
    .add('Name', '§name%10s§')
    .add('Age', '§age%10d§')
    .add('Score', '§score%10d§');

f.data({ name: 'Malcolm', age: 35, score: 98 });

const g = layer
    .fieldset({
        x: 5,
        y: 10,
        width: 20,
        dataWidth: 10,
        legend: 'FIELDSET',
        legendAlign: 'center',
        border: 'ascii',
    })
    .add('Name', '§name%10s§')
    .add('Age', '§age%10d§')
    .add('Score', '§score%10d§');

g.data({ name: 'Malcolm', age: 35, score: 98 });
```
