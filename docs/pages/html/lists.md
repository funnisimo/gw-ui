# HTML Lists

You can easily make basic lists.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('li', { bg: -1, fg: 0xeef });

const list = document
    .create('<list>')
    .pos(10, 5)
    .style('width', 30)
    .style('bg', 'gray')
    .style('padding', 1)
    .appendTo('body');

list.append('<li>Item 1</li>');
list.append('<li>Item 2</li>');
list.append('<li>Item 3</li>');
list.append('<li>Item 4</li>');

LOOP.run(document);
```

## Unordered Lists

Unordered lists add bullets to the list items.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('li', { bg: -1, fg: 'dark_green' });

const list = document
    .create('<ul>')
    .pos(10, 5)
    .style('width', 30)
    .style('bg', 'gray')
    .style('padding', 1)
    .appendTo('body');

list.append('<li>Item 1</li>');
list.append('<li>Item 2</li>');
list.append('<li>Item 3</li>');
list.append('<li>Item 4</li>');

LOOP.run(document);
```

## Ordered Lists

Ordered lists add a number to the list items.

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const document = new GWI.html.Document(ui);

document.stylesheet.add('li', { bg: -1, fg: 0xeef });

const list = document
    .create('<ol>')
    .pos(10, 5)
    .style('width', 30)
    .style('bg', 'gray')
    .style('padding', 1)
    .appendTo('body');

list.append('<li>Item 1</li>');
list.append('<li>Item 2</li>');
list.append('<li>Item 3</li>');
list.append('<li>Item 4</li>');

LOOP.run(document);
```
