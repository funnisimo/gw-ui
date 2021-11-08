const Q_GENDER = new GWI.Prompt('Will you be a Lady or a Gentleman?').choices(
    ['Lady', 'Gentleman'],
    [
        'The League sports a few women, all worthy members.\n' +
            'Since the world in the year 1500 is ruled by men, you\n' +
            'have learned your skills outside of the public view.',
        'You have been accepted quite soon in the League because\n' +
            'of your potential. You have never considered that being\n' +
            'male has made your progress in the League much easier.',
    ]
);

async function showBirth(ui) {
    const layer = ui.startNewLayer();
    let done;

    layer.styles.add('prompt', { fg: 'dark_yellow' });
    layer.styles.add('.color', { fg: 'green' });
    layer.styles.add('choice', { fg: 'blue' });
    layer.styles.add('choice:selected', { bg: 'lightest_blue' });

    layer.pos(10, 2);
    layer.fg('light_purple').text('Character Creation Screen');
    layer.reset().pos(10, 4);
    layer.text(
        'Your character is about to embark on adventure, journeying through Hell.'
    );
    layer.text(
        'Each character is different, and now is the time to decide on yours.'
    );

    layer.pos(10, 11);
    const choice = layer.choice({
        width: 80,
        choiceWidth: 21,
        height: 16,
        choiceClass: 'color',
        hover: 'select',
    });

    choice.prompt.pos(20, 9);

    layer.reset().pos(15, 36).fg('dark_gray');
    layer.text(
        '?) Help         Escape) Back              R) Restart           Q) Quit'
    );

    choice.showPrompt(Q_GENDER);

    choice.on('change', (n, w, e) => {
        console.log('You selected: ', e.value());
        ui.finishLayer(layer);
        done();
    });

    return new Promise((resolve) => {
        done = resolve;
    });
}
