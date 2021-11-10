// import * as GWU from 'gw-utils';
// import { UILayer } from '../types';
// import * as Widget from '../widget';

// // Menu has buttons that are either dropdowns or actions.
// // Dropdowns are keys with an object of other buttons.
// // actions are keys with a string of the action name.

// interface Rec<T> {
//     [keys: string]: T;
// }
// type DropdownConfig = Rec<ButtonConfig>;
// type ActionConfig = string;
// type ButtonConfig = ActionConfig | DropdownConfig;

// export class MenuButton {
//     text: string;
//     hovered = false;
//     x = 999;

//     constructor(text: string) {
//         this.text = text;
//     }

//     get width() {
//         return this.text.length;
//     }
// }

// export class ActionButton extends MenuButton {
//     action: string;

//     constructor(text: string, action: string) {
//         super(text);
//         this.action = action;
//     }
// }

// export class DropDownButton extends MenuButton {
//     bounds: GWU.xy.Bounds;
//     buttons: MenuButton[] = [];
//     menu: Menu;
//     parent: DropDownButton | null = null;

//     constructor(
//         menu: Menu,
//         parent: DropDownButton | null,
//         text: string,
//         buttons: ButtonConfig
//     ) {
//         super(text);
//         this.menu = menu;
//         this.parent = parent;
//         this.text = text;

//         this.bounds = new GWU.xy.Bounds(0, 0, 0, 0);
//         Object.entries(buttons).forEach(([text, opts]) => {
//             this.addButton(text, opts);
//         });
//     }

//     addButton(text: string, config: ButtonConfig) {
//         // if (this.buttons.length >= this.menu.bounds.height - 1) {
//         //     throw new Error('Too many menu options.');
//         // }
//         let button: MenuButton;
//         if (typeof config === 'string') {
//             button = new ActionButton(text, config);
//         } else {
//             button = new DropDownButton(this.menu, this, text, config);
//         }
//         this.buttons.push(button);

//         ++this.bounds.height;
//         this.bounds.width = Math.max(this.bounds.width, text.length + 2);
//     }

//     setBounds(
//         buffer: GWU.buffer.Buffer,
//         px: number,
//         py: number,
//         pw: number
//     ) {
//         // vertical reveal
//         const right = px + pw;
//         const totalWidth = buffer.width;
//         if (this.bounds.width < totalWidth - right) {
//             this.bounds.x = right;
//         } else if (this.bounds.width < px) {
//             this.bounds.x = px - this.bounds.width;
//         } else {
//             throw new Error('Menu does not fit - too wide.');
//         }

//         const totalHeight = buffer.height;
//         if (this.bounds.height <= totalHeight - py) {
//             this.bounds.y = py;
//         } else if (this.bounds.height < totalHeight) {
//             this.bounds.y = totalHeight - this.bounds.height - 1;
//         } else {
//             throw new Error('Menu does not fit - too tall.');
//         }

//         // this.buttons.forEach((b) => {
//         //     if (b instanceof DropDownButton) {
//         //         b.setBounds(buffer);
//         //     }
//         // });
//     }

//     contains(e: GWU.io.Event) {
//         return this.bounds.contains(e);
//     }

//     buttonAt(e: GWU.io.Event): MenuButton | null {
//         const index = e.y - this.bounds.y;
//         return this.buttons[index] || null;
//     }

//     draw(buffer: GWU.buffer.Buffer) {
//         const width = this.bounds.width;
//         const height = this.bounds.height;
//         const x = this.bounds.x;
//         let y = this.bounds.y;

//         buffer.fillRect(x, y, width, height, 0, 0, this.menu.dropBg);

//         // Now draw the individual buttons...
//         this.buttons.forEach((b) => {
//             buffer.drawText(
//                 x + 1,
//                 y,
//                 b.text,
//                 this.menu._used.fg,
//                 this.menu._used.bg
//             );
//             ++y;
//         });

//         if (this.parent) {
//             this.parent.draw(buffer);
//         }
//     }
// }

