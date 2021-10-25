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

term.styles.add('.fun', { fg: 'dark_green' });
term.styles.add('.fun:hover', { fg: 'dark_red' });

term.pos(2, 1).text('This is the most basic text widget.');

term.pos(2, 3).text(
    'This one will wrap the text at the given width.  It will use the GWU.text.splitIntoLines funciton to do this.',
    { width: 25 }
);

term.pos(2, 9).text('This one has some stylying and ΩredΩcolored text∆!', {
    style: { fg: 'light_teal', bg: 'dark_gray', valign: 'bottom' },
    height: 3,
});

term.pos(2, 13).text(
    'This one is styled with a class.  This allows it to have hover effects.',
    { class: 'fun' }
);

LOOP.run(term);
```
