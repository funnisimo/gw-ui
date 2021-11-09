const Q_GENDER = new GWI.Prompt('Will you be a Lady or a Gentleman?', {
    field: 'gender',
    id: 'GENDER',
    next: 'GENUS',
}).choices({
    Lady:
        'The League sports a few women, all worthy members.\n' +
        'Since the world in the year 1500 is ruled by men, you\n' +
        'have learned your skills outside of the public view.',
    Gentleman:
        'You have been accepted quite soon in the League because\n' +
        'of your potential. You have never considered that being\n' +
        'male has made your progress in the League much easier.',
});

const Q_GENUS = new GWI.Prompt(
    GWU.text.compile('What is your genus, §gender§?'),
    {
        field: 'genus',
        id: 'GENUS',
    }
).choices({
    Human: {
        info:
            'Humans rule the world in the year 1500, however not all\n' +
            'of them are of pure blood. Others have been bitten by\n' +
            'vampires or werewolves. Humans born under the right\n' +
            'constellation have gained extra-ordinary powers.',
        next: 'HUMAN',
    },
    Faerie: {
        info:
            'These little creatures are almost lost to the world,\n' +
            'but some have adapted to the ways of the humans. Mostly\n' +
            'found on the British Islands, some of them support the\n' +
            'activities of the League. Compared to humans, faeries\n' +
            'are more dextrous, intelligent, charming, stealthier\n' +
            'and superior in magic. They are much weaker though.\n' +
            'Their magic keeps them from falling into traps.\n',
        next: 'FAERIE',
    },
    Spawn: {
        info:
            'Creatures born in the pits of Hell, they all fight for\n' +
            'their spot. Some win, some loose and some get thrown in\n' +
            'to the world of Man. The League being a source of much\n' +
            'power and knowledge it attracts the occasional outcast\n' +
            'Spawn. The league employs some of them, using a magical\n' +
            'bond that lasts a hundred years. Spawns are stronger,\n' +
            'faster, tougher and more intelligent. They are heinous\n' +
            'though, providing little charisma.\n',
        next: 'SPAWN',
    },
    Elder: {
        info:
            'Little is known about the Elder, even the Elder have\n' +
            'forgotten where they come from, what their purpose is\n' +
            'It is a generally accepted idea that the Elder existed\n' +
            'when the Earth was created, and they will be there when\n' +
            'the Earth will be undone. The Elder employ Guardians, a\n' +
            'subspecies of the Elder born to protect them. Elder are\n' +
            'charismatic, intelligent and superior in magic.',
        next: 'ELDER',
    },
});

