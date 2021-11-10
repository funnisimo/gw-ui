class FireWidget extends GWI.Widget {
    constructor(layer, opts = {}) {
        super(
            layer,
            (() => {
                opts.tag = opts.tag || 'fire';
                opts.width = opts.width || 7;
                opts.height = opts.height || 5;
                if (opts.y) {
                    opts.y = opts.y - opts.height;
                } else {
                    opts.y = opts.height;
                }
                return opts;
            })()
        );
        this.data = GWU.grid.make(this.bounds.width, this.bounds.height);
        this.decay = 1 - 1 / this.bounds.height;

        layer.setTimeout(this._tick.bind(this), 300);
    }

    _tick(dt) {
        this.data.update((v) => Math.floor(v * this.decay));

        for (let x = 0; x < this.data.width; ++x) {
            for (let y = 0; y < this.data.height; ++y) {
                let val = 0;
                val += Math.floor(0.4 * this.data.get(x - 1, y + 1) || 0);
                val += Math.floor(0.2 * this.data.get(x, y + 1) || 0);
                val += Math.floor(0.4 * this.data.get(x + 1, y + 1) || 0);
                this.data.set(x, y, val);
            }
        }

        for (let i = 0; i < this.bounds.width; ++i) {
            this.data[i][this.bounds.height - 1] =
                50 + GWU.rng.random.number(50);
        }

        this.layer.needsDraw = true;
        layer.setTimeout(this._tick.bind(this), 300);
    }

    _ch(v) {
        if (v > 20) {
            let mod = v % 10;
            if (mod < 2) {
                return '(';
            } else if (mod < 4) {
                return ')';
            } else if (mod < 5) {
                return '{';
            } else if (mod < 6) {
                return '}';
            } else if (mod < 8) {
                return "'";
            } else return ' ';
        }
        return ' ';
    }

    _fg(v) {
        if (v > 80) return 0xff0;
        if (v > 60) return 0xee0;
        if (v > 40) return 0xdd0;
        if (v > 20) return 0x990;
        return 0x770;
    }

    _draw(buffer) {
        const color = GWU.color.from(this._used.bg);
        this.data.forEach((v, x, y) => {
            const bg = color.clone().scale(v);

            const ch = this._ch(v);
            const fg = this._fg(v);

            buffer.draw(this.bounds.x + x, this.bounds.y + y, ch, fg, bg);
        });
    }
}

function showIntro(ui) {
    layer = ui.startNewLayer();

    layer.pos(29, 5).fg('red');
    layer.text(' _    _      _ _ _                     _  ');
    layer.text('| |  | |    | | | |                   | | ');
    layer.text('| |__| | ___| | | |__   __ _ _ __   __| | ');
    layer.text("|  __  |/ _ \\ | | '_ \\ / _` | '_ \\ / _` |");
    layer.text('| |  | |  __/ | | |_) | (_| | | | | (_| | ');
    layer.text('|_|  |_|\\___|_|_|_.__/ \\__,_|_| |_|\\__,_| ');

    layer.pos(30, 12).fg('gray');
    layer.text("'Abandon all hope ye who enter here...'");

    layer.reset().pos(39, 14).fg('red');
    layer.text('       ,      ,        ');
    layer.text('      /(.-""-.)\\    ');
    layer.text('  |\\  \\/      \\/  /|');
    layer.text('  | \\ / =.  .= \\ / | ');
    layer.text('  \\( \\   o\\/o   / )/');
    layer.text("   \\_, '-/  \\-' ,_/  ");
    layer.text('     /   \\__/   \\   ');
    layer.text('     \\ \\__/\\__/ /  ');
    layer.text('   ___\\ \\|--|/ /___');
    layer.text(' /`    \\      /    `\\');
    layer.text("/       '----'       \\");

    // TODO - Fire widget (make flames move!)

    new FireWidget(layer, {
        bg: 'red',
        fg: 'yellow',
        x: 5,
        y: 25,
    });

    // fire @ 40, 23
    new FireWidget(layer, {
        bg: 'red',
        fg: 'yellow',
        x: 28,
        y: 25,
    });

    layer.reset().pos(16, 20);
    layer.text('  (_)L|J ');
    layer.text('  (ΩgreenΩ"∆) | ');
    layer.text('/`/ \\-| ');
    layer.text('\\/\\ / | ');
    layer.text('  _W_ | ');

    layer.fg('brown').pos(4, 25).text('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

    // fire @ 60,23
    new FireWidget(layer, {
        bg: 'red',
        fg: 'yellow',
        x: 65,
        y: 25,
    });

    // fire @ 80,23
    new FireWidget(layer, {
        bg: 'red',
        fg: 'yellow',
        x: 88,
        y: 25,
    });

    layer.reset().pos(76, 20);
    layer.text('L|J(_)');
    layer.text(' | (ΩgreenΩ"∆)');
    layer.text(" |`/ \\'\\");
    layer.text(' | \\ /\\/');
    layer.text(' | _W_');
    layer.fg('brown').pos(64, 25).text('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

    layer.reset().pos(26, 28);
    layer.text('(See help file for credits, license and history)');
    layer.pos(44, 30).text('Press Space');

    layer.on('click', () => {
        layer.finish('BIRTH');
    });

    layer.on('keypress', (n, w, e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            layer.finish('BIRTH');
        }
    });

    return layer.promise;
}