// export async function showDropDown(
//     dialog: UILayer,
//     menu: Menu,
//     button: DropDownButton
// ) {
//     // Start dialog
//     const ui = dialog.ui;
//     const buffer = ui.startLayer();

//     button.buttons.forEach((b) => (b.hovered = false));
//     // button.buttons[0].hovered = true;

//     let activeButton: DropDownButton | null = button;
//     await ui.loop.run({
//         Escape() {
//             return true;
//         },

//         // TODO - Tab
//         Tab() {
//             menu.activeIndex = (menu.activeIndex + 1) % menu.buttons.length;

//             const button = menu.buttons[menu.activeIndex];
//             if (button) {
//                 button.hovered = true;
//             }
//             if (activeButton && button instanceof DropDownButton) {
//                 activeButton.hovered = false;
//                 activeButton = button;
//             } else {
//                 activeButton = null; // done.
//             }

//             dialog.needsDraw = true;
//             return !activeButton;
//         },
//         // TODO - TAB
//         TAB() {
//             menu.activeIndex =
//                 (menu.buttons.length + menu.activeIndex - 1) %
//                 menu.buttons.length;

//             const button = menu.buttons[menu.activeIndex];
//             if (button) {
//                 button.hovered = true;
//             }
//             if (activeButton && button instanceof DropDownButton) {
//                 activeButton.hovered = false;
//                 activeButton = button;
//             } else {
//                 activeButton = null; // done.
//             }
//             dialog.needsDraw = true;
//             return !activeButton;
//         },

//         mousemove: (e: GWU.io.Event) => {
//             if (!activeButton) return true; // we are done (should not happen)

//             let newActive: DropDownButton | null = activeButton;
//             while (newActive && !newActive.contains(e)) {
//                 newActive = newActive.parent;
//             }
//             if (newActive) {
//                 activeButton = newActive;
//                 const selected = activeButton.buttonAt(e);
//                 if (selected) {
//                     activeButton.buttons.forEach((b) => {
//                         b.hovered = false;
//                     });

//                     selected.hovered = true;
//                     if (selected instanceof DropDownButton) {
//                         selected.buttons.forEach((b) => {
//                             b.hovered = false;
//                         });
//                         selected.buttons[0].hovered = true;

//                         selected.setBounds(
//                             ui.buffer,
//                             activeButton.bounds.x,
//                             e.y,
//                             activeButton.bounds.width
//                         );
//                         activeButton = selected;
//                     }
//                 }
//             } else {
//                 if (menu.contains(e)) {
//                     if (dialog) dialog.requestRedraw();
//                     const button = menu.getButtonAt(e.x, e.y);
//                     if (button) {
//                         button.hovered = true;
//                         menu.activeIndex = menu.buttons.indexOf(button);
//                     }
//                     if (button instanceof DropDownButton) {
//                         activeButton.hovered = false;
//                         activeButton = button;
//                     } else {
//                         activeButton = null; // done.
//                     }
//                     if (dialog) dialog.requestRedraw();
//                 }
//             }

//             return !activeButton; // if no active button we are done (should not happen)
//         },

//         click: async (e: GWU.io.Event) => {
//             if (!activeButton) return true; // we are done (should not happen)

//             if (!activeButton.contains(e)) {
//                 menu.clearHighlight();
//                 return true; // we are done
//             }

//             const actionButton = activeButton.buttonAt(e);
//             if (!actionButton) {
//                 return true; // weird, but we are done.
//             }

//             if (actionButton instanceof ActionButton) {
//                 menu.actionButton = actionButton;
//                 await dialog.fireAction(actionButton.action, menu);
//                 return true;
//             }

//             return false;
//         },

//         dir: async (e: GWU.io.Event) => {
//             if (!activeButton) return true; // should not happen
//             if (!e.dir) return;
//             if (e.dir[1]) {
//                 const current = activeButton.buttons.findIndex(
//                     (b) => b.hovered
//                 );