const Q_HUMAN = new GWI.Prompt(
    GWU.text.compile('What type of §genus§ are you, §gender§?'),
    {
        field: 'species',
        id: 'HUMAN',
        next: 'SIGN',
    }
).choices({
    Florentian:
        'Florentians are Italians from the city of Florence.\n' +
        'They are your basic human, with more than average \n' +
        'interest in Inferno given that Dante was a Florentian\n' +
        'as well. They get they get discounts in most shops.',
    Gipsy:
        'Gipsies are not very well liked, even though they are\n' +
        'great entertainers and sport some of the most beautiful\n' +
        'women. Gipsies are charismatic, have a knack for being\n' +
        'stealthy and gain the Second Sight when they become\n' +
        'more experienced. They are slightly better in magic.',
    Nordic:
        'Nordics are hardy men from the North. They are still\n' +
        "very much in touch with Nature and its' spirits. This\n" +
        'makes them slightly better at magical abilities.',
    Atlantian:
        'Living in a dome on the bottom of the ocean, they have\n' +
        'no natural enemies and grown weak. They do however have\n' +
        'a knack for magic and are resistant to darkness. Their\n' +
        'innate magical abilities allow to fire magical missiles\n' +
        'at will.',
    'Dwarven descendant': {
        info:
            'True dwarfs have not dwelled on the planet surface\n' +
            'since ages, but they have mingled with humans and some\n' +
            'of their descendants are almost as stocky, loudmouthed\n' +
            'and foul-tempered as they once were. They are hard to\n' +
            'be blinded and find their ways easily under the ground.',
        value: 'Dwarf',
    },
    'Elven descendant': {
        info:
            'True elfs have not dwelled in the Scandinavian lands\n' +
            'since ages, but they have mingled with humans and some\n' +
            'of their descendants show a startling gracefulness.',
        value: 'Elf',
    },
    'Ogre descendant': {
        info:
            'Ogres were a race of large humanoid beings, fierce and\n' +
            'cruel monsters that ate human flesh. The most viscious\n' +
            'have been hunted down and subdued. The other ones have\n' +
            'taken the custom to shapeshift into a human form and\n' +
            'lead a normal life among humans. Some can even trick a\n' +
            'human and procreate. The descendants of these ogres can\n' +
            'still sport bulging muscles, and some still know how to\n' +
            'shapeshift. Ogres are resistant to darkness, their\n' +
            'strength cannot be drained and they can place magical\n' +
            'traps that explode when touched. They tend be rich.',
        value: 'Ogre',
    },
    'Troll descendant': {
        info:
            'Trolls are the Scandinavian version of the German and\n' +
            'French ogres. Their descendants even though civilized\n' +
            'are uglier, stronger, stupider and regenerate faster.\n' +
            'Experienced trolls can enter into a berserker fury.',
        value: 'Troll',
    },
    'Giant descendant': {
        info:
            'Like the descendants of the Titans they have concealed\n' +
            'themselves on an island in the Mediterranean sea. The\n' +
            'League has found out about their existance and requires\n' +
            'their assistance every now and then. Even though not\n' +
            'very smart they make great adventurers with their solid\n' +
            'toughness and strength. They resist strength draining\n' +
            'attacks and shards. Experienced, they can smash stone\n' +
            'into dust.',
        value: 'Giant',
    },
    'Titan descendant': {
        info:
            'The largest of all, and superior in almost every aspect\n' +
            'these descedants have been found on a remote island in\n' +
            'the Mediterranean sea, protected by ancient sorceries.\n' +
            'The League has managed to penetrate these sorceries and\n' +
            'some of the inhabitants have decided to join them. They\n' +
            'resist chaosand can spot the weaknesses of others.',
        value: 'Titan',
    },
    Nephilim:
        'Children of men and angels, they usually become giant\n' +
        'man-eating creatures. It seems that at some point in\n' +
        'their life Nephilim must give up their Angelic or their\n' +
        'human heritage. Nephilim starting this adventure have\n' +
        'not yet made this choice, allowing them to go either\n' +
        'way.',
    Afflicted:
        'Either bitten by vampire or werewolf or cursed undead,\n' +
        'the afflicted have lost their humanity. However, this\n' +
        'brings a higher resistance than usual to nether, cold\n' +
        'and darkness. It also means that they have lost the \n' +
        'effects of any constellation they were born under.',
});

const Q_FAERIE = new GWI.Prompt(
    GWU.text.compile('What type of §genus§ are you, §gender§?'),
    {
        field: 'species',
        id: 'FAERIE',
        next: 'SIGN',
    }
).choices({
    'Seelie Fae': {
        info:
            'Seelie Fae, or properly called Seelie Court, are good\n' +
            'faeries of the British Isles. They are a beautifull to\n' +
            'behold, but frail and not very strong. They are very\n' +
            'dextrous and have superior magic skills. Their magic\n' +
            'prevents them from falling intro traps, from light and\n' +
            'it allows them to toss around magical sleeping dust.\n' +
            'As they get more experienced, they become faster.',
        value: 'Fae',
    },
    Gnome:
        'Gnomes are a small, playful folk. Whilst being very\n' +
        'intelligent, they suffer from an almost chronic failure\n' +
        'to take anything seriously. Gnomes are constantly on\n' +
        'the move, and are impossible to paralyse or slow. In\n' +
        'fact, they can even teleport themself at higher levels.',
    Leprechaun:
        'Leprechauns are male faeries inhabiting Ireland.  They\n' +
        'are into shoemaking, mischief and gold collections.\n' +
        'There are no famous leprechauns yet, even though they\n' +
        'are superior in magic, dexterity, charm and speed.',
    Kobold:
        'Kobolds are malicious faeries inhabiting the Black\n' +
        'Forest. Some of their talents are very useful and for\n' +
        'the right price they sometimes work with the League.\n' +
        'They are masters in stealth and poison, an experienced\n' +
        'kobold even grows glands that allow it to spit poison\n' +
        'darts. They are not an intelligent type of faerie, and\n' +
        'arent great lookers either.',
});

