import * as Element from './element';
import * as Style from './style';

const MARKUP_RE = /<!--[^]*?(?=-->)-->|<(\/?)(\w*)\s*([^>]*?)(\/?)>/g;
const ATTR_RE = /(\w+)(?: *= *(?:(?:\'([^\']*)\')|(?:\"([^\"]*)\")|(\w+)))?/g;

// var kAttributePattern = /\b(id|class)\s*=\s*("([^"]+)"|'([^']+)'|(\S+))/gi;
export const selfClosingTags: Record<string, boolean> = {
    meta: true,
    img: true,
    link: true,
    input: true,
    area: true,
    br: true,
    hr: true,
};

var tagsClosedByOpening: Record<string, Record<string, boolean>> = {
    li: { li: true },
    p: { p: true, div: true },
    td: { td: true, th: true },
    th: { td: true, th: true },
};
var tagsClosedByClosing: Record<string, Record<string, boolean>> = {
    li: { ul: true, ol: true },
    a: { div: true },
    b: { div: true },
    i: { div: true },
    p: { div: true },
    td: { tr: true, table: true },
    th: { tr: true, table: true },
};

export type MakeElementFn = (
    tag: string,
    sheet?: Style.Sheet
) => Element.Element;
export const elements: Record<string, MakeElementFn> = {};

export interface ElementInstallOptions {
    selfClosing?: boolean;
    openCloses?: string[];
    closeCloses?: string[];
}

export function configureElement(
    tag: string,
    opts: ElementInstallOptions = {}
) {
    if (opts.selfClosing) {
        selfClosingTags[tag] = true;
    }
    if (opts.openCloses && opts.openCloses.length) {
        const tcbo = (tagsClosedByOpening[tag] = {} as Record<string, boolean>);
        opts.openCloses.forEach((t) => (tcbo[t] = true));
    }
    if (opts.closeCloses && opts.closeCloses.length) {
        const tcbc = (tagsClosedByClosing[tag] = {} as Record<string, boolean>);
        opts.closeCloses.forEach((t) => (tcbc[t] = true));
    }
}

export function installElement(
    tag: string,
    fn: MakeElementFn,
    opts: ElementInstallOptions = {}
) {
    elements[tag] = fn;
    configureElement(tag, opts);
}

function createElement(
    tag: string,
    rawAttr?: string,
    stylesheet?: Style.Sheet
): Element.Element {
    const fn = elements[tag];
    const e = fn ? fn(tag, stylesheet) : new Element.Element(tag, stylesheet);
    // TODO - Add attributs, properties, and styles

    if (rawAttr) {
        // console.log(tag, rawAttr);
        const re = new RegExp(ATTR_RE, 'g');

        let match = re.exec(rawAttr);
        while (match) {
            const name = match[1];
            const value = match[2] || match[3] || match[4] || true;
            // console.log('- attr', name, value);
            if (value === true) {
                e.prop(name, value);
            } else {
                e.attr(name, value);
            }
            match = re.exec(rawAttr);
        }
    }
    return e;
}

// // TODO - Look at htmlparser2
// export function makeElement(
//     tag: string,
//     stylesheet?: Style.Sheet
// ): Element.Element {
//     if (tag.startsWith('<')) {
//         if (!tag.endsWith('>'))
//             throw new Error('Need brackets around new tag - e.g. "<tag>"');
//     }

//     const tagRE = /<(\w+)/g;
//     const fieldRE =
//         /(\w+)(?: *= *(?:(?:\'([^\']*)\')|(?:\"([^\"]*)\")|(\w+)))?/g;
//     const endRE = / *>/g;
//     const textRE = />(.+?)(?=(<\/|$))/g;

//     const parts: Record<string, string | boolean> = {};
//     const tag_re = new RegExp(tagRE, 'g');
//     const field_re = new RegExp(fieldRE, 'g');
//     const end_re = new RegExp(endRE, 'g');
//     const text_re = new RegExp(textRE, 'g');

//     // console.log('PARSE', tag);

//     let match = tag_re.exec(tag);
//     if (!match) {
//         parts.tag = 'div';
//     } else {
//         parts.tag = match[1];
//         if (tag[tag_re.lastIndex] === ' ') {
//             field_re.lastIndex = tag_re.lastIndex;
//             match = field_re.exec(tag);
//             while (match) {
//                 // console.log(match);
//                 parts[match[1]] = match[2] || match[3] || match[4] || true;

//                 text_re.lastIndex = field_re.lastIndex;
//                 end_re.lastIndex = field_re.lastIndex;
//                 const endMatch = end_re.exec(tag);
//                 if (endMatch && endMatch.index === field_re.lastIndex) {
//                     break;
//                 }
//                 match = field_re.exec(tag);
//             }
//         } else {
//             text_re.lastIndex = tag_re.lastIndex;
//         }
//         const tm = text_re.exec(tag);
//         // console.log(tm);
//         if (tm) {
//             parts.text = tm[1];
//         }
//         // console.log(parts);
//     }

//     const e = createElement(parts.tag, '', stylesheet);

//     Object.entries(parts).forEach(([key, value]) => {
//         if (key === 'tag') return;
//         else if (key === 'text') {
//             e.text(value as string);
//         } else if (key === 'id') {
//             e.attr('id', value as string);
//         } else if (key === 'style') {
//             const style = value as string;
//             // console.log('style=', style);
//             style.split(';').forEach((s) => {
//                 const parts = s.split('=').map((p) => p.trim());
//                 parts.forEach((p) => {
//                     const [k, v] = p.split(':').map((t) => t.trim());
//                     // console.log(' - ', k, v);
//                     if (k && v) {
//                         e.style(k as keyof Style.StyleOptions, v);
//                     }
//                 });
//             });
//         } else if (typeof value === 'string') {
//             e.attr(key, value);
//         } else {
//             e.prop(key, value as boolean);
//         }
//     });

//     return e;
// }

interface MyOptions {
    lowerCaseTagName?: boolean;
    stylesheet?: Style.Sheet;
}

function back(arr: any[]): any {
    return arr[arr.length - 1];
}

/**
 * Parse a chuck of HTML source.
 * @param  {string} data      html
 * @return {HTMLElement}      root element
 */
export function parse(
    data: string,
    options: MyOptions | Style.Sheet = {}
): Element.Element {
    if (options instanceof Style.Sheet) {
        options = { stylesheet: options };
    }
    var root = createElement('dummy', '', options.stylesheet);
    var currentElement = root;
    var stack = [root];
    var lastTextPos = -1;

    options = options || {};
    const RE = new RegExp(MARKUP_RE, 'gi');

    var match, text;
    match = RE.exec(data);
    while (match) {
        if (lastTextPos > -1) {
            if (lastTextPos + match[0].length < RE.lastIndex) {
                // if has content
                text = data.substring(
                    lastTextPos,
                    RE.lastIndex - match[0].length
                );
                currentElement.text(text); //.appendNode(new TextNode(text));
            }
        }
        lastTextPos = RE.lastIndex;
        if (match[0][1] == '!') {
            // this is a comment
            continue;
        }
        if (options.lowerCaseTagName) match[2] = match[2].toLowerCase();
        if (!match[1]) {
            // not </ tags
            // var attrs: Record<string, string> = {};
            // var attMatch;
            // attMatch = kAttributePattern.exec(match[3]);
            // while (attMatch) {
            //     attrs[attMatch[1]] = attMatch[3] || attMatch[4] || attMatch[5];
            //     attMatch = kAttributePattern.exec(match[3]);
            // }
            // console.log(attrs);
            if (!match[4] && tagsClosedByOpening[currentElement.tag]) {
                if (tagsClosedByOpening[currentElement.tag][match[2]]) {
                    stack.pop();
                    currentElement = back(stack);
                }
            }
            const child = createElement(match[2], match[3], options.stylesheet);
            stack.push(child);
            currentElement.appendChild(child);
            currentElement = child;
            // if (kBlockTextElements[match[2]]) {
            //   // a little test to find next </script> or </style> ...
            //   var closeMarkup = '</' + match[2] + '>';
            //   var index = data.indexOf(closeMarkup, kMarkupPattern.lastIndex);
            //   if (options[match[2]]) {
            //     if (index == -1) {
            //       // there is no matching ending for the text element.
            //       text = data.substr(kMarkupPattern.lastIndex);
            //     } else {
            //       text = data.substring(kMarkupPattern.lastIndex, index);
            //     }
            //     if (text.length > 0)
            //       currentParent.appendChild(new TextNode(text));
            //   }
            //   if (index == -1) {
            //     lastTextPos = kMarkupPattern.lastIndex = data.length + 1;
            //   } else {
            //     lastTextPos = kMarkupPattern.lastIndex = index + closeMarkup.length;
            //     match[1] = true;
            //   }
            // }
        }
        if (match[1] || match[4] || selfClosingTags[match[2]]) {
            // </ or /> or <br> etc.
            while (true) {
                if (currentElement.tag == match[2]) {
                    stack.pop();
                    currentElement = back(stack);
                    break;
                } else {
                    // Trying to close current tag, and move on
                    if (tagsClosedByClosing[currentElement.tag]) {
                        if (tagsClosedByClosing[currentElement.tag][match[2]]) {
                            stack.pop();
                            currentElement = back(stack);
                            continue;
                        }
                    }
                    // Use aggressive strategy to handle unmatching markups.
                    break;
                }
            }
        }
        match = RE.exec(data);
    }

    // in case you forget closing tag on something like : "<div>text"
    if (lastTextPos > -1) {
        if (lastTextPos < data.length) {
            // if has content
            text = data.substring(lastTextPos);
            currentElement.text(text); //.appendNode(new TextNode(text));
        }
    }

    const e = root.children[0]; // real root
    e.parent = null;
    return e;
}

// let t = parse('<div name="test" checked id=A>Test</div>');
// console.log(t);