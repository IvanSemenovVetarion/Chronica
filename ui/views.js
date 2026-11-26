/* =========================================================
   Chronica — обзор и коллекции
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  function daysAgoISO(days) {
    return new Date(Date.now() - days * 86400000).toISOString();
  }
  MF.isRecent = function (iso, days) {
    if (!iso) return false;
    const d = new Date(iso).getTime();
    return !isNaN(d) && Date.now() - d <= (days || 7) * 86400000;
  };
  MF.newCount = function (collection) {
    const arr = MF.state.data[collection] || [];
    return arr.filter(function (item) { return MF.isRecent(item.createdAt, 7); }).length;
  };

  MF.heroArt = function () {
    return '<div class="hero-art" aria-hidden="true">' +
      '<svg viewBox="0 0 620 400" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
      '<g opacity=".42">' +
      '<circle cx="430" cy="196" r="148" stroke-width=".6"/>' +
      '<circle cx="430" cy="196" r="121" stroke-width=".5" stroke-dasharray="2 9"/>' +
      '<circle cx="430" cy="196" r="93" stroke-width=".45" opacity=".55"/>' +
      '<path d="M430 47v298M281 196h298" stroke-width=".4" opacity=".3"/>' +
      '</g>' +
      '<g opacity=".55">' +
      '<path d="M261 320 L324 226 L358 271 L401 207 L464 304 L509 261 L563 322" stroke-width="1"/>' +
      '<path d="M292 311 L324 265 L347 293 M377 244 L401 223 L429 264" stroke-width=".5" opacity=".55"/>' +
      '<path d="M248 340 C309 322 350 338 408 325 C473 311 518 329 581 314" stroke-width=".7" opacity=".55"/>' +
      '</g>' +
      '<g opacity=".7">' +
      '<path d="M451 315 L451 239 L466 220 L481 239 L481 315 Z" stroke-width=".9"/>' +
      '<path d="M481 315 L481 256 L493 241 L505 256 L505 315 Z" stroke-width=".8"/>' +
      '<path d="M466 196v-23M466 173l15 8-15 8" stroke-width=".75"/>' +
      '<path d="M461 285 l-21 65M471 285 l21 65" stroke-width=".5" opacity=".45"/>' +
      '<rect x="463" y="259" width="4" height="8" rx="1" fill="currentColor" stroke="none" opacity=".5"/>' +
      '<rect x="469" y="274" width="4" height="8" rx="1" fill="currentColor" stroke="none" opacity=".35"/>' +
      '</g>' +
      '<g opacity=".45">' +
      '<path d="M297 210 C335 180 368 193 393 162 C418 130 459 131 480 102" stroke-width=".9" stroke-dasharray="3 7"/>' +
      '<circle cx="297" cy="210" r="3" fill="currentColor" stroke="none"/>' +
      '<circle cx="393" cy="162" r="2.5" fill="currentColor" stroke="none"/>' +
      '<circle cx="480" cy="102" r="3" fill="currentColor" stroke="none"/>' +
      '</g>' +
      '<g opacity=".55">' +
      '<path d="M499 345 l13 30 30 13 -30 13 -13 30 -13 -30 -30 -13 30 -13z" stroke-width=".7"/>' +
      '<circle cx="499" cy="388" r="2" fill="currentColor" stroke="none"/>' +
      '</g>' +
      '<g fill="currentColor" stroke="none" opacity=".6">' +
      '<circle cx="238" cy="95" r="1.1"/><circle cx="330" cy="63" r=".8"/><circle cx="551" cy="143" r="1"/>' +
      '<circle cx="578" cy="244" r=".8"/><circle cx="208" cy="253" r=".7"/><circle cx="354" cy="349" r=".8"/>' +
      '</g>' +
      '<g opacity=".3" stroke-width=".6">' +
      '<path d="M344 82 c14-10 29-10 43 0M531 78 c12-9 24-9 36 0"/>' +
      '</g>' +
      '</svg></div>';
  };

  MF.demoBanner = function () {
    const data = MF.state.data;
    if (!data.world.isDemo) return '';
    try { if (localStorage.getItem('mifarium.demoDismissed') === '1') return ''; } catch (e) {}
    return '<div class="demo-banner">' +
      '<span class="demo-mark">' + MF.icon('i-sparkles') + 'ДЕМО-МИР</span>' +
      '<span>Это пример мира <strong>«' + MF.esc(data.world.name) + '»</strong>, чтобы вы освоились. Все записи можно менять, а когда захотите — начать свою летопись с чистого листа.</span>' +
      '<div class="demo-banner-actions">' +
      '<button class="btn btn-soft" data-action="start-clean">Создать свой мир</button>' +
      '<button class="icon-btn" data-action="dismiss-demo" aria-label="Скрыть подсказку" title="Скрыть">' + MF.icon('i-x') + '</button>' +
      '</div></div>';
  };

  MF.statCard = function (key, page, icon, label, count, newCount) {
    return '<button class="stat-card" data-nav="' + page + '" title="Открыть раздел «' + MF.esc(label) + '»">' +
      '<span class="stat-icon">' + MF.icon(icon) + '</span>' +
      '<span class="stat-body"><span class="stat-value">' + count + '</span>' +
      '<span class="stat-label">' + MF.esc(label) + '</span>' +
      '<span class="stat-new ' + (newCount ? '' : 'is-empty') + '">' + (newCount ? '+' + newCount + ' за неделю' : '&nbsp;') + '</span></span>' +
      '</button>';
  };

  MF.getRecentActivity = function (limit) {
    const data = MF.state.data;
    const arr = [];
    (data.activity || []).slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).forEach(function (a) {
      if (a.entityType === 'world') {
        arr.push({ kind: a.kind, entityType: 'world', entityId: '', title: a.title, at: a.at });
      } else {
        const item = MF.getEntity(a.entityType, a.entityId);
        if (item) arr.push({ kind: a.kind, entityType: a.entityType, entityId: a.entityId, title: a.title, at: a.at });
      }
    });
    if (!arr.length) {
      const all = [];
      ['character', 'region', 'location', 'faction', 'race', 'lore', 'event', 'note'].forEach(function (type) {
        (data[MF.collectionFor(type)] || []).forEach(function (item) {
          all.push({ kind: 'update', entityType: type, entityId: item.id, title: MF.activityTitle(type, 'update', item.name || item.title), at: item.updatedAt || item.createdAt });
        });
      });
      all.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
      return all.slice(0, limit || 6);
    }
    return arr.slice(0, limit || 6);
  };

  MF.renderDashboard = function () {
    const data = MF.state.data;
    const world = data.world;
    const stats = [
      ['characters', 'characters', 'i-users', 'Персонажи'],
      ['regions', 'regions', 'i-region', 'Регионы'],
      ['locations', 'regions', 'i-map', 'Локации'],
      ['factions', 'factions', 'i-banner', 'Фракции'],
      ['races', 'races', 'i-race', 'Расы'],
      ['lore', 'lore', 'i-book', 'Лор'],
      ['events', 'timeline', 'i-hourglass', 'События'],
      ['notes', 'notes', 'i-feather', 'Заметки']
    ];
    const statCards = stats.map(function (s) {
      return MF.statCard(s[0], s[1], s[2], s[3], data[s[0]].length, MF.newCount(s[0]));
    }).join('');

    const heroAction = data.characters.length
      ? '<button class="btn btn-primary btn-lg" data-nav="tree">' + MF.icon('i-tree') + 'Смотреть древо</button>'
      : '<button class="btn btn-primary btn-lg" data-action="new-character">' + MF.icon('i-plus') + 'Добавить первого героя</button>';

    const hero = '<section class="hero">' +
      (world.cover ? '<div class="hero-cover" style="background-image:url(&quot;' + MF.esc(world.cover) + '&quot;)"></div>' : MF.heroArt()) +
      '<span class="hero-corner hero-corner--tl"></span><span class="hero-corner hero-corner--tr"></span><span class="hero-corner hero-corner--bl"></span><span class="hero-corner hero-corner--br"></span>' +
      '<div class="hero-content">' +
      '<div class="hero-eyebrow"><span>' + MF.esc(world.genre || 'Фэнтези') + '</span><span class="diamond"></span><span>Хроники мира</span>' + (world.isDemo ? '<span class="diamond"></span><span>демо-мир</span>' : '') + '</div>' +
      '<h1 class="hero-title">' + MF.esc(world.name || 'Мой мир') + '</h1>' +
      '<p class="hero-tagline">' + MF.esc(world.tagline || MF.t('История этого мира начинается с первой страницы.')) + '</p>' +
      '<div class="hero-meta">' +
      (world.currentYear ? '<span>' + MF.icon('i-hourglass') + MF.esc(world.currentYear) + '</span>' : '') +
      (world.era ? '<span>' + MF.esc(world.era) + '</span>' : '') +
      '<span>' + MF.icon('i-users') + data.characters.length + ' ' + MF.plural(data.characters.length, 'герой', 'героя', 'героев') + '</span>' +
      '<span>' + MF.icon('i-region') + data.regions.length + ' ' + MF.plural(data.regions.length, 'регион', 'региона', 'регионов') + '</span>' +
      '<span>' + MF.icon('i-map') + data.locations.length + ' ' + MF.plural(data.locations.length, 'земля', 'земли', 'земель') + '</span>' +
      '<span>' + MF.icon('i-race') + data.races.length + ' ' + MF.plural(data.races.length, 'раса', 'расы', 'рас') + '</span>' +
      '</div>' +
      '<div class="hero-actions">' + heroAction +
      '<button class="btn btn-ghost btn-lg" data-action="edit-world">' + MF.icon('i-edit') + 'Описать мир</button>' +
      '</div></div></section>';

    const progress = MF.worldProgress();
    const ringC = 2 * Math.PI * 38;
    const ringOffset = ringC * (1 - progress.percent / 100);
    const checks = progress.checks.map(function (check) {
      return '<div class="progress-check ' + (check.done ? 'done' : '') + '">' +
        '<span class="check-mark">' + MF.icon(check.done ? 'i-check' : 'i-x') + '</span>' +
        '<span>' + MF.esc(check.label) + '</span>' +
        '<span class="pc-count">' + MF.esc(check.count) + '</span></div>';
    }).join('');

    const recent = MF.getRecentActivity(6);
    const recentHtml = recent.length ? recent.map(function (a) {
      const et = a.entityType === 'world' ? { label: 'Мир', icon: 'i-globe' } : MF.ENTITY[a.entityType];
      const icon = et ? et.icon : 'i-scroll';
      const label = et ? et.label : 'Запись';
      return '<button class="activity-item" data-action="open-activity" data-entity-type="' + MF.esc(a.entityType) + '" data-entity-id="' + MF.esc(a.entityId || '') + '">' +
        '<span class="activity-icon">' + MF.icon(icon) + '</span>' +
        '<span class="activity-main"><span class="activity-title">' + MF.esc(a.title) + '</span>' +
        '<span class="activity-sub">' + MF.esc(label) + '</span></span>' +
        '<span class="activity-time"><strong>' + MF.formatRelative(a.at) + '</strong>' + MF.formatDateShort(a.at) + ' · ' + MF.formatTime(a.at) + '</span>' +
        '</button>';
    }).join('') : '<div class="activity-empty">Здесь появятся новые записи. Создайте персонажа, локацию или заметку.</div>';

    const events = data.events.slice().sort(function (a, b) {
      return (Number(b.sortYear) || 0) - (Number(a.sortYear) || 0);
    }).slice(0, 3);
    const eventHtml = events.length ? events.map(function (ev) {
      return '<button class="mini-timeline-item" data-action="open-event" data-id="' + MF.esc(ev.id) + '">' +
        '<span class="mini-date">' + MF.esc(MF.eventYearLabel(ev)) + '</span>' +
        '<span class="mini-timeline-copy"><strong>' + MF.esc(ev.title) + '</strong><small>' + MF.esc(ev.era || MF.EVENT_TYPES[ev.type] && MF.EVENT_TYPES[ev.type].label || 'Событие') + '</small></span>' +
        '</button>';
    }).join('') : '<div class="activity-empty">Хронология пока пуста.<br>Добавьте первое событие вашего мира.</div>';

    const quoteChar = MF.charQuoteForDay();
    const quotePanel = quoteChar ? '<div class="panel quote-panel"><div class="quote-mark">“</div>' +
      '<blockquote>' + MF.esc(quoteChar.quote) + '</blockquote>' +
      '<cite>' + MF.esc(quoteChar.name) + (quoteChar.title ? ' · ' + MF.esc(quoteChar.title) : '') + '</cite></div>' : '';

    return '<div class="view">' +
      MF.demoBanner() +
      hero +
      '<div class="stats-grid">' + statCards + '</div>' +
      '<div class="dash-grid">' +
      '<div class="dash-column">' +
      '<section class="panel"><header class="panel-head"><h2>' + MF.icon('i-scroll') + 'Последние записи</h2>' +
      '<button class="link-btn" data-action="show-journal">Журнал ' + MF.icon('i-chevron-right') + '</button></header>' +
      '<div class="activity-list">' + recentHtml + '</div></section>' +
      '<section class="panel"><header class="panel-head"><h2>' + MF.icon('i-hourglass') + 'Из хроники</h2>' +
      '<button class="link-btn" data-nav="timeline">Вся хронология ' + MF.icon('i-chevron-right') + '</button></header>' +
      '<div class="mini-timeline">' + eventHtml + '</div></section>' +
      '</div>' +
      '<div class="dash-column dash-column--right">' +
      '<section class="panel progress-panel">' +
      '<div class="progress-top">' +
      '<div class="progress-ring"><svg viewBox="0 0 100 100"><circle class="ring-bg" cx="50" cy="50" r="38"/><circle class="ring-value" cx="50" cy="50" r="38" stroke-dasharray="' + ringC.toFixed(2) + '" stroke-dashoffset="' + ringOffset.toFixed(2) + '"/></svg>' +
      '<div class="progress-ring-label"><strong>' + progress.percent + '%</strong><small>полнота</small></div></div>' +
      '<div class="progress-copy"><h3>Летопись оживает</h3><p>Чем больше историй, образов и связей, тем полнее ваш мир.</p></div>' +
      '</div>' +
      '<div class="progress-checks">' + checks + '</div>' +
      '<div class="progress-foot"><span>' + data.activity.length + ' ' + MF.plural(data.activity.length, 'запись', 'записи', 'записей') + ' в журнале</span>' +
      '<button class="link-btn" data-nav="settings">Настройки ' + MF.icon('i-chevron-right') + '</button></div>' +
      '</section>' +
      quotePanel +
      '</div></div></div>';
  };

  /* ---------- Characters ---------- */
  MF.filterCharacters = function () {
    const data = MF.state.data;
    const q = MF.normalize(MF.state.ui.charSearch);
    const f = MF.state.ui.charFilter;
    return data.characters.filter(function (c) {
      if (f === 'alive' && !MF.isLiving(c.status)) return false;
      if (f === 'dead' && !/погиб|deceased|dead/i.test(c.status || '')) return false;
      if (f === 'unknown' && (MF.isLiving(c.status) || /погиб|deceased|dead/i.test(c.status || ''))) return false;
      if (!q) return true;
      const faction = MF.getFaction(c.factionId);
      const location = MF.getLocation(c.locationId);
      const race = MF.raceOf(c);
      const audioTitles = (c.audio || []).map(function (track) { return track.title || ''; }).join(' ');
      const customTitles = (c.customFields || []).map(function (field) { return (field.label || '') + ' ' + (field.value || ''); }).join(' ');
      const haystack = [c.name, c.title, c.role, c.race, c.gender, race && race.name, c.appearance, c.description, c.personality, c.quote, audioTitles, customTitles, (c.tags || []).join(' '), faction && faction.name, location && location.name].join(' ');
      return MF.normalize(haystack).indexOf(q) !== -1;
    }).sort(function (a, b) {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  };

  MF.characterCard = function (c) {
    const faction = MF.getFaction(c.factionId);
    const color = faction && faction.color ? faction.color : 'var(--muted-2)';
    const raceName = MF.raceName(c);
    const show = MF.isCharacterFieldVisible;
    const titleLine = [show('title') ? c.title : '', show('role') ? c.role : '', show('race') ? c.race : ''].filter(Boolean)[0] || '';
    const submeta = [show('race') ? raceName : '', show('gender') && MF.isKnownGender(c.gender) ? c.gender : ''].filter(Boolean).join(' · ');
    const custom = (Array.isArray(c.customFields) ? c.customFields : []).filter(function (field) { return field && field.label; }).slice(0, 2);
    const artMarks = (show('gallery') && c.gallery && c.gallery.length) || (show('audio') && c.audio && c.audio.length) || (show('palette') && c.palette && c.palette.length);
    return '<article class="character-card" role="button" tabindex="0" data-action="open-character" data-id="' + MF.esc(c.id) + '" aria-label="Открыть персонажа ' + MF.esc(c.name) + '">' +
      '<div class="char-portrait">' + MF.characterPortrait(c) +
      '<div class="char-shade"></div>' +
      (show('status') ? MF.statusBadge(c.status) : '') +
      '<span class="char-open-arrow">' + MF.icon('i-arrow-left') + '</span>' +
      '<div class="char-portrait-content"><h3 class="char-name">' + MF.esc(c.name) + '</h3>' +
      '<p class="char-title">' + MF.esc(titleLine) + '</p></div></div>' +
      '<div class="char-body"><div class="char-meta-row">' +
      (show('faction') ? '<span class="char-faction"><span class="faction-swatch" style="background:' + MF.esc(color) + '"></span><span>' + MF.esc(faction ? faction.name : 'Без фракции') + '</span></span>' : '<span></span>') +
      '<span class="char-updated" title="Обновлено: ' + MF.esc(MF.formatDateFull(c.updatedAt)) + '">' + MF.formatDateShort(c.updatedAt) + '</span>' +
      '</div>' +
      (submeta ? '<div class="char-submeta">' + MF.icon('i-race') + '<span>' + MF.esc(submeta) + '</span></div>' : '') +
      (custom.length ? '<div class="char-custom-preview">' + custom.map(function (field) { return '<span><b>' + MF.esc(field.label) + '</b>' + MF.esc(field.value || '—') + '</span>'; }).join('') + '</div>' : '') +
      (artMarks ? '<div class="char-art-marks">' +
        (show('gallery') && c.gallery && c.gallery.length ? '<span title="Рисунки">' + MF.icon('i-gallery') + c.gallery.length + '</span>' : '') +
        (show('audio') && c.audio && c.audio.length ? '<span title="Голос и музыка">' + MF.icon('i-audio') + c.audio.length + '</span>' : '') +
        (show('palette') && c.palette && c.palette.length ? '<span class="char-palette-mini" title="Палитра">' + c.palette.slice(0, 5).map(function (color) { return '<i style="background:' + MF.esc(color) + '"></i>'; }).join('') + '</span>' : '') +
        '</div>' : '') +
      '</div></article>';
  };

  MF.renderCharacterGrid = function () {
    const list = MF.filterCharacters();
    if (!list.length) {
      return '<div class="no-results" style="grid-column:1/-1"><strong>Никого не нашлось</strong>Попробуйте изменить запрос или снять фильтр.</div>';
    }
    return list.map(MF.characterCard).join('') +
      '<button class="char-add-card" data-action="new-character"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>Новый персонаж</span></button>';
  };

  MF.renderCharacters = function () {
    const data = MF.state.data;
    const aliveCount = data.characters.filter(function (c) { return MF.isLiving(c.status); }).length;
    const deadCount = data.characters.filter(function (c) { return /погиб/i.test(c.status || ''); }).length;
    const unknownCount = data.characters.length - aliveCount - deadCount;
    const filters = [
      { id: 'all', label: 'Все', count: data.characters.length },
      { id: 'alive', label: 'Живые', count: aliveCount },
      { id: 'dead', label: 'Павшие', count: deadCount },
      { id: 'unknown', label: 'Неизвестность', count: unknownCount }
    ];
    const chips = filters.map(function (f) {
      return '<button class="chip ' + (MF.state.ui.charFilter === f.id ? 'active' : '') + '" data-char-filter="' + f.id + '">' + f.label + ' <span class="count">' + f.count + '</span></button>';
    }).join('');
    const hasChars = data.characters.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main">' +
      '<div class="eyebrow">Галерея героев</div><h1 class="page-title">Персонажи</h1>' +
      '<p class="page-subtitle">Собирайте героев, злодеев и случайных путников. Портреты, судьбы и родственные связи складываются в живую историю мира.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-character">' + MF.icon('i-plus') + 'Новый персонаж</button></div></div>' +
      (hasChars ? '<div class="toolbar"><div class="toolbar-left">' +
        '<div class="search-field">' + MF.icon('i-search') + '<input id="charSearch" type="search" placeholder="Найти героя…" value="' + MF.esc(MF.state.ui.charSearch) + '" autocomplete="off"></div>' +
        '<div class="chip-row">' + chips + '</div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="charResultCount">' + data.characters.length + ' ' + MF.plural(data.characters.length, 'персонаж', 'персонажа', 'персонажей') + '</span></div></div>' : '') +
      (hasChars ? '<div class="card-grid" id="charactersGrid">' + MF.renderCharacterGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-users') + '</div><h2 class="empty-title">Герои ждут своего часа</h2><p class="empty-text">Добавьте первого персонажа: его портрет, историю и связи с другими. Это станет первым ростком вашей династии.</p><button class="btn btn-primary" data-action="new-character">' + MF.icon('i-plus') + 'Добавить персонажа</button></div>') +
      '</div>';
  };

  /* ---------- Locations ---------- */
  MF.filterLocations = function () {
    const ui = MF.state.ui;
    const q = MF.normalize(ui.locSearch);
    const type = ui.locType;
    const regionFilter = ui.locRegion;
    return MF.state.data.locations.filter(function (l) {
      if (type !== 'all' && l.type !== type) return false;
      if (regionFilter !== 'all' && l.regionId !== regionFilter) return false;
      if (!q) return true;
      const region = MF.getRegion(l.regionId);
      const haystack = [l.name, l.type, l.region, region && region.name, l.description, (l.tags || []).join(' ')].join(' ');
      return MF.normalize(haystack).indexOf(q) !== -1;
    }).sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
  };

  MF.locationCard = function (l) {
    const residents = MF.state.data.characters.filter(function (c) { return c.locationId === l.id; }).length;
    const factions = MF.state.data.factions.filter(function (f) { return f.locationId === l.id; }).length;
    const region = MF.getRegion(l.regionId);
    const regionName = region ? region.name : l.region;
    return '<article class="location-card" role="button" tabindex="0" data-action="open-location" data-id="' + MF.esc(l.id) + '" aria-label="Открыть локацию ' + MF.esc(l.name) + '">' +
      '<div class="location-media">' + MF.locationMedia(l) + '<span class="location-type">' + MF.esc(l.type || 'Земля') + '</span></div>' +
      '<div class="location-body"><h3 class="location-name">' + MF.esc(l.name) + '</h3>' +
      (regionName ? '<div class="location-region">' + MF.icon('i-region') + MF.esc(regionName) + '</div>' : '') +
      '<p class="location-desc clamp-2">' + MF.esc(MF.clampText(l.description, 160) || 'Описание этого места ещё ждёт своего летописца.') + '</p>' +
      '<div class="location-footer"><span>' + MF.icon('i-users') + residents + ' ' + MF.plural(residents, 'герой', 'героя', 'героев') + '</span>' +
      (factions ? '<span>' + MF.icon('i-banner') + factions + '</span>' : '') +
      '<span class="date-stamp" title="Обновлено: ' + MF.esc(MF.formatDateFull(l.updatedAt)) + '">' + MF.icon('i-clock') + MF.formatDateShort(l.updatedAt) + '</span></div></div></article>';
  };

  MF.renderLocationGrid = function () {
    const list = MF.filterLocations();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>Земли не найдены</strong>Попробуйте изменить запрос или тип локации.</div>';
    return list.map(MF.locationCard).join('') +
      '<button class="char-add-card" data-action="new-location" style="min-height:235px"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>Новая локация</span></button>';
  };

  MF.renderLocations = function () {
    const data = MF.state.data;
    const types = Array.from(new Set(data.locations.map(function (l) { return l.type; }).filter(Boolean))).sort();
    const optionHtml = ['<option value="all">Все земли</option>'].concat(types.map(function (t) {
      return '<option value="' + MF.esc(t) + '"' + (MF.state.ui.locType === t ? ' selected' : '') + '>' + MF.esc(t) + '</option>';
    })).join('');
    const regionOptionHtml = ['<option value="all">Все регионы</option>'].concat(data.regions.map(function (r) {
      return '<option value="' + MF.esc(r.id) + '"' + (MF.state.ui.locRegion === r.id ? ' selected' : '') + '>' + MF.esc(r.name) + '</option>';
    })).join('');
    const has = data.locations.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Карта мира</div><h1 class="page-title">Локации</h1>' +
      '<p class="page-subtitle">От шумных столиц до забытых руин. Локации живут внутри регионов, а каждое место хранит атмосферу, тайны и тех, кто его населяет.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-location">' + MF.icon('i-plus') + 'Новая локация</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left">' +
        '<div class="search-field">' + MF.icon('i-search') + '<input id="locSearch" type="search" placeholder="Найти локацию…" value="' + MF.esc(MF.state.ui.locSearch) + '"></div>' +
        '<select class="select-compact" id="locRegionFilter">' + regionOptionHtml + '</select>' +
        '<select class="select-compact" id="locTypeFilter">' + optionHtml + '</select></div>' +
        '<div class="toolbar-right"><span class="result-count" id="locResultCount">' + data.locations.length + ' ' + MF.plural(data.locations.length, 'место', 'места', 'мест') + '</span></div></div>' : '') +
      (has ? '<div class="location-grid" id="locationsGrid">' + MF.renderLocationGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-map') + '</div><h2 class="empty-title">Мир пока без карты</h2><p class="empty-text">Добавьте первую локацию: город, лес, крепость или таинственную руину. У каждой земли есть свой характер.</p><button class="btn btn-primary" data-action="new-location">' + MF.icon('i-plus') + 'Добавить локацию</button></div>') +
      '</div>';
  };

  /* ---------- Factions ---------- */
  MF.filterFactions = function () {
    const q = MF.normalize(MF.state.ui.factionSearch);
    return MF.state.data.factions.filter(function (f) {
      if (!q) return true;
      return MF.normalize([f.name, f.type, f.description, f.ideology, (f.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    }).sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
  };

  MF.factionCard = function (f) {
    const leader = f.leaderId ? MF.getCharacter(f.leaderId) : null;
    const members = MF.state.data.characters.filter(function (c) { return c.factionId === f.id; }).length;
    const region = MF.getRegion(f.regionId);
    const location = MF.getLocation(f.locationId);
    const place = location ? location.name : (region ? region.name : '');
    return '<article class="faction-card" role="button" tabindex="0" data-action="open-faction" data-id="' + MF.esc(f.id) + '" aria-label="Открыть фракцию ' + MF.esc(f.name) + '">' +
      MF.factionEmblemMarkup(f) +
      '<div class="faction-main"><div class="faction-top"><div><h3 class="faction-name">' + MF.esc(f.name) + '</h3>' +
      '<div class="faction-type">' + MF.esc(f.type || 'Фракция') + (place ? ' · ' + MF.esc(place) : '') + '</div></div>' +
      '<span class="badge ' + (f.status === 'У власти' ? 'badge-gold' : '') + '">' + MF.esc(f.status || 'Действует') + '</span></div>' +
      '<p class="faction-desc clamp-2">' + MF.esc(f.description || MF.t('У этой силы ещё нет истории. Расскажите, чего она добивается и чего боится.')) + '</p>' +
      '<div class="faction-stats"><span class="faction-stat">' + MF.icon('i-users') + '<strong>' + members + '</strong> ' + MF.plural(members, 'участник', 'участника', 'участников') + '</span>' +
      (leader ? '<span class="faction-stat">' + MF.icon('i-crown') + '<strong>' + MF.esc(leader.name) + '</strong></span>' : '') +
      '<span class="faction-stat" style="margin-left:auto">' + MF.icon('i-clock') + MF.formatDateShort(f.updatedAt) + '</span></div></div></article>';
  };

  MF.renderFactionGrid = function () {
    const list = MF.filterFactions();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>Силы не найдены</strong>Попробуйте изменить запрос.</div>';
    return list.map(MF.factionCard).join('') +
      '<button class="faction-add" data-action="new-faction">' + MF.icon('i-plus') + 'Новая фракция</button>';
  };

  MF.renderFactions = function () {
    const data = MF.state.data;
    const has = data.factions.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Силы мира</div><h1 class="page-title">Фракции</h1>' +
      '<p class="page-subtitle">Дома, ордена, ковены и братства. Здесь у каждой силы есть цель, лидер и цена, которую она готова заплатить.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-faction">' + MF.icon('i-plus') + 'Новая фракция</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left"><div class="search-field">' + MF.icon('i-search') + '<input id="factionSearch" type="search" placeholder="Найти фракцию…" value="' + MF.esc(MF.state.ui.factionSearch) + '"></div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="factionResultCount">' + data.factions.length + ' ' + MF.plural(data.factions.length, 'фракция', 'фракции', 'фракций') + '</span></div></div>' : '') +
      (has ? '<div class="factions-grid" id="factionsGrid">' + MF.renderFactionGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-banner') + '</div><h2 class="empty-title">В мире нет сил</h2><p class="empty-text">Создайте первый дом или орден, определите его цели и лидера. Противостояние — топливо для истории.</p><button class="btn btn-primary" data-action="new-faction">' + MF.icon('i-plus') + 'Добавить фракцию</button></div>') +
      '</div>';
  };

  /* ---------- Regions ---------- */
  MF.filterRegions = function () {
    const q = MF.normalize(MF.state.ui.regionSearch);
    return MF.state.data.regions.filter(function (r) {
      if (!q) return true;
      return MF.normalize([r.name, r.type, r.climate, r.description, (r.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    }).sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
  };

  MF.regionCard = function (r) {
    const locations = MF.state.data.locations.filter(function (l) { return l.regionId === r.id; });
    const factions = MF.state.data.factions.filter(function (f) { return f.regionId === r.id; });
    const characters = MF.state.data.characters.filter(function (c) {
      return locations.some(function (l) { return l.id === c.locationId; });
    });
    const locationNames = locations.slice(0, 4).map(function (l) { return l.name; }).join(' · ');
    return '<article class="location-card region-card" role="button" tabindex="0" data-action="open-region" data-id="' + MF.esc(r.id) + '" aria-label="Открыть регион ' + MF.esc(r.name) + '">' +
      '<div class="location-media">' + MF.locationMedia(r) + '<span class="location-type">' + MF.esc(r.type || 'Регион') + '</span></div>' +
      '<div class="location-body"><h3 class="location-name">' + MF.esc(r.name) + '</h3>' +
      (r.climate ? '<div class="location-region">' + MF.icon('i-sun') + MF.esc(r.climate) + '</div>' : '') +
      '<p class="location-desc clamp-2">' + MF.esc(MF.clampText(r.description, 160) || 'Этот регион ещё ждёт своего описания.') + '</p>' +
      (locationNames ? '<div class="region-locations"><span>' + MF.icon('i-map') + MF.esc(locationNames) + (locations.length > 4 ? ' · +' + (locations.length - 4) : '') + '</span></div>' : '') +
      '<div class="location-footer"><span>' + MF.icon('i-map') + locations.length + ' ' + MF.plural(locations.length, 'локация', 'локации', 'локаций') + '</span>' +
      '<span>' + MF.icon('i-banner') + factions.length + '</span>' +
      '<span>' + MF.icon('i-users') + characters.length + '</span></div></div></article>';
  };

  MF.renderRegionGrid = function () {
    const list = MF.filterRegions();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>Регионы не найдены</strong>Попробуйте изменить запрос.</div>';
    return list.map(MF.regionCard).join('') +
      '<button class="char-add-card" data-action="new-region" style="min-height:235px"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>Новый регион</span></button>';
  };

  MF.renderRegions = function () {
    const data = MF.state.data;
    const has = data.regions.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Земли и пределы</div><h1 class="page-title">Регионы</h1>' +
      '<p class="page-subtitle">Крупные области мира: королевства, пустоши, священные холмы. Внутри каждого региона живут локации, а силы делят между собой влияние.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-region">' + MF.icon('i-plus') + 'Новый регион</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left"><div class="search-field">' + MF.icon('i-search') + '<input id="regionSearch" type="search" placeholder="Найти регион…" value="' + MF.esc(MF.state.ui.regionSearch) + '"></div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="regionResultCount">' + data.regions.length + ' ' + MF.plural(data.regions.length, 'регион', 'региона', 'регионов') + '</span></div></div>' : '') +
      (has ? '<div class="location-grid" id="regionsGrid">' + MF.renderRegionGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-region') + '</div><h2 class="empty-title">Мир ещё не разделён</h2><p class="empty-text">Создайте первый регион — королевство, долину или пустошь. Локации и фракции смогут найти в нём свой дом.</p><button class="btn btn-primary" data-action="new-region">' + MF.icon('i-plus') + 'Добавить регион</button></div>') +
      '</div>';
  };

  /* ---------- Races ---------- */
  MF.filterRaces = function () {
    const q = MF.normalize(MF.state.ui.raceSearch);
    return MF.state.data.races.filter(function (r) {
      if (!q) return true;
      return MF.normalize([r.name, r.type, r.traits, r.description, (r.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    }).sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
  };

  MF.raceCard = function (r) {
    const characters = MF.state.data.characters.filter(function (c) { return c.raceId === r.id; });
    const mark = MF.factionEmblemMarkup({ name: r.name, color: '#7fa8c4', emblem: r.image }, 'race-emblem');
    return '<article class="faction-card race-card" role="button" tabindex="0" data-action="open-race" data-id="' + MF.esc(r.id) + '" aria-label="Открыть расу ' + MF.esc(r.name) + '">' +
      mark +
      '<div class="faction-main"><div class="faction-top"><div><h3 class="faction-name">' + MF.esc(r.name) + '</h3>' +
      '<div class="faction-type">' + MF.esc(r.type || 'Народ') + '</div></div>' +
      '<span class="badge">' + characters.length + ' ' + MF.plural(characters.length, 'герой', 'героя', 'героев') + '</span></div>' +
      (r.traits ? '<div class="race-traits">' + MF.icon('i-sparkles') + MF.esc(r.traits) + '</div>' : '') +
      '<p class="faction-desc clamp-2">' + MF.esc(r.description || MF.t('Эта раса ещё не описана. Расскажите, чем она отличается от других народов.')) + '</p>' +
      '<div class="faction-stats"><span class="faction-stat">' + MF.icon('i-users') + '<strong>' + characters.length + '</strong> ' + MF.plural(characters.length, 'представитель', 'представителя', 'представителей') + '</span>' +
      '<span class="faction-stat" style="margin-left:auto">' + MF.icon('i-clock') + MF.formatDateShort(r.updatedAt) + '</span></div></div></article>';
  };

  MF.renderRaceGrid = function () {
    const list = MF.filterRaces();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>Расы не найдены</strong>Попробуйте изменить запрос.</div>';
    return list.map(MF.raceCard).join('') +
      '<button class="faction-add" data-action="new-race">' + MF.icon('i-plus') + 'Новая раса</button>';
  };

  MF.renderRaces = function () {
    const data = MF.state.data;
    const has = data.races.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Народы мира</div><h1 class="page-title">Расы</h1>' +
      '<p class="page-subtitle">Смертные, древние, одарённые и звери. Расы задают происхождение героев, их обычаи и то, чем они отличаются друг от друга.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-race">' + MF.icon('i-plus') + 'Новая раса</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left"><div class="search-field">' + MF.icon('i-search') + '<input id="raceSearch" type="search" placeholder="Найти расу…" value="' + MF.esc(MF.state.ui.raceSearch) + '"></div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="raceResultCount">' + data.races.length + ' ' + MF.plural(data.races.length, 'раса', 'расы', 'рас') + '</span></div></div>' : '') +
      (has ? '<div class="factions-grid" id="racesGrid">' + MF.renderRaceGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-race') + '</div><h2 class="empty-title">Народы ещё не названы</h2><p class="empty-text">Добавьте первую расу: людей, эльфов, детей тумана или кого-то, кого мир ещё не видел.</p><button class="btn btn-primary" data-action="new-race">' + MF.icon('i-plus') + 'Добавить расу</button></div>') +
      '</div>';
  };

  /* ---------- Lore ---------- */
  MF.filterLore = function () {
    const q = MF.normalize(MF.state.ui.loreSearch);
    const cat = MF.state.ui.loreCategory;
    const source = MF.state.ui.loreSource || 'all';
    return MF.state.data.lore.filter(function (l) {
      if (cat !== 'all' && l.category !== cat) return false;
      if (source !== 'all' && l.sourceId !== source) return false;
      if (!q) return true;
      return MF.normalize([l.title, l.category, l.summary, l.content, l.sourceTitle, (l.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    }).sort(function (a, b) { return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0); });
  };

  MF.loreCard = function (l) {
    return '<article class="lore-card" role="button" tabindex="0" data-action="open-lore" data-id="' + MF.esc(l.id) + '" aria-label="Открыть статью ' + MF.esc(l.title) + '">' +
      '<div class="lore-media">' + MF.loreArt(l) + '<span class="lore-category">' + MF.esc(l.category || 'Лор') + '</span>' +
      (l.sourceId ? '<span class="lore-source-badge">' + MF.icon('i-scroll') + MF.esc(l.sourceTitle || 'Источник') + '</span>' : '') + '</div>' +
      '<div class="lore-body"><h3 class="lore-title">' + MF.esc(l.title) + '</h3>' +
      '<p class="lore-summary clamp-3">' + MF.esc(l.summary || MF.clampText(l.content, 150) || MF.t('Статья ещё не дописана.')) + '</p>' +
      '<div class="lore-footer"><span class="lore-tags">' + MF.tagList(l.tags, 2) + '</span>' +
      '<span class="date-stamp" title="Обновлено: ' + MF.esc(MF.formatDateFull(l.updatedAt)) + '">' + MF.icon('i-clock') + MF.formatDateShort(l.updatedAt) + '</span></div></div></article>';
  };

  MF.renderLoreGrid = function () {
    const list = MF.filterLore();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>Статей не найдено</strong>Попробуйте другую категорию или запрос.</div>';
    return list.map(MF.loreCard).join('') +
      '<button class="char-add-card" data-action="new-lore" style="min-height:285px"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>Новая статья</span></button>';
  };

  MF.renderLore = function () {
    const data = MF.state.data;
    const categories = ['all'].concat(MF.LORE_CATEGORIES.filter(function (cat) {
      return data.lore.some(function (l) { return l.category === cat; });
    }));
    const chips = categories.map(function (cat) {
      const count = cat === 'all' ? data.lore.length : data.lore.filter(function (l) { return l.category === cat; }).length;
      return '<button class="chip ' + (MF.state.ui.loreCategory === cat ? 'active' : '') + '" data-lore-category="' + MF.esc(cat) + '">' + (cat === 'all' ? 'Все' : MF.esc(cat)) + ' <span class="count">' + count + '</span></button>';
    }).join('');
    const sourceChips = data.books.length ? '<div class="chip-row lore-source-row">' +
      '<button class="chip ' + ((MF.state.ui.loreSource || 'all') === 'all' ? 'active' : '') + '" data-lore-source="all">' + MF.t('Все источники') + '</button>' +
      data.books.map(function (book) {
        return '<button class="chip ' + (MF.state.ui.loreSource === book.id ? 'active' : '') + '" data-lore-source="' + MF.esc(book.id) + '">' + MF.icon('i-scroll') + MF.esc(book.title) + '</button>';
      }).join('') + '</div>' : '';
    const has = data.lore.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Знания мира</div><h1 class="page-title">Лор</h1>' +
      '<p class="page-subtitle">История, магия, религия и сказания. Всё, что делает ваш мир глубже, а решения героев — тяжелее.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-lore">' + MF.icon('i-plus') + 'Новая статья</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left">' +
        '<div class="search-field">' + MF.icon('i-search') + '<input id="loreSearch" type="search" placeholder="Найти в лоре…" value="' + MF.esc(MF.state.ui.loreSearch) + '"></div>' +
        '<div class="chip-row">' + chips + '</div>' + sourceChips + '</div>' +
        '<div class="toolbar-right"><span class="result-count" id="loreResultCount">' + data.lore.length + ' ' + MF.plural(data.lore.length, 'статья', 'статьи', 'статей') + '</span></div></div>' : '') +
      (has ? '<div class="lore-grid" id="loreGrid">' + MF.renderLoreGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-book') + '</div><h2 class="empty-title">Летопись пока пуста</h2><p class="empty-text">Опишите древний договор, устройство магии или легенду, которую здесь рассказывают детям. Это фундамент мира.</p><button class="btn btn-primary" data-action="new-lore">' + MF.icon('i-plus') + 'Написать первую статью</button></div>') +
      '</div>';
  };

  /* ---------- Library / lore sources ---------- */
  MF.filterBooks = function () {
    const q = MF.normalize(MF.state.ui.librarySearch || '');
    const type = MF.state.ui.libraryType || 'all';
    return MF.state.data.books.filter(function (book) {
      if (type !== 'all' && book.type !== type) return false;
      if (!q) return true;
      return MF.normalize([book.title, book.type, book.author, book.year, book.description, (book.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    }).sort(function (a, b) {
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  };

  MF.bookLoreCount = function (id) {
    return MF.state.data.lore.filter(function (article) { return article.sourceId === id; }).length;
  };

  MF.bookCard = function (book) {
    const count = MF.bookLoreCount(book.id);
    const cover = book.cover || book.image;
    return '<article class="book-card" role="button" tabindex="0" data-action="open-book" data-id="' + MF.esc(book.id) + '" aria-label="' + MF.t('Открыть источник') + ' ' + MF.esc(book.title) + '">' +
      '<div class="book-cover">' + (cover
        ? '<img src="' + MF.esc(cover) + '" alt="" loading="lazy">'
        : '<span class="book-cover-mark">' + MF.icon('i-scroll') + '</span>') +
      '<span class="book-type">' + MF.esc(book.type || 'Книга') + '</span></div>' +
      '<div class="book-body"><h3 class="book-title">' + MF.esc(book.title) + '</h3>' +
      '<p class="book-author">' + MF.esc([book.author, book.year].filter(Boolean).join(' · ') || MF.t('Автор не указан')) + '</p>' +
      '<p class="book-desc clamp-2">' + MF.esc(book.description || MF.t('Источник ещё не описан.')) + '</p>' +
      '<div class="book-foot"><span>' + MF.icon('i-book') + count + ' ' + MF.plural(count, 'статья', 'статьи', 'статей') + '</span>' +
      '<span class="date-stamp">' + MF.formatDateShort(book.updatedAt) + '</span></div></div></article>';
  };

  MF.renderLibraryGrid = function () {
    const list = MF.filterBooks();
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>' + MF.t('Источников не найдено') + '</strong>' + MF.t('Попробуйте другой тип или запрос.') + '</div>';
    return list.map(MF.bookCard).join('') +
      '<button class="char-add-card book-add-card" data-action="new-book"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>' + MF.t('Новый источник') + '</span></button>';
  };

  MF.renderLibrary = function () {
    const data = MF.state.data;
    const types = ['all'].concat(MF.BOOK_TYPES.filter(function (type) {
      return data.books.some(function (book) { return book.type === type; });
    }));
    const chips = types.map(function (type) {
      const count = type === 'all' ? data.books.length : data.books.filter(function (book) { return book.type === type; }).length;
      return '<button class="chip ' + ((MF.state.ui.libraryType || 'all') === type ? 'active' : '') + '" data-library-type="' + MF.esc(type) + '">' +
        (type === 'all' ? MF.t('Все') : MF.esc(type)) + ' <span class="count">' + count + '</span></button>';
    }).join('');
    const has = data.books.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">' + MF.t('Источники лора') + '</div><h1 class="page-title">' + MF.t('Библиотека') + '</h1>' +
      '<p class="page-subtitle">' + MF.t('Книги, повести и хроники, из которых в мир приходят знания. Связывайте статьи лора с их источником.') + '</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-book">' + MF.icon('i-plus') + MF.t('Новый источник') + '</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left">' +
        '<div class="search-field">' + MF.icon('i-search') + '<input id="librarySearch" type="search" placeholder="' + MF.t('Найти источник…') + '" value="' + MF.esc(MF.state.ui.librarySearch || '') + '"></div>' +
        '<div class="chip-row">' + chips + '</div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="libraryResultCount">' + data.books.length + ' ' + MF.plural(data.books.length, 'источник', 'источника', 'источников') + '</span></div></div>' : '') +
      (has ? '<div class="book-grid" id="libraryGrid">' + MF.renderLibraryGrid() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-scroll') + '</div><h2 class="empty-title">' + MF.t('Библиотека пока пуста') + '</h2>' +
        '<p class="empty-text">' + MF.t('Добавьте книгу, повесть или хронику, а затем выберите её как источник для статей лора.') + '</p>' +
        '<button class="btn btn-primary" data-action="new-book">' + MF.icon('i-plus') + MF.t('Добавить первый источник') + '</button></div>') +
      '</div>';
  };

  /* ---------- World map ---------- */
  MF.MAP_BACKGROUNDS = [
    { id: 'parchment', label: 'Пергамент', labelEn: 'Parchment' },
    { id: 'night', label: 'Ночная карта', labelEn: 'Night map' },
    { id: 'sea', label: 'Морская', labelEn: 'Sea chart' },
    { id: 'desert', label: 'Пустыня', labelEn: 'Desert' },
    { id: 'forest', label: 'Лесная', labelEn: 'Forest' }
  ];
  MF.mapBackgroundLabel = function (id) {
    const bg = MF.MAP_BACKGROUNDS.find(function (item) { return item.id === id; }) || MF.MAP_BACKGROUNDS[0];
    return MF.LANG === 'en' ? bg.labelEn : bg.label;
  };

  MF.mapPathD = function (points) {
    if (!Array.isArray(points) || !points.length) return '';
    return points.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + Number(point[0]).toFixed(1) + ' ' + Number(point[1]).toFixed(1);
    }).join(' ');
  };

  MF.renderMap = function () {
    const map = MF.state.data.map;
    const markers = map.markers.map(function (marker) {
      const left = (marker.x / 1200) * 100;
      const top = (marker.y / 720) * 100;
      const location = marker.locationId ? MF.getLocation(marker.locationId) : null;
      return '<div class="map-marker" data-map-marker data-id="' + MF.esc(marker.id) + '" style="left:' + left.toFixed(3) + '%;top:' + top.toFixed(3) + '%;--marker-color:' + MF.esc(marker.color || '#c5a15f') + '">' +
        '<span class="map-marker-pin">' + MF.icon(marker.icon || 'i-pin') + '</span>' +
        '<span class="map-marker-label">' + MF.esc(marker.name || (location && location.name) || MF.t('Метка')) + '</span>' +
        '<button class="map-remove" data-map-remove-marker data-id="' + MF.esc(marker.id) + '" title="' + MF.t('Удалить метку') + '">' + MF.icon('i-x') + '</button></div>';
    }).join('');
    const labels = map.labels.map(function (label) {
      return '<div class="map-label" data-map-label data-id="' + MF.esc(label.id) + '" style="left:' + ((label.x / 1200) * 100).toFixed(3) + '%;top:' + ((label.y / 720) * 100).toFixed(3) + '%;color:' + MF.esc(label.color || '#c5a15f') + ';font-size:' + MF.clamp(Number(label.size) || 14, 9, 36) + 'px">' +
        MF.esc(label.text) + '<button class="map-remove" data-map-remove-label data-id="' + MF.esc(label.id) + '" title="' + MF.t('Удалить подпись') + '">' + MF.icon('i-x') + '</button></div>';
    }).join('');
    const paths = map.paths.map(function (path) {
      return '<path class="map-path" data-map-path data-id="' + MF.esc(path.id) + '" d="' + MF.mapPathD(path.points) + '" style="stroke:' + MF.esc(path.color || '#c5a15f') + ';stroke-width:' + MF.clamp(Number(path.width) || 3, 1, 12) + '"></path>';
    }).join('');
    const empty = !map.markers.length && !map.labels.length && !map.paths.length;
    const background = MF.MAP_BACKGROUNDS.some(function (item) { return item.id === map.background; }) ? map.background : 'parchment';
    return '<div class="view map-page">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">' + MF.t('Атлас мира') + '</div><h1 class="page-title">' + MF.t('Карта мира') + '</h1>' +
      '<p class="page-subtitle">' + MF.t('Соберите карту из меток, подписей и линий. Метки можно привязать к локациям и перетаскивать.') + '</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-subtle btn-sm" data-action="auto-place-map">' + MF.icon('i-map') + MF.t('Разместить локации') + '</button>' +
      '<button class="btn btn-primary" data-action="new-map-marker">' + MF.icon('i-plus') + MF.t('Добавить метку') + '</button></div></div>' +
      '<div class="map-shell"><div class="map-toolbar">' +
      '<div class="map-tools">' +
      '<button class="map-tool-btn' + (MF.state.map.tool === 'select' ? ' active' : '') + '" data-map-tool="select" title="' + MF.t('Выбор и перемещение') + '">' + MF.icon('i-move') + '</button>' +
      '<button class="map-tool-btn' + (MF.state.map.tool === 'line' ? ' active' : '') + '" data-map-tool="line" title="' + MF.t('Нарисовать линию') + '">' + MF.icon('i-edit') + '</button>' +
      '<button class="map-tool-btn' + (MF.state.map.tool === 'erase' ? ' active' : '') + '" data-map-tool="erase" title="' + MF.t('Ластик') + '">' + MF.icon('i-trash') + '</button>' +
      '<span class="control-divider"></span>' +
      '<button class="map-tool-btn" data-action="new-map-label" title="' + MF.t('Добавить подпись') + '">' + MF.icon('i-feather') + '</button>' +
      '<input type="color" class="map-color" id="mapDrawColor" value="#c5a15f" title="' + MF.t('Цвет линии') + '">' +
      '</div>' +
      '<div class="map-background-controls"><select class="select-compact" id="mapBackground">' + MF.MAP_BACKGROUNDS.map(function (bg) {
        return '<option value="' + MF.esc(bg.id) + '"' + (background === bg.id ? ' selected' : '') + '>' + MF.esc(MF.LANG === 'en' ? bg.labelEn : bg.label) + '</option>';
      }).join('') + '</select>' +
      '<button class="btn btn-subtle btn-sm" data-action="upload-map-image">' + MF.icon('i-upload') + MF.t('Фон карты') + '</button>' +
      (map.image ? '<button class="btn btn-ghost btn-sm" data-action="clear-map-image">' + MF.icon('i-x') + '</button>' : '') + '</div></div>' +
      '<div class="map-stage map-bg--' + MF.esc(background) + ' map-tool--' + MF.esc(MF.state.map.tool) + '" id="mapStage"' + (map.image ? ' style="background-image:url(&quot;' + MF.esc(map.image) + '&quot;)"' : '') + '>' +
      '<div class="map-compass">✦</div>' +
      '<svg class="map-svg" viewBox="0 0 1200 720" preserveAspectRatio="none">' + paths + '<path id="mapDrawPreview" class="map-path map-path--preview" d=""></path></svg>' +
      markers + labels +
      (empty ? '<div class="map-empty"><span>' + MF.icon('i-map') + '</span><strong>' + MF.t('Карта пока пуста') + '</strong><small>' + MF.t('Нажмите «Добавить метку» или «Разместить локации».') + '</small></div>' : '') +
      '</div>' +
      '<div class="map-foot"><span>' + MF.icon(MF.state.map.tool === 'line' ? 'i-edit' : MF.state.map.tool === 'erase' ? 'i-trash' : 'i-move') + (MF.state.map.tool === 'line' ? MF.t('Проведите по карте, чтобы нарисовать линию') : MF.state.map.tool === 'erase' ? MF.t('Нажмите на линию, чтобы удалить её') : MF.t('Перетаскивайте метки и подписи')) + '</span>' +
      '<span>' + map.markers.length + ' ' + MF.plural(map.markers.length, 'метка', 'метки', 'меток') + ' · ' + map.paths.length + ' ' + MF.plural(map.paths.length, 'линия', 'линии', 'линий') + '</span></div></div></div>';
  };

  MF.bindMap = function () {
    const stage = MF.$('#mapStage');
    if (!stage) return;
    MF.$$('[data-map-tool]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.map.tool = button.getAttribute('data-map-tool');
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
    const bg = MF.$('#mapBackground');
    if (bg) bg.addEventListener('change', function () {
      MF.state.data.map.background = bg.value;
      MF.state.data.map.updatedAt = MF.nowISO();
      MF.saveNow().catch(function () {});
      MF.renderCurrentPage({ keepScroll: true });
    });
    function coords(event) {
      const rect = stage.getBoundingClientRect();
      return [MF.clamp((event.clientX - rect.left) / rect.width * 1200, 0, 1200), MF.clamp((event.clientY - rect.top) / rect.height * 720, 0, 720)];
    }
    function saveMap() {
      MF.state.data.map.updatedAt = MF.nowISO();
      MF.saveNow().catch(function () {});
    }
    function bindDraggable(element, dataType, id) {
      element.addEventListener('pointerdown', function (event) {
        if (MF.state.map.tool !== 'select' || event.button !== 0) return;
        if (event.target.closest('.map-remove')) return;
        event.preventDefault();
        event.stopPropagation();
        const map = MF.state.data.map;
        const item = dataType === 'marker' ? map.markers.find(function (m) { return m.id === id; }) : map.labels.find(function (l) { return l.id === id; });
        if (!item) return;
        const start = coords(event);
        const originX = item.x, originY = item.y;
        let moved = false;
        element.classList.add('is-dragging');
        function move(moveEvent) {
          const point = coords(moveEvent);
          const dx = point[0] - start[0], dy = point[1] - start[1];
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          item.x = MF.clamp(originX + dx, 0, 1200);
          item.y = MF.clamp(originY + dy, 0, 720);
          element.style.left = (item.x / 1200 * 100).toFixed(3) + '%';
          element.style.top = (item.y / 720 * 100).toFixed(3) + '%';
        }
        function up() {
          element.classList.remove('is-dragging');
          element.removeEventListener('pointermove', move);
          element.removeEventListener('pointerup', up);
          element.removeEventListener('pointercancel', up);
          if (moved) saveMap();
          else if (dataType === 'marker' && item.locationId) MF.openLocationSheet(item.locationId);
          else if (dataType === 'marker') MF.openMapMarkerForm(item.id);
          else if (dataType === 'label') MF.openMapLabelForm(item.id);
        }
        element.setPointerCapture(event.pointerId);
        element.addEventListener('pointermove', move);
        element.addEventListener('pointerup', up);
        element.addEventListener('pointercancel', up);
      });
    }
    MF.$$('[data-map-marker]').forEach(function (marker) { bindDraggable(marker, 'marker', marker.getAttribute('data-id')); });
    MF.$$('[data-map-label]').forEach(function (label) { bindDraggable(label, 'label', label.getAttribute('data-id')); });
    MF.$$('[data-map-remove-marker]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        MF.state.data.map.markers = MF.state.data.map.markers.filter(function (marker) { return marker.id !== button.getAttribute('data-id'); });
        saveMap(); MF.renderCurrentPage({ keepScroll: true });
      });
    });
    MF.$$('[data-map-remove-label]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        MF.state.data.map.labels = MF.state.data.map.labels.filter(function (label) { return label.id !== button.getAttribute('data-id'); });
        saveMap(); MF.renderCurrentPage({ keepScroll: true });
      });
    });
    MF.$$('[data-map-path]').forEach(function (path) {
      path.addEventListener('click', function (event) {
        if (MF.state.map.tool !== 'erase') return;
        event.stopPropagation();
        MF.state.data.map.paths = MF.state.data.map.paths.filter(function (item) { return item.id !== path.getAttribute('data-id'); });
        saveMap(); MF.renderCurrentPage({ keepScroll: true });
      });
    });
    let drawing = null;
    stage.addEventListener('pointerdown', function (event) {
      if (MF.state.map.tool !== 'line' || event.button !== 0) return;
      if (event.target.closest('[data-map-marker],[data-map-label],.map-remove,button,select,input')) return;
      event.preventDefault();
      const point = coords(event);
      drawing = { id: MF.uid('mp'), color: (MF.$('#mapDrawColor') || {}).value || '#c5a15f', width: 3, points: [point] };
      MF.state.map.draw = drawing;
      try { stage.setPointerCapture(event.pointerId); } catch (e) {}
    });
    stage.addEventListener('pointermove', function (event) {
      if (!drawing) return;
      const point = coords(event);
      const last = drawing.points[drawing.points.length - 1];
      if (Math.abs(point[0] - last[0]) + Math.abs(point[1] - last[1]) > 4) {
        drawing.points.push(point);
        const preview = MF.$('#mapDrawPreview');
        if (preview) preview.setAttribute('d', MF.mapPathD(drawing.points));
      }
    });
    stage.addEventListener('pointerup', function () {
      if (!drawing) return;
      if (drawing.points.length > 1) {
        MF.state.data.map.paths.push(drawing);
        saveMap();
      }
      drawing = null;
      MF.state.map.draw = null;
      MF.renderCurrentPage({ keepScroll: true });
    });
  };

  /* ---------- Genre catalogs ---------- */
  MF.filterCatalogItems = function (catalogId) {
    const q = MF.normalize((MF.state.ui.catalogSearch || {})[catalogId] || '');
    return MF.catalogItemsFor(catalogId).filter(function (item) {
      if (!q) return true;
      return MF.normalize([item.name, item.type, item.description, (item.tags || []).join(' ')].join(' ')).indexOf(q) !== -1;
    });
  };

  MF.catalogItemCard = function (item, catalog) {
    return '<article class="catalog-item-card" role="button" tabindex="0" data-action="open-catalog-item" data-id="' + MF.esc(item.id) + '" data-catalog-id="' + MF.esc(catalog.id) + '" aria-label="' + MF.esc(MF.t('Открыть запись')) + ' ' + MF.esc(item.name) + '">' +
      '<div class="catalog-item-media">' + (item.image ? '<img src="' + MF.esc(item.image) + '" alt="" loading="lazy">' : '<span>' + MF.icon(catalog.icon || 'i-scroll') + '</span>') + '</div>' +
      '<div class="catalog-item-body"><span class="catalog-item-type">' + MF.esc(item.type || MF.catalogName(catalog)) + '</span>' +
      '<h3 class="catalog-item-name">' + MF.esc(item.name) + '</h3>' +
      '<p class="catalog-item-desc clamp-3">' + MF.esc(item.description || MF.t('Описание пока не добавлено.')) + '</p>' +
      '<div class="catalog-item-foot">' + MF.tagList(item.tags, 2) + '<span class="date-stamp">' + MF.formatDateShort(item.updatedAt) + '</span></div></div></article>';
  };

  MF.renderCatalogGrid = function (catalogId) {
    const catalog = MF.catalogMeta(catalogId);
    const list = MF.filterCatalogItems(catalogId);
    if (!list.length) return '<div class="no-results" style="grid-column:1/-1"><strong>' + MF.t('Записей не найдено') + '</strong>' + MF.t('Добавьте первую запись или измените запрос.') + '</div>';
    return list.map(function (item) { return MF.catalogItemCard(item, catalog); }).join('') +
      '<button class="char-add-card catalog-add-card" data-action="new-catalog-item" data-catalog-id="' + MF.esc(catalog.id) + '"><span class="add-plus">' + MF.icon('i-plus') + '</span><span>' + MF.t('Новая запись') + '</span></button>';
  };

  MF.renderCatalog = function (catalogId) {
    const catalog = MF.catalogMeta(catalogId);
    if (!catalog) return '<div class="view"><div class="empty-state"><h2 class="empty-title">' + MF.t('Раздел не найден') + '</h2></div></div>';
    const items = MF.filterCatalogItems(catalogId);
    const has = items.length > 0;
    const name = MF.catalogName(catalog);
    return '<div class="view catalog-page"><div class="page-head"><div class="page-head-main"><div class="eyebrow">' + MF.icon(catalog.icon || 'i-scroll') + ' ' + MF.t('Раздел мира') + '</div><h1 class="page-title">' + MF.esc(name) + '</h1>' +
      '<p class="page-subtitle">' + MF.esc(MF.LANG === 'en' ? (catalog.descriptionEn || catalog.description || MF.t('Записи этого раздела.')) : (catalog.description || catalog.descriptionEn || MF.t('Записи этого раздела.'))) + '</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-subtle btn-sm" data-action="edit-catalog" data-id="' + MF.esc(catalog.id) + '">' + MF.icon('i-edit') + MF.t('Настроить раздел') + '</button>' +
      '<button class="btn btn-primary" data-action="new-catalog-item" data-catalog-id="' + MF.esc(catalog.id) + '">' + MF.icon('i-plus') + MF.t('Новая запись') + '</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left"><div class="search-field">' + MF.icon('i-search') + '<input id="catalogSearch" type="search" placeholder="' + MF.t('Найти в разделе…') + '" value="' + MF.esc((MF.state.ui.catalogSearch || {})[catalogId] || '') + '"></div></div>' +
        '<div class="toolbar-right"><span class="result-count" id="catalogResultCount">' + items.length + ' ' + MF.plural(items.length, 'запись', 'записи', 'записей') + '</span></div></div>' : '') +
      (has ? '<div class="catalog-grid" id="catalogGrid">' + MF.renderCatalogGrid(catalogId) + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon(catalog.icon || 'i-scroll') + '</div><h2 class="empty-title">' + MF.t('Раздел пока пуст') + '</h2>' +
        '<p class="empty-text">' + MF.t('Добавьте оружие, транспорт, технологию или любую другую запись этого раздела.') + '</p>' +
        '<button class="btn btn-primary" data-action="new-catalog-item" data-catalog-id="' + MF.esc(catalog.id) + '">' + MF.icon('i-plus') + MF.t('Добавить первую запись') + '</button></div>') +
      '</div>';
  };

  MF.bindCatalogFilters = function (catalogId) {
    const input = MF.$('#catalogSearch');
    const grid = MF.$('#catalogGrid');
    const count = MF.$('#catalogResultCount');
    if (input) {
      input.addEventListener('input', function () {
        if (!MF.state.ui.catalogSearch) MF.state.ui.catalogSearch = {};
        MF.state.ui.catalogSearch[catalogId] = input.value;
        const list = MF.filterCatalogItems(catalogId);
        if (grid) grid.innerHTML = MF.renderCatalogGrid(catalogId);
        if (count) count.textContent = list.length + ' ' + MF.plural(list.length, 'запись', 'записи', 'записей');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
  };

  /* ---------- Render dispatcher & bindings ---------- */
  MF.renderPage = function (page) {
    if (!MF.state.data) return '';
    if (page === 'characters') return MF.renderCharacters();
    if (page === 'regions') return MF.renderRegions();
    if (page === 'factions') return MF.renderFactions();
    if (page === 'races') return MF.renderRaces();
    if (page === 'lore') return MF.renderLore();
    if (page === 'library') return MF.renderLibrary();
    if (page === 'map') return MF.renderMap();
    if (page === 'dnd' && MF.renderDnd) return MF.renderDnd();
    if (page === 'timeline' && MF.renderTimeline) return MF.renderTimeline();
    if (page === 'notes' && MF.renderNotes) return MF.renderNotes();
    if (page === 'settings' && MF.renderSettings) return MF.renderSettings();
    if (page === 'tree' && MF.renderTreePage) return MF.renderTreePage();
    if (page.indexOf('catalog:') === 0) return MF.renderCatalog(page.slice(8));
    return MF.renderDashboard();
  };

  MF.afterPageRender = function (page) {
    if (page === 'characters') MF.bindCollectionFilters('characters');
    else if (page === 'regions') MF.bindCollectionFilters('regions');
    else if (page === 'factions') MF.bindCollectionFilters('factions');
    else if (page === 'races') MF.bindCollectionFilters('races');
    else if (page === 'lore') MF.bindCollectionFilters('lore');
    else if (page === 'library' && MF.bindLibraryFilters) MF.bindLibraryFilters();
    else if (page === 'map' && MF.bindMap) MF.bindMap();
    else if (page === 'dnd' && MF.bindDnd) MF.bindDnd();
    else if (page === 'timeline' && MF.bindTimelineFilters) MF.bindTimelineFilters();
    else if (page === 'notes' && MF.bindNotesFilters) MF.bindNotesFilters();
    else if (page === 'tree' && MF.initTree) MF.initTree();
    else if (page === 'settings' && MF.bindSettings) MF.bindSettings();
    else if (page.indexOf('catalog:') === 0 && MF.bindCatalogFilters) MF.bindCatalogFilters(page.slice(8));
    MF.refreshNavCounts();
    MF.refreshStorageLabels();
    if (MF.bindCardKeyboard) MF.bindCardKeyboard();
    const saveState = MF.$('#saveState');
    if (saveState) MF.setSaveState(MF.state.saveStatus);
  };

  MF.bindLibraryFilters = function () {
    const search = MF.$('#librarySearch');
    const grid = MF.$('#libraryGrid');
    const count = MF.$('#libraryResultCount');
    if (search) {
      search.addEventListener('input', function () {
        MF.state.ui.librarySearch = search.value;
        if (grid) grid.innerHTML = MF.renderLibraryGrid();
        if (count) {
          const n = MF.filterBooks().length;
          count.textContent = n + ' ' + MF.plural(n, 'источник', 'источника', 'источников');
        }
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
    MF.$$('[data-library-type]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.ui.libraryType = button.getAttribute('data-library-type');
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
  };

  MF.bindCollectionFilters = function (kind) {
    if (kind === 'characters') {
      const input = MF.$('#charSearch');
      const grid = MF.$('#charactersGrid');
      const count = MF.$('#charResultCount');
      if (input) {
        input.addEventListener('input', function (e) {
          MF.state.ui.charSearch = e.target.value;
          if (grid) grid.innerHTML = MF.renderCharacterGrid();
          const n = MF.filterCharacters().length;
          if (count) count.textContent = n + ' ' + MF.plural(n, 'персонаж', 'персонажа', 'персонажей');
          if (MF.bindCardKeyboard) MF.bindCardKeyboard();
        });
      }
      MF.$$('[data-char-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          MF.state.ui.charFilter = btn.getAttribute('data-char-filter');
          MF.$$('[data-char-filter]').forEach(function (b) { b.classList.toggle('active', b === btn); });
          if (grid) grid.innerHTML = MF.renderCharacterGrid();
          if (MF.bindCardKeyboard) MF.bindCardKeyboard();
        });
      });
    }
    if (kind === 'regions') {
      const input = MF.$('#regionSearch');
      const grid = MF.$('#regionsGrid');
      const count = MF.$('#regionResultCount');
      if (input) input.addEventListener('input', function (e) {
        MF.state.ui.regionSearch = e.target.value;
        const n = MF.filterRegions().length;
        if (grid) grid.innerHTML = MF.renderRegionGrid();
        if (count) count.textContent = n + ' ' + MF.plural(n, 'регион', 'региона', 'регионов');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
    if (kind === 'locations') {
      const input = MF.$('#locSearch');
      const select = MF.$('#locTypeFilter');
      const regionSelect = MF.$('#locRegionFilter');
      const grid = MF.$('#locationsGrid');
      const count = MF.$('#locResultCount');
      const update = function () {
        const n = MF.filterLocations().length;
        if (grid) grid.innerHTML = MF.renderLocationGrid();
        if (count) count.textContent = n + ' ' + MF.plural(n, 'место', 'места', 'мест');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      };
      if (input) input.addEventListener('input', function (e) { MF.state.ui.locSearch = e.target.value; update(); });
      if (select) select.addEventListener('change', function (e) { MF.state.ui.locType = e.target.value; update(); });
      if (regionSelect) regionSelect.addEventListener('change', function (e) { MF.state.ui.locRegion = e.target.value; update(); });
    }
    if (kind === 'factions') {
      const input = MF.$('#factionSearch');
      const grid = MF.$('#factionsGrid');
      const count = MF.$('#factionResultCount');
      if (input) input.addEventListener('input', function (e) {
        MF.state.ui.factionSearch = e.target.value;
        const n = MF.filterFactions().length;
        if (grid) grid.innerHTML = MF.renderFactionGrid();
        if (count) count.textContent = n + ' ' + MF.plural(n, 'фракция', 'фракции', 'фракций');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
    if (kind === 'races') {
      const input = MF.$('#raceSearch');
      const grid = MF.$('#racesGrid');
      const count = MF.$('#raceResultCount');
      if (input) input.addEventListener('input', function (e) {
        MF.state.ui.raceSearch = e.target.value;
        const n = MF.filterRaces().length;
        if (grid) grid.innerHTML = MF.renderRaceGrid();
        if (count) count.textContent = n + ' ' + MF.plural(n, 'раса', 'расы', 'рас');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
    if (kind === 'lore') {
      const input = MF.$('#loreSearch');
      const grid = MF.$('#loreGrid');
      const count = MF.$('#loreResultCount');
      const update = function () {
        const n = MF.filterLore().length;
        if (grid) grid.innerHTML = MF.renderLoreGrid();
        if (count) count.textContent = n + ' ' + MF.plural(n, 'статья', 'статьи', 'статей');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      };
      if (input) input.addEventListener('input', function (e) { MF.state.ui.loreSearch = e.target.value; update(); });
      MF.$$('[data-lore-category]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          MF.state.ui.loreCategory = btn.getAttribute('data-lore-category');
          MF.$$('[data-lore-category]').forEach(function (b) { b.classList.toggle('active', b === btn); });
          update();
        });
      });
      MF.$$('[data-lore-source]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          MF.state.ui.loreSource = btn.getAttribute('data-lore-source');
          MF.$$('[data-lore-source]').forEach(function (b) { b.classList.toggle('active', b === btn); });
          update();
        });
      });
    }
  };
})();