//                 if (current < 1 && e.dir[1] < 0) {
//                     activeButton.buttons.forEach((b) => (b.hovered = false));
//                     return true; // close me!
//                 }

//                 const index = GWU.clamp(
//                     current + e.dir[1],
//                     0,
//                     activeButton.buttons.length - 1
//                 );
//                 activeButton.buttons.forEach(
//                     (b, i) => (b.hovered = i === index)
//                 );

//                 const selected = activeButton.buttons[index];
//                 if (selected instanceof DropDownButton) {
//                     selected.buttons.forEach((b) => {
//                         b.hovered = false;
//                     });
//                     selected.buttons[0].hovered = true;

//                     selected.setBounds(
//                         ui.buffer,
//                         activeButton.bounds.x,
//                         e.y,
//                         activeButton.bounds.width
//                     );
//                     activeButton = selected;
//                 }
//             }
//         },

//         draw: () => {
//             if (!activeButton) return;
//             ui.copyUIBuffer(buffer);
//             activeButton.draw(buffer);
//             menu.draw(buffer);
//             buffer.render();
//         },
//     });

//     ui.finishLayer();
//     menu.clearHighlight();
// }

// export interface MenuOptions extends Widget.WidgetOptions {
//     separator?: string;
//     lead?: string;

//     dropFg?: GWU.color.ColorBase;
//     dropBg?: GWU.color.ColorBase;

//     buttons: ButtonConfig;
// }

// export class Menu extends Widget.Widget {
//     buttons!: MenuButton[];

//     separator!: string;
//     lead!: string;

//     dropFg!: GWU.color.Color;
//     dropBg!: GWU.color.Color;

//     activeIndex = -1;
//     actionButton: ActionButton | null = null;

//     constructor(id: string, opts?: MenuOptions) {
//         super(id, opts);
//     }

//     init(opts: MenuOptions) {
//         opts.fg = GWU.first(opts.fg, 'black');
//         opts.bg = GWU.first(opts.bg, 'light_gray');
//         opts.height = opts.height || 1;

//         opts.tabStop = GWU.first(opts.tabStop, true);

//         super.init(opts);

//         this.dropFg = GWU.color.from(opts.dropFg || this.fg);
//         this.dropBg = GWU.color.from(opts.dropBg || this.bg);

//         this.buttons = [];
//         this.separator = opts.separator || ' | ';
//         this.lead = opts.lead || ' ';

//         Object.entries(opts.buttons).forEach(([text, opts]) => {
//             this._addButton(text, opts);
//         });

//         if (opts.separator) {
//             this.separator = opts.separator;
//         }
//         if (opts.lead !== undefined) {
//             this.lead = opts.lead ? opts.lead : '';
//         }
//     }

//     reset() {
//         super.reset();
//         const onTop = this.bounds.y <= 10;
//         this.buttons.forEach((b) => {
//             if (b instanceof DropDownButton) {
//                 if (onTop) {
//                     b.bounds.top = this.bounds.bottom + 1;
//                 } else {
//                     b.bounds.bottom = this.bounds.top - 1;
//                 }
//             }
//         });
//     }

//     activate(reverse = false) {
//         super.activate(reverse);
//         if (this.activeIndex < 0)
//             this.activeIndex = reverse ? this.buttons.length - 1 : 0;
//     }

//     deactivate() {
//         super.deactivate();
//         this.activeIndex = -1;
//     }

//     mousemove(e: GWU.io.Event, dialog: Widget.WidgetRunner): boolean {
//         // turn off all the hovers
//         this.buttons.forEach((b: MenuButton) => {
//             if (b.hovered) {
//                 b.hovered = false;
//             }
//         });

//         if (!super.mousemove(e, dialog)) return false;

//         // highlight one of them...
//         if (this.bounds.contains(e)) {
//             let hovered: MenuButton | null = null;
//             this.buttons.forEach((b) => {
//                 b.hovered = false;
//                 if (b.x < e.x) {
//                     hovered = b;
//                 }
//             });

