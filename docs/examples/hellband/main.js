var layer;
var ui;
var canvas;

window.onload = async () => {
    canvas = GWU.canvas.make(100, 38, { div: 'game', io: true });

    ui = new GWI.UI({ canvas });

    // const div = document.getElementById('game');
    document.onkeydown = ui.loop.onkeydown.bind(ui.loop);

    const fns = {
        INTRO: showIntro,
        BIRTH: showBirth,
        CHARACTER: showCharacter,
    };

    let current = fns.INTRO;

    while (current) {
        const next = await current(ui);
        current = fns[next] || null;
    }

    console.log('DONE!');
};
