# HTML-ish

The UI library gives you some HTML-ish ways to draw and interact with the canvas.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const layer = new GWI.html.Layer(ui);

layer.root.style('bg', 'dark_gray');
layer.$('<text>').text('Testing').appendTo('layer');
layer.$('<text>').text('Another Text').style('fg', 'red').appendTo('layer');
layer.$('<text>').text('Third Text').style('bg', -1).appendTo('layer');

layer
    .$('<text>')
    .text('You can apply multiple styles at once.')
    .style({ bg: 'white', fg: 'blue', width: 50 })
    .appendTo('layer');

layer
    .$('<text>')
    .text(
        'You can add longer text to the elements and they will handle wrapping the text based on the calculated/supplied with.  You can also add padding and align the text horizontally!'
    )
    .style({
        bg: 'light_gray',
        fg: 'teal',
        width: 30,
        padding: 1,
        align: 'right',
    })
    .appendTo('layer');

layer.draw();
```
