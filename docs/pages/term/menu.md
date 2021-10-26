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

const term = new GWI.term.Term(ui);

term.styles.add('mi', { fg: 'black', bg: 'gray', align: 'left' });
term.styles.add('mi:hover', { fg: 'teal' });

term.pos(5, 5).menu({
    buttons: {
        'Button 1': 'ACTION',
        'Button 2': 'ACTION',
        'Button 3': 'ACTION',
        'Button 4': 'ACTION',
    },
});

const results = term.pos(25, 5).text('', { style: { fg: 'light_blue' } });

term.on('ACTION', (name, w, ev) => {
    results.text('Clicked: ' + w.text());
});

term.on('click', (name, w, e) => {
    term.pos(e.x, e.y).text('!');
});

LOOP.run(term);
```

## Manual Menu Button

Here are some example text widgets with styling.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.styles.add('mi', { fg: 'black', bg: 'gray', align: 'left' });
term.styles.add('mi:hover', { fg: 'teal' });

const menu = term.pos(5, 5).menu({
    buttons: {
        'Button 1': 'ACTION',
        'Button 2': 'ACTION',
        'Button 3': 'ACTION',
        'Button 4': 'ACTION',
    },
});

term.on('click', (name, w, e) => {
    menu.toggleProp('hidden');
});

LOOP.run(term);
```
