# Tables

Tables are fancy grids that can be styled and dynamically filled.

## Configuring a Table Widget

Here is a look at the table options that are available:

### id : string

The id of the table.

### tag : string

The tag to put on the table. Useful for css styling.

### header : boolean

If set, the table will draw headers for each column. If a column does not have a header set in its options, then the header will be empty.

### headerTag : string

The tag to use for header cells - default: th

### dataTag : string

The tag to use for data cells - default: td

### prefix : 'letter' | 'number' | 'none'

Which prefix (if any) to prepend to the first column.

-   letter : puts a lower case letter (e.g. "a) ")
-   number : puts a number (e.g. "1) ")
-   none : no prefix, this is the default.

The prefix is part of the first column for border purposes.

### height : number

If set, the table will take up exactly this many rows (including border, if any). If it has more data than that, then it enters paging/scrolling mode automatically (unless turned off).

If not set, the table will grow until it either shows all of its data or hits the bottom of the display.

### rowHeight : number

If set, each row in the table will have this height. Defaults to 1.

### select : 'row' | 'column' | 'cell' | 'none'

What to select within the table. Valid values are: row, column, cell (default), and none.

This is also what will be highlighted when the mouse hovers over the table.

### border : 'ascii' | 'fill' | 'none'

What type of border to draw around the cells. The border will be drawn in the table `fg` color.

### columns : (ColumnOptions | string)[]

**NOTE:** If a string is provided for the column options, then that string is the format.

You configure table widgets by columns. Each column is configured using the following options:

-   header : The text of the header (if any) that the table will show
-   headerClass : Any additional classes that the header should have
-   format : The template to use for extracting the value from the data object. If not present, it will default as shown in the **data** section.
-   dataClass : Additional classes (if any) to add to the data cells (it will automatically get "data")
-   width : The width of the column (if not set, the table widget will try to set it)

### data: value[] | value[][] | object[]

Table data can have a few formats:

-   **value[]** : A value (string | number) array will result in the first column showing the value and all other columns showing the empty default.
-   **value[][]** : An array of arrays of values will show each value as the text of the appropriate cell.
-   **Object[]** : An array of objects will use the column formatter to extract a value from the object and will display that value. If no formatter is on a column, it will call the object's toString() method and will display that.

The table widget will not automatically redraw itself if the underlying data changes after it is set. This means that anytime you change the data object and want to redraw the table, you must either set the table's data again or set the `needsDraw` field on the widget.

## Example - List

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.styles.add('td', { bg: 'blue', align: 'center' });
term.styles.add('th', { bg: 'white', fg: 'blue', align: 'center' });

term.pos(5, 5).table({
    header: true,
    columns: [{ header: 'Name', width: 10 }],
    data: ['Sam', 'Jerome', 'Marsha', 'Natasha'],
});

term.render();
```

## Example - Multiple Columns

```js
const canvas = GWU.canvas.make(100, 38, { loop: LOOP });
SHOW(canvas.node);

const ui = new GWI.UI({ canvas, loop: LOOP });

const term = new GWI.term.Term(ui);

term.styles.add('.center', { align: 'center' });
term.styles.add('th', { bg: 'white', fg: 'blue' });
term.styles.add('td', { bg: 'blue' });
term.styles.add('td:hover', { bg: 'green', fg: 'black' });

const data = [
    ['Sam', 42],
    ['Jerome', 17],
    ['Marsha', 34],
    ['Natasha', 78],
];

term.pos(5, 5).table({
    header: true,
    select: 'row',
    border: 'ascii',
    style: { bg: 'dark_red', fg: 'red' },
    height: 6,
    columns: [
        { header: 'Name', width: 10 },
        {
            header: 'Age',
            width: 10,
            headerClass: 'center',
            dataClass: 'center',
        },
    ],
    data,
});

LOOP.run(term);
```
