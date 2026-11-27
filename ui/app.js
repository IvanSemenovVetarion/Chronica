/* =========================================================
   Chronica — ядро приложения
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF = window.MF || {};

  MF.VERSION = '2.0.1';
  MF.EDITION = 'standard';
  try {
    const editionParam = new URLSearchParams(window.location.search || '').get('edition');
    if (editionParam === 'dnd') MF.EDITION = 'dnd';
  } catch (e) {}
  MF.EDITION_NAME = MF.EDITION === 'dnd' ? 'Chronika DnD Edition' : 'Chronica';

  MF.ENTITY = {
    character: { label: 'Персонаж', plural: 'Персонажи', accusative: 'персонажа', many: 'персонажей', icon: 'i-users', page: 'characters', accent: 'gold' },
    region: { label: 'Регион', plural: 'Регионы', accusative: 'регион', many: 'регионов', icon: 'i-region', page: 'regions', accent: 'green' },
    location: { label: 'Локация', plural: 'Локации', accusative: 'локацию', many: 'локаций', icon: 'i-map', page: 'locations', accent: 'green' },
    faction: { label: 'Фракция', plural: 'Фракции', accusative: 'фракцию', many: 'фракций', icon: 'i-banner', page: 'factions', accent: 'rose' },
    race: { label: 'Раса', plural: 'Расы', accusative: 'расу', many: 'рас', icon: 'i-race', page: 'races', accent: 'blue' },
    lore: { label: 'Статья лора', plural: 'Лор', accusative: 'статью', many: 'статей', icon: 'i-book', page: 'lore', accent: 'blue' },
    event: { label: 'Событие', plural: 'Хронология', accusative: 'событие', many: 'событий', icon: 'i-hourglass', page: 'timeline', accent: 'gold' },
    note: { label: 'Заметка', plural: 'Заметки', accusative: 'заметку', many: 'заметок', icon: 'i-feather', page: 'notes', accent: 'rose' },
    book: { label: 'Источник', plural: 'Библиотека', accusative: 'источник', many: 'источников', icon: 'i-book', page: 'library', accent: 'gold' },
    catalogItem: { label: 'Запись раздела', plural: 'Разделы', accusative: 'запись', many: 'записей', icon: 'i-scroll', page: '', accent: 'gold' },
    dndSheet: { label: 'Лист D&D', plural: 'Листы D&D', accusative: 'лист', many: 'листов', icon: 'i-shield', page: 'dnd', accent: 'rose' }
  };

  MF.PAGE_TITLES = {
    dashboard: 'Обзор',
    characters: 'Персонажи',
    regions: 'Регионы',
    factions: 'Фракции',
    races: 'Расы',
    lore: 'Лор',
    library: 'Библиотека',
    map: 'Карта мира',
    dnd: 'D&D',
    timeline: 'Хронология',
    tree: 'Древо рода',
    notes: 'Заметки',
    settings: 'Настройки'
  };

  MF.STATUSES = ['Жив', 'Жива', 'Погиб', 'Погибла', 'Пропал', 'Пропала', 'Неизвестно'];
  MF.EVENT_TYPES = {
    battle: { label: 'Битва', icon: 'i-swords', cls: 'battle' },
    politics: { label: 'Политика', icon: 'i-crown', cls: 'politics' },
    magic: { label: 'Магия', icon: 'i-sparkles', cls: 'magic' },
    disaster: { label: 'Катастрофа', icon: 'i-alert', cls: 'disaster' },
    discovery: { label: 'Открытие', icon: 'i-compass', cls: 'discovery' },
    union: { label: 'Союз', icon: 'i-link', cls: 'union' },
    death: { label: 'Смерть', icon: 'i-scroll', cls: 'death' },
    birth: { label: 'Рождение', icon: 'i-heart', cls: 'birth' },
    other: { label: 'Другое', icon: 'i-more', cls: 'other' }
  };
  MF.LORE_CATEGORIES = ['История', 'Магия', 'Религия', 'Артефакты', 'Бестиарий', 'Культура', 'География', 'Персоналии', 'Другое'];
  MF.BOOK_TYPES = ['Книга', 'Повесть', 'Рассказ', 'Сага', 'Цикл', 'Дневник', 'Хроника', 'Миф', 'Сборник', 'Другое'];
  MF.LOCATION_TYPES = ['Столица', 'Город', 'Крепость', 'Деревня', 'Долина', 'Лес', 'Горы', 'Пустошь', 'Озеро', 'Море', 'Остров', 'Руина', 'Святилище', 'Портал', 'Другое'];
  MF.FACTION_TYPES = ['Королевский дом', 'Знатный род', 'Тайный орден', 'Религиозный орден', 'Гильдия', 'Наёмное братство', 'Ковен', 'Племя', 'Союз', 'Другое'];
  MF.REGION_TYPES = ['Королевство', 'Провинция', 'Долины', 'Горы', 'Лесной край', 'Пустошь', 'Острова', 'Побережье', 'Священные земли', 'Дикие земли', 'Руины', 'Другое'];
  MF.RACE_TYPES = [
    'Смертные', 'Древние', 'Одарённые', 'Звери', 'Небожители', 'Созданные', 'Полулюди',
    'Драконы', 'Эльфы', 'Дварфы', 'Орки', 'Полурослики', 'Гоблины', 'Нежить', 'Демоны',
    'Ангелы', 'Духи', 'Элементали', 'Киборги', 'Мутанты', 'Боги', 'Титаны', 'Наги',
    'Кентавры', 'Оборотни', 'Вампиры', 'Феи', 'Русалки', 'Другое'
  ];
  MF.GENDERS = ['Женский', 'Мужской', 'Иной', 'Не указан'];
  MF.STANDARD_CHARACTER_FIELDS = [
    { key: 'portrait', label: 'Большой портрет' },
    { key: 'gallery', label: 'Галерея' },
    { key: 'title', label: 'Титул или прозвище' },
    { key: 'role', label: 'Роль в истории' },
    { key: 'status', label: 'Статус' },
    { key: 'race', label: 'Раса и народ' },
    { key: 'gender', label: 'Пол' },
    { key: 'age', label: 'Возраст' },
    { key: 'faction', label: 'Фракция' },
    { key: 'location', label: 'Локация' },
    { key: 'quote', label: 'Цитата' },
    { key: 'description', label: 'История' },
    { key: 'personality', label: 'Характер' },
    { key: 'appearance', label: 'Внешность' },
    { key: 'palette', label: 'Палитра образа' },
    { key: 'tags', label: 'Метки' },
    { key: 'family', label: 'Семья' },
    { key: 'audio', label: 'Голос и музыка' }
  ];
  MF.DEEPSEEK_MODELS = [
    { id: 'deepseek-chat', label: 'DeepSeek Chat · быстрый и точный' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner · глубокий разбор' }
  ];
  MF.THEMES = [
    { id: 'dark', label: 'Полночь', mode: 'dark', bg: '#12100e', surface: '#24211e', accent: '#d4af37', hint: 'Тёплая бумага и латунь' },
    { id: 'emerald', label: 'Изумруд', mode: 'dark', bg: '#07130f', surface: '#11291f', accent: '#8fbf9f', hint: 'Мох и серебро' },
    { id: 'rosequartz', label: 'Розовый кварц', mode: 'dark', bg: '#150c12', surface: '#2c1823', accent: '#d3a3ad', hint: 'Нежный камень' },
    { id: 'wine', label: 'Багровый двор', mode: 'dark', bg: '#12080b', surface: '#2b151b', accent: '#c0837b', hint: 'Вино и медь' },
    { id: 'sapphire', label: 'Лазурь', mode: 'dark', bg: '#07111c', surface: '#122537', accent: '#8fb4d8', hint: 'Ночное море' },
    { id: 'amethyst', label: 'Аметист', mode: 'dark', bg: '#0f0a17', surface: '#231732', accent: '#b7a0d6', hint: 'Королевский камень' },
    { id: 'obsidian', label: 'Обсидиан', mode: 'dark', bg: '#0a0e11', surface: '#19242b', accent: '#a7b4b8', hint: 'Камень и пепел' },
    { id: 'copper', label: 'Медная осень', mode: 'dark', bg: '#171006', surface: '#25180b', accent: '#d09a62', hint: 'Медь и охра' },
    { id: 'ocean', label: 'Глубина', mode: 'dark', bg: '#06141a', surface: '#0c2630', accent: '#7fc4d4', hint: 'Морская бирюза' },
    { id: 'plum', label: 'Сливовый сад', mode: 'dark', bg: '#140b16', surface: '#24132a', accent: '#c49acb', hint: 'Слива и дым' },
    { id: 'steel', label: 'Холодная сталь', mode: 'dark', bg: '#0b1014', surface: '#152027', accent: '#9fb3c8', hint: 'Сталь и туман' },
    { id: 'moss', label: 'Мшистый камень', mode: 'dark', bg: '#12150b', surface: '#1e2312', accent: '#c0b877', hint: 'Мох и олива' },
    { id: 'light', label: 'Пергамент', mode: 'light', bg: '#ece5d8', surface: '#f4eee2', accent: '#97702d', hint: 'Тёплая бумага' },
    { id: 'dungeon', label: 'Подземелье', mode: 'dark', bg: '#0d0c0a', surface: '#1c1915', accent: '#c79a56', hint: 'Факелы и камень' },
    { id: 'dragon', label: 'Драконье пламя', mode: 'dark', bg: '#160806', surface: '#2a100d', accent: '#d06a4f', hint: 'Угли и золото' },
    { id: 'heraldry', label: 'Геральдика', mode: 'dark', bg: '#071225', surface: '#102543', accent: '#c9a95c', hint: 'Знамёна и сталь' },
    { id: 'nebula', label: 'Туманность', mode: 'dark', bg: '#090818', surface: '#17102f', accent: '#a78bfa', hint: 'Звёздная пыль' },
    { id: 'terminal', label: 'Терминал', mode: 'dark', bg: '#050b08', surface: '#0c1a12', accent: '#6ee7a0', hint: 'Код и сигнал' },
    { id: 'starship', label: 'Звёздный корабль', mode: 'dark', bg: '#081016', surface: '#12232d', accent: '#67c7e8', hint: 'Металл и космос' },
    { id: 'bloodmoon', label: 'Кровавая луна', mode: 'dark', bg: '#120609', surface: '#260c14', accent: '#d46a7a', hint: 'Проклятие и шёлк' },
    { id: 'grimoire', label: 'Гримуар', mode: 'dark', bg: '#0d0a13', surface: '#1c1429', accent: '#b49ce8', hint: 'Пыль и заклинания' },
    { id: 'jade', label: 'Нефрит', mode: 'dark', bg: '#071512', surface: '#0d2a25', accent: '#79d6b0', hint: 'Камень и туман' },
    { id: 'rust', label: 'Ржавчина', mode: 'dark', bg: '#120d09', surface: '#26180f', accent: '#d18a57', hint: 'Пепел и выживание' },
    { id: 'brass', label: 'Латунь', mode: 'dark', bg: '#12100a', surface: '#262013', accent: '#d8b06a', hint: 'Пар и механизмы' },
    { id: 'frost', label: 'Иней', mode: 'dark', bg: '#08121a', surface: '#102630', accent: '#a8d8ea', hint: 'Лёд и северное сияние' }
  ];
  MF.FONTS = [
    { id: 'forum', label: 'Книжный', sample: 'Аа Бб', hint: 'Lora и Inter' },
    { id: 'manuscript', label: 'Манускрипт', sample: 'Аа Бб', hint: 'Изящная антиква' },
    { id: 'antiqua', label: 'Антиква', sample: 'Аа Бб', hint: 'Классическая книга' },
    { id: 'classic', label: 'Классика', sample: 'Аа Бб', hint: 'Георгиевский шрифт' },
    { id: 'modern', label: 'Современный', sample: 'Аа Бб', hint: 'Чистый интерфейс' },
    { id: 'compact', label: 'Компактный', sample: 'Аа Бб', hint: 'Плотная посадка' },
    { id: 'script', label: 'Рукопись', sample: 'Аа Бб', hint: 'Для настроения' }
  ];
  MF.CUSTOM_FONTS = [];
  MF.customIcons = {};
  MF.background = { url: '', blur: 10, dim: 32 };
  MF.NAV_ICONS = [
    { key: 'dashboard', label: 'Обзор', icon: 'i-compass' },
    { key: 'characters', label: 'Персонажи', icon: 'i-users' },
    { key: 'regions', label: 'Регионы', icon: 'i-region' },
    { key: 'factions', label: 'Фракции', icon: 'i-banner' },
    { key: 'races', label: 'Расы', icon: 'i-race' },
    { key: 'lore', label: 'Лор', icon: 'i-book' },
    { key: 'library', label: 'Библиотека', icon: 'i-scroll' },
    { key: 'map', label: 'Карта мира', icon: 'i-map' },
    { key: 'timeline', label: 'Хронология', icon: 'i-hourglass' },
    { key: 'tree', label: 'Древо', icon: 'i-tree' },
    { key: 'notes', label: 'Заметки', icon: 'i-feather' },
    { key: 'settings', label: 'Настройки', icon: 'i-settings' }
  ];

  MF.characterFieldConfig = { hidden: [] };
  MF.loadCharacterFields = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('mifarium.characterFields') || '{}');
      MF.characterFieldConfig.hidden = Array.isArray(raw && raw.hidden) ? raw.hidden.filter(Boolean) : [];
    } catch (e) {
      MF.characterFieldConfig.hidden = [];
    }
  };
  MF.saveCharacterFields = function () {
    try { localStorage.setItem('mifarium.characterFields', JSON.stringify(MF.characterFieldConfig)); } catch (e) {}
  };
  MF.isCharacterFieldVisible = function (key) {
    return MF.characterFieldConfig.hidden.indexOf(key) === -1;
  };
  MF.setCharacterFieldVisible = function (key, visible) {
    const hidden = MF.characterFieldConfig.hidden.filter(function (item) { return item !== key; });
    if (!visible) hidden.push(key);
    MF.characterFieldConfig.hidden = hidden;
    MF.saveCharacterFields();
  };
  MF.resetCharacterFields = function () {
    MF.characterFieldConfig.hidden = [];
    MF.saveCharacterFields();
  };

  MF.normalizeLegacyAppName = function (name) {
    const clean = String(name || '').trim();
    const legacy = ['Мир TitZero', 'TitZero', 'Мифариум', 'Mifarium', 'Мир Mifarium', 'Мир Chronica'];
    return legacy.indexOf(clean) !== -1 ? 'Chronica' : clean;
  };

  MF.getAppName = function () {
    try {
      const stored = (localStorage.getItem('mifarium.appName') || '').trim();
      if (stored) {
        const mapped = MF.normalizeLegacyAppName(stored);
        if (mapped !== stored) {
          try { localStorage.setItem('mifarium.appName', mapped); } catch (e) {}
        }
        return mapped;
      }
    } catch (e) {}
    return MF.normalizeLegacyAppName((MF.state.info && MF.state.info.appName) || 'Chronica') || 'Chronica';
  };
  MF.applyAppName = function (name) {
    const clean = String(name || '').trim().slice(0, 48) || 'Chronica';
    MF.state.appName = clean;
    document.title = clean + ' — ' + MF.t('хранитель миров');
    const brand = MF.$('.brand-title');
    if (brand) brand.textContent = clean;
    const boot = MF.$('.boot-title');
    if (boot) boot.textContent = clean;
    const about = MF.$('.about-title');
    if (about) about.textContent = clean;
    const sidebarVersion = MF.$('.sidebar-version');
    if (sidebarVersion) sidebarVersion.textContent = clean + ' · v' + MF.VERSION;
  };
  MF.refreshUpdateUI = function () {
    const current = MF.$('#updateCurrentVersion');
    if (current) current.textContent = 'v' + MF.VERSION;
    const repoInput = MF.$('#githubRepoInput');
    if (repoInput && (!MF.state.info || !repoInput.matches(':focus'))) {
      repoInput.value = (MF.state.info && MF.state.info.githubRepo) || 'IvanSemenovVetarion/Chronica';
    }
    const status = MF.$('#updateStatus');
    const button = MF.$('#updateDownloadBtn');
    if (button) button.classList.add('is-hidden');
    if (!status) return;
    if (MF.state.update.checking) {
      status.textContent = 'Проверяем GitHub…';
      return;
    }
    const latest = MF.state.update.latest;
    if (!latest) {
      status.textContent = 'Проверка ещё не выполнялась.';
      return;
    }
    if (latest.isNewer) {
      status.textContent = MF.LANG === 'en'
        ? 'Version ' + latest.latestVersion + ' is available · you have ' + MF.VERSION + '.'
        : 'Доступна версия ' + latest.latestVersion + ' · у вас ' + MF.VERSION + '.';
      if (button) {
        button.classList.remove('is-hidden');
        button.textContent = (latest.downloadUrl ? (MF.LANG === 'en' ? 'Download ' : 'Скачать ') : (MF.LANG === 'en' ? 'Open ' : 'Открыть ')) + latest.latestVersion;
      }
    } else {
      status.textContent = MF.LANG === 'en'
        ? 'You have the latest version · ' + MF.VERSION + '.'
        : 'У вас последняя версия · ' + MF.VERSION + '.';
    }
  };

  MF.checkUpdates = async function () {
    if (!MF.isNative) { MF.toast('Только в приложении', 'Проверка обновлений доступна в настольной версии.', 'info'); return; }
    await MF.saveGithubRepo(true);
    MF.state.update.checking = true;
    MF.refreshUpdateUI();
    try {
      const result = await MF.invoke('checkUpdates', null, { timeoutMs: 60000 });
      MF.state.update.latest = result;
      MF.state.update.checking = false;
      MF.refreshUpdateUI();
      MF.toast(result.isNewer ? 'Доступно обновление' : 'Обновлений нет',
        result.isNewer ? 'Версия ' + result.latestVersion + ' уже на GitHub.' : 'У вас последняя версия Chronica.',
        result.isNewer ? 'success' : 'info');
    } catch (error) {
      MF.state.update.checking = false;
      MF.state.update.latest = null;
      MF.refreshUpdateUI();
      const status = MF.$('#updateStatus');
      if (status) status.textContent = error.message || 'Не удалось проверить обновления.';
      MF.toast('Не удалось проверить обновления', error.message || 'Проверьте репозиторий и интернет.', 'error');
    }
  };

  MF.saveGithubRepo = async function (silent) {
    if (!MF.isNative) return;
    const input = MF.$('#githubRepoInput');
    const repo = input ? input.value.trim() : ((MF.state.info && MF.state.info.githubRepo) || '');
    try {
      const result = await MF.invoke('saveGitHubRepo', { repo: repo });
      MF.state.info = MF.state.info || {};
      MF.state.info.githubRepo = result.repo || '';
      MF.refreshUpdateUI();
      if (!silent) MF.toast('GitHub-репозиторий сохранён', result.repo || 'Адрес очищен.', 'success');
    } catch (error) {
      if (!silent) MF.toast('Не удалось сохранить репозиторий', error.message || 'Проверьте адрес.', 'error');
    }
  };

  MF.openGithub = function () {
    const repo = (MF.state.info && MF.state.info.githubRepo) || '';
    if (!repo) { MF.toast('GitHub не настроен', 'Укажите владельца/репозиторий в настройках.', 'info'); return; }
    window.open('https://github.com/' + repo, '_blank');
  };

  MF.downloadUpdate = function () {
    const latest = MF.state.update.latest;
    if (!latest) { MF.checkUpdates(); return; }
    if (!latest.downloadUrl) { MF.openGithub(); return; }
    MF.openConfirm({
      title: 'Скачать Chronica ' + latest.latestVersion + '?',
      text: 'Будет скачан установщик из GitHub Release. После загрузки Chronica предложит запустить его. Текущая версия: ' + MF.VERSION + '.',
      confirmLabel: 'Скачать',
      danger: false,
      onConfirm: async function () {
        try {
          const result = await MF.invoke('downloadUpdate', {
            url: latest.downloadUrl,
            version: latest.latestVersion
          }, { timeoutMs: 600000 });
          if (!result || !result.path) throw new Error('Установщик не был скачан.');
          setTimeout(function () {
            MF.openConfirm({
              title: 'Установщик скачан',
              text: 'Файл: ' + result.path + '\n\nЗапустить установщик сейчас? Chronica закроется.',
              confirmLabel: 'Запустить установщик',
              danger: false,
              onConfirm: async function () {
                await MF.invoke('runInstaller', { path: result.path });
              }
            });
          }, 80);
        } catch (error) {
          MF.toast('Не удалось скачать обновление', error.message || 'Попробуйте позже.', 'error');
        }
      }
    });
  };

  MF.setAppName = function (name, options) {
    const opts = options || {};
    const clean = String(name || '').trim().slice(0, 48);
    if (!clean) { MF.toast('Название пустое', 'Введите название программы.', 'error'); return; }
    try { localStorage.setItem('mifarium.appName', clean); } catch (e) {}
    MF.applyAppName(clean);
    if (MF.isNative) MF.invoke('setAppName', { appName: clean }).catch(function () {});
    if (opts.announce) MF.toast('Название изменено', 'Теперь программа называется «' + clean + '».', 'success');
  };
  MF.loadCustomFonts = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('mifarium.customFonts') || '[]');
      MF.CUSTOM_FONTS = Array.isArray(raw) ? raw.filter(function (font) {
        return font && font.id && font.family && font.url;
      }) : [];
    } catch (e) {
      MF.CUSTOM_FONTS = [];
    }
    MF.ensureCustomFontFaces();
  };
  MF.saveCustomFonts = function () {
    try { localStorage.setItem('mifarium.customFonts', JSON.stringify(MF.CUSTOM_FONTS)); } catch (e) {}
  };
  MF.ensureCustomFontFaces = function () {
    let style = document.getElementById('customFontFaces');
    if (!style) {
      style = document.createElement('style');
      style.id = 'customFontFaces';
      document.head.appendChild(style);
    }
    style.textContent = MF.CUSTOM_FONTS.map(function (font) {
      const url = String(font.url || '').replace(/["\\)]/g, '');
      return '@font-face{font-family:"' + font.family + '";src:url("' + url + '");font-display:swap;}';
    }).join('');
  };
  MF.allFonts = function () {
    return MF.FONTS.concat(MF.CUSTOM_FONTS.map(function (font) {
      return { id: 'custom:' + font.id, label: font.name, sample: 'Аа Бб', hint: 'Свой шрифт', custom: true, family: font.family };
    }));
  };
  MF.loadCustomIcons = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('mifarium.customIcons') || '{}');
      MF.customIcons = raw && typeof raw === 'object' ? raw : {};
    } catch (e) {
      MF.customIcons = {};
    }
  };
  MF.saveCustomIcons = function () {
    try { localStorage.setItem('mifarium.customIcons', JSON.stringify(MF.customIcons)); } catch (e) {}
  };
  MF.applyCustomIcons = function () {
    MF.$$('.nav-item[data-nav]').forEach(function (button) {
      const key = button.getAttribute('data-nav');
      const url = MF.customIcons[key];
      const svg = button.querySelector('svg.icon');
      let img = button.querySelector('.nav-icon-img');
      if (url) {
        if (!img) {
          img = document.createElement('img');
          img.className = 'nav-icon-img';
          img.alt = '';
          button.insertBefore(img, svg || button.firstChild);
        }
        img.src = url;
        if (svg) svg.style.display = 'none';
      } else {
        if (img && img.parentNode) img.parentNode.removeChild(img);
        if (svg) svg.style.display = '';
      }
    });
  };
  MF.loadBackground = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('mifarium.background') || '{}');
      MF.background.url = raw && raw.url ? String(raw.url) : '';
      MF.background.blur = Math.max(0, Math.min(30, Number(raw && raw.blur)));
      MF.background.dim = Math.max(0, Math.min(80, Number(raw && raw.dim)));
      if (!Number.isFinite(MF.background.blur)) MF.background.blur = 10;
      if (!Number.isFinite(MF.background.dim)) MF.background.dim = 32;
    } catch (e) {
      MF.background = { url: '', blur: 10, dim: 32 };
    }
    MF.applyBackground();
  };
  MF.saveBackground = function () {
    try { localStorage.setItem('mifarium.background', JSON.stringify(MF.background)); } catch (e) {}
  };
  MF.applyBackground = function () {
    const root = document.documentElement;
    const has = !!MF.background.url;
    document.body.classList.toggle('has-custom-bg', has);
    if (has) {
      root.style.setProperty('--custom-bg-image', 'url("' + String(MF.background.url).replace(/"/g, '%22') + '")');
      root.style.setProperty('--custom-bg-blur', MF.background.blur + 'px');
      root.style.setProperty('--custom-bg-dim', String(MF.background.dim / 100));
    } else {
      root.style.removeProperty('--custom-bg-image');
      root.style.removeProperty('--custom-bg-blur');
      root.style.removeProperty('--custom-bg-dim');
    }
    const preview = MF.$('#bgPreview');
    if (preview) {
      preview.style.backgroundImage = has ? 'url("' + String(MF.background.url).replace(/"/g, '%22') + '")' : '';
      preview.classList.toggle('has-image', has);
    }
    const blur = MF.$('#bgBlur');
    if (blur) blur.value = String(MF.background.blur);
    const dim = MF.$('#bgDim');
    if (dim) dim.value = String(MF.background.dim);
    const blurValue = MF.$('#bgBlurValue');
    if (blurValue) blurValue.textContent = MF.background.blur + ' px';
    const dimValue = MF.$('#bgDimValue');
    if (dimValue) dimValue.textContent = MF.background.dim + '%';
  };
  MF.setBackgroundBlur = function (value) {
    MF.background.blur = Math.max(0, Math.min(30, Number(value) || 0));
    MF.saveBackground();
    MF.applyBackground();
  };
  MF.setBackgroundDim = function (value) {
    MF.background.dim = Math.max(0, Math.min(80, Number(value) || 0));
    MF.saveBackground();
    MF.applyBackground();
  };
  MF.NOTE_COLORS = [
    { id: 'gold', label: 'Золото', color: '#c5a15f' },
    { id: 'sage', label: 'Шалфей', color: '#7fac8d' },
    { id: 'rose', label: 'Роза', color: '#c28e9c' },
    { id: 'blue', label: 'Лазурь', color: '#7fa8c4' }
  ];

  MF.NAV_GROUPS = [
    { id: 'world', label: 'Мир' },
    { id: 'chronicle', label: 'Летопись' },
    { id: 'workshop', label: 'Мастерская' }
  ];
  MF.CORE_NAV_ITEMS = [
    { page: 'dashboard', group: 'world', label: 'Обзор', icon: 'i-compass' },
    { page: 'characters', group: 'world', label: 'Персонажи', icon: 'i-users' },
    { page: 'regions', group: 'world', label: 'Регионы', icon: 'i-region' },
    { page: 'factions', group: 'world', label: 'Фракции', icon: 'i-banner' },
    { page: 'map', group: 'world', label: 'Карта мира', icon: 'i-map' },
    { page: 'races', group: 'chronicle', label: 'Расы', icon: 'i-race' },
    { page: 'lore', group: 'chronicle', label: 'Лор', icon: 'i-book' },
    { page: 'library', group: 'chronicle', label: 'Библиотека', icon: 'i-scroll' },
    { page: 'timeline', group: 'chronicle', label: 'Хронология', icon: 'i-hourglass' },
    { page: 'tree', group: 'chronicle', label: 'Древо', icon: 'i-tree' },
    { page: 'dnd', group: 'workshop', label: 'D&D', icon: 'i-shield', edition: 'dnd' },
    { page: 'notes', group: 'workshop', label: 'Заметки', icon: 'i-feather' }
  ];

  function catalogDef(genre, key, label, labelEn, icon, group, name, nameEn, description, descriptionEn) {
    return {
      key: key, label: label, labelEn: labelEn, icon: icon, group: group,
      catalog: {
        id: 'cat_' + genre + '_' + key, name: name || label, nameEn: nameEn || labelEn,
        icon: icon, description: description || '', descriptionEn: descriptionEn || ''
      }
    };
  }

  MF.GENRE_EXTRAS = {
    fantasy: [
      catalogDef('fantasy', 'artifacts', 'Артефакты', 'Artifacts', 'i-sparkles', 'chronicle', 'Артефакты', 'Artifacts', 'Магические предметы, реликвии и проклятые вещи.', 'Magic items, relics and cursed objects.'),
      catalogDef('fantasy', 'bestiary', 'Бестиарий', 'Bestiary', 'i-race', 'chronicle', 'Бестиарий', 'Bestiary', 'Существа, звери и легендарные чудовища.', 'Creatures, beasts and legendary monsters.')
    ],
    dnd: [
      catalogDef('dnd', 'equipment', 'Снаряжение', 'Equipment', 'i-shield', 'world', 'Снаряжение', 'Equipment', 'Оружие, броня, инструменты и походные вещи.', 'Weapons, armor, tools and travel gear.'),
      catalogDef('dnd', 'monsters', 'Монстры', 'Monsters', 'i-alert', 'chronicle', 'Монстры', 'Monsters', 'Бестиарий партии и её противников.', 'A bestiary of the party and its enemies.')
    ],
    medieval: [
      catalogDef('medieval', 'weapons', 'Оружие', 'Weapons', 'i-shield', 'world', 'Оружие', 'Weapons', 'Клинки, копья, луки и осадные машины.', 'Blades, spears, bows and siege engines.'),
      catalogDef('medieval', 'castles', 'Замки', 'Castles', 'i-banner', 'world', 'Замки', 'Castles', 'Крепости, башни и укрепления.', 'Fortresses, towers and strongholds.')
    ],
    scifi: [
      catalogDef('scifi', 'technology', 'Технологии', 'Technology', 'i-settings', 'chronicle', 'Технологии', 'Technology', 'Устройства, импланты и научные открытия.', 'Devices, implants and scientific discoveries.'),
      catalogDef('scifi', 'ships', 'Корабли', 'Ships', 'i-compass', 'world', 'Корабли', 'Ships', 'Звёздные корабли, шаттлы и станции.', 'Starships, shuttles and stations.'),
      catalogDef('scifi', 'weapons', 'Оружие', 'Weapons', 'i-shield', 'world', 'Оружие', 'Weapons', 'Огнестрельное, энергетическое и экспериментальное оружие.', 'Firearms, energy weapons and prototypes.')
    ],
    dark: [
      catalogDef('dark', 'rituals', 'Ритуалы', 'Rituals', 'i-moon', 'chronicle', 'Ритуалы', 'Rituals', 'Запретные обряды и их цена.', 'Forbidden rites and their price.'),
      catalogDef('dark', 'curses', 'Проклятия', 'Curses', 'i-heart', 'chronicle', 'Проклятия', 'Curses', 'Проклятия, одержимость и тёмные дары.', 'Curses, possession and dark gifts.')
    ],
    eastern: [
      catalogDef('eastern', 'techniques', 'Техники', 'Techniques', 'i-sparkles', 'world', 'Техники', 'Techniques', 'Боевые и духовные практики.', 'Martial and spiritual practices.'),
      catalogDef('eastern', 'spirits', 'Духи', 'Spirits', 'i-race', 'chronicle', 'Духи', 'Spirits', 'Духи мест, предки и хранители.', 'Local spirits, ancestors and guardians.')
    ],
    steampunk: [
      catalogDef('steampunk', 'weapons', 'Оружие', 'Weapons', 'i-shield', 'world', 'Оружие', 'Weapons', 'Огнестрельное оружие, пушки и паровые устройства.', 'Firearms, cannons and steam devices.'),
      catalogDef('steampunk', 'transport', 'Транспорт', 'Transport', 'i-compass', 'world', 'Транспорт', 'Transport', 'Поезда, дирижабли, автомобили и ДВС.', 'Trains, airships, cars and combustion engines.'),
      catalogDef('steampunk', 'mechanisms', 'Механизмы', 'Mechanisms', 'i-settings', 'chronicle', 'Механизмы', 'Mechanisms', 'Машины, автоматоны и изобретения.', 'Machines, automatons and inventions.')
    ],
    postapoc: [
      catalogDef('postapoc', 'weapons', 'Оружие', 'Weapons', 'i-shield', 'world', 'Оружие', 'Weapons', 'Огнестрельное оружие, самоделки и боеприпасы.', 'Firearms, scrap weapons and ammunition.'),
      catalogDef('postapoc', 'transport', 'Транспорт', 'Transport', 'i-compass', 'world', 'Транспорт', 'Transport', 'Внедорожники, мотоциклы и машины с ДВС.', 'Off-roaders, motorcycles and combustion vehicles.'),
      catalogDef('postapoc', 'shelters', 'Убежища', 'Shelters', 'i-banner', 'world', 'Убежища', 'Shelters', 'Бункеры, лагеря и безопасные места.', 'Bunkers, camps and safe places.')
    ],
    mythic: [
      catalogDef('mythic', 'artifacts', 'Артефакты', 'Artifacts', 'i-sparkles', 'chronicle', 'Артефакты', 'Artifacts', 'Божественные реликвии и древние дары.', 'Divine relics and ancient gifts.'),
      catalogDef('mythic', 'gods', 'Боги', 'Gods', 'i-crown', 'chronicle', 'Боги', 'Gods', 'Пантеон, культы и божественные силы.', 'Pantheon, cults and divine powers.')
    ],
    urban: [
      catalogDef('urban', 'societies', 'Тайные общества', 'Secret societies', 'i-users', 'world', 'Тайные общества', 'Secret societies', 'Клубы, культы и организации под городом.', 'Clubs, cults and organizations beneath the city.'),
      catalogDef('urban', 'artifacts', 'Артефакты', 'Artifacts', 'i-sparkles', 'chronicle', 'Артефакты', 'Artifacts', 'Городские реликвии и странные находки.', 'Urban relics and strange finds.')
    ]
  };

  MF.PATTERNS = [
    { id: 'contour', label: 'Контуры', hint: 'Старинные карты и линии высот' },
    { id: 'stars', label: 'Звёзды', hint: 'Ночное небо и созвездия' },
    { id: 'runes', label: 'Руны', hint: 'Письмена древних народов' },
    { id: 'waves', label: 'Волны', hint: 'Море, туман и течение' },
    { id: 'grid', label: 'Сетка', hint: 'Архитектура и звёздные карты' },
    { id: 'crystals', label: 'Кристаллы', hint: 'Осколки магии и минералы' },
    { id: 'leaves', label: 'Листья', hint: 'Леса, травы и жизнь' },
    { id: 'gears', label: 'Шестерни', hint: 'Механизмы и пар' },
    { id: 'cracks', label: 'Трещины', hint: 'Пепел, руины и время' },
    { id: 'hex', label: 'Гексы', hint: 'Карты и пчелиные соты' },
    { id: 'aurora', label: 'Аврора', hint: 'Северное сияние и свет' },
    { id: 'circuit', label: 'Схемы', hint: 'Технологии и сигналы' },
    { id: 'dunes', label: 'Дюны', hint: 'Песок и дальние дороги' },
    { id: 'snow', label: 'Снег', hint: 'Зима и тихие хлопья' },
    { id: 'bamboo', label: 'Бамбук', hint: 'Восток и сады' }
  ];

  MF.GENRES = [
    {
      id: 'fantasy', label: 'Фэнтези', labelEn: 'Fantasy', icon: 'i-sparkles', pattern: 'contour', font: 'forum',
      themes: ['dark', 'emerald', 'moss'],
      hint: 'Магия, древние королевства и судьбы героев',
      hintEn: 'Magic, ancient kingdoms and heroic destinies'
    },
    {
      id: 'dnd', label: 'D&D и настольные миры', labelEn: 'D&D & tabletop', icon: 'i-shield', pattern: 'runes', font: 'antiqua',
      themes: ['dungeon', 'dragon', 'heraldry'],
      hint: 'Подземелья, драконы, партии и приключения',
      hintEn: 'Dungeons, dragons, parties and adventures'
    },
    {
      id: 'medieval', label: 'Средневековье', labelEn: 'Medieval', icon: 'i-crown', pattern: 'grid', font: 'manuscript',
      themes: ['parchment', 'heraldry', 'copper'],
      hint: 'Дома, турниры, интриги и хроники',
      hintEn: 'Houses, tournaments, intrigue and chronicles'
    },
    {
      id: 'scifi', label: 'Фантастика', labelEn: 'Science fiction', icon: 'i-compass', pattern: 'grid', font: 'modern',
      themes: ['nebula', 'terminal', 'starship'],
      hint: 'Звёзды, технологии и будущее',
      hintEn: 'Stars, technology and the future'
    },
    {
      id: 'dark', label: 'Тёмное фэнтези', labelEn: 'Dark fantasy', icon: 'i-moon', pattern: 'runes', font: 'manuscript',
      themes: ['bloodmoon', 'grimoire', 'obsidian'],
      hint: 'Проклятия, кровь и цена силы',
      hintEn: 'Curses, blood and the price of power'
    },
    {
      id: 'eastern', label: 'Восточные миры', labelEn: 'Eastern worlds', icon: 'i-race', pattern: 'waves', font: 'classic',
      themes: ['jade', 'plum', 'sapphire'],
      hint: 'Духи, кланы, нефрит и честь',
      hintEn: 'Spirits, clans, jade and honor'
    },
    {
      id: 'steampunk', label: 'Стимпанк', labelEn: 'Steampunk', icon: 'i-settings', pattern: 'gears', font: 'modern',
      themes: ['brass', 'copper', 'steel'],
      hint: 'Пар, шестерни и викторианские тайны',
      hintEn: 'Steam, gears and Victorian mysteries'
    },
    {
      id: 'postapoc', label: 'Постапокалипсис', labelEn: 'Post-apocalyptic', icon: 'i-alert', pattern: 'cracks', font: 'compact',
      themes: ['rust', 'steel', 'moss'],
      hint: 'Руины, выживание и новая надежда',
      hintEn: 'Ruins, survival and new hope'
    },
    {
      id: 'mythic', label: 'Мифы и легенды', labelEn: 'Myth & legend', icon: 'i-banner', pattern: 'stars', font: 'antiqua',
      themes: ['frost', 'amethyst', 'dark'],
      hint: 'Боги, титаны и сказания начала времён',
      hintEn: 'Gods, titans and tales of the beginning'
    },
    {
      id: 'urban', label: 'Городское фэнтези', labelEn: 'Urban fantasy', icon: 'i-map', pattern: 'stars', font: 'modern',
      themes: ['rosequartz', 'sapphire', 'obsidian'],
      hint: 'Магия среди небоскрёбов и тайных клубов',
      hintEn: 'Magic among skyscrapers and secret clubs'
    }
  ];

  MF.getGenreId = function () {
    try {
      const stored = localStorage.getItem('mifarium.genre');
      if (stored && MF.GENRES.some(function (genre) { return genre.id === stored; })) return stored;
    } catch (e) {}
    return MF.EDITION === 'dnd' ? 'dnd' : '';
  };
  MF.genreMeta = function (id) {
    return MF.GENRES.find(function (genre) { return genre.id === id; }) || MF.GENRES[0];
  };
  MF.getUiScale = function () {
    try {
      const value = Number(localStorage.getItem('mifarium.uiScale'));
      if (Number.isFinite(value) && value >= 70 && value <= 160) return value;
    } catch (e) {}
    return 100;
  };
  MF.applyUiScale = function () {
    const scale = MF.getUiScale();
    MF.state.uiScale = scale;
    if (MF.isNative) {
      MF.invoke('setUiScale', { scale: scale / 100 }).catch(function () {});
    } else {
      document.body.style.zoom = String(scale / 100);
    }
    MF.syncUiScaleControls();
  };
  MF.setUiScale = function (value, options) {
    const scale = MF.clamp(Math.round(Number(value) / 5) * 5, 70, 160);
    try { localStorage.setItem('mifarium.uiScale', String(scale)); } catch (e) {}
    MF.state.uiScale = scale;
    MF.applyUiScale();
    if (options && options.announce) {
      MF.toast(MF.LANG === 'en' ? 'Interface scale' : 'Масштаб интерфейса', scale + '%', 'success');
    }
  };
  MF.syncUiScaleControls = function () {
    const range = MF.$('#uiScale');
    if (range) range.value = String(MF.getUiScale());
    const out = MF.$('#uiScaleValue');
    if (out) out.textContent = MF.getUiScale() + '%';
  };

  MF.getPattern = function () {
    try {
      const stored = localStorage.getItem('mifarium.pattern');
      if (stored && MF.PATTERNS.some(function (pattern) { return pattern.id === stored; })) return stored;
    } catch (e) {}
    return 'contour';
  };
  MF.applyPattern = function () {
    document.documentElement.setAttribute('data-pattern', MF.getPattern());
    MF.syncPatternOptions();
  };
  MF.loadNavConfig = function () {
    try {
      const raw = JSON.parse(localStorage.getItem('mifarium.nav.v3') || 'null');
      if (raw && Array.isArray(raw.extras)) return raw;
    } catch (e) {}
    return null;
  };
  MF.saveNavConfig = function () {
    try { localStorage.setItem('mifarium.nav.v3', JSON.stringify(MF.state.nav || null)); } catch (e) {}
  };
  MF.genreNavDefaults = function (genreId) {
    const list = MF.GENRE_EXTRAS[genreId] || MF.GENRE_EXTRAS.fantasy || [];
    return list.map(function (entry) {
      return {
        key: entry.key, group: entry.group, label: entry.label, labelEn: entry.labelEn,
        icon: entry.icon, catalogId: entry.catalog.id, custom: false
      };
    });
  };
  MF.ensureGenreCatalogs = function (genreId) {
    if (!MF.state.data) return false;
    const list = MF.GENRE_EXTRAS[genreId] || MF.GENRE_EXTRAS.fantasy || [];
    let added = false;
    list.forEach(function (entry) {
      const id = entry.catalog.id;
      if (!MF.state.data.catalogs.some(function (cat) { return cat.id === id; })) {
        MF.state.data.catalogs.push({
          id: id, name: entry.catalog.name, nameEn: entry.catalog.nameEn, title: entry.catalog.name,
          icon: entry.catalog.icon, description: entry.catalog.description, descriptionEn: entry.catalog.descriptionEn,
          builtin: true, createdAt: MF.nowISO(), updatedAt: MF.nowISO()
        });
        added = true;
      }
    });
    return added;
  };
  MF.applyNavConfig = function (options) {
    const opts = options || {};
    const genreId = MF.getGenreId() || 'fantasy';
    let cfg = MF.state.nav || MF.loadNavConfig();
    if (!cfg || cfg.genreId !== genreId || opts.reset) {
      const custom = cfg && Array.isArray(cfg.extras) ? cfg.extras.filter(function (item) { return item && item.custom; }) : [];
      cfg = {
        genreId: genreId,
        hiddenCore: cfg && Array.isArray(cfg.hiddenCore) ? cfg.hiddenCore : [],
        extras: MF.genreNavDefaults(genreId).concat(custom)
      };
    }
    cfg.hiddenCore = Array.isArray(cfg.hiddenCore) ? cfg.hiddenCore : [];
    cfg.extras = Array.isArray(cfg.extras) ? cfg.extras : [];
    MF.state.nav = cfg;
    const added = MF.ensureGenreCatalogs(genreId);
    MF.saveNavConfig();
    MF.applyCoreNavVisibility();
    MF.renderNavExtras();
    MF.syncNav();
    if (added && MF.state.data) MF.saveNow().catch(function () {});
  };
  MF.applyCoreNavVisibility = function () {
    const hidden = (MF.state.nav && MF.state.nav.hiddenCore) || [];
    MF.CORE_NAV_ITEMS.forEach(function (item) {
      const button = MF.$('.nav-item[data-nav="' + item.page + '"]');
      if (!button) return;
      const unavailable = item.edition && item.edition !== MF.EDITION;
      button.hidden = unavailable || hidden.indexOf(item.page) !== -1;
    });
  };
  MF.renderNavExtras = function () {
    MF.$$('.nav-item--extra').forEach(function (button) { button.remove(); });
    if (!MF.state.nav) return;
    MF.state.nav.extras.forEach(function (extra) {
      const group = MF.$('.nav-group[data-nav-group="' + extra.group + '"]');
      if (!group) return;
      const count = MF.state.data ? MF.state.data.catalogItems.filter(function (item) { return item.catalogId === extra.catalogId; }).length : 0;
      const label = MF.LANG === 'en' ? (extra.labelEn || extra.label) : extra.label;
      const button = document.createElement('button');
      button.className = 'nav-item nav-item--extra';
      button.setAttribute('data-catalog', extra.catalogId);
      button.innerHTML = MF.icon(extra.icon || 'i-scroll') + '<span>' + MF.esc(MF.t(label)) + '</span><span class="nav-count">' + count + '</span>';
      group.appendChild(button);
    });
  };
  MF.setCoreNavVisible = function (page, visible) {
    if (!MF.state.nav) MF.applyNavConfig();
    const hidden = MF.state.nav.hiddenCore.filter(function (item) { return item !== page; });
    if (!visible) hidden.push(page);
    MF.state.nav.hiddenCore = hidden;
    MF.saveNavConfig();
    MF.applyCoreNavVisibility();
  };
  MF.createNavExtra = function (label, group, icon) {
    const clean = String(label || '').trim();
    if (!clean) return;
    if (!MF.state.nav) MF.applyNavConfig();
    const catalogId = 'cat_custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    MF.state.data.catalogs.push({
      id: catalogId, name: clean, nameEn: clean, title: clean, icon: icon || 'i-scroll',
      description: '', descriptionEn: '', builtin: false, createdAt: MF.nowISO(), updatedAt: MF.nowISO()
    });
    MF.state.nav.extras.push({
      key: MF.uid('nav'), group: MF.NAV_GROUPS.some(function (g) { return g.id === group; }) ? group : 'world',
      label: clean, labelEn: clean, icon: icon || 'i-scroll', catalogId: catalogId, custom: true
    });
    MF.saveNavConfig();
    MF.applyNavConfig();
    MF.saveNow().catch(function () {});
    MF.renderCurrentPage({ keepScroll: true });
  };
  MF.removeNavExtra = function (key) {
    if (!MF.state.nav) return;
    MF.state.nav.extras = MF.state.nav.extras.filter(function (item) { return item.key !== key; });
    MF.saveNavConfig();
    MF.applyNavConfig();
    MF.renderCurrentPage({ keepScroll: true });
  };
  MF.resetNavConfig = function () {
    MF.state.nav = null;
    try { localStorage.removeItem('mifarium.nav.v3'); } catch (e) {}
    MF.applyNavConfig({ reset: true });
    MF.renderCurrentPage({ keepScroll: true });
  };
  MF.catalogMeta = function (id) {
    return MF.state.data.catalogs.find(function (cat) { return cat.id === id; }) || null;
  };
  MF.catalogName = function (catalog) {
    if (!catalog) return '';
    return MF.LANG === 'en' ? (catalog.nameEn || catalog.name || catalog.title) : (catalog.name || catalog.title || catalog.nameEn);
  };
  MF.catalogItemsFor = function (id) {
    return MF.state.data.catalogItems.filter(function (item) { return item.catalogId === id; }).sort(function (a, b) {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  };

  MF.setPattern = function (id, options) {
    const meta = MF.PATTERNS.find(function (pattern) { return pattern.id === id; }) || MF.PATTERNS[0];
    try { localStorage.setItem('mifarium.pattern', meta.id); } catch (e) {}
    document.documentElement.setAttribute('data-pattern', meta.id);
    MF.syncPatternOptions();
    if (options && options.announce) MF.toast(MF.t('Узор фона') + ': ' + MF.t(meta.label), MF.t(meta.hint), 'success');
  };
  MF.syncPatternOptions = function () {
    MF.$$('[data-pattern-choice]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-pattern-choice') === MF.getPattern());
    });
  };
  MF.applyGenre = function (id, options) {
    const opts = options || {};
    const genre = MF.genreMeta(id);
    try { localStorage.setItem('mifarium.genre', genre.id); } catch (e) {}
    const style = opts.style || (genre.themes && genre.themes[0]) || MF.getTheme();
    MF.setPattern(genre.pattern || MF.getPattern());
    MF.setTheme(style, { announce: false });
    if (genre.font) MF.setFont(genre.font, { announce: false });
    if (MF.state.data && MF.state.data.world) {
      MF.state.data.world.genreId = genre.id;
      if (opts.updateWorld !== false) MF.state.data.world.genre = MF.LANG === 'en' ? genre.labelEn : genre.label;
      MF.state.data.world.updatedAt = MF.nowISO();
      if (opts.save !== false) MF.saveNow().catch(function () {});
    }
    if (MF.applyNavConfig) MF.applyNavConfig();
    if (MF.state.page === 'settings') {
      MF.renderCurrentPage({ keepScroll: true });
    }
  };

  const USED_BRIDGE_METHODS = ['loadData', 'saveData', 'pickImage', 'pickImages', 'pickAudio', 'pickBackground', 'pickFont', 'createBackup', 'restoreBackup', 'exportWorld', 'getInfo', 'getSyncSettings', 'saveSyncSettings', 'chooseSyncFolder', 'readShared', 'writeShared', 'getGitHubRepo', 'saveGitHubRepo', 'checkUpdates', 'downloadUpdate', 'runInstaller', 'openDataFolder', 'setTheme', 'setAppName', 'showItemInFolder', 'getApiSettings', 'saveApiSettings', 'deepseekExtract', 'setLanguage', 'setUiScale'];

  /* ---------- DOM helpers ---------- */
  MF.$ = function (sel, root) { return (root || document).querySelector(sel); };
  MF.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  MF.esc = function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  MF.attr = MF.esc;
  MF.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#' + name + '"></use></svg>';
  };
  MF.uid = function (prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };
  MF.clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  MF.nowISO = function () { return new Date().toISOString(); };
  MF.safeParse = function (value, fallback) {
    try { return JSON.parse(value); } catch (e) { return fallback; }
  };
  MF.debounce = function (fn, ms) {
    let timer = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  };

  MF.plural = function (n, one, few, many) {
    const value = Math.abs(Number(n) || 0) % 100;
    const tail = value % 10;
    if (value > 10 && value < 20) return many;
    if (tail > 1 && tail < 5) return few;
    if (tail === 1) return one;
    return many;
  };

  MF.formatDate = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return MF.dateFmt.format(d).replace(' г.', '') + ', ' + MF.timeFmt.format(d);
  };
  MF.formatDateFull = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return MF.dateFullFmt.format(d) + (MF.LANG === 'en' ? ' at ' : ' в ') + MF.timeFmt.format(d);
  };
  MF.formatDateShort = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return MF.dateFmt.format(d);
  };
  MF.formatTime = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return MF.timeFmt.format(d);
  };
  MF.formatRelative = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso), now = new Date();
    if (isNaN(d.getTime())) return '—';
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 1000) return 'только что';
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / 60000);
      return mins + ' ' + MF.plural(mins, 'минуту', 'минуты', 'минут') + ' назад';
    }
    if (diff < 24 * 60 * 60 * 1000) {
      const hrs = Math.floor(diff / 3600000);
      return hrs + ' ' + MF.plural(hrs, 'час', 'часа', 'часов') + ' назад';
    }
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startToday - startDate) / 86400000);
    if (days === 1) return MF.LANG === 'en' ? 'yesterday, ' + MF.timeFmt.format(d) : 'вчера, ' + MF.timeFmt.format(d);
    if (days > 1 && days < 7) return days + ' ' + MF.plural(days, 'день', 'дня', 'дней') + (MF.LANG === 'en' ? ' ago' : ' назад');
    return MF.formatDate(iso);
  };
  MF.formatClockDate = function (date) {
    return MF.weekdayFmt.format(date).replace('.', '') + ', ' + date.getDate() + ' ' + MF.MONTHS[date.getMonth()].replace('.', '') + ' ' + date.getFullYear();
  };

  MF.initials = function (name) {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };
  MF.normalize = function (str) {
    return String(str || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  };
  MF.clampText = function (text, limit) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    return s.length > limit ? s.slice(0, limit - 1).trim() + '…' : s;
  };
  MF.highlight = function (text, query) {
    const raw = String(text || '');
    if (!query) return MF.esc(raw);
    const idx = MF.normalize(raw).indexOf(MF.normalize(query));
    if (idx === -1) return MF.esc(raw);
    const len = String(query).length;
    return MF.esc(raw.slice(0, idx)) + '<mark>' + MF.esc(raw.slice(idx, idx + len)) + '</mark>' + MF.esc(raw.slice(idx + len));
  };

  MF.isLiving = function (status) {
    return /^(жив|alive)/i.test(String(status || ''));
  };
  MF.isKnownGender = function (gender) {
    const value = String(gender || '').trim();
    return !!value && value !== 'Не указан' && value !== 'Не указана' && value !== 'Not specified';
  };
  MF.isFemale = function (gender) {
    return /^(жен|female)/i.test(String(gender || ''));
  };
  MF.statusOptions = function (current) {
    const base = MF.LANG === 'en' ? ['Alive', 'Deceased', 'Missing', 'Unknown'] : MF.STATUSES;
    const value = String(current || '').trim();
    return value && base.indexOf(value) === -1 ? [value].concat(base) : base;
  };
  MF.genderOptions = function (current) {
    const base = MF.LANG === 'en' ? ['Female', 'Male', 'Other', 'Not specified'] : MF.GENDERS;
    const value = String(current || '').trim();
    return value && base.indexOf(value) === -1 ? [value].concat(base) : base;
  };
  MF.statusClass = function (status) {
    if (/погиб|deceased|dead/i.test(String(status || ''))) return 'is-dead';
    if (/пропал|неизвест|missing|unknown/i.test(String(status || ''))) return 'is-missing';
    return 'is-alive';
  };

  /* ---------- Entity lookups ---------- */
  MF.collectionFor = function (type) {
    if (type === 'character') return 'characters';
    if (type === 'region') return 'regions';
    if (type === 'location') return 'locations';
    if (type === 'faction') return 'factions';
    if (type === 'race') return 'races';
    if (type === 'lore') return 'lore';
    if (type === 'event') return 'events';
    if (type === 'note') return 'notes';
    if (type === 'book') return 'books';
    if (type === 'catalog') return 'catalogs';
    if (type === 'catalogItem') return 'catalogItems';
    if (type === 'dndSheet') return 'dndSheets';
    return null;
  };
  MF.getEntity = function (type, id) {
    const state = MF.state;
    if (!state || !state.data) return null;
    const key = MF.collectionFor(type);
    if (!key || !Array.isArray(state.data[key])) return null;
    return state.data[key].find(function (item) { return item.id === id; }) || null;
  };
  MF.getCharacter = function (id) { return MF.getEntity('character', id); };
  MF.getRegion = function (id) { return MF.getEntity('region', id); };
  MF.getLocation = function (id) { return MF.getEntity('location', id); };
  MF.getFaction = function (id) { return MF.getEntity('faction', id); };
  MF.getRace = function (id) { return MF.getEntity('race', id); };
  MF.getBook = function (id) { return MF.getEntity('book', id); };
  MF.entityName = function (type, id) {
    const item = MF.getEntity(type, id);
    return item ? (item.name || item.title || 'Без названия') : '';
  };
  MF.characterName = function (id) { return MF.entityName('character', id); };
  MF.factionOf = function (character) {
    if (!character || !character.factionId) return null;
    return MF.getFaction(character.factionId);
  };
  MF.locationOf = function (entity) {
    if (!entity || !entity.locationId) return null;
    return MF.getLocation(entity.locationId);
  };
  MF.regionOf = function (entity) {
    if (!entity) return null;
    if (entity.regionId) return MF.getRegion(entity.regionId);
    if (entity.locationId) {
      const location = MF.getLocation(entity.locationId);
      if (location && location.regionId) return MF.getRegion(location.regionId);
    }
    return null;
  };
  MF.raceOf = function (character) {
    if (!character) return null;
    return character.raceId ? MF.getRace(character.raceId) : null;
  };
  MF.raceName = function (character) {
    const race = MF.raceOf(character);
    return race ? race.name : (character && character.race) || '';
  };
  MF.genderLabel = function (character) {
    return character && character.gender ? character.gender : '';
  };
  MF.findOrCreateRace = function (name) {
    const text = String(name || '').trim();
    if (!text) return null;
    const data = MF.state.data;
    const found = data.races.find(function (race) { return MF.normalize(race.name) === MF.normalize(text); });
    if (found) return found;
    const now = new Date().toISOString();
    const race = { id: MF.uid('race'), name: text, type: 'Народ', traits: '', description: '', image: '', tags: [], createdAt: now, updatedAt: now };
    data.races.push(race);
    return race;
  };
  MF.findOrCreateRegion = function (name) {
    const text = String(name || '').trim();
    if (!text) return null;
    const data = MF.state.data;
    const found = data.regions.find(function (region) { return MF.normalize(region.name) === MF.normalize(text); });
    if (found) return found;
    const now = new Date().toISOString();
    const region = { id: MF.uid('rg'), name: text, type: 'Регион', climate: '', description: '', image: '', tags: [], createdAt: now, updatedAt: now };
    data.regions.push(region);
    return region;
  };
  MF.characterDisplayTitle = function (character) {
    if (!character) return '';
    return character.title || character.role || character.race || '';
  };
  MF.childrenOf = function (id) {
    return MF.state.data.characters.filter(function (c) { return c.fatherId === id || c.motherId === id; });
  };
  MF.spousesOf = function (character) {
    if (!character || !Array.isArray(character.spouseIds)) return [];
    return character.spouseIds.map(function (id) { return MF.getCharacter(id); }).filter(Boolean);
  };

  /* ---------- Bridge ---------- */
  const bridgePending = new Map();
  let bridgeSeq = 0;
  MF.isAndroid = !!(window.ChronicaAndroid && typeof window.ChronicaAndroid.invoke === 'function');
  MF.isNative = MF.isAndroid || !!(window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function');

  function resolveBridgeResponse(response) {
    if (!response || response.id == null) return;
    const pending = bridgePending.get(response.id);
    if (!pending) return;
    bridgePending.delete(response.id);
    clearTimeout(pending.timer);
    if (response.ok) pending.resolve(response.result);
    else pending.reject(new Error(response.error || 'Неизвестная ошибка приложения'));
  }
  window.__mifariumBridge = resolveBridgeResponse;
  window.__chronicaAndroidBridge = function (response) {
    if (typeof response === 'string') {
      try { response = JSON.parse(response); } catch (e) { return; }
    }
    resolveBridgeResponse(response);
  };
  if (!MF.isAndroid && MF.isNative && window.chrome.webview.addEventListener) {
    window.chrome.webview.addEventListener('message', function (event) {
      window.__mifariumBridge(event.data);
    });
  }

  MF.invoke = function (method, args, options) {
    return new Promise(function (resolve, reject) {
      if (!MF.isNative) {
        reject(new Error('Приложение запущено в режиме предпросмотра.'));
        return;
      }
      const opts = options || {};
      const id = ++bridgeSeq;
      const timer = setTimeout(function () {
        bridgePending.delete(id);
        reject(new Error('Приложение не ответило вовремя.'));
      }, opts.timeoutMs || 30000);
      bridgePending.set(id, { resolve: resolve, reject: reject, timer: timer });
      try {
        if (MF.isAndroid) {
          window.ChronicaAndroid.invoke(method, JSON.stringify(args || {}), String(id));
        } else {
          window.chrome.webview.postMessage({ id: id, method: method, args: args || {} });
        }
      } catch (e) {
        clearTimeout(timer);
        bridgePending.delete(id);
        reject(e);
      }
    });
  };

  /* ---------- State ---------- */
  MF.state = {
    data: null,
    page: 'dashboard',
    info: null,
    loaded: false,
    pendingGenre: '',
    lastSavedAt: null,
    saveStatus: 'saved',
    saveChain: Promise.resolve(),
    pendingSaves: 0,
    ui: {
      charSearch: '',
      charFilter: 'all',
      regionSearch: '',
      raceSearch: '',
      locSearch: '',
      locType: 'all',
      locRegion: 'all',
      factionSearch: '',
      loreSearch: '',
      loreCategory: 'all',
      loreSource: 'all',
      librarySearch: '',
      libraryType: 'all',
      catalogSearch: {},
      dndTab: 'sheets',
      timelineEra: 'all',
      timelineType: 'all',
      notesSearch: '',
      notesFilter: 'all'
    },
    api: {
      hasKey: false,
      keyHint: '',
      model: 'deepseek-chat',
      endpoint: 'https://api.deepseek.com'
    },
    sync: {
      folder: '',
      participant: '',
      auto: true,
      assets: true,
      path: '',
      exists: false,
      lastSync: null,
      status: 'off',
      syncing: false,
      timer: null
    },
    update: {
      latest: null,
      checking: false
    },
    uiScale: 100,
    nav: null,
    map: { tool: 'select', drag: null, moved: false, draw: null },
    diceHistory: [],
    diceMode: 'normal',
    tree: {
      zoom: 1,
      panX: 0,
      panY: 0,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      startPanX: 0,
      startPanY: 0,
      selectedId: null,
      editing: false,
      linkMode: false,
      linkSource: null
    },
    search: {
      query: '',
      selectedIndex: -1
    }
  };

  MF.normalizeData = function (data) {
    if (!data || typeof data !== 'object') return null;
    const out = data;
    out.version = 1;
    if (!out.world || typeof out.world !== 'object') out.world = {};
    const now = new Date().toISOString();
    const world = out.world;
    world.name = world.name || 'Мой мир';
    world.genre = world.genre || 'Фэнтези';
    world.genreId = world.genreId || '';
    world.tagline = world.tagline || '';
    world.description = world.description || '';
    world.era = world.era || '';
    world.currentYear = world.currentYear || '';
    world.cover = world.cover || '';
    world.isDemo = !!world.isDemo;
    world.createdAt = world.createdAt || now;
    world.updatedAt = world.updatedAt || now;
    ['characters', 'regions', 'races', 'locations', 'factions', 'lore', 'books', 'catalogs', 'catalogItems', 'dndSheets', 'events', 'notes', 'activity', 'tombstones'].forEach(function (key) {
      if (!Array.isArray(out[key])) out[key] = [];
    });
    out.tombstones = out.tombstones.filter(function (item) {
      return item && item.type && item.id && item.at;
    }).slice(0, 1000);

    const regionByName = {};
    out.regions.forEach(function (r) {
      r.id = r.id || MF.uid('rg');
      r.name = r.name || 'Без названия';
      r.type = r.type || 'Регион';
      r.climate = r.climate || '';
      r.description = r.description || '';
      r.image = r.image || '';
      r.tags = Array.isArray(r.tags) ? r.tags : [];
      r.createdAt = r.createdAt || now;
      r.updatedAt = r.updatedAt || r.createdAt;
      regionByName[MF.normalize(r.name)] = r;
    });
    const raceByName = {};
    out.races.forEach(function (r) {
      r.id = r.id || MF.uid('race');
      r.name = r.name || 'Без названия';
      r.type = r.type || 'Народ';
      r.traits = r.traits || '';
      r.description = r.description || '';
      r.image = r.image || '';
      r.tags = Array.isArray(r.tags) ? r.tags : [];
      r.createdAt = r.createdAt || now;
      r.updatedAt = r.updatedAt || r.createdAt;
      raceByName[MF.normalize(r.name)] = r;
    });
    function ensureRegion(name) {
      const key = MF.normalize(name);
      if (!key) return null;
      if (regionByName[key]) return regionByName[key];
      const region = {
        id: MF.uid('rg'), name: String(name).trim(), type: 'Регион', climate: '',
        description: '', image: '', tags: [], createdAt: now, updatedAt: now
      };
      out.regions.push(region);
      regionByName[key] = region;
      return region;
    }
    function ensureRace(name) {
      const key = MF.normalize(name);
      if (!key) return null;
      if (raceByName[key]) return raceByName[key];
      const race = {
        id: MF.uid('race'), name: String(name).trim(), type: 'Народ', traits: '',
        description: '', image: '', tags: [], createdAt: now, updatedAt: now
      };
      out.races.push(race);
      raceByName[key] = race;
      return race;
    }

    out.characters.forEach(function (c) {
      c.id = c.id || MF.uid('ch');
      c.name = c.name || 'Без имени';
      c.spouseIds = Array.isArray(c.spouseIds) ? c.spouseIds.filter(Boolean) : (c.spouseId ? [c.spouseId] : []);
      c.tags = Array.isArray(c.tags) ? c.tags : [];
      c.fatherId = c.fatherId || '';
      c.motherId = c.motherId || '';
      c.gender = c.gender || 'Не указан';
      c.appearance = c.appearance || '';
      c.gallery = (Array.isArray(c.gallery) ? c.gallery : []).map(function (item) {
        return typeof item === 'string' ? item : (item && item.url) || '';
      }).filter(Boolean);
      c.palette = (Array.isArray(c.palette) ? c.palette : []).map(function (item) {
        const value = String(item || '').trim();
        return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : null;
      }).filter(Boolean).slice(0, 8);
      c.audio = (Array.isArray(c.audio) ? c.audio : []).map(function (item, index) {
        if (typeof item === 'string') {
          return { id: MF.uid('aud'), url: item, title: 'Аудио ' + (index + 1), kind: 'voice' };
        }
        if (!item || !item.url) return null;
        return {
          id: item.id || MF.uid('aud'),
          url: String(item.url),
          title: String(item.title || 'Аудио ' + (index + 1)),
          kind: item.kind === 'music' ? 'music' : 'voice'
        };
      }).filter(Boolean).slice(0, 12);
      c.raceId = c.raceId || '';
      let race = c.raceId ? (raceByName[c.raceId.toLowerCase()] || out.races.find(function (r) { return r.id === c.raceId; })) : null;
      if (!race && c.race && c.race !== 'Неизвестно') race = ensureRace(c.race);
      if (race) {
        c.raceId = race.id;
        c.race = race.name;
      }
      c.treeX = (c.treeX !== null && c.treeX !== undefined && c.treeX !== '' && Number.isFinite(Number(c.treeX))) ? Number(c.treeX) : null;
      c.treeY = (c.treeY !== null && c.treeY !== undefined && c.treeY !== '' && Number.isFinite(Number(c.treeY))) ? Number(c.treeY) : null;
      c.customFields = (Array.isArray(c.customFields) ? c.customFields : []).map(function (field) {
        if (!field) return null;
        const label = String(field.label || '').trim();
        const value = String(field.value || '').trim();
        if (!label && !value) return null;
        return { id: field.id || MF.uid('cf'), label: label, value: value };
      }).filter(Boolean).slice(0, 40);
      c.createdAt = c.createdAt || now;
      c.updatedAt = c.updatedAt || c.createdAt;
    });
    if (!out.map || typeof out.map !== 'object') out.map = {};
    out.map.background = out.map.background || 'parchment';
    out.map.image = out.map.image || '';
    out.map.markers = (Array.isArray(out.map.markers) ? out.map.markers : []).map(function (marker) {
      if (!marker) return null;
      return {
        id: marker.id || MF.uid('mk'), locationId: marker.locationId || '',
        name: String(marker.name || ''), x: MF.clamp(Number(marker.x) || 600, 0, 1200),
        y: MF.clamp(Number(marker.y) || 360, 0, 720), icon: marker.icon || 'i-pin',
        color: marker.color || '#c5a15f'
      };
    }).filter(Boolean);
    out.map.paths = (Array.isArray(out.map.paths) ? out.map.paths : []).map(function (path) {
      if (!path || !Array.isArray(path.points) || path.points.length < 2) return null;
      return {
        id: path.id || MF.uid('mp'), color: path.color || '#c5a15f',
        width: MF.clamp(Number(path.width) || 3, 1, 12),
        points: path.points.map(function (point) {
          return [MF.clamp(Number(point[0]) || 0, 0, 1200), MF.clamp(Number(point[1]) || 0, 0, 720)];
        })
      };
    }).filter(Boolean);
    out.map.labels = (Array.isArray(out.map.labels) ? out.map.labels : []).map(function (label) {
      if (!label || !String(label.text || '').trim()) return null;
      return {
        id: label.id || MF.uid('ml'), text: String(label.text).slice(0, 120),
        x: MF.clamp(Number(label.x) || 600, 0, 1200), y: MF.clamp(Number(label.y) || 360, 0, 720),
        color: label.color || '#c5a15f', size: MF.clamp(Number(label.size) || 14, 9, 36)
      };
    }).filter(Boolean);
    out.map.updatedAt = out.map.updatedAt || now;

    out.dndSheets.forEach(function (sheet) {
      sheet.id = sheet.id || MF.uid('dnd');
      sheet.edition = sheet.edition === '2024' ? '2024' : '5e';
      sheet.name = sheet.name || 'Без имени';
      sheet.level = MF.clamp(Number(sheet.level) || 1, 1, 30);
      sheet.abilities = sheet.abilities && typeof sheet.abilities === 'object' ? sheet.abilities : {};
      MF.DND_ABILITIES.forEach(function (ability) {
        sheet.abilities[ability.id] = MF.clamp(Number(sheet.abilities[ability.id]) || 10, 1, 30);
      });
      sheet.skills = Array.isArray(sheet.skills) ? sheet.skills : [];
      sheet.saves = Array.isArray(sheet.saves) ? sheet.saves : [];
      sheet.equipment = sheet.equipment || '';
      sheet.spells = sheet.spells || '';
      sheet.features = sheet.features || '';
      sheet.notes = sheet.notes || '';
      sheet.createdAt = sheet.createdAt || now;
      sheet.updatedAt = sheet.updatedAt || sheet.createdAt;
    });

    out.catalogs.forEach(function (cat) {
      cat.id = cat.id || MF.uid('cat');
      cat.name = cat.name || cat.title || 'Без названия';
      cat.title = cat.title || cat.name;
      cat.nameEn = cat.nameEn || cat.name;
      cat.icon = cat.icon || 'i-scroll';
      cat.description = cat.description || '';
      cat.descriptionEn = cat.descriptionEn || '';
      cat.createdAt = cat.createdAt || now;
      cat.updatedAt = cat.updatedAt || cat.createdAt;
    });
    out.catalogItems.forEach(function (item) {
      item.id = item.id || MF.uid('ci');
      item.catalogId = item.catalogId || '';
      item.name = item.name || 'Без названия';
      item.type = item.type || '';
      item.description = item.description || '';
      item.image = item.image || '';
      item.tags = Array.isArray(item.tags) ? item.tags : [];
      item.createdAt = item.createdAt || now;
      item.updatedAt = item.updatedAt || item.createdAt;
    });
    out.books.forEach(function (b) {
      b.id = b.id || MF.uid('book');
      b.title = b.title || b.name || 'Без названия';
      b.name = b.name || b.title;
      b.type = b.type || 'Книга';
      b.author = b.author || '';
      b.year = b.year || '';
      b.description = b.description || '';
      b.cover = b.cover || b.image || '';
      b.image = b.image || b.cover;
      b.tags = Array.isArray(b.tags) ? b.tags : [];
      b.createdAt = b.createdAt || now;
      b.updatedAt = b.updatedAt || b.createdAt;
    });
    out.locations.forEach(function (l) {
      l.id = l.id || MF.uid('loc');
      l.tags = Array.isArray(l.tags) ? l.tags : [];
      let region = l.regionId ? out.regions.find(function (r) { return r.id === l.regionId; }) : null;
      if (!region && l.region) region = ensureRegion(l.region);
      if (region) {
        l.regionId = region.id;
        l.region = region.name;
      } else {
        l.regionId = l.regionId || '';
      }
      l.createdAt = l.createdAt || now;
      l.updatedAt = l.updatedAt || l.createdAt;
    });
    out.factions.forEach(function (f) {
      f.id = f.id || MF.uid('fac');
      f.tags = Array.isArray(f.tags) ? f.tags : [];
      f.regionId = f.regionId || '';
      f.locationId = f.locationId || '';
      f.createdAt = f.createdAt || now;
      f.updatedAt = f.updatedAt || f.createdAt;
    });
    out.lore.forEach(function (l) {
      l.id = l.id || MF.uid('lr');
      l.tags = Array.isArray(l.tags) ? l.tags : [];
      l.sourceId = l.sourceId || '';
      if (l.sourceId) {
        const source = out.books.find(function (book) { return book.id === l.sourceId; });
        if (source) l.sourceTitle = source.title;
        else l.sourceId = '';
      }
      l.createdAt = l.createdAt || now;
      l.updatedAt = l.updatedAt || l.createdAt;
    });
    out.events.forEach(function (e) {
      e.id = e.id || MF.uid('ev');
      e.participantIds = Array.isArray(e.participantIds) ? e.participantIds : [];
      e.createdAt = e.createdAt || now;
      e.updatedAt = e.updatedAt || e.createdAt;
    });
    out.notes.forEach(function (n) {
      n.id = n.id || MF.uid('n');
      n.color = n.color || 'gold';
      n.pinned = !!n.pinned;
      n.createdAt = n.createdAt || now;
      n.updatedAt = n.updatedAt || n.createdAt;
    });
    out.activity = out.activity.filter(function (a) { return a && a.at; });
    return out;
  };

  MF.loadInitialData = async function () {
    let raw = null;
    if (MF.isNative) {
      const res = await MF.invoke('loadData');
      if (res && res.json) raw = res.json;
    } else {
      try { raw = localStorage.getItem('mifarium.data.v1'); } catch (e) { raw = null; }
    }
    const demoFactory = MF.LANG === 'en' && MF.createDemoDataEn ? MF.createDemoDataEn : MF.createDemoData;
    if (!raw) {
      const demo = demoFactory();
      MF.state.data = MF.normalizeData(demo);
      await MF.saveData({ initial: true });
      return { seeded: true };
    }
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    if (!parsed) {
      const demo = demoFactory();
      MF.state.data = MF.normalizeData(demo);
      await MF.saveData({ initial: true });
      return { seeded: true, recovered: true };
    }
    MF.state.data = MF.normalizeData(parsed);
    return { seeded: false };
  };

  /* ---------- Persistence ---------- */
  MF.setSaveState = function (status, text) {
    const state = MF.state;
    state.saveStatus = status;
    const el = MF.$('#saveState');
    if (!el) return;
    el.classList.toggle('is-saving', status === 'saving');
    el.classList.toggle('is-error', status === 'error');
    const strong = el.querySelector('strong');
    const small = el.querySelector('small');
    if (strong) strong.textContent = status === 'saving' ? 'Сохранение…' : status === 'error' ? 'Ошибка сохранения' : 'Всё сохранено';
    if (small) {
      if (status === 'saving') small.textContent = 'записываем летопись';
      else if (status === 'error') small.textContent = 'проверьте папку данных';
      else if (state.lastSavedAt) small.textContent = MF.formatTime(state.lastSavedAt);
      else small.textContent = 'только что';
    }
  };

  MF.saveData = function (options) {
    const state = MF.state;
    if (!state.data) return Promise.resolve();
    const snapshot = JSON.stringify(state.data);
    state.pendingSaves++;
    MF.setSaveState('saving');
    const task = state.saveChain.then(async function () {
      let result = null;
      if (MF.isNative) {
        result = await MF.invoke('saveData', { json: snapshot });
      } else {
        try {
          localStorage.setItem('mifarium.data.v1', snapshot);
          result = { savedAt: new Date().toISOString(), size: snapshot.length };
        } catch (e) {
          throw new Error('Не удалось сохранить данные в браузере. Возможно, закончилось место.');
        }
      }
      const now = (result && result.savedAt) || new Date().toISOString();
      state.lastSavedAt = now;
      state.pendingSaves = Math.max(0, state.pendingSaves - 1);
      if (result && result.size && state.info) state.info.dataSize = result.size;
      if (state.pendingSaves === 0) {
        MF.setSaveState('saved');
        MF.refreshStorageLabels();
      }
      if (!options || !options.initial) {
        if (state.sync && state.sync.folder) state.sync.dirty = true;
        if (state.sync && state.sync.folder && state.sync.auto && !state.sync.syncing) {
          MF.scheduleSharedSync();
        }
      }
      return result;
    }).catch(function (err) {
      state.pendingSaves = Math.max(0, state.pendingSaves - 1);
      MF.setSaveState('error');
      if (!options || !options.silent) MF.toast('Не удалось сохранить изменения', err.message || 'Проверьте папку данных приложения.', 'error');
      throw err;
    });
    state.saveChain = task.catch(function () {});
    return task;
  };

  MF.saveNow = function () {
    return MF.saveData({ silent: true });
  };

  /* ---------- Совместная работа через общую папку ---------- */
  MF.mergeSharedData = function (localData, remoteData) {
    const local = MF.normalizeData(JSON.parse(JSON.stringify(localData || {})));
    const remote = MF.normalizeData(JSON.parse(JSON.stringify(remoteData || {})));
    if (!local) return MF.state.data;
    if (!remote) return local;

    const tombMap = {};
    function addTombstones(list) {
      (list || []).forEach(function (item) {
        if (!item || !item.type || !item.id || !item.at) return;
        const key = item.type + '|' + item.id;
        const current = tombMap[key];
        if (!current || new Date(item.at) > new Date(current.at)) tombMap[key] = item;
      });
    }
    addTombstones(local.tombstones);
    addTombstones(remote.tombstones);

    const types = ['character', 'region', 'race', 'location', 'faction', 'lore', 'book', 'catalog', 'catalogItem', 'dndSheet', 'event', 'note'];
    const result = JSON.parse(JSON.stringify(local));
    types.forEach(function (type) {
      const collection = MF.collectionFor(type);
      const map = {};
      [local[collection], remote[collection]].forEach(function (list) {
        (list || []).forEach(function (item) {
          if (!item || !item.id) return;
          const current = map[item.id];
          const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const currentTime = current ? new Date(current.updatedAt || current.createdAt || 0).getTime() : -1;
          if (!current || itemTime > currentTime) map[item.id] = item;
        });
      });
      result[collection] = Object.keys(map).map(function (id) { return map[id]; }).filter(function (item) {
        const tomb = tombMap[type + '|' + item.id];
        if (!tomb) return true;
        return new Date(tomb.at).getTime() < new Date(item.updatedAt || item.createdAt || 0).getTime();
      });
    });

    const activityMap = {};
    [local.activity, remote.activity].forEach(function (list) {
      (list || []).forEach(function (item) {
        if (!item || !item.id || !item.at) return;
        if (!activityMap[item.id]) activityMap[item.id] = item;
      });
    });
    result.activity = Object.keys(activityMap).map(function (id) { return activityMap[id]; })
      .sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).slice(0, 120);
    result.tombstones = Object.keys(tombMap).map(function (key) { return tombMap[key]; })
      .sort(function (a, b) { return new Date(a.at) - new Date(b.at); }).slice(-1000);

    const localWorldTime = new Date(local.world && local.world.updatedAt || 0).getTime();
    const remoteWorldTime = new Date(remote.world && remote.world.updatedAt || 0).getTime();
    if (remoteWorldTime > localWorldTime) result.world = remote.world;
    const localMapTime = new Date(local.map && local.map.updatedAt || 0).getTime();
    const remoteMapTime = new Date(remote.map && remote.map.updatedAt || 0).getTime();
    if (remoteMapTime > localMapTime) result.map = remote.map;
    return MF.normalizeData(result);
  };

  MF.startSyncTimer = function () {
    const sync = MF.state.sync;
    if (sync.timer) { clearInterval(sync.timer); sync.timer = null; }
    if (!sync.folder || !sync.auto) return;
    sync.timer = setInterval(function () { MF.syncNow({ silent: true }); }, 20000);
  };

  MF.scheduleSharedSync = function () {
    const sync = MF.state.sync;
    if (!sync.folder || !sync.auto || sync.syncing) return;
    if (sync.pushTimer) clearTimeout(sync.pushTimer);
    sync.pushTimer = setTimeout(function () { MF.syncNow({ silent: true }); }, 1500);
  };

  MF.syncNow = async function (options) {
    const opts = options || {};
    const sync = MF.state.sync;
    if (!MF.isNative) return;
    if (!sync.folder) {
      if (!opts.silent) MF.toast('Совместная работа не настроена', 'Выберите общую папку в настройках.', 'info');
      return;
    }
    if (sync.syncing) return;
    sync.syncing = true;
    sync.status = 'syncing';
    MF.refreshSyncStatus();
    try {
      const remote = await MF.invoke('readShared', null, { timeoutMs: 30000 });
      const remoteChanged = !!(remote && remote.exists && remote.json && remote.modified !== sync.remoteModified);
      if (!sync.dirty && !remoteChanged && opts.silent) {
        sync.status = 'ok';
        sync.syncing = false;
        MF.refreshSyncStatus();
        return;
      }
      let changed = false;
      if (remote && remote.exists && remote.json) {
        let parsed = null;
        try { parsed = JSON.parse(remote.json); } catch (e) { throw new Error('Общая копия повреждена.'); }
        const before = JSON.stringify(MF.state.data);
        const merged = MF.mergeSharedData(MF.state.data, parsed);
        if (JSON.stringify(merged) !== before) {
          MF.state.data = merged;
          await MF.saveNow();
          changed = true;
        }
      }
      const written = await MF.invoke('writeShared', { json: JSON.stringify(MF.state.data) }, { timeoutMs: 30000 });
      sync.dirty = false;
      sync.exists = true;
      sync.path = written && written.path ? written.path : sync.path;
      sync.remoteModified = written && written.modified ? written.modified : null;
      sync.lastSync = MF.nowISO();
      sync.status = 'ok';
      if (changed) {
        MF.refreshNavCounts();
        if (!document.querySelector('.overlay')) MF.renderCurrentPage({ keepScroll: true });
      }
      if (!opts.silent) {
        MF.toast(changed ? 'Получены изменения' : 'Общая копия обновлена',
          changed ? 'Летопись объединена с правками других участников.' : 'Ваши изменения записаны в общую папку.',
          'success');
      }
    } catch (error) {
      sync.status = 'error';
      sync.error = error.message || 'Не удалось синхронизировать.';
      if (!opts.silent) MF.toast('Ошибка совместной работы', sync.error, 'error');
    } finally {
      sync.syncing = false;
      MF.refreshSyncStatus();
    }
  };

  MF.refreshSyncStatus = function () {
    const sync = MF.state.sync;
    const status = MF.$('#syncStatus');
    if (status) {
      const labels = { off: 'Не подключено', syncing: 'Синхронизация…', ok: 'Синхронизировано', error: 'Ошибка' };
      status.textContent = labels[sync.status] || 'Не подключено';
      status.classList.toggle('is-ready', sync.status === 'ok');
      status.classList.toggle('is-error', sync.status === 'error');
    }
    const path = MF.$('#syncPath');
    if (path) path.textContent = sync.path || (sync.folder ? sync.folder : 'Папка не выбрана');
    const last = MF.$('#syncLast');
    if (last) last.textContent = sync.lastSync ? MF.formatRelative(sync.lastSync) : 'ещё не было';
    const folder = MF.$('#syncFolderInput');
    if (folder) folder.value = sync.folder || '';
    const participant = MF.$('#syncNameInput');
    if (participant) participant.value = sync.participant || '';
    const auto = MF.$('#syncAutoInput');
    if (auto) auto.checked = sync.auto !== false;
    const assets = MF.$('#syncAssetsInput');
    if (assets) assets.checked = sync.assets !== false;
  };

  MF.loadSyncSettings = async function () {
    if (!MF.isNative) return;
    try {
      const data = await MF.invoke('getSyncSettings');
      MF.state.sync.folder = data.folder || '';
      MF.state.sync.participant = data.participant || '';
      MF.state.sync.auto = data.auto !== false;
      MF.state.sync.assets = data.assets !== false;
      MF.state.sync.path = data.path || '';
      MF.state.sync.exists = !!data.exists;
      MF.state.sync.dirty = true;
      MF.startSyncTimer();
      MF.refreshSyncStatus();
      if (MF.state.sync.folder) {
        setTimeout(function () { MF.syncNow({ silent: true }); }, 1800);
      }
    } catch (e) {}
  };

  MF.saveSyncSettings = async function (silent) {
    if (!MF.isNative) return;
    const nameEl = MF.$('#syncNameInput');
    const autoEl = MF.$('#syncAutoInput');
    const assetsEl = MF.$('#syncAssetsInput');
    const participant = nameEl ? nameEl.value.trim() : MF.state.sync.participant;
    const auto = autoEl ? autoEl.checked : MF.state.sync.auto;
    const assets = assetsEl ? assetsEl.checked : MF.state.sync.assets;
    try {
      const data = await MF.invoke('saveSyncSettings', {
        folder: MF.state.sync.folder || '',
        participant: participant,
        auto: auto,
        assets: assets
      });
      MF.state.sync.folder = data.folder || '';
      MF.state.sync.participant = data.participant || '';
      MF.state.sync.auto = data.auto !== false;
      MF.state.sync.assets = data.assets !== false;
      MF.state.sync.path = data.path || '';
      MF.startSyncTimer();
      MF.refreshSyncStatus();
      if (!silent) MF.toast('Совместная работа настроена', MF.state.sync.folder ? 'Папка: ' + MF.state.sync.folder : 'Папка не выбрана.', 'success');
    } catch (error) {
      if (!silent) MF.toast('Не удалось сохранить настройки', error.message || 'Попробуйте снова.', 'error');
    }
  };

  MF.chooseSyncFolder = async function () {
    if (!MF.isNative) return;
    try {
      const folder = await MF.invoke('chooseSyncFolder', null, { timeoutMs: 300000 });
      if (!folder) return;
      MF.state.sync.folder = folder;
      await MF.saveSyncSettings(true);
      MF.state.sync.dirty = true;
      MF.refreshSyncStatus();
      MF.toast('Общая папка выбрана', 'Синхронизация начнётся в ближайшие секунды.', 'success');
      setTimeout(function () { MF.syncNow({ silent: false }); }, 300);
    } catch (error) {
      MF.toast('Не удалось выбрать папку', error.message || 'Попробуйте снова.', 'error');
    }
  };

  MF.commit = function (options) {
    const opts = options || {};
    if (opts.touchWorld) MF.state.data.world.updatedAt = MF.nowISO();
    return MF.saveData({ silent: opts.silent }).then(function () {
      MF.refreshNavCounts();
      if (opts.rerender !== false) MF.renderCurrentPage({ keepScroll: opts.keepScroll });
    });
  };

  MF.addActivity = function (kind, entityType, entityId, title) {
    const data = MF.state.data;
    if (!data) return;
    data.activity = data.activity || [];
    data.activity.unshift({
      id: MF.uid('a'),
      kind: kind,
      entityType: entityType,
      entityId: entityId || '',
      title: title,
      at: new Date().toISOString()
    });
    data.activity = data.activity.slice(0, 120);
  };

  MF.activityTitle = function (type, action, title) {
    const map = {
      character: { create: 'Добавлен персонаж', update: 'Обновлён персонаж' },
      region: { create: 'Добавлен регион', update: 'Обновлён регион' },
      location: { create: 'Добавлена локация', update: 'Обновлена локация' },
      faction: { create: 'Добавлена фракция', update: 'Обновлена фракция' },
      race: { create: 'Добавлена раса', update: 'Обновлена раса' },
      lore: { create: 'Добавлена статья', update: 'Обновлена статья' },
      book: { create: 'Добавлен источник', update: 'Обновлён источник' },
      catalogItem: { create: 'Добавлена запись раздела', update: 'Обновлена запись раздела' },
      dndSheet: { create: 'Создан лист D&D', update: 'Обновлён лист D&D' },
      event: { create: 'Добавлено событие', update: 'Обновлено событие' },
      note: { create: 'Добавлена заметка', update: 'Обновлена заметка' }
    };
    if (type === 'world') return 'Обновлён профиль мира';
    const prefix = map[type] ? map[type][action] : 'Обновлена запись';
    return prefix + ' «' + title + '»';
  };

  MF.refreshNavCounts = function () {
    const data = MF.state.data;
    if (!data) return;
    const counts = {
      characters: data.characters.length,
      regions: data.regions.length,
      races: data.races.length,
      locations: data.locations.length,
      factions: data.factions.length,
      lore: data.lore.length,
      books: data.books.length,
      events: data.events.length,
      notes: data.notes.length
    };
    const ids = { characters: '#navCountCharacters', regions: '#navCountRegions', races: '#navCountRaces', locations: '#navCountLocations', factions: '#navCountFactions', lore: '#navCountLore', books: '#navCountBooks', events: '#navCountEvents', notes: '#navCountNotes' };
    Object.keys(ids).forEach(function (key) {
      const el = MF.$(ids[key]);
      if (el) el.textContent = counts[key];
    });
    MF.$$('.nav-item--extra[data-catalog]').forEach(function (el) {
      const id = el.getAttribute('data-catalog');
      const countEl = el.querySelector('.nav-count');
      if (countEl) countEl.textContent = data.catalogItems.filter(function (item) { return item.catalogId === id; }).length;
    });
    const crumb = MF.$('#crumbWorld');
    if (crumb) crumb.textContent = data.world.name || 'Мой мир';
  };

  MF.refreshStorageLabels = function () {
    const el = MF.$('#storageInfoPath');
    if (!el) return;
    const info = MF.state.info;
    if (info && info.storagePath) el.textContent = info.storagePath;
    else if (!MF.isNative) el.textContent = 'Локальное хранилище браузера (режим предпросмотра)';
    const sizeEl = MF.$('#storageInfoSize');
    if (sizeEl) {
      if (info && info.dataSize) sizeEl.textContent = MF.formatBytes(info.dataSize);
      else if (info && info.dataFileSize) sizeEl.textContent = MF.formatBytes(info.dataFileSize);
      else sizeEl.textContent = '—';
    }
    const countEl = MF.$('#storageInfoImages');
    if (countEl) countEl.textContent = info && info.imageCount != null ? info.imageCount + ' ' + MF.plural(info.imageCount, 'файл', 'файла', 'файлов') : '—';
    const audioEl = MF.$('#storageInfoAudio');
    if (audioEl) audioEl.textContent = info && info.audioCount != null ? info.audioCount + ' ' + MF.plural(info.audioCount, 'файл', 'файла', 'файлов') : '—';
  };

  MF.formatBytes = function (bytes) {
    const n = Number(bytes) || 0;
    const decimal = MF.LANG === 'en' ? '.' : ',';
    if (n < 1024) return n + ' ' + MF.t('Б');
    if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', decimal) + ' ' + MF.t('КБ');
    return (n / (1024 * 1024)).toFixed(1).replace('.', decimal) + ' ' + MF.t('МБ');
  };

  /* ---------- Theme, font, clock, toast ---------- */
  MF.themeMeta = function (id) {
    return MF.THEMES.find(function (theme) { return theme.id === id; }) || MF.THEMES[0];
  };
  MF.fontMeta = function (id) {
    return MF.allFonts().find(function (font) { return font.id === id; }) || MF.FONTS[0];
  };
  MF.getTheme = function () {
    return MF.themeMeta(document.documentElement.getAttribute('data-theme')).id;
  };
  MF.getFont = function () {
    try {
      const stored = localStorage.getItem('mifarium.font');
      if (stored && MF.allFonts().some(function (font) { return font.id === stored; })) return stored;
    } catch (e) {}
    return document.documentElement.getAttribute('data-font') === 'custom' ? 'forum' : MF.fontMeta(document.documentElement.getAttribute('data-font')).id;
  };
  MF.applyFont = function (font) {
    const meta = MF.fontMeta(font);
    const root = document.documentElement;
    if (meta.custom) {
      MF.ensureCustomFontFaces();
      root.setAttribute('data-font', 'custom');
      const display = '"' + meta.family + '", Georgia, serif';
      const sans = '"' + meta.family + '", "Segoe UI", sans-serif';
      root.style.setProperty('--font-display', display);
      root.style.setProperty('--font-serif', display);
      root.style.setProperty('--font-sans', sans);
    } else {
      root.setAttribute('data-font', meta.id);
      root.style.removeProperty('--font-display');
      root.style.removeProperty('--font-serif');
      root.style.removeProperty('--font-sans');
    }
  };
  MF.isLightTheme = function () {
    return MF.themeMeta(MF.getTheme()).mode === 'light';
  };
  MF.setTheme = function (theme, options) {
    const opts = options || {};
    const meta = MF.themeMeta(theme);
    document.documentElement.setAttribute('data-theme', meta.id);
    try { localStorage.setItem('mifarium.theme', meta.id); } catch (e) {}
    MF.syncThemeUI();
    if (MF.isNative) {
      MF.invoke('setTheme', { theme: meta.id }).catch(function () {});
    }
    if (opts.announce) {
      MF.toast('Тема «' + meta.label + '»', meta.hint + '.', 'success');
    }
    if (MF.state.page === 'settings') MF.syncThemeOptions();
  };
  MF.toggleTheme = function () {
    const darkThemes = MF.THEMES.filter(function (theme) { return theme.mode === 'dark'; });
    const current = MF.getTheme();
    const index = darkThemes.findIndex(function (theme) { return theme.id === current; });
    if (MF.isLightTheme()) {
      MF.setTheme('dark', { announce: true });
    } else {
      MF.setTheme(darkThemes[(index + 1) % darkThemes.length].id, { announce: true });
    }
  };
  MF.syncThemeUI = function () {
    const btn = MF.$('#themeToggle');
    if (btn) {
      const light = MF.isLightTheme();
      btn.setAttribute('aria-label', light ? 'Включить тёмную тему' : 'Сменить палитру');
      btn.setAttribute('title', light ? 'Включить тёмную тему' : 'Сменить палитру');
    }
    MF.syncThemeOptions();
  };
  MF.syncThemeOptions = function () {
    MF.$$('.theme-option, .theme-row').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-theme-choice') === MF.getTheme());
    });
  };
  MF.setFont = function (font, options) {
    const opts = options || {};
    const meta = MF.fontMeta(font);
    MF.applyFont(meta.id);
    try { localStorage.setItem('mifarium.font', meta.id); } catch (e) {}
    MF.syncFontOptions();
    if (opts.announce) MF.toast('Шрифт «' + meta.label + '»', meta.hint + '.', 'success');
  };
  MF.syncFontOptions = function () {
    MF.$$('[data-font-choice]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-font-choice') === MF.getFont());
    });
  };

  MF.updateClock = function () {
    const now = new Date();
    const dateEl = MF.$('#clockDate');
    const timeEl = MF.$('#clockTime');
    if (dateEl) dateEl.textContent = MF.formatClockDate(now);
    if (timeEl) timeEl.textContent = MF.timeFmt.format(now);
    const clock = MF.$('.clock');
    if (clock) clock.title = MF.dateFullFmt.format(now) + ', ' + now.toLocaleTimeString(MF.LANG === 'en' ? 'en-US' : 'ru-RU');
  };

  MF.toast = function (title, text, type) {
    const root = MF.$('#toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    const iconName = type === 'error' ? 'i-alert' : type === 'success' ? 'i-check' : 'i-info';
    el.innerHTML = '<div class="toast-icon">' + MF.icon(iconName) + '</div>' +
      '<div class="toast-copy"><div class="toast-title">' + MF.esc(MF.t(title)) + '</div>' +
      (text ? '<div class="toast-text">' + MF.esc(MF.t(text)) + '</div>' : '') + '</div>' +
      '<button class="toast-close" aria-label="' + MF.esc(MF.t('Закрыть')) + '">' + MF.icon('i-x') + '</button>';
    root.appendChild(el);
    const remove = function () {
      el.classList.add('is-leaving');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 230);
    };
    el.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, type === 'error' ? 6500 : 4200);
  };

  /* ---------- Navigation & page lifecycle ---------- */
  MF.isValidPage = function (page) {
    if (page === 'dnd' && MF.EDITION !== 'dnd') return false;
    if (MF.PAGE_TITLES[page]) return true;
    if (page && page.indexOf('catalog:') === 0) return !!MF.catalogMeta(page.slice(8));
    return false;
  };
  MF.pageTitle = function (page) {
    if (MF.PAGE_TITLES[page]) return MF.PAGE_TITLES[page];
    if (page && page.indexOf('catalog:') === 0) {
      const catalog = MF.catalogMeta(page.slice(8));
      return MF.catalogName(catalog) || 'Раздел';
    }
    return 'Обзор';
  };
  MF.navigate = function (page, options) {
    const opts = options || {};
    if (!MF.isValidPage(page) || !MF.state.data) return;
    if (MF.closeAllOverlays) MF.closeAllOverlays();
    MF.state.page = page;
    MF.syncNav();
    const pageEl = MF.$('#page');
    if (opts.keepScroll !== true) window.scrollTo({ top: 0, behavior: 'auto' });
    if (pageEl) {
      pageEl.focus({ preventScroll: true });
      pageEl.innerHTML = MF.renderPage ? MF.renderPage(page) : '';
      if (MF.localizeDom) MF.localizeDom(pageEl);
    }
    const crumb = MF.$('#crumbPage');
    if (crumb) crumb.textContent = MF.pageTitle(page);
    if (window.innerWidth > 560) {
      try { window.location.hash = page === 'dashboard' ? '' : page; } catch (e) {}
    }
    if (MF.afterPageRender) MF.afterPageRender(page);
  };
  MF.syncNav = function () {
    MF.$$('.nav-item[data-nav]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === MF.state.page);
    });
    MF.$$('.nav-item[data-catalog]').forEach(function (el) {
      el.classList.toggle('active', MF.state.page === 'catalog:' + el.getAttribute('data-catalog'));
    });
  };
  MF.renderCurrentPage = function (options) {
    const pageEl = MF.$('#page');
    if (!pageEl || !MF.state.data) return;
    const scroll = window.scrollY;
    pageEl.innerHTML = MF.renderPage(MF.state.page);
    if (MF.localizeDom) MF.localizeDom(pageEl);
    MF.refreshNavCounts();
    if (options && options.keepScroll) window.scrollTo({ top: scroll, behavior: 'auto' });
    if (MF.afterPageRender) MF.afterPageRender(MF.state.page);
  };

  /* ---------- Progress ---------- */
  MF.worldProgress = function () {
    const data = MF.state.data;
    if (!data) return { percent: 0, checks: [] };
    const chars = data.characters;
    const locs = data.locations;
    const factions = data.factions;
    const lore = data.lore;
    const events = data.events;
    const notes = data.notes;
    const charChecks = chars.length ? chars.reduce(function (sum, c) {
      return sum + (c.description ? 1 : 0) + (c.portrait ? 1 : 0) + ((c.fatherId || c.motherId || (c.spouseIds && c.spouseIds.length)) ? 1 : 0) + (c.factionId ? 1 : 0);
    }, 0) : 0;
    const charMax = chars.length * 4 || 4;
    const locChecks = locs.length ? locs.reduce(function (sum, l) { return sum + (l.description ? 1 : 0) + (l.image ? 1 : 0); }, 0) : 0;
    const locMax = locs.length * 2 || 2;
    const loreChecks = lore.length ? lore.reduce(function (sum, l) { return sum + (l.content ? 1 : 0) + (l.image ? 1 : 0); }, 0) : 0;
    const loreMax = lore.length * 2 || 2;
    const eventChecks = events.length ? events.reduce(function (sum, e) { return sum + (e.description ? 1 : 0) + (e.dateText ? 1 : 0); }, 0) : 0;
    const eventMax = events.length * 2 || 2;
    const worldChecks = (data.world.name ? 1 : 0) + (data.world.tagline ? 1 : 0) + (data.world.description ? 1 : 0) + (data.world.currentYear ? 1 : 0);
    const filled = charChecks + locChecks + loreChecks + eventChecks + worldChecks;
    const total = charMax + locMax + loreMax + eventMax + 4;
    const percent = Math.round((filled / total) * 100);
    const checks = [
      { label: 'Профиль мира заполнен', done: worldChecks >= 3, count: worldChecks + '/4' },
      { label: 'У героев есть истории и портреты', done: chars.length > 0 && charChecks >= Math.max(1, charMax * .5), count: chars.length ? Math.round(charChecks / charMax * 100) + '%' : '—' },
      { label: 'Земли описаны и увидены', done: locs.length > 0 && locChecks >= Math.max(1, locMax * .5), count: locs.length ? Math.round(locChecks / locMax * 100) + '%' : '—' },
      { label: 'Хроника событий ведётся', done: events.length >= 3, count: events.length + '' },
      { label: 'Связи рода прочерчены', done: chars.some(function (c) { return c.fatherId || c.motherId || (c.spouseIds && c.spouseIds.length); }), count: chars.filter(function (c) { return c.fatherId || c.motherId || (c.spouseIds && c.spouseIds.length); }).length + '' },
      { label: 'Лор и статьи пополняются', done: lore.length >= 3, count: lore.length + '' }
    ];
    return { percent: MF.clamp(percent, 0, 100), checks: checks, hasNotes: notes.length, counts: { chars: chars.length, locs: locs.length, factions: factions.length, lore: lore.length, events: events.length, notes: notes.length } };
  };

  /* ---------- Popovers & controls ---------- */
  MF.closeCreateMenu = function () {
    const menu = MF.$('#createMenu');
    const btn = MF.$('#createBtn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  };
  MF.toggleCreateMenu = function () {
    const menu = MF.$('#createMenu');
    const btn = MF.$('#createBtn');
    if (!menu || !btn) return;
    const open = menu.hidden;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  };

  MF.getHashPage = function () {
    const hash = (window.location.hash || '').replace('#', '');
    if (hash === 'dnd' && MF.EDITION !== 'dnd') return 'dashboard';
    if (MF.PAGE_TITLES[hash]) return hash;
    if (hash.indexOf('catalog:') === 0 && MF.catalogMeta(hash.slice(8))) return hash;
    return 'dashboard';
  };

  /* ---------- Boot ---------- */
  MF.boot = async function () {
    const bootStatus = MF.$('#bootStatus');
    try {
      try { if (localStorage.getItem('mifarium.lang')) MF.setLanguage(MF.LANG, { announce: false }); } catch (e) {}
      if (MF.localizeDom) MF.localizeDom(document.body);
      MF.updateClock();
      setInterval(MF.updateClock, 1000);
      MF.state.data = null;
      await MF.loadInitialData();
      if (MF.isNative) {
        try { MF.state.info = await MF.invoke('getInfo'); } catch (e) {}
        try { MF.state.api = await MF.invoke('getApiSettings'); } catch (e) {}
        try { await MF.loadSyncSettings(); } catch (e) {}
      } else {
        MF.state.info = { storagePath: 'Локальное хранилище браузера (режим предпросмотра)', dataSize: JSON.stringify(MF.state.data).length, imageCount: 0 };
      }
      MF.state.page = MF.getHashPage();
      MF.refreshNavCounts();
      MF.loadCharacterFields();
      MF.loadCustomFonts();
      MF.loadCustomIcons();
      MF.loadBackground();
      MF.applyPattern();
      MF.applyUiScale();
      if (MF.state.pendingGenre && MF.state.data && MF.state.data.world) {
        const pending = MF.genreMeta(MF.state.pendingGenre);
        if (!MF.state.data.world.genreId || MF.state.data.world.isDemo) {
          MF.state.data.world.genreId = pending.id;
          MF.state.data.world.genre = MF.LANG === 'en' ? pending.labelEn : pending.label;
          await MF.saveNow();
        }
      }
      MF.applyNavConfig();
      MF.applyAppName(MF.getAppName());
      try { MF.applyFont(localStorage.getItem('mifarium.font') || 'forum'); } catch (e) {}
      MF.syncThemeUI();
      MF.syncFontOptions();
      MF.applyCustomIcons();
      const appEl = MF.$('#app');
      if (appEl) appEl.hidden = false;
      MF.navigate(MF.state.page);
      document.body.classList.add('ready');
      MF.state.loaded = true;
      if (bootStatus) bootStatus.textContent = '';
      if (!MF.state.data.world.description && !MF.state.data.characters.length) {
        setTimeout(function () { MF.toast('Мир ждёт первой записи', 'Откройте персонажа или статью лора, чтобы начать летопись.', 'info'); }, 800);
      }
    } catch (err) {
      if (bootStatus) {
        bootStatus.textContent = 'Не удалось открыть летопись. ' + (err && err.message ? err.message : '');
        bootStatus.classList.add('boot-error');
      }
      MF.toast('Ошибка запуска', err.message || 'Проверьте папку данных приложения.', 'error');
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (MF.isAndroid) document.documentElement.classList.add('platform-android');
    if (MF.onboardingNeeded && MF.onboardingNeeded() && MF.startOnboarding) {
      MF.startOnboarding();
    } else {
      MF.boot();
    }

    const themeToggle = MF.$('#themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', MF.toggleTheme);

    const searchTrigger = MF.$('#searchTrigger');
    if (searchTrigger) searchTrigger.addEventListener('click', function () { if (MF.openSearch) MF.openSearch(); });

    const createBtn = MF.$('#createBtn');
    if (createBtn) {
      createBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        MF.toggleCreateMenu();
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.create-wrap')) MF.closeCreateMenu();
    });

    document.addEventListener('click', function (e) {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        e.preventDefault();
        MF.navigate(nav.getAttribute('data-nav'));
        return;
      }
      const catalog = e.target.closest('[data-catalog]');
      if (catalog) {
        e.preventDefault();
        MF.navigate('catalog:' + catalog.getAttribute('data-catalog'));
      }
    });

    document.addEventListener('keydown', function (e) {
      const key = e.key ? e.key.toLowerCase() : '';
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        if (MF.openSearch) MF.openSearch();
        return;
      }
      if (key === 'escape') {
        const menu = MF.$('#createMenu');
        if (menu && !menu.hidden) { MF.closeCreateMenu(); return; }
        if (MF.handleEscape) MF.handleEscape();
      }
    });

    window.addEventListener('hashchange', function () {
      if (!MF.state.loaded) return;
      const page = MF.getHashPage();
      if (page !== MF.state.page) MF.navigate(page);
    });

    window.addEventListener('online', function () { MF.refreshStorageLabels(); });
  });
})();