const Q_SPAWN = new GWI.Prompt(
    GWU.text.compile('What type of §genus§ are you, §gender§?'),
    {
        field: 'species',
        id: 'SPAWN',
        next: 'SIGN',
    }
).choices({
    Spawn:
        'Spawn are the progeny of mortals and demons. As\n' +
        'such, they inherit some of the raw strength of their\n' +
        'demonic parentage, but their mixed race tends to leave\n' +
        'their thoughts confused and their forms misshapen.\n' +
        'Spawn are remembered by their demonic anscestors,\n' +
        'and as such they always get a demonic patron. Their\n' +
        'association with the pandemonium of hell allows them to\n' +
        'resist both confusion and sound attacks.',
    Imp:
        'Imps are small red-skinned fire demons. Although not\n' +
        'terribly strong or smart, they are tough and fast. As\n' +
        'they are beings of fire, they have innate resistance to\n' +
        'it, growing into immunity as they toughen up. They can\n' +
        'learn how to toss flame bolts, fireballs and can even\n' +
        'gain Second Sight.',
    Succubus:
        'Born in the pits of Hell, they have been selected as\n' +
        'much for their beauty as their visciousness. They are\n' +
        'demons that can take the form of a beautiful woman and\n' +
        'have a special draining attack against men. They are\n' +
        'intelligent, dextrous, fast and stealthy with a knack\n' +
        'for magic. They resists chaos and confusion naturally.',
    Lilli:
        'Born from Lilith and Asmodeus they know that Lillith\n' +
        'will come one day after them. They join the League for\n' +
        'power, power they will use when the Day comes. Lili are\n' +
        'beautiful and rebellious like their mother and sensual\n' +
        'like their father. Lilim resist chaos and confusion\n' +
        'and are very tough.',
});

const Q_ELDER = new GWI.Prompt(
    GWU.text.compile('What type of §genus§ are you, §gender§?'),
    {
        field: 'species',
        id: 'ELDER',
        next: 'SIGN',
    }
).choices({
    Elder:
        'The true Elder is a very tough creature, regenerating\n' +
        'wounds even when almost completely destroyed. They are\n' +
        'a beautiful sight to behold and radiate light in the\n' +
        'dark. Their senses are magically attuned and they have\n' +
        'the second sight. They are protected from light-based\n' +
        'attacks.',
    Guardian:
        'Elder Guardians have been completely designed to defend\n' +
        'their assigned Elder. A few Elder Guardians have lost\n' +
        'the Elder they should guard and have joined the League,\n' +
        'as a means to find back their protegee. They are slow,\n' +
        'not very bright but incredibly tough. They cannot use\n' +
        'mortal food, only Ambrosia or magical means can sustain\n' +
        'them. They have awesome defences, they cannot be bled\n' +
        'or stunned. They are naturally resistant to poison and\n' +
        'have Second Sight.',
    Horror:
        'Some of the Elder have become Horrors, after recovering\n' +
        'from grievous wounds their body has changed into a\n' +
        'nightmarish thing. Slimy, their faces covered with\n' +
        'tentacles they have gained even more mental powers at\n' +
        'the cost of frailty. They can gain the Second Sight,\n' +
        'sense minds from a distance and project mental energies\n' +
        'in a direct attack.',
});

