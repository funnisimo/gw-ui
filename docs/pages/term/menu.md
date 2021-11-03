# Text Widget

The text widget handles drawing text to the canvas. It handles word wrapping and truncating.

## Options

Here are the options available for configuring the text widget:

-   id : string - The id of the widget (used for events)
-   width : number - The number of characters to display. If the text is longer than this, it will wrap.
-   height : number - The maximum height of the widget. If the text wraps to more lines than this, it is truncated. If not supplied, the text will show all lines.
-   style : StyleOptions - Any custom style components
-   class : string | string[] - Any CSS classes to add to the widget
-   tag : string - The tag (for CSS) of the widget

## Examples

Here are some example text widgets with styling.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('text:hover', { fg: 'red' });
layer.styles.add('mi', { fg: 'black', bg: 'gray', align: 'left' });
layer.styles.add('mi:hover', { fg: 'teal' });

const menu = layer.pos(5, 5).menu({
    buttons: {
        'Button 1': 'ACTION',
        'Button 2': {
            'Sub Button 1': 'ACTION',
            'Sub Button 2': 'ACTION',
            'Sub Button 3': {
                'Sub Sub 1': 'ACTION',
                'Sub Sub 2': 'ACTION',
                'Sub Sub 3': 'ACTION',
                'Sub Sub 4': 'ACTION',
            },
            'Sub Button 4': 'ACTION',
        },
        'Button 3': 'ACTION',
        'Button 4': 'ACTION',
    },
});
const results = layer.pos(5, 3).text('Results', { fg: 'light_blue' });

menu.on('change', (name, w) => {
    results.text('Selected: ' + w.text());
});

menu.on('ACTION', (name, w, ev) => {
    menu.collapse();
    results.text('Clicked: ' + w.text());
});

layer.on('click', (name, w, e) => {
    layer.pos(e.x, e.y).text('!');
});
```

## Manual Menu Button

Here are some example text widgets with styling.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });
const layer = ui.startNewLayer();

layer.styles.add('text:hover', { fg: 'red' });

layer.styles.add('mi', { fg: 'black', bg: 'gray', align: 'left' });
layer.styles.add('mi:hover', { fg: 'teal' });
layer.styles.add('select', { bg: 'white', fg: 'black' });

const button = layer.pos(5, 4).text('Click Me ' + '\u25bc', { tag: 'select' });
layer.pos(5, 6).text('Will hide Me ');

const menu = layer
    .pos(5, 5)
    .menu({
        width: Math.max(button.bounds.width, 8),
        buttons: {
            'Button 1': 'ACTION',
            'Button 2': 'ACTION',
            'Button 3': 'ACTION',
            'Button 4': 'ACTION',
        },
    })
    .on('click', (name, w, e) => {
        console.log('menu click');
        menu.hidden = true;
    });

menu.hidden = true;

button.on('click', (name, w, e) => {
    menu.toggleProp('hidden');
});

layer.on('ACTION', (name, w, e) => {
    console.log('Click! - ' + w.text());
});

layer.pos(25, 4).select({
    text: 'Click Me too!',
    buttons: {
        'Button 1': 'ACTION',
        'Button 2': 'ACTION',
        'Button 3': 'ACTION',
        'Button 4': 'ACTION',
    },
});
```
