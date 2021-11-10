var character;

function reroll() {
    const dice = GWU.range.make('2d6+6');

    const stats = character.stats;
    stats.str = dice.value();
    stats.int = dice.value();
    stats.wis = dice.value();
    stats.dex = dice.value();
    stats.con = dice.value();
    stats.chr = dice.value();
}

function createCharacter(info) {
    character = info;

    const dice = GWU.range.make('2d6+6');

    character.stats = {
        str: dice.value(),
        int: dice.value(),
        wis: dice.value(),
        dex: dice.value(),
        con: dice.value(),
        chr: dice.value(),

        hp: 10,
        hpMax: 10,
        mana: 10,
        manaMax: 10,
    };

    character.combat = {
        toHit: 1,
        toDamage: -1,
        blows: 1,
        shots: 1,
        ac: 10,
    };

    character.xp = {
        level: 1,
        xp: 0,
        needXp: 10,
        factor: 155,
    };

    character.skills = {
        combat: 'Fair',
        missiles: 'Good',
        wizardry: 'Poor',
    };

    character.gold = 0;
    character.infravision = 0;

    console.log('CREATE CHARACTER', info);
}

function showCharacter(ui) {
    const layer = ui.startNewLayer();
    let done;

    layer.styles.add('.right', { align: 'right' });
    layer.styles.add('.dark_gray', { fg: 'dark_gray' });
    layer.styles.add('.dark_gray:hover', { fg: 'teal' });
    layer.styles.add('legend', { fg: 'dark_green' });
    layer.styles.add('label', { fg: 'lighter_gray' });

    layer.pos(38, 1);
    layer.fg('light_purple').text('Hellband Character Sheet');
    layer.reset().pos(10, 4);

    layer
        .fieldset({
            x: 10,
            y: 3,
            legend: '[============== Character =============]',
            pad: 1,
            width: 40,
            dataWidth: 20,
        })
        .add('Race', '§genus§')
        .add('Class', '§vocation§')
        .add('Birth Sign', '§sign§')
        .add('Major Realm', '§majorRealm§')
        .add('Minor Realm', '§minorRealm§')
        .add('Patron', '§patron§')
        .data(character);

    const stats = layer
        .fieldset({
            x: 52,
            y: 3,
            legend: '[=============== Stats ================]',
            pad: 1,
            width: 40,
            dataWidth: 20,
        })
        .add('Strength', '§stats.str§')
        .add('Intelligence', '§stats.int§')
        .add('Wisdom', '§stats.wis§')
        .add('Dexterity', '§stats.dex§')
        .add('Constitution', '§stats.con§')
        .add('Charisma', '§stats.chr§')
        .data(character);

    layer
        .fieldset({
            x: 10,
            y: 12,
            legend: '[======= Combat =======]',
            pad: 1,
            width: 24,
            dataWidth: 6,
            dataClass: 'right',
        })
        .add('To Hit Bonus', '§combat.toHit§')
        .add('Damage Bonus', '§combat.toDamage§')
        .add('Armor Class', '§combat.ac§')
        .add('Blows/Round', '§combat.blows§')
        .add('Shots/Round', '§combat.shots§')
        .data(character);

    layer
        .fieldset({
            x: 36,
            y: 12,
            legend: '[====== Progression =======]',
            pad: 1,
            width: 28,
            dataWidth: 12,
            dataClass: 'right',
        })
        .add('Level', '§xp.level§')
        .add('Experience', '§xp.xp§')
        .add('To Advance', '§xp.needXp§')
        .add('Factor', '§xp.factor§')
        .data(character);

    layer
        .fieldset({
            x: 66,
            y: 12,
            legend: '[====== Counters ========]',
            pad: 1,
            width: 26,
            dataWidth: 10,
            dataClass: 'right',
        })
        .add('Gold', '§gold§')
        .add('HitPoints', '§stats.hp§/§stats.hpMax§')
        .add('Mana', '§stats.mana§/§stats.manaMax§')
        .add('Infravision', '§infravision§')
        .data(character);

    layer
        .pos(30, 20)
        .text('[========= Adventuring Skills =========]', { tag: 'legend' });

    layer
        .fieldset({
            x: 10,
            y: 22,
            legend: false,
            pad: [0, 1],
            border: 'none',
            width: 26,
            dataWidth: 10,
        })
        .add('Combat', '§skills.combat§')
        .add('Missiles', '§skills.missiles§')
        .add('Wizardry', '§skills.wizardry§')
        .data(character);

    layer
        .fieldset({
            x: 38,
            y: 22,
            legend: false,
            pad: [0, 1],
            border: 'none',
            width: 26,
            dataWidth: 10,
        })
        .add('Perception', '§skills.combat§')
        .add('Disarming', '§skills.missiles§')
        .add('Stealth', '§skills.wizardry§')
        .data(character);

    layer
        .fieldset({
            x: 66,
            y: 22,
            legend: false,
            pad: [0, 1],
            border: 'none',
            width: 26,
            dataWidth: 10,
        })
        .add('Occlusion', '§skills.combat§')
        .add('Appraising', '§skills.missiles§')
        .add('Alchemy', '§skills.wizardry§')
        .data(character);

    layer.class('dark_gray').pos(15, 36).text('?) Help');

    layer
        .pos(27, 36)
        .text('Space) Reroll')
        .on('click', () => {
            reroll();
            stats.data(character);
            layer.needsDraw = true;
            return true;
        });

    layer
        .pos(47, 36)
        .text('R) Restart')
        .on('click', () => {
            layer.finish('BIRTH');
            return true;
        });

    layer
        .pos(63, 36)
        .text('Q) Quit')
        .on('click', () => {
            layer.finish('INTRO');
            return true;
        });
    layer
        .pos(79, 36)
        .text('C) Continue')
        .on('click', () => {
            layer.finish('DONE');
            return true;
        });

    layer.on('keypress', (n, w, e) => {
        if (e.key === ' ') {
            reroll();
            stats.data(character);
            layer.needsDraw = true;
            return true;
        } else if (e.key === 'Q') {
            layer.finish('INTRO');
            return true;
        } else if (e.key === 'R') {
            layer.finish('BIRTH');
            return true;
        } else if (e.key === 'C') {
            layer.finish('DONE');
            return true;
        }
        return false;
    });

    return layer.promise;
}