//             if (hovered) {
//                 // @ts-ignore
//                 hovered.hovered = true;
//                 this.activeIndex = this.buttons.indexOf(hovered);
//             }
//             if (dialog) dialog.requestRedraw();
//             return true; // we handled the message
//         }

//         return false;
//     }

//     clearHighlight() {
//         this.buttons.forEach((b) => {
//             b.hovered = false;
//         });
//     }

//     getButtonAt(x: number, _y: number): MenuButton | null {
//         return GWU.arrayFindRight(this.buttons, (b) => b.x < x) || null;
//     }

//     async click(
//         e: GWU.io.Event,
//         dialog: Widget.WidgetRunner
//     ): Promise<boolean> {
//         if (this.bounds.contains(e)) {
//             // get active button
//             let activeButton = this.getButtonAt(e.x, e.y);
//             if (!activeButton) return false;

//             this.activeIndex = this.buttons.indexOf(activeButton);

//             if (activeButton instanceof DropDownButton) {
//                 await showDropDown(dialog, this, activeButton);
//             } else if (activeButton instanceof ActionButton) {
//                 this.actionButton = activeButton;
//                 await dialog.fireAction(activeButton.action, this);
//             }

//             return true;
//         }
//         return false;
//     }

//     async keypress(
//         e: GWU.io.Event,
//         dialog: Widget.WidgetRunner
//     ): Promise<boolean> {
//         if (this.active) {
//             if (e.key === 'Tab') {
//                 ++this.activeIndex;
//                 if (this.activeIndex >= this.buttons.length) {
//                     this.deactivate();
//                     return false; // tabbing away from me, need to process in dialog
//                 }
//                 return true;
//             } else if (e.key === 'TAB') {
//                 --this.activeIndex;
//                 if (this.activeIndex < 0) {
//                     this.deactivate();
//                     return false; // shift tabbing away from me, need to process in dialog
//                 }
//                 return true;
//             } else if (e.key === 'Enter') {
//                 const activeButton = this.buttons[this.activeIndex];
//                 if (activeButton instanceof DropDownButton) {
//                     await showDropDown(dialog, this, activeButton);
//                 } else if (activeButton instanceof ActionButton) {
//                     this.actionButton = activeButton;
//                     await dialog.fireAction(activeButton.action, this);
//                 }
//                 return true;
//             }
//         }
//         return super.keypress(e, dialog);
//     }

//     protected _addButton(text: string, config: ButtonConfig) {
//         const x = this.buttons.reduce(
//             (len, button) => len + button.text.length + this.separator.length,
//             this.lead.length + this.bounds.x
//         );
//         if (x + text.length + this.separator.length > this.bounds.width) {
//             throw new Error('Button makes menu too wide :' + text);
//         }

//         let button: MenuButton;
//         if (typeof config === 'string') {
//             button = new ActionButton(text, config);
//         } else {
//             const dropdown = new DropDownButton(this, null, text, config);
//             dropdown.bounds.x = x - 1; // Hmmm...
//             button = dropdown;
//         }
//         button.x = x;
//         this.buttons.push(button);
//     }

//     draw(buffer: GWU.buffer.Buffer): boolean {
//         const bg = this.active ? this.activeBg : this.bg;
//         const fg = this.active ? this.activeFg : this.fg;

//         buffer.fillRect(
//             this.bounds.x,
//             this.bounds.y,
//             this.bounds.width,
//             1,
//             0,
//             bg,
//             bg
//         );

//         let x = this.bounds.x;
//         const y = this.bounds.y;
//         buffer.drawText(x, y, this.lead, fg);

//         this.buttons.forEach((b, i) => {
//             const hovered = i === this.activeIndex;
//             const color = hovered ? this.hoverFg : fg;
//             const bgColor = hovered ? this.hoverBg : bg;
//             buffer.drawText(b.x, y, b.text, color, bgColor);
//             x = b.x + b.text.length;
//             buffer.drawText(x, y, this.separator, fg);
//         });

//         return true;
//     }
// }
