# HTML-ish

The UI library gives you some HTML-ish ways to draw and interact with the canvas.

## Basics

Here we add various text elements and adjust their styling.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.body.style('bg', 'dark_gray');
document.create('<div>').text('Testing').appendTo('body');
document
    .create('<div>')
    .text('Another Text')
    .style('fg', 'red')
    .appendTo('body');
document.create('<div>').text('Third Text').style('bg', -1).appendTo('body');

document
    .create('<div>')
    .text('You can apply multiple styles at once.')
    .style({ bg: 'white', fg: 'blue', width: 50 })
    .appendTo('body');

document
    .create('<div>')
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
    .appendTo('body');

document.draw();
```

## Using Classes

Just like HTML, we can add styles using classes and rules to simplify the management of the styling.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('div', { fg: 'green', bg: 'dark_gray' });
document.stylesheet.add('.narrow', { width: 30 });
document.stylesheet.add('.pad', { padding: 1 });
document.stylesheet.add('.right-justify', { align: 'right' });
document.stylesheet.add('body', { bg: 'darkest_red', padding: 1 });

document.create('<div>').text('Testing').appendTo('body');
document
    .create('<div>')
    .text('You can override rules locally.')
    .style('bg', 'black')
    .appendTo('body');

document
    .create('<div>')
    .text('You can apply classes.')
    .addClass('narrow')
    .appendTo('body');

document
    .create('<div>')
    .text(
        'You can add longer text to the elements and they will handle wrapping the text based on the calculated/supplied with.  You can also add padding and align the text horizontally!'
    )
    .addClass('pad right-justify')
    .style('width', 60)
    .appendTo('body');

document.draw();
```