const Q_SIGN = new GWI.Prompt(
    GWU.text.compile('Which constellation were you born under, §gender§?'),
    {
        field: 'sign',
        id: 'SIGN',
        next: 'VOCATION',
    }
).choices({
    Free:
        'You have been born under no particular constellation,\n' +
        'causing concern among the Elder Gods. You have no\n' +
        'special powers or weaknesses.',
    Draco:
        "The constellation Draco or 'Dragon' confers under rare\n" +
        'circumstances dragon powers to newborn children. Later\n' +
        'in their life they will discover resistance to many\n' +
        'elements, they will also find that they can shapeshift\n' +
        'into a Dragonling; scaled, winged and capable to breath\n' +
        'fire and other elements.',
    Serpens:
        "The constellation Serpens or 'Serpent' confers under\n" +
        'rare conditions powers of and over snakes. People born\n' +
        'under this constellation can resist poison and will not\n' +
        'be attacked by snakes and serpents. They also can be\n' +
        'very stealthy.',
    Plutus:
        "Even though Plutus' star is not classified under modern\n" +
        "astronomy, it's effects on newborns can be profound.The\n" +
        'need to amass large fortunes and to tell whether things\n' +
        'are valuable or not. They also have the Second Sight,\n' +
        'their belongings are protected from disenchantment and\n' +
        'they tend to discover things that were meant to stay\n' +
        'hidden. The only drawback they have is that they cannot\n' +
        'easily part with their money.',
    Morui:
        'Stories are told of the people from the star Morui, now\n' +
        'more commonly called Orion. It is said that they have\n' +
        'mingled with humans and that their genes are stronger\n' +
        'with children born under Orion. People born under Morui\n' +
        'are better in every way save for an odd mind. They grow\n' +
        'a tough subdermal chitin that resists acid and their\n' +
        'thoughts are impossible to confuse. They can grow wings\n' +
        'that help avoid pits and falls. As they get more\n' +
        'experienced, they also get faster and gain the ability\n' +
        'to spit acid.',
});

