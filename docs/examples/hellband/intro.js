var layer;
var ui;
var canvas;

window.onload = async () => {
    canvas = GWU.canvas.make(100, 38, { div: 'game', io: true });

    ui = new GWI.UI({ canvas });

    // const div = document.getElementById('game');
    document.onkeydown = ui.loop.onkeydown.bind(ui.loop);

    await showIntro(ui);
    await showBirth(ui);

    console.log('DONE!');
};

async function showIntro(ui) {
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

    layer.reset().pos(37, 14).fg('red');
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

    layer.reset().pos(12, 19);
    layer.text('          (_)L|J       ');
    layer.text('   )      (ΩgreenΩ"∆) |    (  ');
    layer.text('   ,(.  /`/ \\-|   (,`)');
    layer.text("  )' (' \\/\\ / |  ) (.");
    layer.text(" (' ),).  _W_ | (,)' ) ");
    layer.fg('brown').text('^^^^^^^^^^^^^^^^^^^^^^^');

    layer.reset().pos(61, 19);
    layer.text('         L|J(_)             ');
    layer.text('    )     | (ΩgreenΩ"∆)      (      ');
    layer.text("   ,(.    |`/ \\'\\    (,`)    ");
    layer.text("  )' ('   | \\ /\\/    ) (.     ");
    layer.text(" (' ),)   | _W_     (,)' ).   ");
    layer.fg('brown').text('^^^^^^^^^^^^^^^^^^^^^^^^^^^^');

    layer.reset().pos(26, 26);
    layer.text('(See help file for credits, license and history)');
    layer.pos(44, 29).text('Press Space');

    let done;

    layer.on('click', () => {
        ui.finishLayer(layer);
        done();
    });

    layer.on('keypress', (n, w, e) => {
        if (e.key === ' ') {
            ui.finishLayer(layer);
            done();
        }
    });

    return new Promise((resolve) => {
        done = resolve;
    });
}
