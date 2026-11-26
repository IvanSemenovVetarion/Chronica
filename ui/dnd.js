/* =========================================================
   Chronika DnD Edition — листы, справочник и кубы
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  MF.DND_LINK = 'https://dnd.su/';
  MF.DND_EDITIONS = [
    { id: '5e', label: 'D&D 5e (2014)', labelEn: 'D&D 5e (2014)' },
    { id: '2024', label: 'D&D 2024 (6e)', labelEn: 'D&D 2024 (6e)' }
  ];
  MF.DND_ABILITIES = [
    { id: 'str', label: 'Сила', labelEn: 'Strength', short: 'STR' },
    { id: 'dex', label: 'Ловкость', labelEn: 'Dexterity', short: 'DEX' },
    { id: 'con', label: 'Телосложение', labelEn: 'Constitution', short: 'CON' },
    { id: 'int', label: 'Интеллект', labelEn: 'Intelligence', short: 'INT' },
    { id: 'wis', label: 'Мудрость', labelEn: 'Wisdom', short: 'WIS' },
    { id: 'cha', label: 'Харизма', labelEn: 'Charisma', short: 'CHA' }
  ];
  MF.DND_SKILLS = [
    { id: 'acrobatics', ability: 'dex', label: 'Акробатика', labelEn: 'Acrobatics' },
    { id: 'animal', ability: 'wis', label: 'Обращение с животными', labelEn: 'Animal Handling' },
    { id: 'arcana', ability: 'int', label: 'Магия', labelEn: 'Arcana' },
    { id: 'athletics', ability: 'str', label: 'Атлетика', labelEn: 'Athletics' },
    { id: 'deception', ability: 'cha', label: 'Обман', labelEn: 'Deception' },
    { id: 'history', ability: 'int', label: 'История', labelEn: 'History' },
    { id: 'insight', ability: 'wis', label: 'Проницательность', labelEn: 'Insight' },
    { id: 'intimidation', ability: 'cha', label: 'Запугивание', labelEn: 'Intimidation' },
    { id: 'investigation', ability: 'int', label: 'Расследование', labelEn: 'Investigation' },
    { id: 'medicine', ability: 'wis', label: 'Медицина', labelEn: 'Medicine' },
    { id: 'nature', ability: 'int', label: 'Природа', labelEn: 'Nature' },
    { id: 'perception', ability: 'wis', label: 'Внимательность', labelEn: 'Perception' },
    { id: 'performance', ability: 'cha', label: 'Выступление', labelEn: 'Performance' },
    { id: 'persuasion', ability: 'cha', label: 'Убеждение', labelEn: 'Persuasion' },
    { id: 'religion', ability: 'int', label: 'Религия', labelEn: 'Religion' },
    { id: 'sleight', ability: 'dex', label: 'Ловкость рук', labelEn: 'Sleight of Hand' },
    { id: 'stealth', ability: 'dex', label: 'Скрытность', labelEn: 'Stealth' },
    { id: 'survival', ability: 'wis', label: 'Выживание', labelEn: 'Survival' }
  ];
  MF.DND_RACES = [
    { id: 'human', name: 'Human', nameRu: 'Люди', traits: 'Универсалы, дополнительный язык, гибкие бонусы.', traitsEn: 'Versatile, one extra language, flexible bonuses.', speed: 30 },
    { id: 'elf', name: 'Elf', nameRu: 'Эльфы', traits: 'Тёмное зрение, транс, иммунитет к магическому сну.', traitsEn: 'Darkvision, trance, immunity to magical sleep.', speed: 30 },
    { id: 'dwarf', name: 'Dwarf', nameRu: 'Дварфы', traits: 'Тёмное зрение, стойкость, знание камня.', traitsEn: 'Darkvision, resilience, stonecunning.', speed: 25 },
    { id: 'halfling', name: 'Halfling', nameRu: 'Полурослики', traits: 'Везучие, проворные, бесстрашные.', traitsEn: 'Lucky, nimble, brave.', speed: 25 },
    { id: 'dragonborn', name: 'Dragonborn', nameRu: 'Драконорождённые', traits: 'Драконье наследие и дыхание.', traitsEn: 'Draconic ancestry and breath weapon.', speed: 30 },
    { id: 'gnome', name: 'Gnome', nameRu: 'Гномы', traits: 'Тёмное зрение, гномья хитрость, стойкость к магии.', traitsEn: 'Darkvision, gnome cunning, magic resilience.', speed: 25 },
    { id: 'halfelf', name: 'Half-Elf', nameRu: 'Полуэльфы', traits: 'Гибкие навыки, тёмное зрение, очарование.', traitsEn: 'Flexible skills, darkvision, fey charm.', speed: 30 },
    { id: 'halforc', name: 'Half-Orc', nameRu: 'Полуорки', traits: 'Свирепость, стойкость, тёмное зрение.', traitsEn: 'Savage attacks, resilience, darkvision.', speed: 30 },
    { id: 'tiefling', name: 'Tiefling', nameRu: 'Тифлинги', traits: 'Тёмное зрение, адское сопротивление, врождённая магия.', traitsEn: 'Darkvision, hellish resistance, innate magic.', speed: 30 },
    { id: 'aasimar', name: 'Aasimar', nameRu: 'Аасимары', traits: 'Небесное наследие, тёмное зрение, исцеление.', traitsEn: 'Celestial legacy, darkvision, healing.', speed: 30 },
    { id: 'goliath', name: 'Goliath', nameRu: 'Голиафы', traits: 'Мощное телосложение, сила гор, холод.', traitsEn: 'Powerful build, mountain born, cold resilience.', speed: 30 },
    { id: 'orc', name: 'Orc', nameRu: 'Орки', traits: 'Свирепость, тёмное зрение, сила.', traitsEn: 'Adrenaline rush, darkvision, strength.', speed: 30 }
  ];
  MF.DND_CLASSES = [
    { id: 'barbarian', name: 'Barbarian', nameRu: 'Варвар', hit: 'd12', primary: 'STR' },
    { id: 'bard', name: 'Bard', nameRu: 'Бард', hit: 'd8', primary: 'CHA' },
    { id: 'cleric', name: 'Cleric', nameRu: 'Жрец', hit: 'd8', primary: 'WIS' },
    { id: 'druid', name: 'Druid', nameRu: 'Друид', hit: 'd8', primary: 'WIS' },
    { id: 'fighter', name: 'Fighter', nameRu: 'Воин', hit: 'd10', primary: 'STR / DEX' },
    { id: 'monk', name: 'Monk', nameRu: 'Монах', hit: 'd8', primary: 'DEX / WIS' },
    { id: 'paladin', name: 'Paladin', nameRu: 'Паладин', hit: 'd10', primary: 'STR / CHA' },
    { id: 'ranger', name: 'Ranger', nameRu: 'Следопыт', hit: 'd10', primary: 'DEX / WIS' },
    { id: 'rogue', name: 'Rogue', nameRu: 'Плут', hit: 'd8', primary: 'DEX' },
    { id: 'sorcerer', name: 'Sorcerer', nameRu: 'Чародей', hit: 'd6', primary: 'CHA' },
    { id: 'warlock', name: 'Warlock', nameRu: 'Колдун', hit: 'd8', primary: 'CHA' },
    { id: 'wizard', name: 'Wizard', nameRu: 'Волшебник', hit: 'd6', primary: 'INT' }
  ];
  MF.DND_BACKGROUNDS = [
    { id: 'acolyte', name: 'Acolyte', nameRu: 'Послушник' },
    { id: 'criminal', name: 'Criminal', nameRu: 'Преступник' },
    { id: 'folkhero', name: 'Folk Hero', nameRu: 'Народный герой' },
    { id: 'noble', name: 'Noble', nameRu: 'Знатный' },
    { id: 'sage', name: 'Sage', nameRu: 'Мудрец' },
    { id: 'soldier', name: 'Soldier', nameRu: 'Солдат' },
    { id: 'urchin', name: 'Urchin', nameRu: 'Беспризорник' },
    { id: 'hermit', name: 'Hermit', nameRu: 'Отшельник' },
    { id: 'entertainer', name: 'Entertainer', nameRu: 'Артист' },
    { id: 'artisan', name: 'Guild Artisan', nameRu: 'Ремесленник гильдии' }
  ];
  MF.DND_CAMPAIGNS = [
    { id: 'strahd', name: 'Curse of Strahd', nameRu: 'Проклятие Страда', levels: '1–10', desc: 'Готический домен Баровии, вампир-правитель и сделки, которые слишком хороши, чтобы быть честными.', descEn: 'A gothic domain, a vampire lord and bargains that are too good to be true.' },
    { id: 'phandelver', name: 'Lost Mine of Phandelver', nameRu: 'Затерянная шахта Фанделвера', levels: '1–5', desc: 'Классический старт: пропавший гном, бандиты и древняя шахта.', descEn: 'A classic start: a missing dwarf, bandits and an ancient mine.' },
    { id: 'waterdeep', name: 'Waterdeep: Dragon Heist', nameRu: 'Глубоководье: Похищение дракона', levels: '1–5', desc: 'Городские интриги, тайники и большие деньги в Глубоководье.', descEn: 'Urban intrigue, vaults and big money in a great city.' },
    { id: 'toa', name: 'Tomb of Annihilation', nameRu: 'Гробница Аннигиляции', levels: '1–11', desc: 'Джунгли, смертельная гробница и проклятие, отнимающее жизнь.', descEn: 'Jungles, a deadly tomb and a curse that steals life.' },
    { id: 'sk', name: 'Storm King’s Thunder', nameRu: 'Гром Короля Штормов', levels: '1–11', desc: 'Гиганты вышли из своих крепостей, а север ищет нового порядка.', descEn: 'Giants leave their strongholds and the north searches for a new order.' },
    { id: 'tiamat', name: 'Tyranny of Dragons', nameRu: 'Тирания драконов', levels: '1–15', desc: 'Культ Дракона собирает силы, чтобы вернуть Тиамат в мир.', descEn: 'The Dragon Cult gathers power to bring Tiamat back.' },
    { id: 'abyss', name: 'Out of the Abyss', nameRu: 'Из бездны', levels: '1–15', desc: 'Плен в Подземье, демонические лорды и путь домой.', descEn: 'Captivity in the Underdark, demon lords and the road home.' },
    { id: 'frostmaiden', name: 'Rime of the Frostmaiden', nameRu: 'Иней Ледяной Девы', levels: '1–12', desc: 'Вечная зима, тайны льда и нечто древнее под снегом.', descEn: 'Endless winter, secrets of ice and something ancient beneath the snow.' },
    { id: 'witchlight', name: 'The Wild Beyond the Witchlight', nameRu: 'Дикий край за Ведьмовским светом', levels: '1–8', desc: 'Фейри, ярмарка чудес и путешествие по Стране фей.', descEn: 'Fey, a carnival of wonders and a journey through the Feywild.' },
    { id: 'netherdeep', name: 'Critical Role: Call of the Netherdeep', nameRu: 'Critical Role: Зов Невердипа', levels: '1–13', desc: 'Экзотическое побережье, подводные тайны и соперничество.', descEn: 'An exotic coast, underwater secrets and rivalry.' }
  ];
  MF.DND_RULES = [
    { id: 'checks', title: 'Проверки d20', titleEn: 'd20 tests', text: 'Бросьте d20, добавьте модификатор характеристики и бонус владения, если он применим. Сравните со сложностью (DC), установленной мастером.', textEn: 'Roll d20, add the ability modifier and proficiency bonus if applicable. Compare with the DC set by the GM.' },
    { id: 'advantage', title: 'Преимущество и помеха', titleEn: 'Advantage and disadvantage', text: 'Преимущество — бросайте две d20 и берите лучший результат. Помеха — берите худший. Не складываются: достаточно одного источника.', textEn: 'Advantage: roll two d20 and take the higher result. Disadvantage: take the lower. They do not stack.' },
    { id: 'combat', title: 'Бой', titleEn: 'Combat', text: 'Инициатива, ход, действие, бонусное действие, реакция и перемещение. Атака сравнивается с КД цели; урон вычитается из хитов.', textEn: 'Initiative, turn, action, bonus action, reaction and movement. An attack is compared with AC; damage is subtracted from hit points.' },
    { id: 'rest', title: 'Отдых', titleEn: 'Rest', text: 'Короткий отдых восстанавливает часть ресурсов; продолжительный — хиты и большинство способностей. Конкретные эффекты зависят от класса и издания.', textEn: 'A short rest restores some resources; a long rest restores hit points and most abilities. Exact effects depend on class and edition.' },
    { id: 'magic', title: 'Заклинания', titleEn: 'Spellcasting', text: 'Заклинания требуют ячейки или врождённой магии, времени и компонентов. Концентрация удерживает эффект и может быть нарушена.', textEn: 'Spells require slots or innate magic, time and components. Concentration maintains an effect and can be broken.' },
    { id: 'conditions', title: 'Состояния', titleEn: 'Conditions', text: 'Отравлен, испуган, схвачен, оглушён, ослеплён, очарован, парализован и другие состояния меняют проверки, атаки и перемещение.', textEn: 'Poisoned, frightened, grappled, stunned, blinded, charmed, paralyzed and other conditions change checks, attacks and movement.' }
  ];
  MF.DND_LORE = [
    { id: 'planes', title: 'Планы бытия', titleEn: 'Planes of existence', text: 'Материальный план, Внутренние планы стихий, Внешние планы и Верхний/Нижний мир. Путешествие между ними — отдельное приключение.', textEn: 'The Material Plane, Inner elemental planes, Outer planes and the Upper/Lower realms. Travel between them is an adventure of its own.' },
    { id: 'faerun', title: 'Фаэрун и Побережье Мечей', titleEn: 'Faerûn and the Sword Coast', text: 'Классический сеттинг D&D: города-государства, торговые пути, древние руины и множество богов.', textEn: 'The classic D&D setting: city-states, trade roads, ancient ruins and many gods.' },
    { id: 'underdark', title: 'Подземье', titleEn: 'The Underdark', text: 'Огромные пещеры под миром, где живут дроу, иллитиды, гномы и существа, которым не нужен свет.', textEn: 'Vast caverns beneath the world, home to drow, illithids, deep dwarves and creatures that need no light.' },
    { id: 'weave', title: 'Плетение', titleEn: 'The Weave', text: 'В Фаэруне магия существует как Плетение — сеть, через которую заклинатели касаются силы. Её повреждение меняет мир.', textEn: 'In Faerûn magic exists as the Weave, a network through which casters touch power. Damage to it changes the world.' },
    { id: 'factions', title: 'Фракции и силы', titleEn: 'Factions and powers', text: 'Арфисты, Орден Перчатки, Лорды-протекторы, культы драконов и другие силы постоянно делят влияние.', textEn: 'Harpers, Order of the Gauntlet, Lords’ Alliance, dragon cults and others constantly compete for influence.' },
    { id: 'pantheon', title: 'Пантеоны', titleEn: 'Pantheons', text: 'Боги D&D — не только сила, но и политика: домены, храмы, смертные слуги и старые обиды.', textEn: 'D&D gods are not only power but politics: domains, temples, mortal servants and old grudges.' }
  ];

  MF.dndLabel = function (obj, field) {
    if (!obj) return '';
    return MF.LANG === 'en' ? (obj[field + 'En'] || obj[field]) : (obj[field + 'Ru'] || obj[field]);
  };
  MF.dndModifier = function (score) {
    const value = Math.floor((Number(score || 10) - 10) / 2);
    return value >= 0 ? '+' + value : String(value);
  };
  MF.dndProficiency = function (level) {
    return 2 + Math.floor((Math.max(1, Number(level || 1)) - 1) / 4);
  };
  MF.dndSheetTitle = function (sheet) {
    return sheet.name || MF.t('Новый лист');
  };
  MF.dndClassLabel = function (value) {
    const item = (MF.DND_CLASSES || []).find(function (entry) {
      return entry.id === value || entry.name === value || entry.nameRu === value;
    });
    return item ? MF.dndLabel(item, 'name') : (value || '');
  };
  MF.dndSheetCard = function (sheet) {
    const edition = MF.DND_EDITIONS.find(function (item) { return item.id === sheet.edition; }) || MF.DND_EDITIONS[0];
    const abilities = MF.DND_ABILITIES.map(function (ability) {
      const score = (sheet.abilities || {})[ability.id] || 10;
      return '<span><b>' + ability.short + '</b>' + score + '<small>' + MF.dndModifier(score) + '</small></span>';
    }).join('');
    const dex = Number((sheet.abilities || {}).dex) || 10;
    const wis = Number((sheet.abilities || {}).wis) || 10;
    const prof = Number(sheet.proficiency) || MF.dndProficiency(sheet.level);
    const perceptionProf = (sheet.skills || []).indexOf('perception') !== -1 ? prof : 0;
    const initiative = Math.floor((dex - 10) / 2);
    const passive = 10 + Math.floor((wis - 10) / 2) + perceptionProf;
    return '<article class="dnd-sheet-card" data-action="edit-dnd-sheet" data-id="' + MF.esc(sheet.id) + '" role="button" tabindex="0">' +
      '<div class="dnd-sheet-head"><span class="dnd-edition-badge">' + MF.esc(MF.LANG === 'en' ? edition.labelEn : edition.label) + '</span>' +
      '<button class="icon-btn is-danger dnd-sheet-delete" data-action="delete-dnd-sheet" data-id="' + MF.esc(sheet.id) + '" title="' + MF.t('Удалить лист') + '">' + MF.icon('i-trash') + '</button></div>' +
      '<h3>' + MF.esc(MF.dndSheetTitle(sheet)) + '</h3>' +
      '<p>' + MF.esc([MF.dndClassLabel(sheet.className), sheet.level ? (MF.LANG === 'en' ? 'lvl ' : 'ур. ') + sheet.level : '', sheet.species].filter(Boolean).join(' · ') || MF.t('Лист ещё не заполнен')) + '</p>' +
      '<div class="dnd-mini-abilities">' + abilities + '</div>' +
      '<div class="dnd-sheet-meta"><span>AC <b>' + MF.esc(sheet.ac || '—') + '</b></span><span>HP <b>' + MF.esc((sheet.hpCurrent != null ? sheet.hpCurrent : (sheet.hpMax || '-')) + '/' + (sheet.hpMax || '-')) + '</b></span><span>' + MF.t('Инициатива') + ' <b>' + (initiative >= 0 ? '+' + initiative : initiative) + '</b></span><span>' + MF.t('Пассивное внимание') + ' <b>' + passive + '</b></span><span>' + MF.t('Скорость') + ' <b>' + MF.esc(sheet.speed || '—') + '</b></span></div></article>';
  };

  function tabButton(id, label) {
    return '<button class="dnd-tab ' + ((MF.state.ui.dndTab || 'sheets') === id ? 'active' : '') + '" data-dnd-tab="' + id + '">' + MF.t(label) + '</button>';
  }

  MF.renderDnd = function () {
    const ui = MF.state.ui;
    const tab = ui.dndTab || 'sheets';
    const sheets = MF.state.data.dndSheets || [];
    let content = '';
    if (tab === 'sheets') {
      content = '<div class="dnd-disclaimer">' + MF.icon('i-info') + '<span>' + MF.t('Неофициальный игровой инструмент. Не связан с Wizards of the Coast. Часть правил — по SRD; ссылки ведут на dnd.su.') + '</span></div>' +
        '<div class="dnd-toolbar"><span>' + (MF.LANG === 'en' ? sheets.length + (sheets.length === 1 ? ' sheet' : ' sheets') : sheets.length + ' ' + MF.plural(sheets.length, 'лист', 'листа', 'листов')) + '</span><button class="btn btn-primary btn-sm" data-action="new-dnd-sheet">' + MF.icon('i-plus') + MF.t('Новый лист') + '</button></div>' +
        (sheets.length ? '<div class="dnd-sheet-grid">' + sheets.map(MF.dndSheetCard).join('') + '</div>' :
          '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-shield') + '</div><h2 class="empty-title">' + MF.t('Листов пока нет') + '</h2><p class="empty-text">' + MF.t('Создайте лист персонажа D&D 5e или D&D 2024: характеристики, класс, хиты, навыки и снаряжение.') + '</p><button class="btn btn-primary" data-action="new-dnd-sheet">' + MF.icon('i-plus') + MF.t('Создать первый лист') + '</button></div>');
    } else if (tab === 'races') {
      content = '<div class="dnd-section-head"><div><span class="dnd-kicker">' + MF.t('Стандартные народы') + '</span><h2>' + MF.t('Расы D&D') + '</h2><p>' + MF.t('Справочник основных народов. Можно добавить расу в свой мир и заполнить её по-своему.') + '</p></div><a class="btn btn-subtle btn-sm" href="' + MF.DND_LINK + 'races/" target="_blank" rel="noreferrer">' + MF.icon('i-external') + 'dnd.su</a></div>' +
        '<div class="dnd-reference-grid">' + MF.DND_RACES.map(function (race) {
          return '<article class="dnd-reference-card"><div class="dnd-reference-top"><span class="dnd-edition-badge">' + MF.t('D&D') + '</span><span class="dnd-speed">' + race.speed + ' ft.</span></div><h3>' + MF.esc(MF.dndLabel(race, 'name')) + '</h3><p>' + MF.esc(MF.dndLabel(race, 'traits')) + '</p>' +
            '<button class="btn btn-subtle btn-sm" data-action="dnd-import-race" data-id="' + MF.esc(race.id) + '">' + MF.icon('i-plus') + MF.t('Добавить в мир') + '</button></article>';
        }).join('') + '</div>';
    } else if (tab === 'campaigns') {
      content = '<div class="dnd-section-head"><div><span class="dnd-kicker">' + MF.t('Популярные приключения') + '</span><h2>' + MF.t('Кампании') + '</h2><p>' + MF.t('Краткие ориентиры без пересказа сюжета. Полные материалы ищите на dnd.su и у издателя.') + '</p></div><a class="btn btn-subtle btn-sm" href="' + MF.DND_LINK + '" target="_blank" rel="noreferrer">' + MF.icon('i-external') + 'dnd.su</a></div>' +
        '<div class="dnd-reference-grid">' + MF.DND_CAMPAIGNS.map(function (campaign) {
          return '<article class="dnd-reference-card"><div class="dnd-reference-top"><span class="dnd-edition-badge">' + MF.esc(campaign.levels) + '</span></div><h3>' + MF.esc(MF.dndLabel(campaign, 'name')) + '</h3><p>' + MF.esc(MF.dndLabel(campaign, 'desc')) + '</p></article>';
        }).join('') + '</div>';
    } else if (tab === 'lore') {
      content = '<div class="dnd-section-head"><div><span class="dnd-kicker">' + MF.t('Мир D&D') + '</span><h2>' + MF.t('Лор и космология') + '</h2><p>' + MF.t('Ориентиры для домашних кампаний. Используйте их как основу, а не как единственный канон.') + '</p></div><a class="btn btn-subtle btn-sm" href="' + MF.DND_LINK + '" target="_blank" rel="noreferrer">' + MF.icon('i-external') + 'dnd.su</a></div>' +
        '<div class="dnd-reference-grid">' + MF.DND_LORE.map(function (item) {
          return '<article class="dnd-reference-card"><h3>' + MF.esc(MF.dndLabel(item, 'title')) + '</h3><p>' + MF.esc(MF.dndLabel(item, 'text')) + '</p></article>';
        }).join('') + '</div>';
    } else if (tab === 'rules') {
      content = '<div class="dnd-section-head"><div><span class="dnd-kicker">' + MF.t('Быстрый справочник') + '</span><h2>' + MF.t('Книга правил') + '</h2><p>' + MF.t('Короткие напоминания по базовым механикам. Это не замена книге правил.') + '</p></div><a class="btn btn-subtle btn-sm" href="' + MF.DND_LINK + '" target="_blank" rel="noreferrer">' + MF.icon('i-external') + MF.t('Открыть dnd.su') + '</a></div>' +
        '<div class="dnd-rules-grid">' + MF.DND_RULES.map(function (rule) {
          return '<article class="dnd-rule-card"><h3>' + MF.esc(MF.dndLabel(rule, 'title')) + '</h3><p>' + MF.esc(MF.dndLabel(rule, 'text')) + '</p></article>';
        }).join('') + '</div>' +
        '<p class="dnd-disclaimer">' + MF.icon('i-info') + '<span>' + MF.t('Правила D&D принадлежат Wizards of the Coast. Здесь приведены краткие авторские памятки; для полного текста используйте официальные книги и dnd.su.') + '</span></p>';
    } else {
      content = '<div class="dice-layout"><section class="dice-panel"><div class="dnd-section-head"><div><span class="dnd-kicker">' + MF.t('Броски') + '</span><h2>' + MF.t('Кубы D&D') + '</h2><p>' + MF.t('Бросьте стандартный куб или введите формулу, например 2d6+3.') + '</p></div></div>' +
        '<div class="dice-buttons">' + [4, 6, 8, 10, 12, 20, 100].map(function (sides) { return '<button class="dice-btn" data-dnd-roll="d' + sides + '">d' + sides + '</button>'; }).join('') + '</div>' +
        '<div class="dice-mode-row"><button class="dice-mode" data-dnd-adv="normal">' + MF.t('Обычный') + '</button><button class="dice-mode" data-dnd-adv="adv">' + MF.t('Преимущество') + '</button><button class="dice-mode" data-dnd-adv="dis">' + MF.t('Помеха') + '</button></div>' +
        '<div class="dice-formula-row"><input class="input" id="dndFormula" placeholder="2d6+3" maxlength="30"><button class="btn btn-primary btn-sm" data-action="dnd-roll-custom">' + MF.icon('i-sparkles') + MF.t('Бросить') + '</button></div>' +
        '<div class="dice-result" id="dndDiceResult"><span>' + MF.t('Результат появится здесь') + '</span></div></section>' +
        '<aside class="dice-history"><div class="dnd-kicker">' + MF.t('История') + '</div><div id="dndDiceHistory">' + (MF.state.diceHistory || []).slice(0, 12).map(function (entry) { return '<div class="dice-history-row"><span>' + MF.esc(entry.formula) + '</span><strong>' + MF.esc(entry.total) + '</strong><small>' + MF.esc(entry.detail) + '</small></div>'; }).join('') + '</div></aside></div>';
    }
    return '<div class="view dnd-page"><div class="page-head"><div class="page-head-main"><div class="eyebrow">' + MF.t('D&D Edition') + '</div><h1 class="page-title">' + MF.t('Игровой стол') + '</h1>' +
      '<p class="page-subtitle">' + MF.t('Листы D&D 5e и D&D 2024, стандартные народы, кампании, правила и кубы — в одном месте.') + '</p></div>' +
      '<div class="page-head-actions"><a class="btn btn-subtle" href="' + MF.DND_LINK + '" target="_blank" rel="noreferrer">' + MF.icon('i-external') + 'dnd.su</a><button class="btn btn-primary" data-action="new-dnd-sheet">' + MF.icon('i-plus') + MF.t('Новый лист') + '</button></div></div>' +
      '<div class="dnd-tabs">' + tabButton('sheets', 'Листы') + tabButton('races', 'Расы') + tabButton('campaigns', 'Кампании') + tabButton('lore', 'Лор') + tabButton('rules', 'Правила') + tabButton('dice', 'Кубы') + '</div>' +
      '<div class="dnd-content">' + content + '</div></div>';
  };

  MF.dndRollFormula = function (formula, mode) {
    const clean = String(formula || '').trim().toLowerCase().replace(/\s+/g, '');
    const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) return null;
    const count = MF.clamp(Number(match[1] || 1), 1, 50);
    const sides = MF.clamp(Number(match[2]), 2, 1000);
    const bonus = Number(match[3] || 0);
    let rolls = [];
    if (sides === 20 && (mode === 'adv' || mode === 'dis')) {
      const a = 1 + Math.floor(Math.random() * 20);
      const b = 1 + Math.floor(Math.random() * 20);
      rolls = [mode === 'adv' ? Math.max(a, b) : Math.min(a, b)];
    } else {
      for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(Math.random() * sides));
    }
    const total = rolls.reduce(function (sum, value) { return sum + value; }, 0) + bonus;
    return { formula: clean, total: total, rolls: rolls, bonus: bonus, detail: rolls.join(' + ') + (bonus ? (bonus > 0 ? ' + ' + bonus : ' ' + bonus) : '') };
  };

  MF.dndRoll = function (formula, mode) {
    const result = MF.dndRollFormula(formula, mode);
    if (!result) { MF.toast('Проверьте формулу', 'Используйте формат 2d6+3 или d20.', 'error'); return; }
    MF.state.diceHistory = MF.state.diceHistory || [];
    MF.state.diceHistory.unshift(result);
    MF.state.diceHistory = MF.state.diceHistory.slice(0, 30);
    try { localStorage.setItem('mifarium.diceHistory', JSON.stringify(MF.state.diceHistory)); } catch (e) {}
    const box = MF.$('#dndDiceResult');
    if (box) box.innerHTML = '<strong>' + result.total + '</strong><span>' + MF.esc(result.formula) + ' · ' + MF.esc(result.detail) + '</span>';
    const history = MF.$('#dndDiceHistory');
    if (history) history.innerHTML = MF.state.diceHistory.slice(0, 12).map(function (entry) {
      return '<div class="dice-history-row"><span>' + MF.esc(entry.formula) + '</span><strong>' + MF.esc(entry.total) + '</strong><small>' + MF.esc(entry.detail) + '</small></div>';
    }).join('');
    MF.$$('.dice-btn').forEach(function (button) { button.classList.toggle('is-rolling', button.getAttribute('data-dnd-roll') === result.formula); });
  };

  try {
    MF.state.diceHistory = JSON.parse(localStorage.getItem('mifarium.diceHistory') || '[]');
  } catch (e) {
    MF.state.diceHistory = [];
  }

  MF.bindDnd = function () {
    MF.$$('[data-dnd-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.ui.dndTab = button.getAttribute('data-dnd-tab');
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
    MF.$$('[data-dnd-roll]').forEach(function (button) {
      button.addEventListener('click', function () { MF.dndRoll(button.getAttribute('data-dnd-roll'), MF.state.diceMode || 'normal'); });
    });
    MF.$$('[data-dnd-adv]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.diceMode = button.getAttribute('data-dnd-adv');
        MF.$$('[data-dnd-adv]').forEach(function (item) { item.classList.toggle('active', item === button); });
      });
    });
    const custom = MF.$('#dndFormula');
    if (custom) custom.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); MF.dndRoll(custom.value, MF.state.diceMode || 'normal'); }
    });
    try {
      MF.state.diceHistory = JSON.parse(localStorage.getItem('mifarium.diceHistory') || '[]');
    } catch (e) { MF.state.diceHistory = MF.state.diceHistory || []; }
  };
})();