const Q_VOCATION = new GWI.Prompt(
    GWU.text.compile('What is your vocation, §gender§?'),
    {
        field: 'vocation',
        id: 'VOCATION',
        next: null,
    }
).choices({
    Warrior:
        'To be a warriors is the simplest vocation. They gain\n' +
        'no special abilities, other than mastery of their fear.\n' +
        'They simply fight. However, they are tougher and fight\n' +
        'better at fighting than any other.',
    Mage:
        'Mages dedicate themselves to two magic realms. One major\n' +
        'and a minor realm. Mages struggle with combat when not \n' +
        'using spells.',
    Priest:
        'Priests are devoted to powers beyond this realm. They\n' +
        'have some fighting skills, but excel at magic. Priests\n' +
        'work their miracles throug either white magic or black\n' +
        'magic and one other neutral realm. White magic priests\n' +
        'take vows which prevent them from using edged weapons\n' +
        'unless those weapons are blessed.',
    Rogue:
        'Rogues are masters of stealth. Although they are not as\n' +
        'good as warriors in a straight fight, they can backstab\n' +
        'sleeping or fleeing opponents doing large amounts of\n' +
        'damage. Rogues also learn a very small amount of magic\n' +
        'from a restricted set of realsm',
    Hunter:
        'Hunters are decent fighters, although they specialize\n' +
        'in missile weapons. Like druids, they use divine magic\n' +
        'from the Nature realm. They are not as good as druids\n' +
        'at nature magic, but make up for it by also learning a\n' +
        'second realm.',
    Paladin:
        'Paladins are holy warriors. There are two types - true\n' +
        'Paladins and Death Knights. True paladins get divine\n' +
        'magic from the Miracles realm, whereas death knights\n' +
        'get divine magic from the Death realm. In either case,\n' +
        'their magic is not as strong as that of a priest, but\n' +
        'they make up for this by fighting almost as well as a\n' +
        'warrior does. Paladins can learn to resist the effects\n' +
        'of fear at a higher level.',
    Spellblade:
        'Spellblades combine reasonable combat skills with\n' +
        'Charms magic and another realm of their choice. They\n' +
        'are sturdy magical warriors with a knack for surviving.',
    'Hell Knight':
        'Hell Knights have made a pact with an infernal patron in\n' +
        'exchange for physical prowess. As such, they are great\n' +
        'warriors. Their patrons give them a small amount of\n' +
        'divine magic from the chaos realm, and occasionally\n' +
        'give them other rewards too. Hell Knights can learn to\n' +
        'resist the effects of chaos, confusion and fear.',
    Mystic:
        'Mystics are martial artists. As such they are masters\n' +
        'of their mind and body; trained in unarmed combat and \n' +
        'acceleration. However, their skills are hampered by\n' +
        'wearing heavy armour. With experience, they can shrug\n' +
        'off slowing and paralyzing attacks. As part of their\n' +
        'meditations, mystics learn Somatic magic.',
    Orphic:
        'Orphics rely on the supernatural powers that their\n' +
        'mind is capable of producing. Many of their powers are\n' +
        'similar to spells and are used in the same way. Some\n' +
        'powers, however, are simply passive, not requiring\n' +
        'active use. Orhpics can resists fear and confusion.\n' +
        'They can sustain their wisdom, and even sense other\n' +
        'minds once they are very experienced. They can handle\n' +
        'themselves in combat.',
    'High Mage':
        'High mages study arcane magic from a single realm to\n' +
        'the exclusion of any other magic. As such, their\n' +
        'magical abilities are purer than most other vocations,\n' +
        'and they get more spell points than others.\n' +
        'However, their intense study leaves them weak in combat\n' +
        'when not using spells.',
    Druid:
        'Druids are nature worshippers. As such, they use divine\n' +
        'magic from the realm of Nature. They are better at\n' +
        'nature magic than any other class. Like priests, druids\n' +
        'are not allowed to use edged weapons unless those\n' +
        'weapons are blessed.',
    Warlock:
        'Warlocks are people who have studied the magical\n' +
        'arts of demon magic with the aid of an infernal patron.\n' +
        'They are an arcane spell user, getting demonic spell\n' +
        'and the choice of any other realm. They are better at\n' +
        'demonic magic than any other class. Warlocks have\n' +
        'an infernal patron who may bestow gifts upon them, and\n' +
        'they can learn how to resist the effects of chaos.\n' +
        'Warlocks have great difficulty wielding any weapon\n' +
        'that is not a weapon of chaos, since their pact with\n' +
        'their patron involves only using the power of chaos.',
});

async function showBirth(ui) {
    const layer = ui.startNewLayer();
    let done;

    layer.styles.add('.dark_gray', { fg: 'dark_gray' });
    layer.styles.add('.dark_gray:hover', { fg: 'teal' });

    layer.styles.add('prompt', { fg: 'dark_yellow' });
    layer.styles.add('.color', { fg: 'green' });
    layer.styles.add('ci', { fg: 'blue' });
    layer.styles.add('ci:selected', { bg: 'lightest_blue' });

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

    const inquiry = new GWI.Inquiry(choice).prompts(
        Q_GENDER,
        Q_GENUS,
        Q_HUMAN,
        Q_FAERIE,
        Q_SPAWN,
        Q_ELDER,
        Q_SIGN,
        Q_VOCATION
    );

    layer.reset().pos(15, 36).class('dark_gray');
    layer.pos(19, 36).text('?) Help');
    layer
        .pos(34, 36)
        .text('Escape) Back')
        .on('click', () => {
            inquiry.back();
        });
    layer
        .pos(59, 36)
        .text('R) Restart')
        .on('click', () => {
            inquiry.restart();
        });
    layer
        .pos(79, 36)
        .text('Q) Quit')
        .on('click', () => {
            inquiry.quit();
        });

    try {
        const result = await inquiry.start();
        console.log('You chose: ', result);
    } catch (e) {
        ui.finishLayer(layer);
        return false;
    }

    ui.finishLayer(layer);
    return true;
}
