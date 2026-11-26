/* =========================================================
   Chronica — English starter world
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;
  const DAY = 24 * 60 * 60 * 1000;
  const MIN = 60 * 1000;

  MF.createDemoDataEn = function () {
    const now = Date.now();
    const ago = function (minutes) { return new Date(now - minutes * MIN).toISOString(); };
    const agoDays = function (days) { return new Date(now - days * DAY).toISOString(); };
    const createdWorld = agoDays(96);
    const t = { eir: agoDays(28), mar: agoDays(27), dag: ago(68 * 60), hal: agoDays(2), bra: agoDays(12), lio: ago(14), kai: agoDays(5), ing: agoDays(190), ask: agoDays(41), eira: agoDays(7) };

    const characters = [
      {
        id: 'ch_eirik', name: 'Eirik Veld', title: 'The Grey Wolf of Heymdal', role: 'Founder of the dynasty',
        race: 'Humans', age: '67 at the end of his reign', status: 'Deceased', factionId: 'f_veld', locationId: 'l_heymdal',
        quote: 'A crown is not worn. It is carried.', description: 'Eirik was the first to bind the seven northern houses into one kingdom. He was a hunter before he was a king, and he never stopped listening to the forest.\n\nHe left behind a crown of black iron and a line of heirs who still argue with his shadow.',
        personality: 'Patient, watchful, slow to anger and slower to forgive.', appearance: 'Grey hair, a weathered face and a cloak fastened with a wolf’s jaw.',
        tags: ['founder', 'grey wolf', 'north'], fatherId: '', motherId: '', spouseIds: ['ch_marena'], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(90), updatedAt: t.eir
      },
      {
        id: 'ch_marena', name: 'Marena Veld', title: 'The Wolf-Queen', role: 'Queen, enchantress',
        race: 'Mistborn', age: '58 at the time of her death', status: 'Deceased', factionId: 'f_veld', locationId: 'l_heymdal',
        quote: 'The dead are patient. We are not.', description: 'Marena came from the mist villages and brought old magic into the royal hall. The court feared her; the people asked her for rain, for children and for mercy.\n\nShe died in the winter fever and was buried beneath the eastern gate.',
        personality: 'Quiet, watchful, with a dry humor that cut deeper than any blade.', appearance: 'Silver hair, dark eyes and rings on every finger.',
        tags: ['queen', 'mist', 'winter'], fatherId: '', motherId: '', spouseIds: ['ch_eirik'], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(90), updatedAt: t.mar
      },
      {
        id: 'ch_dagmar', name: 'Dagmar Veld', title: 'The Ashen King', role: 'King of Heymdal',
        race: 'Humans', age: '38', status: 'Alive', factionId: 'f_veld', locationId: 'l_heymdal',
        quote: 'My father built a kingdom. I must decide what it is for.', description: 'Dagmar inherited a strong realm and a court full of knives. He wears the ash crown with the calm of a man who knows exactly how many people are waiting for him to fail.\n\nHe is a better strategist than his father and a worse liar.',
        personality: 'Controlled, intelligent, privately superstitious.', appearance: 'Dark hair, a trimmed beard and a scar above the left eyebrow.',
        tags: ['king', 'veld', 'ash'], fatherId: 'ch_eirik', motherId: 'ch_marena', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(88), updatedAt: t.dag
      },
      {
        id: 'ch_halla', name: 'Halla Olkh', title: 'Shieldmaiden of the North', role: 'Warrior',
        race: 'Humans', age: '31', status: 'Alive', factionId: 'f_blades', locationId: 'l_iceforest',
        quote: 'I do not need a throne to stand my ground.', description: 'Halla earned her place among the Free Blades before she was twenty. She keeps the old oaths and distrusts every new one.\n\nShe disappeared into the Ice Forest on the day of her own funeral. The body in the grave was someone else.',
        personality: 'Direct, stubborn, fiercely loyal.', appearance: 'Red braid, broad shoulders and a sword worn across her back.',
        tags: ['warrior', 'shieldmaiden', 'ice forest'], fatherId: '', motherId: '', spouseIds: ['ch_brann'], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(70), updatedAt: t.hal
      },
      {
        id: 'ch_brann', name: 'Brann Olkh', title: 'The Free Blade', role: 'Mercenary captain',
        race: 'Humans', age: '36', status: 'Alive', factionId: 'f_blades', locationId: 'l_heather',
        quote: 'Every war has a price. I prefer to be paid before it starts.', description: 'Brann leads the Free Blades with charm, good timing and a talent for leaving before the worst of a battle. He is not a coward; he simply likes living.\n\nHe still wears the ring Halla gave him.',
        personality: 'Warm, reckless, sharper than he pretends.', appearance: 'Sun-darkened skin, a broken nose and a patched blue coat.',
        tags: ['mercenary', 'free blades', 'heather'], fatherId: '', motherId: '', spouseIds: ['ch_halla'], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(70), updatedAt: t.bra
      },
      {
        id: 'ch_liora', name: 'Liora Veld', title: 'Keeper of the Mist', role: 'Seer and royal sister',
        race: 'Mistborn', age: '26', status: 'Alive', factionId: 'f_coven', locationId: 'l_lake',
        quote: 'I have seen the end of this world. It begins with silence.', description: 'Liora was born with her mother’s gift and her father’s stubbornness. She serves the Mist Coven, though she rarely agrees with it.\n\nShe says the lake is not a place but a door.',
        personality: 'Reserved, observant, prone to sudden warmth.', appearance: 'Pale hair, grey eyes and a black ribbon at her throat.',
        tags: ['seer', 'mist', 'coven'], fatherId: 'ch_eirik', motherId: 'ch_marena', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(60), updatedAt: t.lio
      },
      {
        id: 'ch_kai', name: 'Kai Veld', title: 'Heir of the Ashen Throne', role: 'Prince',
        race: 'Mistborn', age: '18', status: 'Alive', factionId: 'f_veld', locationId: 'l_heymdal',
        quote: 'I am not afraid of the dark. I am afraid that I will like it.', description: 'Kai carries two gifts and trusts neither. The court sees a quiet prince; the coven sees a storm waiting for a name.\n\nHe is trying to be a good son and failing in interesting ways.',
        personality: 'Thoughtful, guarded, curious.', appearance: 'Black hair, one green eye and one grey.', tags: ['prince', 'heir', 'two gifts'],
        fatherId: 'ch_dagmar', motherId: '', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(18), updatedAt: t.kai
      },
      {
        id: 'ch_ingrid', name: 'Ingrid Tal', title: 'Mist-Witch of the Coven', role: 'Leader of the Mist Coven',
        race: 'Mistborn', age: '44', status: 'Alive', factionId: 'f_coven', locationId: 'l_lake',
        quote: 'The lake remembers every promise. Even the ones we forget.', description: 'Ingrid has led the coven for eleven years and has never once been seen without her bone needle. She believes the mist is a living thing.\n\nShe may be right.',
        personality: 'Calm, cryptic, deeply political.', appearance: 'Long dark robes, silver rings and a needle through her sleeve.', tags: ['witch', 'coven', 'lake'],
        fatherId: '', motherId: '', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(80), updatedAt: t.ing
      },
      {
        id: 'ch_askel', name: 'Askel', title: 'High Keeper of Ash', role: 'Priest of the Ash Order',
        race: 'Humans', age: '52', status: 'Alive', factionId: 'f_ash', locationId: 'l_tower',
        quote: 'A fire that never dies is not a blessing. It is a debt.', description: 'Askel keeps the burned tower and the order that tends it. He blessed Dagmar’s crown, though the old rules said he should not.\n\nNo one has asked him why.',
        personality: 'Formal, patient, impossible to read.', appearance: 'Ash-grey robes and burned hands.', tags: ['priest', 'ash order', 'tower'],
        fatherId: '', motherId: '', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(82), updatedAt: t.ask
      },
      {
        id: 'ch_eira', name: 'Eira Olkh', title: 'Ranger of the Ice Forest', role: 'Scout',
        race: 'Humans', age: '24', status: 'Alive', factionId: 'f_blades', locationId: 'l_iceforest',
        quote: 'The forest moves when no one is watching.', description: 'Eira knows the Ice Forest better than any map. She brought back the first reports of the trees moving after the northern battle.\n\nShe does not speak about what else she saw.',
        personality: 'Practical, quiet, hard to surprise.', appearance: 'Cropped dark hair, a green cloak and frost-burned fingertips.', tags: ['ranger', 'ice forest', 'scout'],
        fatherId: 'ch_brann', motherId: '', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [],
        createdAt: agoDays(24), updatedAt: t.eira
      }
    ];

    const genders = {
      ch_eirik: 'Male', ch_marena: 'Female', ch_dagmar: 'Male', ch_halla: 'Female', ch_brann: 'Male',
      ch_liora: 'Female', ch_kai: 'Male', ch_ingrid: 'Female', ch_askel: 'Male', ch_eira: 'Female'
    };
    characters.forEach(function (character) { character.gender = genders[character.id] || 'Not specified'; });

    const regions = [
      { id: 'rg_heymdal', name: 'Heymdal', type: 'Kingdom', climate: 'Harsh winters, short windy summers', description: 'The northern heart of the realm. Black pines, stone roads and a gate that has never been taken.', tags: ['north', 'capital'], image: '', createdAt: agoDays(90), updatedAt: t.dag },
      { id: 'rg_heather', name: 'Heather Valley', type: 'Province', climate: 'Mild springs, honeyed summers', description: 'Rolling hills, old trade roads and a border guarded by people rather than walls.', tags: ['valley', 'trade'], image: '', createdAt: agoDays(90), updatedAt: t.bra },
      { id: 'rg_ash', name: 'Ash Waste', type: 'Wasteland', climate: 'Ash winds, grey skies', description: 'The burned plain where the First Fire went out. Nothing grows, but warm ash rises every night.', tags: ['ash', 'ruin'], image: '', createdAt: agoDays(90), updatedAt: t.ask },
      { id: 'rg_ice', name: 'Ice Forest', type: 'Woodland', climate: 'Permafrost, blue mist', description: 'A forest that remembers more than kings and dislikes being called a forest.', tags: ['forest', 'ice'], image: '', createdAt: agoDays(90), updatedAt: t.hal },
      { id: 'rg_lake', name: 'Lake of the Quiet Moon', type: 'Sacred lands', climate: 'Mist, soft rain, cold nights', description: 'The lake is a home to the coven, a border to the crown and a door to something else.', tags: ['lake', 'mist', 'coven'], image: '', createdAt: agoDays(90), updatedAt: t.ing },
      { id: 'rg_tower', name: 'Askel’s Tower', type: 'Ruins', climate: 'Windless heat, ash storms', description: 'The burned tower of the Ash Order. Pilgrims come here, but few return with the same eyes.', tags: ['tower', 'ash order'], image: '', createdAt: agoDays(90), updatedAt: t.ask }
    ];

    const races = [
      { id: 'race_humans', name: 'Humans', type: 'Mortals', traits: 'Adaptable · ambitious · short-lived', description: 'The most numerous people of the north. They build kingdoms, forget promises and start again.', tags: ['mortal', 'north'], image: '', createdAt: agoDays(90), updatedAt: t.dag },
      { id: 'race_mistborn', name: 'Mistborn', type: 'Gifted', traits: 'Mist-sight · old magic · silver eyes', description: 'Children of the mist villages. They see what others do not and pay for it in dreams.', tags: ['mist', 'magic'], image: '', createdAt: agoDays(90), updatedAt: t.ing },
      { id: 'race_ancient', name: 'Ancients', type: 'Ancients', traits: 'Long memory · stone-sleep · old oaths', description: 'The first people of the land, now few and mostly silent. The forest still listens to them.', tags: ['ancient', 'forest'], image: '', createdAt: agoDays(90), updatedAt: t.ask }
    ];

    const locations = [
      { id: 'l_heymdal', name: 'Heymdal', type: 'Capital', regionId: 'rg_heymdal', region: 'Heymdal', description: 'A stone city behind a black gate. The royal hall smells of pine smoke and wet iron.', tags: ['capital', 'gate'], image: '', createdAt: agoDays(90), updatedAt: t.dag },
      { id: 'l_heather', name: 'Heather Valley', type: 'Valley', regionId: 'rg_heather', region: 'Heather Valley', description: 'A wide valley of heather and old roads, where every hill has a name and a story.', tags: ['valley', 'heather'], image: '', createdAt: agoDays(90), updatedAt: t.bra },
      { id: 'l_ash', name: 'Ash Waste', type: 'Wasteland', regionId: 'rg_ash', region: 'Ash Waste', description: 'A grey plain under a grey sky. Warm ash drifts like snow.', tags: ['ash', 'waste'], image: '', createdAt: agoDays(90), updatedAt: t.ask },
      { id: 'l_iceforest', name: 'Ice Forest', type: 'Forest', regionId: 'rg_ice', region: 'Ice Forest', description: 'Black pines under blue frost. The trees move when no one is watching.', tags: ['forest', 'ice'], image: '', createdAt: agoDays(90), updatedAt: t.hal },
      { id: 'l_lake', name: 'Lake of the Quiet Moon', type: 'Lake', regionId: 'rg_lake', region: 'Lake of the Quiet Moon', description: 'Still water under a pale moon. Lights move beneath the surface on windless nights.', tags: ['lake', 'mist'], image: '', createdAt: agoDays(90), updatedAt: t.ing },
      { id: 'l_tower', name: 'Askel’s Tower', type: 'Ruin', regionId: 'rg_tower', region: 'Askel’s Tower', description: 'A burned tower of black stone. The Ash Order keeps a fire in its lowest room.', tags: ['tower', 'ash'], image: '', createdAt: agoDays(90), updatedAt: t.ask }
    ];

    const factions = [
      { id: 'f_veld', name: 'House Veld', type: 'Royal house', status: 'In power', leaderId: 'ch_dagmar', color: '#c5a15f', regionId: 'rg_heymdal', locationId: 'l_heymdal', ideology: 'The crown is a duty, not a gift.', description: 'The ruling house of Heymdal. Old wolves, older debts.', tags: ['royal', 'veld'], emblem: '', createdAt: agoDays(90), updatedAt: t.dag },
      { id: 'f_blades', name: 'Free Blades', type: 'Mercenary company', status: 'Active', leaderId: 'ch_brann', color: '#7fa8c4', regionId: 'rg_heather', locationId: 'l_heather', ideology: 'Every war has a price.', description: 'A company of sellswords with a surprising number of old oaths.', tags: ['mercenary', 'blades'], emblem: '', createdAt: agoDays(90), updatedAt: t.bra },
      { id: 'f_coven', name: 'Mist Coven', type: 'Coven', status: 'In shadow', leaderId: 'ch_ingrid', color: '#b7a0d6', regionId: 'rg_lake', locationId: 'l_lake', ideology: 'The lake remembers.', description: 'Mist-witches who keep the old pacts and watch the water.', tags: ['coven', 'mist'], emblem: '', createdAt: agoDays(90), updatedAt: t.ing },
      { id: 'f_ash', name: 'Ash Order', type: 'Religious order', status: 'On the border', leaderId: 'ch_askel', color: '#c0837b', regionId: 'rg_tower', locationId: 'l_tower', ideology: 'A fire that never dies is a debt.', description: 'Priests and keepers of the burned tower, guardians of the First Fire.', tags: ['order', 'ash'], emblem: '', createdAt: agoDays(90), updatedAt: t.ask }
    ];

    const lore = [
      { id: 'lr_firstfire', title: 'The First Fire', category: 'History', summary: 'The fire that ended the first age and began the count of years.', content: 'When the First Fire went out, warm ash rose over the Ash Waste for the first time. The Ash Order calls it a beginning. The crown calls it a warning.', tags: ['ash', 'first fire', 'history'], image: '', createdAt: agoDays(85), updatedAt: t.ask },
      { id: 'lr_wolfcrown', title: 'The Wolf Crown', category: 'Artifacts', summary: 'A crown of black iron worn by the rulers of Heymdal.', content: 'Forged from the seven blades of the northern houses, the Wolf Crown is said to grow heavier with every broken oath.', tags: ['crown', 'artifact', 'veld'], image: '', createdAt: agoDays(84), updatedAt: t.dag },
      { id: 'lr_mistpact', title: 'The Mist Pact', category: 'Magic', summary: 'The agreement between the mist villages and the lake.', content: 'The coven does not worship the lake. It remembers what the lake asked for, and what it promised in return.', tags: ['mist', 'pact', 'magic'], image: '', createdAt: agoDays(82), updatedAt: t.ing }
    ];

    const events = [
      { id: 'ev_firstfire', title: 'The First Fire Fades', dateText: '812 BE', sortYear: -812, era: 'Era of Dawn', type: 'disaster', locationId: 'l_ash', participantIds: [], description: 'The First Fire went out. Warm ash rose over the Ash Waste and the Third Era began.', image: '', createdAt: agoDays(90), updatedAt: t.ask },
      { id: 'ev_crown', title: 'The Wolf Crown', dateText: '1160 TE', sortYear: 1160, era: 'Third Era', type: 'politics', locationId: 'l_heymdal', participantIds: ['ch_eirik', 'ch_marena'], description: 'Eirik Veld united the seven northern houses and took the Wolf Crown. Marena stood beside him and did not bow.', image: '', createdAt: agoDays(70), updatedAt: t.eir },
      { id: 'ev_battle', title: 'Battle of the Ice Forest', dateText: '1189 TE', sortYear: 1189, era: 'Third Era', type: 'battle', locationId: 'l_iceforest', participantIds: ['ch_eirik', 'ch_halla', 'ch_brann'], description: 'The last great war of the north. Heymdal held the gate but lost its king. Brann earned his name here.', image: '', createdAt: agoDays(65), updatedAt: t.hal },
      { id: 'ev_kai', title: 'Birth of Kai', dateText: '1198 TE', sortYear: 1198, era: 'Third Era', type: 'birth', locationId: 'l_lake', participantIds: ['ch_kai', 'ch_dagmar', 'ch_ingrid'], description: 'On the night the heir was born, mist rose from the lake to the stars. The coven called it a blessing; the order called it a warning.', image: '', createdAt: agoDays(20), updatedAt: t.kai },
      { id: 'ev_lake', title: 'The Lake Answers', dateText: '1211 TE', sortYear: 1211, era: 'Third Era', type: 'magic', locationId: 'l_lake', participantIds: ['ch_ingrid', 'ch_liora'], description: 'For the first time in decades, the lake answered the coven without a sacrifice.', image: '', createdAt: agoDays(14), updatedAt: t.ing }
    ];

    const notes = [
      { id: 'n_kai', title: 'Kai’s two gifts', content: 'Kai should not be the obvious heir. Let two gifts fight in him: the mother’s he denies and the father’s stubbornness he mistakes for strength.', color: 'sage', pinned: true, createdAt: agoDays(10), updatedAt: t.kai },
      { id: 'n_askel', title: 'Askel descends', content: 'Dagmar comes to Askel without guards. Askel meets him on the lowest step — the only time anyone has seen him come down.', color: 'rose', pinned: false, createdAt: agoDays(8), updatedAt: t.ask },
      { id: 'n_halla', title: 'Halla’s disappearance', content: 'Not a swap, not a secret death. She walked into the Ice Forest on the day of her funeral, and the body was someone else. Optional thread for now.', color: 'gold', pinned: false, createdAt: agoDays(6), updatedAt: t.hal }
    ];

    return {
      version: 1,
      world: {
        name: 'Heather & Ash', genre: 'Dark fantasy', genreId: 'fantasy',
        tagline: 'A realm where old oaths remember stones, and ash keeps the names of the fallen.',
        description: 'The north has held for a thousand years behind the black gate of Heymdal. Now the king is dead, the heir is afraid of his own blood, and the lake is answering questions no one asked.\n\nThis is a sample world. Edit it, delete it, or start your own chronicle from a blank page.',
        era: 'Third Era', currentYear: '1212 TE', cover: '', isDemo: true,
        createdAt: createdWorld, updatedAt: ago(6 * 24 * 60)
      },
      characters, regions, races, locations, factions, lore, events, notes,
      activity: []
    };
  };
})();
