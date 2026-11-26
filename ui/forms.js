/* =========================================================
   Chronica — карточки записей, формы, поиск и действия
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;
  const modalRoot = function () { return MF.$('#modalRoot'); };
  const searchRoot = function () { return MF.$('#searchRoot'); };
  let lastFocused = null;

  function nowLabel() { return MF.formatDate(new Date().toISOString()); }

  function syncBodyLock() {
    const root = modalRoot();
    const hasModal = !!(root && root.children.length);
    const hasSearch = !!(searchRoot() && searchRoot().children.length);
    document.body.classList.toggle('has-overlay', hasModal || hasSearch);
  }

  /* ---------- Overlays ---------- */
  MF.closeAllOverlays = function () {
    const root = modalRoot();
    if (root) root.innerHTML = '';
    syncBodyLock();
    if (MF.closeSearch) MF.closeSearch();
    if (lastFocused && document.contains(lastFocused)) {
      try { lastFocused.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocused = null;
  };

  MF.closeTopOverlay = function () {
    const root = modalRoot();
    if (!root || !root.lastElementChild) return false;
    root.removeChild(root.lastElementChild);
    syncBodyLock();
    return true;
  };

  function appendOverlay(markup, focusSelector) {
    const root = modalRoot();
    if (!root) return null;
    if (MfRootIsEmpty()) lastFocused = document.activeElement;
    root.insertAdjacentHTML('beforeend', markup);
    if (MF.localizeDom) MF.localizeDom(root.lastElementChild);
    syncBodyLock();
    const overlay = root.lastElementChild;
    const target = focusSelector ? overlay.querySelector(focusSelector) : null;
    if (target) {
      setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (e) {} }, 25);
    }
    return overlay;
  }
  function MfRootIsEmpty() {
    const root = modalRoot();
    return root && !root.children.length;
  }

  function drawerShell(title, label, hero, content, footer) {
    return '<div class="overlay overlay--drawer" data-overlay>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="' + MF.esc(label || title) + '">' +
      '<div class="drawer-scroll">' + hero +
      '<div class="drawer-content">' + content + '</div></div>' +
      '<div class="drawer-footer">' + footer + '</div></aside></div>';
  }

  function heroClose() {
    return '<button class="icon-btn drawer-close" data-action="close-overlay" aria-label="Закрыть" title="Закрыть">' + MF.icon('i-x') + '</button>';
  }

  function recordDates(entity) {
    if (!entity) return '';
    return '<div class="detail-record-dates"><span title="Создано">' + MF.icon('i-clock') + 'Создано: ' + MF.esc(MF.formatDate(entity.createdAt)) + '</span>' +
      '<span title="Обновлено">' + MF.icon('i-edit') + 'Обновлено: ' + MF.esc(MF.formatDate(entity.updatedAt || entity.createdAt)) + '</span></div>';
  }

  function fact(label, value, link) {
    if (!value && value !== 0) return '';
    return '<div class="detail-fact"><span class="detail-fact-label">' + MF.esc(label) + '</span><span class="detail-fact-value">' + value + '</span></div>';
  }

  function facts(items) {
    return '<div class="detail-facts">' + items.join('') + '</div>';
  }

  function chipCharacter(character, label) {
    if (!character) return '';
    return '<button class="relation-chip" data-action="open-character" data-id="' + MF.esc(character.id) + '">' +
      MF.characterAvatar(character) + '<span>' + MF.esc(character.name) + '</span>' +
      (label ? '<span class="rel-label">' + MF.esc(label) + '</span>' : '') + '</button>';
  }

  function tagSection(tags) {
    if (!Array.isArray(tags) || !tags.length) return '';
    return '<section class="drawer-section"><h3>Метки</h3><div class="detail-tags">' + MF.tagList(tags, 50) + '</div></section>';
  }

  function emptyLinks(text) {
    return '<span style="color:var(--muted-2);font-size:10px">' + MF.esc(text) + '</span>';
  }

  MF.openCharacterSheet = function (id) {
    const character = MF.getCharacter(id);
    if (!character) return;
    MF.closeAllOverlays();
    const faction = MF.factionOf(character);
    const location = MF.locationOf(character);
    const region = MF.regionOf(character);
    const race = MF.raceOf(character);
    const father = character.fatherId ? MF.getCharacter(character.fatherId) : null;
    const mother = character.motherId ? MF.getCharacter(character.motherId) : null;
    const spouses = MF.spousesOf(character);
    const children = MF.childrenOf(character.id);
    const gallery = Array.isArray(character.gallery) ? character.gallery : [];
    const palette = Array.isArray(character.palette) ? character.palette : [];
    const audio = Array.isArray(character.audio) ? character.audio : [];
    const siblings = MF.state.data.characters.filter(function (other) {
      if (other.id === character.id) return false;
      return (character.fatherId && other.fatherId === character.fatherId) || (character.motherId && other.motherId === character.motherId);
    });
    const show = MF.isCharacterFieldVisible;
    const heroFacts = [];
    if (show('status')) heroFacts.push('<span class="badge ' + (MF.statusClass(character.status) === 'is-alive' ? 'badge-green' : MF.statusClass(character.status) === 'is-dead' ? 'badge-red' : 'badge-gold') + '">' + MF.esc(character.status || 'Неизвестно') + '</span>');
    if (show('race')) heroFacts.push('<span>' + MF.esc(MF.raceName(character) || 'Персонаж') + '</span>');
    if (show('gender') && MF.isKnownGender(character.gender)) heroFacts.push('<span>·</span><span>' + MF.esc(character.gender) + '</span>');
    const hero = '<div class="drawer-hero drawer-hero--portrait">' + MF.characterPortrait(character) +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      (show('portrait') && character.portrait ? '<button class="drawer-portrait-open" data-action="view-image" data-url="' + MF.esc(character.portrait) + '" aria-label="Открыть большой портрет" title="Открыть большой портрет">' + MF.icon('i-zoom-in') + '</button>' : '') +
      '<div class="drawer-hero-content"><div class="detail-eyebrow">' + heroFacts.join('') + '</div>' +
      '<h2 class="detail-title">' + MF.esc(character.name) + '</h2>' +
      (show('title') && character.title ? '<p class="detail-subtitle">' + MF.esc(character.title) + '</p>' : '') + '</div></div>';
    let content = '';
    if (show('quote') && character.quote) content += '<blockquote class="detail-quote">«' + MF.esc(character.quote) + '»</blockquote>';
    if (show('description')) content += '<div class="drawer-section"><h3>История</h3><p>' + MF.esc(character.description || 'История героя ещё не написана.') + '</p></div>';
    if (show('personality') && character.personality) content += '<div class="drawer-section"><h3>Характер</h3><p>' + MF.esc(character.personality) + '</p></div>';
    if (show('appearance') && character.appearance) content += '<div class="drawer-section"><h3>Внешность</h3><p>' + MF.esc(character.appearance) + '</p></div>';
    if (show('gallery') && gallery.length) content += '<div class="drawer-section"><h3>Галерея</h3><div class="detail-gallery">' + gallery.map(function (url, index) {
      return '<button class="gallery-thumb" data-action="view-image" data-url="' + MF.esc(url) + '" data-index="' + index + '" aria-label="Открыть рисунок ' + (index + 1) + '">' +
        '<img src="' + MF.esc(url) + '" alt="Рисунок ' + (index + 1) + '" loading="lazy"></button>';
    }).join('') + '</div></div>';
    if (show('palette') && palette.length) content += '<div class="drawer-section"><h3>Палитра</h3><div class="detail-palette">' + palette.map(function (color) {
      return '<span class="palette-chip" style="--swatch:' + MF.esc(color) + '" title="' + MF.esc(color) + '"><span>' + MF.esc(color) + '</span></span>';
    }).join('') + '</div></div>';
    if (show('audio') && audio.length) content += '<div class="drawer-section"><h3>Голос и музыка</h3><div class="detail-audio">' + audio.map(function (track) {
      return '<div class="detail-audio-track"><span class="audio-kind-icon">' + MF.icon(track.kind === 'music' ? 'i-music' : 'i-mic') + '</span>' +
        '<div class="detail-audio-main"><strong>' + MF.esc(track.title || 'Аудио') + '</strong><span>' + (track.kind === 'music' ? 'Музыка' : 'Голос') + '</span>' +
        '<audio controls preload="metadata" src="' + MF.esc(track.url) + '"></audio></div></div>';
    }).join('') + '</div></div>';
    const factsList = [];
    if (show('role')) factsList.push(fact('Роль', MF.esc(character.role || '—')));
    if (show('age')) factsList.push(fact('Возраст', MF.esc(character.age || '—')));
    if (show('gender')) factsList.push(fact('Пол', MF.esc(character.gender || 'Не указан')));
    if (show('race')) factsList.push(fact('Раса', race ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-race" data-id="' + MF.esc(race.id) + '">' + MF.esc(race.name) + '</button>' : MF.esc(character.race || '—')));
    if (show('location')) {
      factsList.push(fact('Регион', region ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-region" data-id="' + MF.esc(region.id) + '">' + MF.esc(region.name) + '</button>' : '—'));
      factsList.push(fact('Локация', location ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-location" data-id="' + MF.esc(location.id) + '">' + MF.esc(location.name) + '</button>' : '—'));
    }
    if (show('faction')) factsList.push(fact('Фракция', faction ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-faction" data-id="' + MF.esc(faction.id) + '">' + MF.esc(faction.name) + '</button>' : '—'));
    if (show('family')) {
      factsList.push(fact('Отец', father ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-character" data-id="' + MF.esc(father.id) + '">' + MF.esc(father.name) + '</button>' : '—'));
      factsList.push(fact('Мать', mother ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-character" data-id="' + MF.esc(mother.id) + '">' + MF.esc(mother.name) + '</button>' : '—'));
    }
    if (factsList.length) content += '<div class="drawer-section"><h3>Сведения</h3>' + facts(factsList) + '</div>';
    if (show('family')) {
      content += '<div class="drawer-section"><h3>Связи</h3><div class="detail-links">' +
        (spouses.length ? spouses.map(function (spouse) { return chipCharacter(spouse, 'супруг(а)'); }).join('') : '') +
        (children.length ? children.map(function (child) { return chipCharacter(child, 'ребёнок'); }).join('') : '') +
        (siblings.length ? siblings.map(function (sibling) { return chipCharacter(sibling, 'брат/сестра'); }).join('') : '') +
        (!spouses.length && !children.length && !siblings.length ? emptyLinks('Связи ещё не прочерчены.') : '') +
        '</div></div>';
    }
    const custom = (Array.isArray(character.customFields) ? character.customFields : []).filter(function (field) { return field && field.label; });
    if (custom.length) {
      content += '<div class="drawer-section"><h3>Свои поля</h3><div class="custom-fields-view">' + custom.map(function (field) {
        return '<div class="custom-field-view"><span>' + MF.esc(field.label) + '</span><strong>' + MF.esc(field.value || '—') + '</strong></div>';
      }).join('') + '</div></div>';
    }
    if (show('tags')) content += tagSection(character.tags);
    content += recordDates(character);
    const footer = '<button class="btn btn-ghost btn-sm" data-nav="tree">' + MF.icon('i-tree') + 'Древо</button>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-character" data-id="' + MF.esc(character.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-character" data-id="' + MF.esc(character.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(character.name, 'Персонаж ' + character.name, hero, content, footer), '.drawer-close');
  };

  MF.openLocationSheet = function (id) {
    const location = MF.getLocation(id);
    if (!location) return;
    MF.closeAllOverlays();
    const residents = MF.state.data.characters.filter(function (character) { return character.locationId === location.id; });
    const events = MF.state.data.events.filter(function (event) { return event.locationId === location.id; });
    const region = MF.getRegion(location.regionId);
    const factions = MF.state.data.factions.filter(function (faction) { return faction.locationId === location.id; });
    const hero = '<div class="drawer-hero">' + MF.locationMedia(location) +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(location.type || 'Место') + '</span>' + (region ? '<span>·</span><span>' + MF.esc(region.name) + '</span>' : '') + '</div>' +
      '<h2 class="detail-title">' + MF.esc(location.name) + '</h2>' +
      '<p class="detail-subtitle">' + MF.esc(region ? region.name : (location.region || 'Земля в вашем мире')) + '</p></div></div>';
    let content = '<div class="drawer-section"><h3>Описание</h3><p>' + MF.esc(location.description || 'Это место ещё ждёт своего описания.') + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Тип', MF.esc(location.type || '—')),
      fact('Регион', region ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-region" data-id="' + MF.esc(region.id) + '">' + MF.esc(region.name) + '</button>' : MF.esc(location.region || '—')),
      fact('Обитателей', String(residents.length)),
      fact('Фракций', String(factions.length)),
      fact('Событий', String(events.length))
    ]) + '</div>';
    if (factions.length) content += '<div class="drawer-section"><h3>Фракции</h3><div class="detail-links">' + factions.map(function (faction) {
      return '<button class="relation-chip" data-action="open-faction" data-id="' + MF.esc(faction.id) + '">' + MF.icon('i-banner') + '<span>' + MF.esc(faction.name) + '</span></button>';
    }).join('') + '</div></div>';
    if (residents.length) content += '<div class="drawer-section"><h3>Обитатели</h3><div class="detail-links">' + residents.map(function (character) { return chipCharacter(character); }).join('') + '</div></div>';
    if (events.length) content += '<div class="drawer-section"><h3>События</h3><div class="detail-links">' + events.map(function (event) {
      return '<button class="relation-chip" data-action="open-event" data-id="' + MF.esc(event.id) + '">' + MF.icon(event.type) + '<span>' + MF.esc(event.title) + '</span></button>';
    }).join('') + '</div></div>';
    content += tagSection(location.tags);
    content += recordDates(location);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + residents.length + ' ' + MF.plural(residents.length, 'обитатель', 'обитателя', 'обитателей') + '</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-location" data-id="' + MF.esc(location.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-location" data-id="' + MF.esc(location.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(location.name, 'Локация ' + location.name, hero, content, footer), '.drawer-close');
  };

  MF.openFactionSheet = function (id) {
    const faction = MF.getFaction(id);
    if (!faction) return;
    MF.closeAllOverlays();
    const leader = faction.leaderId ? MF.getCharacter(faction.leaderId) : null;
    const members = MF.state.data.characters.filter(function (character) { return character.factionId === faction.id; });
    const region = MF.getRegion(faction.regionId);
    const location = MF.getLocation(faction.locationId);
    const color = faction.color || '#c5a15f';
    const hero = '<div class="drawer-hero" style="background:radial-gradient(ellipse at 70% 20%,' + MF.esc(color) + '44,transparent 45%),linear-gradient(145deg,#18232b,#0d141a)">' +
      '<div style="position:absolute;right:44px;bottom:31px;opacity:.32;transform:scale(1.8)">' + MF.factionEmblemMarkup(faction) + '</div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(faction.type || 'Фракция') + '</span><span>·</span><span>' + MF.esc(faction.status || 'Действует') + '</span></div>' +
      '<h2 class="detail-title">' + MF.esc(faction.name) + '</h2>' +
      (faction.ideology ? '<p class="detail-subtitle">«' + MF.esc(faction.ideology) + '»</p>' : '') + '</div></div>';
    let content = '<div class="drawer-section"><h3>О фракции</h3><p>' + MF.esc(faction.description || 'У этой силы ещё нет истории.') + '</p></div>';
    if (faction.ideology) content += '<div class="drawer-section"><h3>Кредо</h3><p class="detail-quote">' + MF.esc(faction.ideology) + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Тип', MF.esc(faction.type || '—')),
      fact('Статус', MF.esc(faction.status || '—')),
      fact('Регион', region ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-region" data-id="' + MF.esc(region.id) + '">' + MF.esc(region.name) + '</button>' : '—'),
      fact('Локация', location ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-location" data-id="' + MF.esc(location.id) + '">' + MF.esc(location.name) + '</button>' : '—'),
      fact('Лидер', leader ? chipCharacter(leader) : '<span style="color:var(--muted-2)">Не указан</span>'),
      fact('Участников', String(members.length))
    ]) + '</div>';
    if (members.length) content += '<div class="drawer-section"><h3>Участники</h3><div class="detail-links">' + members.map(function (character) { return chipCharacter(character); }).join('') + '</div></div>';
    content += tagSection(faction.tags);
    content += recordDates(faction);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + members.length + ' ' + MF.plural(members.length, 'участник', 'участника', 'участников') + '</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-faction" data-id="' + MF.esc(faction.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-faction" data-id="' + MF.esc(faction.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(faction.name, 'Фракция ' + faction.name, hero, content, footer), '.drawer-close');
  };

  MF.openRegionSheet = function (id) {
    const region = MF.getRegion(id);
    if (!region) return;
    MF.closeAllOverlays();
    const locations = MF.state.data.locations.filter(function (location) { return location.regionId === region.id; });
    const factions = MF.state.data.factions.filter(function (faction) { return faction.regionId === region.id; });
    const characters = MF.state.data.characters.filter(function (character) {
      return locations.some(function (location) { return location.id === character.locationId; });
    });
    const hero = '<div class="drawer-hero">' + MF.locationMedia(region) +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(region.type || 'Регион') + '</span>' + (region.climate ? '<span>·</span><span>' + MF.esc(region.climate) + '</span>' : '') + '</div>' +
      '<h2 class="detail-title">' + MF.esc(region.name) + '</h2>' +
      '<p class="detail-subtitle ui-subtitle">' + locations.length + ' ' + MF.plural(locations.length, 'локация', 'локации', 'локаций') + ' · ' + factions.length + ' ' + MF.plural(factions.length, 'фракция', 'фракции', 'фракций') + '</p></div></div>';
    let content = '<div class="drawer-section"><h3>Описание</h3><p>' + MF.esc(region.description || 'Этот регион ещё ждёт своего описания.') + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Тип', MF.esc(region.type || '—')),
      fact('Климат', MF.esc(region.climate || '—')),
      fact('Локаций', String(locations.length)),
      fact('Фракций', String(factions.length)),
      fact('Героев', String(characters.length))
    ]) + '</div>';
    content += '<div class="drawer-section"><h3>Локации региона</h3><div class="detail-links">' +
      (locations.length ? locations.map(function (location) {
        return '<button class="relation-chip" data-action="open-location" data-id="' + MF.esc(location.id) + '">' + MF.icon('i-map') + '<span>' + MF.esc(location.name) + '</span></button>';
      }).join('') : emptyLinks('В этом регионе пока нет локаций.')) + '</div>' +
      '<button class="btn btn-soft btn-sm drawer-add-location" data-action="new-location-in-region" data-id="' + MF.esc(region.id) + '">' + MF.icon('i-plus') + 'Добавить локацию</button></div>';
    if (factions.length) content += '<div class="drawer-section"><h3>Силы региона</h3><div class="detail-links">' + factions.map(function (faction) {
      return '<button class="relation-chip" data-action="open-faction" data-id="' + MF.esc(faction.id) + '">' + MF.icon('i-banner') + '<span>' + MF.esc(faction.name) + '</span></button>';
    }).join('') + '</div></div>';
    content += tagSection(region.tags);
    content += recordDates(region);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.icon('i-region') + ' Регион мира</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-region" data-id="' + MF.esc(region.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-region" data-id="' + MF.esc(region.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(region.name, 'Регион ' + region.name, hero, content, footer), '.drawer-close');
  };

  MF.openRaceSheet = function (id) {
    const race = MF.getRace(id);
    if (!race) return;
    MF.closeAllOverlays();
    const characters = MF.state.data.characters.filter(function (character) { return character.raceId === race.id; });
    const hero = '<div class="drawer-hero drawer-hero--plain" style="background:radial-gradient(ellipse at 72% 16%,rgba(127,168,196,.22),transparent 48%),linear-gradient(145deg,#1a252d,#0d141a)">' +
      '<div style="position:absolute;right:44px;bottom:32px;opacity:.34;transform:scale(1.7)">' + MF.factionEmblemMarkup({ name: race.name, color: '#7fa8c4', emblem: race.image }, 'race-emblem') + '</div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(race.type || 'Народ') + '</span><span>·</span><span>' + characters.length + ' ' + MF.plural(characters.length, 'герой', 'героя', 'героев') + '</span></div>' +
      '<h2 class="detail-title">' + MF.esc(race.name) + '</h2>' +
      (race.traits ? '<p class="detail-subtitle">' + MF.esc(race.traits) + '</p>' : '') + '</div></div>';
    let content = '<div class="drawer-section"><h3>Об этом народе</h3><p>' + MF.esc(race.description || 'Эта раса ещё не описана.') + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Тип', MF.esc(race.type || '—')),
      fact('Черты', MF.esc(race.traits || '—')),
      fact('Представителей', String(characters.length))
    ]) + '</div>';
    content += '<div class="drawer-section"><h3>Представители</h3><div class="detail-links">' +
      (characters.length ? characters.map(function (character) { return chipCharacter(character); }).join('') : emptyLinks('Пока никто не связан с этой расой.')) + '</div></div>';
    content += tagSection(race.tags);
    content += recordDates(race);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.icon('i-race') + ' Народ мира</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-race" data-id="' + MF.esc(race.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-race" data-id="' + MF.esc(race.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(race.name, 'Раса ' + race.name, hero, content, footer), '.drawer-close');
  };

  MF.openLoreSheet = function (id) {
    const article = MF.getEntity('lore', id);
    if (!article) return;
    MF.closeAllOverlays();
    const hero = '<div class="drawer-hero">' + MF.loreArt(article) +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(article.category || 'Статья лора') + '</span><span>·</span><span>Знание мира</span></div>' +
      '<h2 class="detail-title">' + MF.esc(article.title) + '</h2>' +
      (article.summary ? '<p class="detail-subtitle">' + MF.esc(MF.clampText(article.summary, 170)) + '</p>' : '') + '</div></div>';
    let content = '';
    if (article.summary) content += '<div class="drawer-section"><h3>Суть</h3><p class="detail-quote">' + MF.esc(article.summary) + '</p></div>';
    content += '<div class="drawer-section"><h3>Текст статьи</h3><p class="detail-content-large">' + MF.esc(article.content || MF.t('Текст статьи ещё не написан.')) + '</p></div>';
    const source = article.sourceId ? MF.getBook(article.sourceId) : null;
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Категория', MF.esc(article.category || '—')),
      fact('Источник', source ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-book" data-id="' + MF.esc(source.id) + '">' + MF.esc(source.title) + '</button>' : '—'),
      fact('Метки', article.tags && article.tags.length ? MF.esc(article.tags.join(', ')) : '—')
    ]) + '</div>';
    content += recordDates(article);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.icon('i-book') + ' Статья лора</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-lore" data-id="' + MF.esc(article.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-lore" data-id="' + MF.esc(article.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(article.title, 'Статья ' + article.title, hero, content, footer), '.drawer-close');
  };

  MF.openEventSheet = function (id) {
    const event = MF.getEntity('event', id);
    if (!event) return;
    MF.closeAllOverlays();
    const type = MF.EVENT_TYPES[event.type] || MF.EVENT_TYPES.other;
    const location = MF.getLocation(event.locationId);
    const participants = (event.participantIds || []).map(function (participantId) { return MF.getCharacter(participantId); }).filter(Boolean);
    const hero = '<div class="drawer-hero drawer-hero--plain" style="background:radial-gradient(ellipse at 75% 15%,rgba(197,161,95,.14),transparent 45%),linear-gradient(145deg,#1c242a,#0d1217)">' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(type.label) + '</span><span>·</span><span>' + MF.esc(event.era || 'Вне эпох') + '</span></div>' +
      '<div class="detail-event-date">' + MF.icon('i-calendar') + MF.esc(event.dateText || 'Дата не указана') + '</div>' +
      '<h2 class="detail-title">' + MF.esc(event.title) + '</h2></div></div>';
    let content = '<div class="drawer-section"><h3>Что произошло</h3><p class="detail-content-large">' + MF.esc(event.description || MF.t('Описание события ещё ждёт летописца.')) + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Дата в мире', MF.esc(event.dateText || '—')),
      fact('Эпоха', MF.esc(event.era || '—')),
      fact('Тип', MF.eventTypeBadge(event.type)),
      fact('Место', location ? '<button class="link-btn" style="padding:0;font-size:11px" data-action="open-location" data-id="' + MF.esc(location.id) + '">' + MF.esc(location.name) + '</button>' : '—')
    ]) + '</div>';
    content += '<div class="drawer-section"><h3>Участники</h3><div class="detail-links">' +
      (participants.length ? participants.map(function (character) { return chipCharacter(character); }).join('') : emptyLinks('Участники не указаны.')) + '</div></div>';
    content += recordDates(event);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.esc(event.era || type.label) + '</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-event" data-id="' + MF.esc(event.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-event" data-id="' + MF.esc(event.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(event.title, 'Событие ' + event.title, hero, content, footer), '.drawer-close');
  };

  MF.openNoteSheet = function (id) {
    const note = MF.getEntity('note', id);
    if (!note) return;
    MF.closeAllOverlays();
    const color = MF.NOTE_COLORS.find(function (entry) { return entry.id === note.color; }) || MF.NOTE_COLORS[0];
    const hero = '<div class="drawer-hero drawer-hero--plain" style="background:radial-gradient(ellipse at 80% 15%,' + color.color + '33,transparent 50%),linear-gradient(145deg,#1b2429,#0e1418)">' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>Заметка</span><span>·</span><span>' + MF.esc(color.label) + '</span>' + (note.pinned ? '<span>·</span><span>Закреплена</span>' : '') + '</div>' +
      '<h2 class="detail-title">' + MF.esc(note.title || 'Без названия') + '</h2>' +
      '<p class="detail-subtitle">' + MF.esc(MF.formatDateFull(note.createdAt)) + '</p></div></div>';
    const content = '<div class="drawer-section"><p class="detail-content-large" style="white-space:pre-line">' + MF.esc(note.content || MF.t('Заметка пока пуста.')) + '</p></div>' + recordDates(note);
    const footer = '<button class="btn btn-ghost btn-sm" data-action="pin-note" data-id="' + MF.esc(note.id) + '">' + MF.icon('i-pin') + (note.pinned ? 'Открепить' : 'Закрепить') + '</button>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-note" data-id="' + MF.esc(note.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-note" data-id="' + MF.esc(note.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(note.title || 'Заметка', 'Заметка ' + (note.title || ''), hero, content, footer), '.drawer-close');
  };

  MF.openBookSheet = function (id) {
    const book = MF.getBook(id);
    if (!book) return;
    MF.closeAllOverlays();
    const linked = MF.state.data.lore.filter(function (article) { return article.sourceId === book.id; });
    const cover = book.cover || book.image;
    const hero = '<div class="drawer-hero' + (cover ? '' : ' drawer-hero--plain') + '"' +
      (cover ? ' style="background-image:url(&quot;' + MF.esc(cover) + '&quot;)"' : ' style="background:radial-gradient(ellipse at 75% 15%,rgba(197,161,95,.16),transparent 45%),linear-gradient(145deg,#1c242a,#0d1217)"') + '>' +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(book.type || 'Книга') + '</span><span>·</span><span>' + MF.esc(book.author || 'Автор не указан') + '</span></div>' +
      '<h2 class="detail-title">' + MF.esc(book.title) + '</h2>' +
      (book.year ? '<p class="detail-subtitle">' + MF.esc(book.year) + '</p>' : '') + '</div></div>';
    let content = '<div class="drawer-section"><h3>Об источнике</h3><p>' + MF.esc(book.description || 'Источник ещё не описан.') + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([
      fact('Тип', MF.esc(book.type || '—')),
      fact('Автор', MF.esc(book.author || '—')),
      fact('Год', MF.esc(book.year || '—')),
      fact('Статей', String(linked.length))
    ]) + '</div>';
    content += '<div class="drawer-section"><h3>Статьи из этого источника</h3><div class="detail-links">' +
      (linked.length ? linked.map(function (article) {
        return '<button class="relation-chip" data-action="open-lore" data-id="' + MF.esc(article.id) + '">' + MF.icon('i-book') + '<span>' + MF.esc(article.title) + '</span></button>';
      }).join('') : emptyLinks('Пока нет статей, связанных с этим источником.')) + '</div></div>';
    content += tagSection(book.tags);
    content += recordDates(book);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.icon('i-scroll') + ' Источник лора</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-book" data-id="' + MF.esc(book.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-book" data-id="' + MF.esc(book.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(book.title, 'Источник ' + book.title, hero, content, footer), '.drawer-close');
  };

  MF.openEntity = function (type, id) {
    if (MF.closeSearch) MF.closeSearch();
    if (type === 'character') MF.openCharacterSheet(id);
    else if (type === 'region') MF.openRegionSheet(id);
    else if (type === 'location') MF.openLocationSheet(id);
    else if (type === 'faction') MF.openFactionSheet(id);
    else if (type === 'race') MF.openRaceSheet(id);
    else if (type === 'lore') MF.openLoreSheet(id);
    else if (type === 'book') MF.openBookSheet(id);
    else if (type === 'catalogItem') {
      const item = MF.state.data.catalogItems.find(function (entry) { return entry.id === id; });
      if (item) MF.openCatalogItemSheet(item.id, item.catalogId);
    }
    else if (type === 'event') MF.openEventSheet(id);
    else if (type === 'note') MF.openNoteSheet(id);
    else if (type === 'world') MF.openWorldForm();
  };

  /* ---------- Modal building ---------- */
  function modalShell(opts) {
    const size = opts.size === 'wide' ? ' modal--wide' : opts.size === 'medium' ? ' modal--medium' : opts.size === 'small' ? ' modal--small' : '';
    const opening = opts.formType ? '<form data-form-type="' + opts.formType + '" data-entity-id="' + MF.esc(opts.entityId || '') + '" novalidate>' : '';
    const closing = opts.formType ? '</form>' : '';
    return '<div class="overlay" data-overlay><div class="modal' + size + '" role="dialog" aria-modal="true" aria-label="' + MF.esc(opts.title) + '">' +
      '<div class="modal-header"><div class="modal-heading">' +
      (opts.eyebrow ? '<div class="modal-eyebrow">' + MF.esc(opts.eyebrow) + '</div>' : '') +
      '<h2 class="modal-title">' + MF.esc(opts.title) + '</h2>' +
      (opts.subtitle ? '<p class="modal-subtitle">' + MF.esc(opts.subtitle) + '</p>' : '') +
      '</div><button type="button" class="icon-btn modal-close" data-action="close-overlay" aria-label="Закрыть">' + MF.icon('i-x') + '</button></div>' +
      opening + '<div class="modal-body">' + opts.body + '</div>' +
      '<div class="modal-footer">' + opts.footer + '</div>' + closing +
      '</div></div>';
  }

  function inputField(name, label, value, opts) {
    const options = opts || {};
    return '<div class="form-field ' + (options.full ? 'span-full' : '') + '"><label class="field-label" for="fld_' + name + '">' + MF.esc(label) + (options.required ? ' <span class="req">✦</span>' : '') + '</label>' +
      '<input class="input" id="fld_' + name + '" name="' + name + '" type="' + (options.type || 'text') + '" value="' + MF.esc(value || '') + '" placeholder="' + MF.esc(options.placeholder || '') + '"' + (options.required ? ' required' : '') + '>' +
      (options.hint ? '<span class="field-hint">' + MF.esc(options.hint) + '</span>' : '') + '</div>';
  }

  function textareaField(name, label, value, opts) {
    const options = opts || {};
    return '<div class="form-field span-full"><label class="field-label" for="fld_' + name + '">' + MF.esc(label) + '</label>' +
      '<textarea class="textarea ' + (options.cls || '') + '" id="fld_' + name + '" name="' + name + '" placeholder="' + MF.esc(options.placeholder || '') + '">' + MF.esc(value || '') + '</textarea>' +
      (options.hint ? '<span class="field-hint">' + MF.esc(options.hint) + '</span>' : '') + '</div>';
  }

  function selectField(name, label, value, items, opts) {
    const options = opts || {};
    const list = items.map(function (item) {
      const val = typeof item === 'string' ? item : item.value;
      const text = typeof item === 'string' ? item : item.label;
      return '<option value="' + MF.esc(val) + '"' + (String(value || '') === String(val) ? ' selected' : '') + '>' + MF.esc(text) + '</option>';
    }).join('');
    return '<div class="form-field ' + (options.full ? 'span-full' : '') + '"><label class="field-label" for="fld_' + name + '">' + MF.esc(label) + '</label>' +
      '<select class="select" id="fld_' + name + '" name="' + name + '">' + list + '</select>' +
      (options.hint ? '<span class="field-hint">' + MF.esc(options.hint) + '</span>' : '') + '</div>';
  }

  function imageField(value, opts) {
    const options = opts || {};
    const has = !!value;
    return '<div class="image-field"><div class="image-preview ' + (options.wide ? 'image-preview--wide' : '') + (has ? ' has-image is-clickable' : '') + '" id="formImagePreview"' +
      (has ? ' data-action="view-image" data-url="' + MF.esc(value) + '" title="Открыть изображение"' : '') +
      (has ? ' style="background-image:url(&quot;' + MF.esc(value) + '&quot;)"' : '') + '>' + (has ? '' : MF.icon('i-image')) + '</div>' +
      '<div class="image-field-copy"><strong>' + MF.esc(options.label || 'Изображение') + '</strong><p>' + MF.esc(options.hint || 'PNG, JPG или WebP. Файл сохранится рядом с летописью.') + '</p>' +
      '<div class="image-field-actions"><button type="button" class="btn btn-soft btn-sm" data-action="pick-image">' + MF.icon('i-upload') + 'Выбрать файл</button>' +
      '<button type="button" class="btn btn-subtle btn-sm ' + (has ? '' : 'is-hidden') + '" data-action="remove-image" id="formImageRemove">Убрать</button></div></div>' +
      '<input type="hidden" name="image" class="js-image-value" value="' + MF.esc(value || '') + '"></div>';
  }

  function galleryField(images, opts) {
    const options = opts || {};
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    const thumbs = list.length ? list.map(function (url, index) {
      return '<div class="gallery-thumb">' +
        '<button type="button" class="gallery-thumb-view" data-action="view-image" data-url="' + MF.esc(url) + '" aria-label="Открыть рисунок ' + (index + 1) + '"><img src="' + MF.esc(url) + '" alt="Рисунок ' + (index + 1) + '" loading="lazy"></button>' +
        '<button type="button" class="gallery-thumb-remove" data-action="remove-gallery" data-index="' + index + '" aria-label="Удалить рисунок">' + MF.icon('i-x') + '</button>' +
        '</div>';
    }).join('') : '<div class="gallery-empty">' + MF.icon('i-gallery') + '<span>Дополнительных рисунков пока нет.</span></div>';
    return '<div class="gallery-field span-full"><div class="gallery-field-head"><div><strong>' + MF.esc(options.label || 'Галерея персонажа') + '</strong>' +
      '<p>' + MF.esc(options.hint || 'Портрет — главное изображение героя. Здесь можно собрать несколько рисунков: сцены, костюмы, детали.') + '</p></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-action="add-gallery">' + MF.icon('i-gallery') + 'Добавить рисунки</button></div>' +
      '<div class="gallery-field-thumbs" id="formGalleryThumbs">' + thumbs + '</div>' +
      '<input type="hidden" name="gallery" class="js-gallery-value" value="' + MF.esc(JSON.stringify(list)) + '"></div>';
  }

  function audioField(tracks) {
    const list = Array.isArray(tracks) ? tracks : [];
    return '<div class="audio-field span-full"><div class="audio-field-head"><div><strong>Голос и музыка</strong>' +
      '<p>Добавьте образец голоса или музыкальную тему героя. Файлы сохраняются рядом с летописью.</p></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-action="add-audio">' + MF.icon('i-audio') + 'Добавить аудио</button></div>' +
      '<div class="audio-list" id="formAudioList">' + audioRows(list) + '</div>' +
      '<input type="hidden" name="audio" class="js-audio-value" value="' + MF.esc(JSON.stringify(list)) + '"></div>';
  }

  function audioRows(list) {
    if (!list.length) {
      return '<div class="audio-empty">' + MF.icon('i-mic') + '<span>Пока нет записей. Можно добавить голос, чтение или музыку.</span></div>';
    }
    return list.map(function (track, index) {
      const kind = track.kind === 'music' ? 'music' : 'voice';
      return '<div class="audio-row" data-audio-row="' + index + '">' +
        '<span class="audio-kind-icon">' + MF.icon(kind === 'music' ? 'i-music' : 'i-mic') + '</span>' +
        '<div class="audio-main"><input class="audio-title" data-audio-title="' + index + '" value="' + MF.esc(track.title || 'Аудио') + '" maxlength="80" aria-label="Название аудио">' +
        '<audio controls preload="none" src="' + MF.esc(track.url) + '"></audio></div>' +
        '<select class="select-compact" data-audio-kind="' + index + '">' +
        '<option value="voice"' + (kind === 'voice' ? ' selected' : '') + '>Голос</option>' +
        '<option value="music"' + (kind === 'music' ? ' selected' : '') + '>Музыка</option></select>' +
        '<button type="button" class="icon-btn is-danger" data-action="remove-audio" data-index="' + index + '" aria-label="Удалить аудио">' + MF.icon('i-trash') + '</button>' +
        '</div>';
    }).join('');
  }

  function audioValues(form) {
    const input = form ? form.querySelector('.js-audio-value') : null;
    if (!input) return [];
    try {
      const list = JSON.parse(input.value || '[]');
      return Array.isArray(list) ? list.filter(function (item) { return item && item.url; }) : [];
    } catch (e) {
      return [];
    }
  }

  function setAudioValues(form, list) {
    const input = form ? form.querySelector('.js-audio-value') : null;
    if (!input) return;
    const clean = (list || []).filter(function (item) { return item && item.url; }).slice(0, 12);
    input.value = JSON.stringify(clean);
    const box = form.querySelector('#formAudioList');
    if (box) box.innerHTML = audioRows(clean);
  }

  function audioTrack(form, index) {
    const list = audioValues(form);
    return list[index] || null;
  }

  function updateAudioTrack(element) {
    const form = element.closest('form[data-form-type]');
    if (!form) return;
    const index = Number(element.getAttribute('data-audio-title') || element.getAttribute('data-audio-kind'));
    const list = audioValues(form);
    if (!list[index]) return;
    if (element.hasAttribute('data-audio-title')) list[index].title = element.value;
    if (element.hasAttribute('data-audio-kind')) list[index].kind = element.value === 'music' ? 'music' : 'voice';
    const hidden = form.querySelector('.js-audio-value');
    if (hidden) hidden.value = JSON.stringify(list);
    const row = element.closest('.audio-row');
    if (row) {
      const icon = row.querySelector('.audio-kind-icon');
      if (icon) icon.innerHTML = MF.icon(list[index].kind === 'music' ? 'i-music' : 'i-mic');
    }
  }

  MF.pickAudioFor = async function (form) {
    if (!form) return;
    if (MF.isNative) {
      try {
        const result = await MF.invoke('pickAudio', null, { timeoutMs: 300000 });
        if (result && result.url) {
          const list = audioValues(form);
          list.push({ id: MF.uid('aud'), url: result.url, title: 'Голос ' + (list.length + 1), kind: 'voice' });
          setAudioValues(form, list);
          MF.toast('Аудио добавлено', result.name || 'Файл сохранён рядом с летописью.', 'success');
        }
      } catch (error) {
        MF.toast('Не удалось добавить аудио', error.message || 'Проверьте файл и попробуйте снова.', 'error');
      }
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      if (file.size > 12 * 1024 * 1024) { MF.toast('Файл слишком большой', 'В предпросмотре можно добавить аудио до 12 МБ.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = function () {
        const list = audioValues(form);
        list.push({ id: MF.uid('aud'), url: String(reader.result || ''), title: file.name.replace(/\.[^.]+$/, ''), kind: 'voice' });
        setAudioValues(form, list);
        MF.toast('Аудио добавлено', file.name, 'success');
      };
      reader.onerror = function () { MF.toast('Не удалось прочитать аудио', 'Попробуйте другой файл.', 'error'); };
      reader.readAsDataURL(file);
    });
    input.click();
  };

  function customFieldRow(field) {
    const item = field || {};
    return '<div class="custom-field-row" data-custom-field-row data-custom-field-id="' + MF.esc(item.id || '') + '">' +
      '<input class="input custom-field-label" maxlength="40" value="' + MF.esc(item.label || '') + '" placeholder="' + MF.esc(MF.t('Название поля, например «Цветок»')) + '">' +
      '<input class="input custom-field-value" maxlength="200" value="' + MF.esc(item.value || '') + '" placeholder="' + MF.esc(MF.t('Значение, например «Лаванда»')) + '">' +
      '<button type="button" class="icon-btn is-danger" data-action="remove-custom-field" aria-label="' + MF.esc(MF.t('Удалить поле')) + '">' + MF.icon('i-x') + '</button></div>';
  }

  function customFieldsField(fields) {
    const list = Array.isArray(fields) ? fields : [];
    return '<div class="custom-fields-field span-full"><div class="custom-fields-head"><div><strong>' + MF.t('Свои поля') + '</strong>' +
      '<p>' + MF.t('Добавьте то, чего нет в стандартной карточке: запах, цветок, любимый напиток, талисман.') + '</p></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-action="add-custom-field">' + MF.icon('i-plus') + MF.t('Добавить поле') + '</button></div>' +
      '<div class="custom-fields-list" id="characterCustomFields">' + (list.length ? list.map(customFieldRow).join('') : '<div class="custom-fields-empty">' + MF.t('Своих полей пока нет.') + '</div>') + '</div></div>';
  }

  function customFieldValues(form) {
    const rows = Array.prototype.slice.call(form.querySelectorAll('[data-custom-field-row]'));
    return rows.map(function (row) {
      const label = String((row.querySelector('.custom-field-label') || {}).value || '').trim();
      const value = String((row.querySelector('.custom-field-value') || {}).value || '').trim();
      if (!label && !value) return null;
      return { id: row.getAttribute('data-custom-field-id') || MF.uid('cf'), label: label, value: value };
    }).filter(Boolean).slice(0, 40);
  }

  function paletteField(colors) {
    const list = Array.isArray(colors) ? colors : [];
    return '<div class="palette-field span-full"><div class="palette-field-head"><div><strong>Палитра образа</strong>' +
      '<p>Цвета кожи, волос, одежды и магии. Пригодятся для рисунков и референсов.</p></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-action="add-palette">' + MF.icon('i-palette') + 'Добавить цвет</button></div>' +
      '<div class="palette-swatches" id="formPaletteSwatches">' + paletteSwatches(list) + '</div>' +
      '<input type="hidden" name="palette" class="js-palette-value" value="' + MF.esc(JSON.stringify(list)) + '"></div>';
  }

  function paletteSwatches(list) {
    if (!list.length) return '<div class="palette-empty">' + MF.icon('i-palette') + '<span>Палитра пока пуста.</span></div>';
    return list.map(function (color, index) {
      return '<div class="palette-swatch" style="--swatch:' + MF.esc(color) + '">' +
        '<input type="color" class="palette-input" data-palette-index="' + index + '" value="' + MF.esc(color) + '" aria-label="Цвет палитры">' +
        '<span class="palette-hex">' + MF.esc(color) + '</span>' +
        '<button type="button" class="palette-remove" data-action="remove-palette" data-index="' + index + '" aria-label="Удалить цвет">' + MF.icon('i-x') + '</button>' +
        '</div>';
    }).join('');
  }

  function paletteValues(form) {
    const input = form ? form.querySelector('.js-palette-value') : null;
    if (!input) return [];
    try {
      const list = JSON.parse(input.value || '[]');
      return Array.isArray(list) ? list.filter(function (value) { return /^#[0-9a-fA-F]{6}$/.test(String(value)); }) : [];
    } catch (e) {
      return [];
    }
  }

  function setPaletteValues(form, list) {
    const input = form ? form.querySelector('.js-palette-value') : null;
    if (!input) return;
    const clean = (list || []).filter(function (value) { return /^#[0-9a-fA-F]{6}$/.test(String(value)); }).slice(0, 8);
    input.value = JSON.stringify(clean);
    const box = form.querySelector('#formPaletteSwatches');
    if (box) box.innerHTML = paletteSwatches(clean);
  }

  function checkboxGrid(name, items) {
    if (!items.length) return '<div class="check-grid"></div>';
    return '<div class="check-grid">' + items.map(function (item) {
      return '<label class="check-item"><input type="checkbox" name="' + name + '" value="' + MF.esc(item.id) + '"' + (item.checked ? ' checked' : '') + '>' +
        '<span class="check-box">' + MF.icon('i-check') + '</span><span class="check-text">' + MF.esc(item.label) + '</span></label>';
    }).join('') + '</div>';
  }

  function timestampInline(entity) {
    if (!entity) return '';
    return '<div class="form-inline-note">' + MF.icon('i-clock') + ' Создано ' + MF.esc(MF.formatDateFull(entity.createdAt)) + '. Изменения сохраняются автоматически и получат новую отметку времени.</div>';
  }

  function formFooter(isEdit, label, entity) {
    return '<button type="button" class="btn btn-ghost" data-action="close-overlay">Отмена</button>' +
      '<button type="submit" class="btn btn-primary">' + MF.icon('i-check') + (isEdit ? 'Сохранить изменения' : (label || 'Создать запись')) + '</button>';
  }

  function selectOptionsFor(items, placeholder) {
    return [{ value: '', label: placeholder || '— не указано —' }].concat(items);
  }

  function charOptions(excludeIds) {
    const exclude = excludeIds || [];
    return MF.state.data.characters.filter(function (character) { return exclude.indexOf(character.id) === -1; }).map(function (character) {
      return { value: character.id, label: character.name + (character.title ? ' · ' + character.title : '') };
    });
  }

  function descendantIds(id) {
    const result = [];
    const queue = [id];
    const seen = {};
    while (queue.length) {
      const current = queue.shift();
      MF.childrenOf(current).forEach(function (child) {
        if (!seen[child.id]) {
          seen[child.id] = true;
          result.push(child.id);
          queue.push(child.id);
        }
      });
    }
    return result;
  }
  MF.descendantIds = descendantIds;

  MF.openTreeRelationForm = function (firstId, secondId) {
    const first = MF.getCharacter(firstId);
    const second = MF.getCharacter(secondId);
    if (!first || !second) return;
    const roleOf = function (character) {
      if (MF.isFemale(character.gender)) return MF.LANG === 'en' ? 'mother' : 'мать';
      return MF.LANG === 'en' ? 'father' : 'отец';
    };
    const body = '<div class="tree-relation-intro">' +
      '<div class="tree-relation-person"><strong>' + MF.esc(first.name) + '</strong><span>' + MF.esc(first.title || first.role || '') + '</span></div>' +
      '<span class="tree-relation-vs">↔</span>' +
      '<div class="tree-relation-person"><strong>' + MF.esc(second.name) + '</strong><span>' + MF.esc(second.title || second.role || '') + '</span></div></div>' +
      '<p class="tree-relation-hint">Выберите, как связать этих персонажей. Связь сразу появится в обеих карточках — как двусторонние ссылки в Obsidian.</p>' +
      '<div class="tree-relation-options">' +
      '<button type="button" class="tree-relation-option" data-tree-rel="first-parent"><span>' + MF.esc(first.name) + '</span><strong>родитель</strong><span>' + MF.esc(second.name) + '</span><small>Роль: ' + roleOf(first) + '</small></button>' +
      '<button type="button" class="tree-relation-option" data-tree-rel="second-parent"><span>' + MF.esc(second.name) + '</span><strong>родитель</strong><span>' + MF.esc(first.name) + '</span><small>Роль: ' + roleOf(second) + '</small></button>' +
      '<button type="button" class="tree-relation-option" data-tree-rel="spouse"><span>' + MF.esc(first.name) + '</span><strong>супруг(а)</strong><span>' + MF.esc(second.name) + '</span><small>Двусторонняя семейная связь</small></button>' +
      '</div>';
    const overlay = appendOverlay(modalShell({
      title: 'Связать персонажей',
      eyebrow: 'Древо рода',
      subtitle: 'Ручное перетягивание меняет расположение, а связи хранятся в карточках героев.',
      size: 'medium', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button>'
    }), '.modal-close');
    if (!overlay) return;
    overlay.querySelectorAll('[data-tree-rel]').forEach(function (button) {
      button.addEventListener('click', async function () {
        const relation = button.getAttribute('data-tree-rel');
        const now = MF.nowISO();
        if (relation === 'spouse') {
          first.spouseIds = Array.isArray(first.spouseIds) ? first.spouseIds : [];
          second.spouseIds = Array.isArray(second.spouseIds) ? second.spouseIds : [];
          if (first.spouseIds.indexOf(second.id) === -1) first.spouseIds.push(second.id);
          if (second.spouseIds.indexOf(first.id) === -1) second.spouseIds.push(first.id);
        } else {
          const parent = relation === 'first-parent' ? first : second;
          const child = relation === 'first-parent' ? second : first;
          if (parent.id === child.id || descendantIds(child.id).indexOf(parent.id) !== -1) {
            MF.toast('Нельзя создать связь', 'Так в древе появится замкнутый круг.', 'error');
            return;
          }
          if (MF.isFemale(parent.gender)) child.motherId = parent.id;
          else child.fatherId = parent.id;
          child.updatedAt = now;
          parent.updatedAt = now;
        }
        first.updatedAt = now;
        second.updatedAt = now;
        MF.addActivity('update', 'character', first.id, first.name);
        MF.closeAllOverlays();
        MF.state.tree.userAdjusted = false;
        MF.state.tree.layoutKey = '';
        await MF.saveNow();
        MF.renderCurrentPage({ keepScroll: true });
        MF.toast('Связи обновлены', '«' + first.name + '» и «' + second.name + '» теперь связаны.', 'success');
      });
    });
  };

  /* ---------- Character form ---------- */
  MF.openCharacterForm = function (id) {
    const isEdit = !!id;
    const character = isEdit ? MF.getCharacter(id) : null;
    if (isEdit && !character) return;
    const c = character || {
      name: '', title: '', role: '', race: '', raceId: '', gender: MF.LANG === 'en' ? 'Not specified' : 'Не указан', age: '',
      status: MF.LANG === 'en' ? 'Alive' : 'Жив', factionId: '', locationId: '',
      quote: '', description: '', personality: '', appearance: '', tags: [], fatherId: '', motherId: '', spouseIds: [],
      portrait: '', gallery: [], palette: [], audio: [], customFields: []
    };
    const blocked = isEdit ? descendantIds(c.id).concat([c.id]) : [];
    const parents = selectOptionsFor(charOptions(blocked), '— не указан —');
    const factions = selectOptionsFor(MF.state.data.factions.map(function (faction) { return { value: faction.id, label: faction.name }; }), '— без фракции —');
    const locations = selectOptionsFor(MF.state.data.locations.map(function (location) { return { value: location.id, label: location.name }; }), '— вне локаций —');
    const races = selectOptionsFor(MF.state.data.races.map(function (race) { return { value: race.id, label: race.name + (race.type ? ' · ' + race.type : '') }; }), '— не указана —');
    const statuses = MF.statusOptions(c.status);
    const genders = MF.genderOptions(c.gender);
    const spouses = MF.state.data.characters.filter(function (other) { return other.id !== c.id; }).map(function (other) {
      return { id: other.id, label: other.name + (other.title ? ' · ' + other.title : ''), checked: (c.spouseIds || []).indexOf(other.id) !== -1 };
    });
    const show = MF.isCharacterFieldVisible;
    const parts = [];
    if (show('portrait')) parts.push(imageField(c.portrait, { label: 'Большой портрет', hint: 'Главное изображение героя. Нажмите на превью, чтобы открыть его крупно.' }));
    if (show('gallery')) parts.push(galleryField(c.gallery, {}));
    if (show('audio')) parts.push(audioField(c.audio));
    parts.push(inputField('name', 'Имя', c.name, { required: true, placeholder: 'Например, Эйрик Вельд' }));
    if (show('title')) parts.push(inputField('title', 'Титул или прозвище', c.title, { placeholder: 'Старший Волк Хеймдаля' }));
    if (show('role')) parts.push(inputField('role', 'Роль в истории', c.role, { placeholder: 'Правитель, ведунья, наёмник…' }));
    if (show('status')) parts.push(selectField('status', 'Статус', c.status, statuses));
    const origin = [];
    if (show('race')) {
      origin.push(selectField('raceId', 'Раса', c.raceId, races, { hint: 'Список рас ведётся в разделе «Расы».' }));
      origin.push(inputField('race', 'Народ / уточнение', c.race, { hint: 'Необязательно. Если расы нет в списке — создайте её кнопкой ниже.' }));
      origin.push('<div class="form-field span-full race-quick-hint">' + MF.icon('i-race') + '<span>Нет нужной расы?</span><button type="button" class="link-btn" data-action="quick-create-race">Создать расу</button></div>');
    }
    if (show('gender')) origin.push(selectField('gender', 'Пол', c.gender, genders));
    if (show('age')) origin.push(inputField('age', 'Возраст', c.age, { placeholder: '38 лет' }));
    if (show('faction')) origin.push(selectField('factionId', 'Фракция', c.factionId, factions));
    if (show('location')) origin.push(selectField('locationId', 'Локация', c.locationId, locations));
    if (origin.length) parts.push('<div class="form-section">Происхождение</div>' + origin.join(''));
    const story = [];
    if (show('quote')) story.push(inputField('quote', 'Цитата', c.quote, { full: true, placeholder: 'Фраза, которая раскрывает героя' }));
    if (show('description')) story.push(textareaField('description', 'История', c.description, { cls: 'form-textarea-tall', placeholder: 'Прошлое, мотивы, поворотные события…' }));
    if (show('personality')) story.push(textareaField('personality', 'Характер', c.personality, { placeholder: 'Привычки, страхи, противоречия…' }));
    if (show('appearance')) story.push(textareaField('appearance', 'Внешность', c.appearance, { placeholder: 'Рост, волосы, глаза, шрамы, одежда, характерные детали…' }));
    if (show('palette')) story.push(paletteField(c.palette));
    if (show('tags')) story.push(inputField('tags', 'Метки', (c.tags || []).join(', '), { full: true, placeholder: 'основатель, династия, север' }));
    if (story.length) parts.push('<div class="form-section">Характер и история</div>' + story.join(''));
    parts.push(customFieldsField(c.customFields));
    if (show('family')) {
      parts.push('<div class="form-section">Семья</div>' +
        selectField('fatherId', 'Отец', c.fatherId, parents) +
        selectField('motherId', 'Мать', c.motherId, parents) +
        '<div class="form-field span-full"><span class="field-label">Супруги</span>' + checkboxGrid('spouseIds', spouses) + '<span class="field-hint">Связь создаётся в обе стороны. Можно выбрать нескольких персонажей.</span></div>');
    }
    parts.push(timestampInline(character));
    const body = '<div class="form-grid">' + parts.join('') + '</div>';
    const overlay = appendOverlay(modalShell({
      title: isEdit ? 'Изменить героя' : 'Новый герой',
      eyebrow: isEdit ? 'Персонаж' : 'Пополнить галерею',
      subtitle: 'Портрет, история и родственные связи собираются в живую судьбу.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать персонажа', character),
      formType: 'character', entityId: c.id || ''
    }), '#fld_name');
    if (overlay) overlay.querySelector('.modal-title').setAttribute('tabindex', '-1');
  };

  MF.openQuickRaceForm = function (form) {
    if (!form) return;
    const input = form.querySelector('[name=race]');
    const suggested = input ? String(input.value || '').trim() : '';
    const body = '<div class="form-grid">' +
      '<div class="form-field span-full"><label class="field-label" for="quickRaceName">Название расы <span class="req">✦</span></label>' +
      '<input class="input" id="quickRaceName" value="' + MF.esc(suggested) + '" placeholder="Например, Дети Тумана" maxlength="80"></div>' +
      '<div class="form-field"><label class="field-label" for="quickRaceType">Тип</label><input class="input" id="quickRaceType" list="quickRaceTypes" value="' + MF.t('Смертные') + '" placeholder="' + MF.t('Выберите или введите свой') + '">' +
      '<datalist id="quickRaceTypes">' + MF.RACE_TYPES.concat(MF.state.data.races.map(function (race) { return race.type; }).filter(Boolean)).filter(function (type, index, all) { return all.indexOf(type) === index; }).map(function (type) { return '<option value="' + MF.esc(type) + '"></option>'; }).join('') + '</datalist></div>' +
      '<div class="form-field"><label class="field-label" for="quickRaceTraits">Черты</label><input class="input" id="quickRaceTraits" placeholder="Сны · отражения · память"></div>' +
      '<div class="form-inline-note span-full">' + MF.icon('i-info') + ' Раса сразу сохранится в летописи и будет выбрана у этого персонажа. Позже её можно дополнить в разделе «Расы». </div></div>';
    const overlay = appendOverlay(modalShell({
      title: 'Новая раса',
      eyebrow: 'Быстрое создание',
      subtitle: 'Если нужного народа ещё нет в мире, создайте его, не закрывая карточку героя.',
      size: 'medium', body: body,
      footer: '<button type="button" class="btn btn-ghost quick-race-cancel">Отмена</button>' +
        '<button type="button" class="btn btn-primary quick-race-save">' + MF.icon('i-check') + 'Создать и выбрать</button>'
    }), '#quickRaceName');
    if (!overlay) return;
    overlay.querySelector('.quick-race-cancel').addEventListener('click', function () { MF.closeTopOverlay(); });
    overlay.querySelector('.quick-race-save').addEventListener('click', async function (event) {
      const button = event.currentTarget;
      const nameEl = overlay.querySelector('#quickRaceName');
      const name = String(nameEl.value || '').trim();
      if (!name) { nameEl.focus(); MF.toast('Название обязательно', 'Дайте расе имя.', 'error'); return; }
      button.disabled = true;
      try {
        const before = MF.state.data.races.length;
        const race = MF.findOrCreateRace(name);
        if (!race) throw new Error('Не удалось создать расу.');
        if (race.type === 'Народ') {
          const typeEl = overlay.querySelector('#quickRaceType');
          const traitsEl = overlay.querySelector('#quickRaceTraits');
          if (typeEl) race.type = typeEl.value || 'Народ';
          if (traitsEl) race.traits = traitsEl.value.trim();
          race.updatedAt = MF.nowISO();
        }
        if (MF.state.data.races.length > before) {
          MF.addActivity('create', 'race', race.id, MF.activityTitle('race', 'create', race.name));
        }
        await MF.saveNow();
        const select = form.querySelector('[name=raceId]');
        if (select) {
          let option = Array.prototype.slice.call(select.options).find(function (item) { return item.value === race.id; });
          if (!option) {
            option = document.createElement('option');
            option.value = race.id;
            option.textContent = race.name + (race.type ? ' · ' + race.type : '');
            select.appendChild(option);
          }
          select.value = race.id;
        }
        const raceInput = form.querySelector('[name=race]');
        if (raceInput) raceInput.value = race.name;
        MF.refreshNavCounts();
        MF.closeTopOverlay();
        MF.toast('Раса создана', '«' + race.name + '» выбрана у персонажа.', 'success');
      } catch (error) {
        button.disabled = false;
        MF.toast('Не удалось создать расу', error.message || 'Попробуйте снова.', 'error');
      }
    });
  };

  /* ---------- Location form ---------- */
  MF.openLocationForm = function (id, presetRegionId) {
    const isEdit = !!id;
    const location = isEdit ? MF.getLocation(id) : null;
    if (isEdit && !location) return;
    const l = location || { name: '', type: 'Город', regionId: presetRegionId || '', region: '', description: '', tags: [], image: '' };
    const types = MF.LOCATION_TYPES.indexOf(l.type) === -1 && l.type ? [l.type].concat(MF.LOCATION_TYPES) : MF.LOCATION_TYPES;
    const regions = selectOptionsFor(MF.state.data.regions.map(function (region) { return { value: region.id, label: region.name + (region.type ? ' · ' + region.type : '') }; }), '— вне региона —');
    const body = '<div class="form-grid">' +
      imageField(l.image, { wide: true, label: 'Вид локации', hint: 'Горизонтальный пейзаж или карта. PNG, JPG или WebP.' }) +
      '<div class="form-section">Место на карте</div>' +
      inputField('name', 'Название', l.name, { required: true, placeholder: 'Долина Вереска' }) +
      selectField('type', 'Тип', l.type, types) +
      selectField('regionId', 'Регион', l.regionId, regions, { full: true, hint: 'Локация будет показана внутри выбранного региона. Регионы создаются в разделе «Регионы».' }) +
      textareaField('description', 'Описание', l.description, { cls: 'form-textarea-tall', placeholder: 'Как здесь пахнет, кто здесь живёт и что скрывают местные?' }) +
      inputField('tags', 'Метки', (l.tags || []).join(', '), { full: true, placeholder: 'долина, вереск, клинки' }) +
      timestampInline(location) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить локацию' : 'Новая локация',
      eyebrow: isEdit ? 'Земля' : 'Карта мира',
      subtitle: 'Место становится настоящим, когда у него есть запах, звук и тайна.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать локацию', location),
      formType: 'location', entityId: l.id || ''
    }), '#fld_name');
  };

  /* ---------- Faction form ---------- */
  MF.openFactionForm = function (id) {
    const isEdit = !!id;
    const faction = isEdit ? MF.getFaction(id) : null;
    if (isEdit && !faction) return;
    const f = faction || { name: '', type: 'Знатный род', status: 'Действует', leaderId: '', color: '#c5a15f', description: '', ideology: '', tags: [], emblem: '', regionId: '', locationId: '' };
    const types = MF.FACTION_TYPES.indexOf(f.type) === -1 && f.type ? [f.type].concat(MF.FACTION_TYPES) : MF.FACTION_TYPES;
    const leaders = selectOptionsFor(MF.state.data.characters.map(function (character) { return { value: character.id, label: character.name + (character.title ? ' · ' + character.title : '') }; }), '— без лидера —');
    const regions = selectOptionsFor(MF.state.data.regions.map(function (region) { return { value: region.id, label: region.name }; }), '— вне региона —');
    const locations = selectOptionsFor(MF.state.data.locations.map(function (location) { return { value: location.id, label: location.name + (MF.getRegion(location.regionId) ? ' · ' + MF.getRegion(location.regionId).name : '') }; }), '— вне локации —');
    const statuses = ['Действует', 'У власти', 'В тени', 'На границе', 'Распущена', 'Уничтожена'];
    if (statuses.indexOf(f.status) === -1 && f.status) statuses.unshift(f.status);
    const body = '<div class="form-grid">' +
      imageField(f.emblem, { label: 'Эмблема', hint: 'Герб или знак фракции. Если не выбрать файл, останется буквенный знак.' }) +
      '<div class="form-section">Сила мира</div>' +
      inputField('name', 'Название', f.name, { required: true, placeholder: 'Дом Вельд' }) +
      selectField('type', 'Тип', f.type, types) +
      selectField('status', 'Статус', f.status, statuses) +
      inputField('color', 'Цвет', f.color, { type: 'color', hint: 'Цвет используется в гербе и связях.' }) +
      selectField('regionId', 'Регион', f.regionId, regions, { hint: 'Где действует эта сила.' }) +
      selectField('locationId', 'Локация', f.locationId, locations, { hint: 'Необязательно. Штаб, храм или главный оплот.' }) +
      selectField('leaderId', 'Лидер', f.leaderId, leaders) +
      inputField('ideology', 'Кредо', f.ideology, { full: true, placeholder: 'Корона — это долг, а не подарок.' }) +
      textareaField('description', 'История и цели', f.description, { cls: 'form-textarea-tall', placeholder: 'Чего добивается эта сила и чего боится?' }) +
      inputField('tags', 'Метки', (f.tags || []).join(', '), { full: true, placeholder: 'орден, магия, север' }) +
      timestampInline(faction) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить фракцию' : 'Новая фракция',
      eyebrow: isEdit ? 'Сила мира' : 'Новая сила',
      subtitle: 'Дом, орден, ковен или братство. У каждой силы есть воля и цена.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать фракцию', faction),
      formType: 'faction', entityId: f.id || ''
    }), '#fld_name');
  };

  /* ---------- Region form ---------- */
  MF.openRegionForm = function (id) {
    const isEdit = !!id;
    const region = isEdit ? MF.getRegion(id) : null;
    if (isEdit && !region) return;
    const r = region || { name: '', type: 'Королевство', climate: '', description: '', tags: [], image: '' };
    const types = MF.REGION_TYPES.indexOf(r.type) === -1 && r.type ? [r.type].concat(MF.REGION_TYPES) : MF.REGION_TYPES;
    const body = '<div class="form-grid">' +
      imageField(r.image, { wide: true, label: 'Вид региона', hint: 'Пейзаж, карта или герб региона. PNG, JPG или WebP.' }) +
      '<div class="form-section">Земли и пределы</div>' +
      inputField('name', 'Название региона', r.name, { required: true, placeholder: 'Сердце Севера' }) +
      selectField('type', 'Тип', r.type, types) +
      inputField('climate', 'Климат и погода', r.climate, { full: true, placeholder: 'Суровые зимы, короткое ветреное лето' }) +
      textareaField('description', 'Описание', r.description, { cls: 'form-textarea-tall', placeholder: 'Какие земли входят в регион, чем он живёт и что здесь скрыто?' }) +
      inputField('tags', 'Метки', (r.tags || []).join(', '), { full: true, placeholder: 'фьорды, корона, север' }) +
      timestampInline(region) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить регион' : 'Новый регион',
      eyebrow: isEdit ? 'Земли и пределы' : 'Новый предел',
      subtitle: 'Регион объединяет локации и силы под одной землёй. Внутри него будет жить карта мира.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать регион', region),
      formType: 'region', entityId: r.id || ''
    }), '#fld_name');
  };

  /* ---------- Race form ---------- */
  MF.openRaceForm = function (id) {
    const isEdit = !!id;
    const race = isEdit ? MF.getRace(id) : null;
    if (isEdit && !race) return;
    const r = race || { name: '', type: 'Смертные', traits: '', description: '', tags: [], image: '' };
    const existingTypes = MF.state.data.races.map(function (race) { return race.type; }).filter(Boolean);
    const typeList = existingTypes.concat(MF.RACE_TYPES).filter(function (type, index, all) { return all.indexOf(type) === index; });
    const body = '<div class="form-grid">' +
      imageField(r.image, { label: 'Символ расы', hint: 'Герб, тотем или характерный образ народа. Необязательно.' }) +
      '<div class="form-section">Народ мира</div>' +
      inputField('name', 'Название расы', r.name, { required: true, placeholder: 'Дети Тумана' }) +
      '<div class="form-field"><label class="field-label" for="fld_type">Тип</label>' +
      '<input class="input" id="fld_type" name="type" list="raceTypeOptions" value="' + MF.esc(MF.t(r.type || 'Смертные')) + '" placeholder="' + MF.t('Выберите или введите свой тип') + '">' +
      '<datalist id="raceTypeOptions">' + typeList.map(function (type) { return '<option value="' + MF.esc(type) + '"></option>'; }).join('') + '</datalist>' +
      '<span class="field-hint">Можно выбрать готовый тип или написать собственный.</span></div>' +
      inputField('traits', 'Отличительные черты', r.traits, { full: true, placeholder: 'Сны · отражения · память' }) +
      textareaField('description', 'Описание', r.description, { cls: 'form-textarea-tall', placeholder: 'Происхождение, обычаи, отношение к другим народам…' }) +
      inputField('tags', 'Метки', (r.tags || []).join(', '), { full: true, placeholder: 'туман, ведуньи, отражения' }) +
      timestampInline(race) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить расу' : 'Новая раса',
      eyebrow: isEdit ? 'Народ мира' : 'Новый народ',
      subtitle: 'Раса задаёт происхождение героев и их место среди других народов.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать расу', race),
      formType: 'race', entityId: r.id || ''
    }), '#fld_name');
  };

  /* ---------- Lore form ---------- */
  MF.openLoreForm = function (id) {
    const isEdit = !!id;
    const article = isEdit ? MF.getEntity('lore', id) : null;
    if (isEdit && !article) return;
    const l = article || { title: '', category: 'История', sourceId: '', summary: '', content: '', tags: [], image: '' };
    const categories = MF.LORE_CATEGORIES.indexOf(l.category) === -1 && l.category ? [l.category].concat(MF.LORE_CATEGORIES) : MF.LORE_CATEGORIES;
    const sources = selectOptionsFor(MF.state.data.books.map(function (book) { return { value: book.id, label: book.title + (book.type ? ' · ' + book.type : '') }; }), '— без источника —');
    const body = '<div class="form-grid">' +
      imageField(l.image, { wide: true, label: 'Иллюстрация', hint: 'Символ, артефакт, древняя карта — всё, что поддерживает статью.' }) +
      '<div class="form-section">Статья</div>' +
      inputField('title', 'Заголовок', l.title, { required: true, placeholder: 'Договор Первого Огня' }) +
      selectField('category', 'Категория', l.category, categories) +
      selectField('sourceId', 'Источник', l.sourceId, sources, { full: true, hint: 'Книга, повесть или хроника, из которой взята статья. Источники ведутся в разделе «Библиотека».' }) +
      textareaField('summary', 'Краткое содержание', l.summary, { placeholder: 'О чём эта статья в двух-трёх предложениях?' }) +
      textareaField('content', 'Полный текст', l.content, { cls: 'form-textarea-xl', placeholder: 'Расскажите предание, опишите закон или устройство магии…' }) +
      inputField('tags', 'Метки', (l.tags || []).join(', '), { full: true, placeholder: 'древность, договор, пепел' }) +
      timestampInline(article) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить статью' : 'Новая статья лора',
      eyebrow: isEdit ? 'Знание мира' : 'Пополнить лор',
      subtitle: 'Мифы, законы и устройства мира. То, во что верят герои и что решает их судьбы.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать статью', article),
      formType: 'lore', entityId: l.id || ''
    }), '#fld_title');
  };

  /* ---------- Book / lore source form ---------- */
  MF.openBookForm = function (id) {
    const isEdit = !!id;
    const book = isEdit ? MF.getBook(id) : null;
    if (isEdit && !book) return;
    const b = book || { title: '', type: 'Книга', author: '', year: '', description: '', tags: [], cover: '', image: '' };
    const types = MF.BOOK_TYPES.indexOf(b.type) === -1 && b.type ? [b.type].concat(MF.BOOK_TYPES) : MF.BOOK_TYPES;
    const linked = isEdit ? MF.state.data.lore.filter(function (article) { return article.sourceId === b.id; }).length : 0;
    const body = '<div class="form-grid">' +
      imageField(b.cover || b.image, { wide: true, label: 'Обложка источника', hint: 'Обложка книги, карта или символическое изображение.' }) +
      '<div class="form-section">Источник знаний</div>' +
      inputField('title', 'Название источника', b.title, { required: true, placeholder: 'Хроники Первого Огня' }) +
      selectField('type', 'Тип', b.type, types) +
      inputField('author', 'Автор', b.author, { placeholder: 'Летописец Аэлин' }) +
      inputField('year', 'Год или эпоха', b.year, { placeholder: '1204 г. Т.Э.' }) +
      textareaField('description', 'Описание', b.description, { cls: 'form-textarea-tall', placeholder: 'О чём эта книга, повесть или хроника?' }) +
      inputField('tags', 'Метки', (b.tags || []).join(', '), { full: true, placeholder: 'летопись, древность, север' }) +
      (isEdit ? '<div class="form-inline-note span-full">' + MF.icon('i-book') + ' К источнику привязано статей: ' + linked + '. Связь задаётся в статье лора.</div>' : '') +
      timestampInline(book) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить источник' : 'Новый источник',
      eyebrow: isEdit ? 'Библиотека' : 'Пополнить библиотеку',
      subtitle: 'Книга, повесть или хроника, из которой в мир приходят знания.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать источник', book),
      formType: 'book', entityId: b.id || ''
    }), '#fld_title');
  };

  /* ---------- D&D character sheet ---------- */
  MF.openDndSheetForm = function (id) {
    const isEdit = !!id;
    const sheet = isEdit ? (MF.state.data.dndSheets || []).find(function (item) { return item.id === id; }) : null;
    if (isEdit && !sheet) return;
    const s = sheet || {
      name: '', edition: '5e', className: '', subclass: '', level: 1, species: '', background: '', alignment: '',
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, saves: [], skills: [],
      ac: 10, hpMax: 10, hpCurrent: 10, speed: 30, hitDice: 'd8', equipment: '', spells: '', features: '', notes: ''
    };
    const editions = MF.DND_EDITIONS.map(function (edition) { return { value: edition.id, label: MF.LANG === 'en' ? edition.labelEn : edition.label }; });
    const classes = selectOptionsFor(MF.DND_CLASSES.map(function (entry) { return { value: entry.name, label: MF.dndLabel(entry, 'name') + ' · ' + entry.hit + ' · ' + entry.primary }; }), '— выберите класс —');
    const backgrounds = selectOptionsFor(MF.DND_BACKGROUNDS.map(function (entry) { return { value: entry.name, label: MF.dndLabel(entry, 'name') }; }), '— без предыстории —');
    const saves = MF.DND_ABILITIES.map(function (ability) { return { id: ability.id, label: ability.short + ' · ' + MF.dndLabel(ability, 'label'), checked: (s.saves || []).indexOf(ability.id) !== -1 }; });
    const skills = MF.DND_SKILLS.map(function (skill) { return { id: skill.id, label: MF.dndLabel(skill, 'label') + ' (' + skill.ability.toUpperCase() + ')', checked: (s.skills || []).indexOf(skill.id) !== -1 }; });
    const abilityInputs = MF.DND_ABILITIES.map(function (ability) {
      const score = (s.abilities || {})[ability.id] || 10;
      return '<div class="dnd-ability-input"><label for="dnd_' + ability.id + '">' + MF.esc(MF.dndLabel(ability, 'label')) + '</label><input class="input" type="number" id="dnd_' + ability.id + '" name="' + ability.id + '" min="1" max="30" value="' + score + '"><small data-dnd-mod="' + ability.id + '">' + MF.dndModifier(score) + '</small></div>';
    }).join('');
    const body = '<div class="form-grid">' +
      '<div class="form-section">Лист персонажа</div>' +
      inputField('name', 'Имя персонажа', s.name, { required: true, placeholder: 'Например, Лира Вельд' }) +
      '<div class="form-field"><label class="field-label" for="fld_edition">Издание</label><select class="select" id="fld_edition" name="edition">' + editions.map(function (edition) { return '<option value="' + MF.esc(edition.value) + '"' + (s.edition === edition.value ? ' selected' : '') + '>' + MF.esc(edition.label) + '</option>'; }).join('') + '</select></div>' +
      selectField('className', 'Класс', s.className, classes) +
      inputField('subclass', 'Подкласс / архетип', s.subclass, { placeholder: 'Например, Школа Иллюзий' }) +
      inputField('level', 'Уровень', String(s.level || 1), { type: 'number' }) +
      inputField('species', 'Вид / раса', s.species, { placeholder: 'Например, Полуэльф' }) +
      selectField('background', 'Предыстория', s.background, backgrounds) +
      inputField('alignment', 'Мировоззрение', s.alignment, { placeholder: 'Нейтрально-добрый' }) +
      '<div class="form-section">Характеристики</div>' +
      '<div class="dnd-ability-grid span-full">' + abilityInputs + '</div>' +
      '<div class="form-field"><label class="field-label" for="fld_proficiency">Бонус владения</label><input class="input" id="fld_proficiency" name="proficiency" type="text" value="' + MF.esc(s.proficiency || '') + '" placeholder="' + MF.dndProficiency(s.level) + '"></div>' +
      inputField('ac', 'Класс брони (AC)', String(s.ac || 10), { type: 'number' }) +
      inputField('hpMax', 'Максимум хитов', String(s.hpMax || 10), { type: 'number' }) +
      inputField('hpCurrent', 'Текущие хиты', String(s.hpCurrent != null ? s.hpCurrent : 10), { type: 'number' }) +
      inputField('speed', 'Скорость', String(s.speed || 30), { type: 'number' }) +
      inputField('hitDice', 'Кости хитов', s.hitDice || 'd8', { placeholder: '1d8' }) +
      '<div class="form-section">Владения</div>' +
      '<div class="form-field span-full"><span class="field-label">Спасброски</span>' + checkboxGrid('saves', saves) + '</div>' +
      '<div class="form-field span-full"><span class="field-label">Навыки</span>' + checkboxGrid('skills', skills) + '</div>' +
      '<div class="form-section">Снаряжение и способности</div>' +
      textareaField('equipment', 'Снаряжение', s.equipment, { cls: 'form-textarea-tall', placeholder: 'Оружие, броня, зелья, инструменты…' }) +
      textareaField('spells', 'Заклинания', s.spells, { cls: 'form-textarea-tall', placeholder: 'Круг, школа, подготовленные заклинания…' }) +
      textareaField('features', 'Умения и особенности', s.features, { cls: 'form-textarea-tall', placeholder: 'Классовые умения, черты, особенности вида…' }) +
      textareaField('notes', 'Заметки', s.notes, { cls: 'form-textarea-tall', placeholder: 'Предыстория, цели, долги, секреты…' }) +
      timestampInline(sheet) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить лист D&D' : 'Новый лист D&D',
      eyebrow: MF.LANG === 'en' ? 'D&D character sheet' : 'Лист персонажа D&D',
      subtitle: MF.LANG === 'en' ? 'Ability scores, class, skills, equipment and notes for D&D 5e or D&D 2024.' : 'Характеристики, класс, навыки, снаряжение и заметки для D&D 5e или D&D 2024.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Сохранить лист', sheet),
      formType: 'dndSheet', entityId: s.id || ''
    }), '#fld_name');
    const overlay = document.querySelector('#modalRoot form[data-form-type=dndSheet]');
    if (!overlay) return;
    MF.DND_ABILITIES.forEach(function (ability) {
      const input = overlay.elements[ability.id];
      if (!input) return;
      input.addEventListener('input', function () {
        const small = overlay.querySelector('[data-dnd-mod="' + ability.id + '"]');
        if (small) small.textContent = MF.dndModifier(input.value);
      });
    });
  };

  /* ---------- Catalog forms ---------- */
  MF.openCatalogItemForm = function (catalogId, id) {
    const catalog = MF.catalogMeta(catalogId);
    if (!catalog) return;
    const isEdit = !!id;
    const existing = isEdit ? MF.state.data.catalogItems.find(function (item) { return item.id === id; }) : null;
    if (isEdit && !existing) return;
    const item = existing || { name: '', type: '', description: '', tags: [], image: '' };
    const body = '<div class="form-grid">' +
      imageField(item.image, { wide: true, label: 'Изображение', hint: 'Необязательно. Оружие, транспорт, устройство или символ.' }) +
      '<div class="form-section">' + MF.esc(MF.catalogName(catalog)) + '</div>' +
      '<input type="hidden" name="catalogId" value="' + MF.esc(catalog.id) + '">' +
      inputField('name', 'Название', item.name, { required: true, placeholder: 'Например, «Северный клинок»' }) +
      inputField('type', 'Тип', item.type, { placeholder: 'Клинок, внедорожник, ритуал…' }) +
      textareaField('description', 'Описание', item.description, { cls: 'form-textarea-tall', placeholder: 'Как это выглядит, работает и чем важно для мира?' }) +
      inputField('tags', 'Метки', (item.tags || []).join(', '), { full: true, placeholder: 'редкое, север, наследие' }) +
      timestampInline(existing) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить запись' : 'Новая запись',
      eyebrow: MF.catalogName(catalog),
      subtitle: 'Запись раздела мира. Её можно связать с персонажами и событиями через метки и описание.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать запись', existing),
      formType: 'catalogItem', entityId: item.id || ''
    }), '#fld_name');
  };

  MF.openCatalogForm = function (catalogId) {
    const catalog = MF.catalogMeta(catalogId);
    if (!catalog) return;
    const icons = ['i-shield', 'i-scroll', 'i-map', 'i-compass', 'i-settings', 'i-sparkles', 'i-banner', 'i-crown', 'i-race', 'i-heart', 'i-hourglass', 'i-users', 'i-book', 'i-feather'];
    const body = '<div class="form-grid">' +
      '<div class="form-section">Раздел меню</div>' +
      inputField('name', 'Название раздела', MF.catalogName(catalog), { required: true, placeholder: 'Оружие' }) +
      '<div class="form-field"><label class="field-label" for="catalogIcon">Иконка</label><div class="catalog-icon-choices">' + icons.map(function (icon) {
        return '<label class="catalog-icon-choice"><input type="radio" name="icon" value="' + MF.esc(icon) + '"' + (catalog.icon === icon ? ' checked' : '') + '><span>' + MF.icon(icon) + '</span></label>';
      }).join('') + '</div></div>' +
      textareaField('description', 'Описание', MF.LANG === 'en' ? (catalog.descriptionEn || catalog.description) : (catalog.description || catalog.descriptionEn), { placeholder: 'Что хранится в этом разделе?' }) +
      '<div class="form-inline-note span-full">' + MF.icon('i-info') + ' Название и иконка обновятся в левом меню. Сам раздел можно скрыть в настройках меню.</div></div>';
    appendOverlay(modalShell({
      title: 'Настроить раздел', eyebrow: 'Левое меню', subtitle: 'Название, иконка и короткое описание этого раздела.',
      size: 'medium', body: body, footer: formFooter(true, 'Сохранить раздел'),
      formType: 'catalog', entityId: catalog.id
    }), '#fld_name');
  };

  MF.openMapMarkerForm = function (id) {
    const map = MF.state.data.map;
    const marker = id ? map.markers.find(function (item) { return item.id === id; }) : null;
    const locations = MF.state.data.locations.map(function (location) { return { value: location.id, label: location.name + (location.region ? ' · ' + location.region : '') }; });
    const icons = ['i-pin', 'i-map', 'i-banner', 'i-shield', 'i-crown', 'i-sparkles', 'i-race', 'i-heart', 'i-hourglass', 'i-scroll'];
    const body = '<div class="form-grid">' +
      '<div class="form-field span-full"><label class="field-label" for="mapMarkerName">Название метки</label><input class="input" id="mapMarkerName" maxlength="60" value="' + MF.esc(marker ? marker.name : '') + '" placeholder="Например, Хеймдаль"></div>' +
      '<div class="form-field span-full"><label class="field-label" for="mapMarkerLocation">Локация</label><select class="select" id="mapMarkerLocation"><option value="">— без локации —</option>' + locations.map(function (location) {
        return '<option value="' + MF.esc(location.value) + '"' + (marker && marker.locationId === location.value ? ' selected' : '') + '>' + MF.esc(location.label) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="form-field"><label class="field-label">Иконка</label><div class="catalog-icon-choices">' + icons.map(function (icon, index) {
        return '<label class="catalog-icon-choice"><input type="radio" name="mapIcon" value="' + MF.esc(icon) + '"' + ((marker ? marker.icon === icon : index === 0) ? ' checked' : '') + '><span>' + MF.icon(icon) + '</span></label>';
      }).join('') + '</div></div>' +
      '<div class="form-field"><label class="field-label" for="mapMarkerColor">Цвет</label><input type="color" class="input" id="mapMarkerColor" value="' + MF.esc(marker ? marker.color : '#c5a15f') + '"></div></div>';
    const overlay = appendOverlay(modalShell({
      title: marker ? 'Изменить метку' : 'Новая метка', eyebrow: 'Карта мира', subtitle: 'Метка появится в центре карты. Перетащите её в нужное место.',
      size: 'medium', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button><button class="btn btn-primary" id="saveMapMarker">' + MF.icon('i-check') + 'Сохранить метку</button>'
    }), '#mapMarkerName');
    if (!overlay) return;
    overlay.querySelector('#saveMapMarker').addEventListener('click', function () {
      const name = String(overlay.querySelector('#mapMarkerName').value || '').trim();
      const locationId = overlay.querySelector('#mapMarkerLocation').value;
      if (!name && !locationId) { overlay.querySelector('#mapMarkerName').focus(); return; }
      const location = locationId ? MF.getLocation(locationId) : null;
      const iconEl = overlay.querySelector('input[name="mapIcon"]:checked');
      const target = marker || { id: MF.uid('mk'), x: 600 + (Math.random() * 80 - 40), y: 360 + (Math.random() * 60 - 30) };
      target.name = name || (location && location.name) || 'Метка';
      target.locationId = locationId;
      target.icon = iconEl ? iconEl.value : 'i-pin';
      target.color = overlay.querySelector('#mapMarkerColor').value || '#c5a15f';
      if (!marker) map.markers.push(target);
      map.updatedAt = MF.nowISO();
      MF.closeAllOverlays();
      MF.saveNow().then(function () { MF.renderCurrentPage({ keepScroll: true }); });
      MF.toast(marker ? 'Метка обновлена' : 'Метка добавлена', 'Перетащите её по карте.', 'success');
    });
  };

  MF.openMapLabelForm = function (id) {
    const map = MF.state.data.map;
    const label = id ? map.labels.find(function (item) { return item.id === id; }) : null;
    const body = '<div class="form-grid">' +
      '<div class="form-field span-full"><label class="field-label" for="mapLabelText">Текст подписи</label><input class="input" id="mapLabelText" maxlength="120" value="' + MF.esc(label ? label.text : '') + '" placeholder="Например, Северные земли"></div>' +
      '<div class="form-field"><label class="field-label" for="mapLabelColor">Цвет</label><input type="color" class="input" id="mapLabelColor" value="' + MF.esc(label ? label.color : '#c5a15f') + '"></div>' +
      '<div class="form-field"><label class="field-label" for="mapLabelSize">Размер</label><input class="input" id="mapLabelSize" type="number" min="9" max="36" value="' + (label ? label.size : 14) + '"></div></div>';
    const overlay = appendOverlay(modalShell({
      title: label ? 'Изменить подпись' : 'Новая подпись', eyebrow: 'Карта мира', subtitle: 'Подпись помогает назвать море, лес или землю.',
      size: 'medium', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button><button class="btn btn-primary" id="saveMapLabel">' + MF.icon('i-check') + 'Сохранить подпись</button>'
    }), '#mapLabelText');
    if (!overlay) return;
    overlay.querySelector('#saveMapLabel').addEventListener('click', function () {
      const text = String(overlay.querySelector('#mapLabelText').value || '').trim();
      if (!text) { overlay.querySelector('#mapLabelText').focus(); return; }
      const target = label || { id: MF.uid('ml'), x: 600, y: 360 };
      target.text = text;
      target.color = overlay.querySelector('#mapLabelColor').value || '#c5a15f';
      target.size = MF.clamp(Number(overlay.querySelector('#mapLabelSize').value) || 14, 9, 36);
      if (!label) map.labels.push(target);
      map.updatedAt = MF.nowISO();
      MF.closeAllOverlays();
      MF.saveNow().then(function () { MF.renderCurrentPage({ keepScroll: true }); });
    });
  };

  MF.autoPlaceMapLocations = function () {
    const map = MF.state.data.map;
    const used = map.markers.map(function (marker) { return marker.locationId; }).filter(Boolean);
    const missing = MF.state.data.locations.filter(function (location) { return used.indexOf(location.id) === -1; });
    if (!missing.length) { MF.toast('Все локации уже на карте', 'Добавьте новые метки вручную.', 'info'); return; }
    const columns = Math.ceil(Math.sqrt(missing.length));
    missing.forEach(function (location, index) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      map.markers.push({
        id: MF.uid('mk'), locationId: location.id, name: location.name,
        x: 250 + col * (700 / Math.max(1, columns - 1 || 1)),
        y: 190 + row * 110, icon: 'i-pin', color: '#c5a15f'
      });
    });
    map.updatedAt = MF.nowISO();
    MF.saveNow().then(function () { MF.renderCurrentPage({ keepScroll: true }); });
    MF.toast('Локации на карте', 'Добавлено меток: ' + missing.length + '.', 'success');
  };

  MF.uploadMapImage = async function () {
    if (!MF.isNative) { MF.toast('Только в приложении', 'Загрузка карты доступна в настольной версии.', 'info'); return; }
    try {
      const result = await MF.invoke('pickImage', { kind: 'map' }, { timeoutMs: 300000 });
      if (!result || !result.url) return;
      MF.state.data.map.image = result.url;
      MF.state.data.map.updatedAt = MF.nowISO();
      await MF.saveNow();
      MF.renderCurrentPage({ keepScroll: true });
      MF.toast('Карта обновлена', 'Фон карты загружен.', 'success');
    } catch (error) {
      MF.toast('Не удалось загрузить карту', error.message || 'Проверьте изображение.', 'error');
    }
  };

  MF.openNavItemForm = function () {
    const icons = ['i-shield', 'i-scroll', 'i-map', 'i-compass', 'i-settings', 'i-sparkles', 'i-banner', 'i-crown', 'i-race', 'i-heart', 'i-hourglass', 'i-users', 'i-book', 'i-feather'];
    const body = '<div class="form-grid">' +
      '<div class="form-field span-full"><label class="field-label" for="navItemName">Название пункта <span class="req">✦</span></label><input class="input" id="navItemName" maxlength="40" placeholder="Оружие, транспорт, технологии…"></div>' +
      '<div class="form-field"><label class="field-label" for="navItemGroup">Раздел меню</label><select class="select" id="navItemGroup">' + MF.NAV_GROUPS.map(function (group) { return '<option value="' + MF.esc(group.id) + '">' + MF.esc(MF.t(group.label)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-field"><label class="field-label">Иконка</label><div class="catalog-icon-choices">' + icons.map(function (icon, index) {
        return '<label class="catalog-icon-choice"><input type="radio" name="navIcon" value="' + MF.esc(icon) + '"' + (index === 0 ? ' checked' : '') + '><span>' + MF.icon(icon) + '</span></label>';
      }).join('') + '</div></div>' +
      '<div class="form-inline-note span-full">' + MF.icon('i-info') + ' Для пункта будет создан новый раздел мира. Записи можно добавлять сразу после создания.</div></div>';
    const overlay = appendOverlay(modalShell({
      title: 'Новый пункт меню', eyebrow: 'Левое меню', subtitle: 'Создайте собственный раздел, например «Оружие» или «Транспорт».',
      size: 'medium', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button><button class="btn btn-primary" id="createNavItem">' + MF.icon('i-plus') + 'Создать пункт</button>'
    }), '#navItemName');
    if (!overlay) return;
    overlay.querySelector('#createNavItem').addEventListener('click', function () {
      const name = String(overlay.querySelector('#navItemName').value || '').trim();
      if (!name) { overlay.querySelector('#navItemName').focus(); return; }
      const group = overlay.querySelector('#navItemGroup').value;
      const iconEl = overlay.querySelector('input[name="navIcon"]:checked');
      const icon = iconEl ? iconEl.value : 'i-scroll';
      MF.closeTopOverlay();
      MF.createNavExtra(name, group, icon);
      MF.toast('Пункт меню добавлен', 'Раздел «' + name + '» готов к записям.', 'success');
    });
  };

  MF.openCatalogItemSheet = function (id, catalogId) {
    const item = MF.state.data.catalogItems.find(function (entry) { return entry.id === id; });
    const catalog = MF.catalogMeta(catalogId || (item && item.catalogId));
    if (!item || !catalog) return;
    MF.closeAllOverlays();
    const hero = '<div class="drawer-hero' + (item.image ? '' : ' drawer-hero--plain') + '"' +
      (item.image ? ' style="background-image:url(&quot;' + MF.esc(item.image) + '&quot;)"' : ' style="background:radial-gradient(ellipse at 75% 15%,rgba(197,161,95,.16),transparent 45%),linear-gradient(145deg,#1c242a,#0d1217)"') + '>' +
      '<div class="drawer-hero-shade"></div>' + heroClose() +
      '<div class="drawer-hero-content"><div class="detail-eyebrow"><span>' + MF.esc(MF.catalogName(catalog)) + '</span><span>·</span><span>' + MF.esc(item.type || '—') + '</span></div>' +
      '<h2 class="detail-title">' + MF.esc(item.name) + '</h2></div></div>';
    let content = '<div class="drawer-section"><h3>Описание</h3><p>' + MF.esc(item.description || 'Описание пока не добавлено.') + '</p></div>';
    content += '<div class="drawer-section"><h3>Сведения</h3>' + facts([fact('Тип', MF.esc(item.type || '—')), fact('Раздел', MF.esc(MF.catalogName(catalog)))]) + '</div>';
    content += tagSection(item.tags);
    content += recordDates(item);
    const footer = '<span style="color:var(--muted-2);font-size:9px">' + MF.icon(catalog.icon || 'i-scroll') + ' ' + MF.esc(MF.catalogName(catalog)) + '</span>' +
      '<div class="footer-actions"><button class="btn btn-danger btn-sm" data-action="delete-catalog-item" data-id="' + MF.esc(item.id) + '" data-catalog-id="' + MF.esc(catalog.id) + '">' + MF.icon('i-trash') + 'Удалить</button>' +
      '<button class="btn btn-primary btn-sm" data-action="edit-catalog-item" data-id="' + MF.esc(item.id) + '" data-catalog-id="' + MF.esc(catalog.id) + '">' + MF.icon('i-edit') + 'Изменить</button></div>';
    appendOverlay(drawerShell(item.name, MF.catalogName(catalog), hero, content, footer), '.drawer-close');
  };

  /* ---------- Event form ---------- */
  MF.openEventForm = function (id) {
    const isEdit = !!id;
    const event = isEdit ? MF.getEntity('event', id) : null;
    if (isEdit && !event) return;
    const e = event || { title: '', dateText: '', sortYear: '', era: '', type: 'politics', locationId: '', participantIds: [], description: '', image: '' };
    const types = Object.keys(MF.EVENT_TYPES).map(function (key) { return { value: key, label: MF.EVENT_TYPES[key].label }; });
    const locations = selectOptionsFor(MF.state.data.locations.map(function (location) { return { value: location.id, label: location.name }; }), '— без локации —');
    const participants = MF.state.data.characters.map(function (character) {
      return { id: character.id, label: character.name + (character.title ? ' · ' + character.title : ''), checked: (e.participantIds || []).indexOf(character.id) !== -1 };
    });
    const body = '<div class="form-grid">' +
      imageField(e.image, { wide: true, label: 'Иллюстрация события', hint: 'Необязательно. Сцена битвы, ритуала или открытия.' }) +
      '<div class="form-section">Событие</div>' +
      inputField('title', 'Название', e.title, { required: true, placeholder: 'Битва у Ледяного леса' }) +
      selectField('type', 'Тип', e.type, types) +
      inputField('dateText', 'Дата в мире', e.dateText, { placeholder: '1204 г. Т.Э.' }) +
      inputField('sortYear', 'Год для сортировки', e.sortYear, { type: 'number', placeholder: '1204', hint: 'Число, по которому события выстраиваются в хронологию.' }) +
      inputField('era', 'Эпоха', e.era, { placeholder: 'Третья эра' }) +
      selectField('locationId', 'Локация', e.locationId, locations) +
      textareaField('description', 'Описание', e.description, { cls: 'form-textarea-tall', placeholder: 'Что произошло, кто был там и что изменилось после?' }) +
      '<div class="form-field span-full"><span class="field-label">Участники</span>' + checkboxGrid('participantIds', participants) + '</div>' +
      timestampInline(event) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить событие' : 'Новое событие',
      eyebrow: isEdit ? 'Хроника' : 'Отметить в веках',
      subtitle: 'Событие связывает время, место и судьбы. Оно станет частью хронологии.',
      size: 'wide', body: body, footer: formFooter(isEdit, 'Создать событие', event),
      formType: 'event', entityId: e.id || ''
    }), '#fld_title');
  };

  /* ---------- Note form ---------- */
  MF.openNoteForm = function (id) {
    const isEdit = !!id;
    const note = isEdit ? MF.getEntity('note', id) : null;
    if (isEdit && !note) return;
    const n = note || { title: '', content: '', color: 'gold', pinned: false };
    const color = MF.NOTE_COLORS.some(function (entry) { return entry.id === n.color; }) ? n.color : 'gold';
    const body = '<div class="form-grid">' +
      inputField('title', 'Заголовок', n.title, { required: true, full: true, placeholder: 'Сцена, идея, вопрос…' }) +
      '<div class="form-field span-full"><span class="field-label">Цвет заметки</span><div class="note-color-options">' +
      MF.NOTE_COLORS.map(function (entry) {
        return '<button type="button" class="color-choice color-choice--' + entry.id + (entry.id === color ? ' active' : '') + '" data-pick-color="' + entry.id + '" title="' + MF.esc(entry.label) + '" aria-label="' + MF.esc(entry.label) + '"></button>';
      }).join('') + '</div><input type="hidden" name="color" id="noteColorValue" value="' + MF.esc(color) + '"></div>' +
      '<div class="form-field span-full"><label class="toggle-line"><span class="toggle-line-copy"><strong>Закрепить на доске</strong><span>Важная заметка поднимется в начало списка.</span></span>' +
      '<span class="switch"><input type="checkbox" name="pinned"' + (n.pinned ? ' checked' : '') + '><span class="switch-track"></span></span></label></div>' +
      textareaField('content', 'Текст заметки', n.content, { cls: 'form-textarea-xl', placeholder: 'Пишите свободно. Для абзацев используйте переносы строк.' }) +
      timestampInline(note) + '</div>';
    appendOverlay(modalShell({
      title: isEdit ? 'Изменить заметку' : 'Новая заметка',
      eyebrow: isEdit ? 'Мастерская' : 'Записать мысль',
      subtitle: 'Черновики и догадки тоже часть мира. Их не обязательно делать каноном.',
      size: 'medium', body: body, footer: formFooter(isEdit, 'Создать заметку', note),
      formType: 'note', entityId: n.id || ''
    }), '#fld_title');
  };

  /* ---------- World form ---------- */
  MF.openWorldForm = function () {
    MF.closeAllOverlays();
    const world = MF.state.data.world;
    const body = '<div class="form-grid">' +
      imageField(world.cover, { wide: true, label: 'Обложка мира', hint: 'Широкое изображение для верхней панели обзора.' }) +
      '<div class="form-section">Лицо мира</div>' +
      inputField('name', 'Название мира', world.name, { required: true, placeholder: 'Вереск и Пепел' }) +
      inputField('genre', 'Жанр', world.genre, { placeholder: 'Тёмное фэнтези' }) +
      inputField('era', 'Эпоха', world.era, { placeholder: 'Третья эра' }) +
      inputField('currentYear', 'Текущий год', world.currentYear, { placeholder: '1212 год Т.Э.' }) +
      inputField('tagline', 'Девиз или подзаголовок', world.tagline, { full: true, placeholder: 'Одна строка, задающая настроение' }) +
      textareaField('description', 'Описание мира', world.description, { cls: 'form-textarea-xl', placeholder: 'Каким воздухом дышит этот мир? Что здесь важно знать каждому?' }) +
      '<div class="form-inline-note">' + MF.icon('i-clock') + ' Создан ' + MF.esc(MF.formatDateFull(world.createdAt)) + '. Обновлён ' + MF.esc(MF.formatDateFull(world.updatedAt)) + '.</div></div>';
    appendOverlay(modalShell({
      title: 'Описать мир',
      eyebrow: 'Профиль мира',
      subtitle: 'Имя, эпоха и обещание истории — с этого начинается летопись.',
      size: 'wide', body: body, footer: formFooter(true, 'Сохранить мир'),
      formType: 'world', entityId: ''
    }), '#fld_name');
  };

  /* ---------- Image handling ---------- */
  function setFormImage(form, url) {
    const hidden = form.querySelector('.js-image-value');
    const preview = form.querySelector('#formImagePreview');
    const remove = form.querySelector('#formImageRemove');
    if (hidden) hidden.value = url || '';
    if (preview) {
      const has = !!url;
      preview.classList.toggle('has-image', has);
      if (has) {
        preview.style.backgroundImage = 'url("' + String(url).replace(/"/g, '%22').replace(/\\/g, '%5C') + '")';
        preview.innerHTML = '';
      } else {
        preview.style.backgroundImage = '';
        preview.innerHTML = MF.icon('i-image');
      }
    }
    if (remove) remove.classList.toggle('is-hidden', !url);
  }

  function galleryValues(form) {
    const input = form ? form.querySelector('.js-gallery-value') : null;
    if (!input) return [];
    try {
      const value = JSON.parse(input.value || '[]');
      return Array.isArray(value) ? value.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function renderGalleryThumbs(form) {
    const box = form ? form.querySelector('#formGalleryThumbs') : null;
    if (!box) return;
    const list = galleryValues(form);
    box.innerHTML = list.length ? list.map(function (url, index) {
      return '<div class="gallery-thumb">' +
        '<button type="button" class="gallery-thumb-view" data-action="view-image" data-url="' + MF.esc(url) + '" aria-label="Открыть рисунок ' + (index + 1) + '"><img src="' + MF.esc(url) + '" alt="Рисунок ' + (index + 1) + '" loading="lazy"></button>' +
        '<button type="button" class="gallery-thumb-remove" data-action="remove-gallery" data-index="' + index + '" aria-label="Удалить рисунок">' + MF.icon('i-x') + '</button>' +
        '</div>';
    }).join('') : '<div class="gallery-empty">' + MF.icon('i-gallery') + '<span>Дополнительных рисунков пока нет.</span></div>';
  }

  function setGalleryValues(form, list) {
    const input = form ? form.querySelector('.js-gallery-value') : null;
    if (!input) return;
    input.value = JSON.stringify((list || []).filter(Boolean).slice(0, 24));
    renderGalleryThumbs(form);
  }

  MF.pickGalleryFor = async function (form) {
    if (!form) return;
    const kind = form.getAttribute('data-form-type') || 'image';
    if (MF.isNative) {
      try {
        const result = await MF.invoke('pickImages', { kind: kind }, { timeoutMs: 300000 });
        const items = Array.isArray(result) ? result : (result && Array.isArray(result.images) ? result.images : []);
        const urls = items.map(function (item) { return typeof item === 'string' ? item : item && item.url; }).filter(Boolean);
        if (!urls.length) return;
        setGalleryValues(form, galleryValues(form).concat(urls));
        MF.toast('Рисунки добавлены', urls.length + ' ' + MF.plural(urls.length, 'файл', 'файла', 'файлов') + ' сохранено рядом с летописью.', 'success');
      } catch (error) {
        MF.toast('Не удалось добавить рисунки', error.message || 'Проверьте файлы и попробуйте снова.', 'error');
      }
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async function () {
      const files = Array.prototype.slice.call(input.files || []);
      document.body.removeChild(input);
      if (!files.length) return;
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        if (!/^image\//.test(files[i].type)) continue;
        try { urls.push(await fileToCompactDataUrl(files[i])); } catch (e) {}
      }
      if (!urls.length) return;
      setGalleryValues(form, galleryValues(form).concat(urls));
      MF.toast('Рисунки добавлены', files.length + ' ' + MF.plural(files.length, 'файл', 'файла', 'файлов') + ' обработано.', 'success');
    });
    input.click();
  };

  function lightboxMarkup() {
    const state = MF.state.lightbox || { urls: [], index: 0 };
    const urls = state.urls || [];
    const url = urls[state.index] || '';
    const many = urls.length > 1;
    return '<div class="overlay overlay--lightbox" data-overlay data-lightbox><div class="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения">' +
      '<button class="icon-btn lightbox-close" data-action="close-lightbox" aria-label="Закрыть">' + MF.icon('i-x') + '</button>' +
      (many ? '<button class="icon-btn lightbox-nav lightbox-nav--prev" data-action="lightbox-prev" aria-label="Предыдущий рисунок">' + MF.icon('i-chevron-left') + '</button>' : '') +
      (many ? '<button class="icon-btn lightbox-nav lightbox-nav--next" data-action="lightbox-next" aria-label="Следующий рисунок">' + MF.icon('i-chevron-right') + '</button>' : '') +
      '<figure class="lightbox-figure"><img class="lightbox-img" src="' + MF.esc(url) + '" alt="Просмотр изображения">' +
      '<figcaption class="lightbox-caption">' + (many ? (state.index + 1) + (MF.LANG === 'en' ? ' of ' : ' из ') + urls.length : 'Портрет и рисунки героя') + '</figcaption></figure></div></div>';
  }

  function refreshLightbox() {
    const overlay = MF.$('[data-lightbox]');
    if (!overlay) return;
    const state = MF.state.lightbox || { urls: [], index: 0 };
    const urls = state.urls || [];
    const url = urls[state.index] || '';
    const img = overlay.querySelector('.lightbox-img');
    if (img) img.src = url;
    const caption = overlay.querySelector('.lightbox-caption');
    if (caption) caption.textContent = urls.length > 1 ? (state.index + 1) + (MF.LANG === 'en' ? ' of ' : ' из ') + urls.length : 'Портрет и рисунки героя';
  }

  MF.openLightbox = function (url, urls) {
    if (!url) return;
    const list = Array.isArray(urls) && urls.length ? urls.filter(Boolean) : [url];
    const index = Math.max(0, list.indexOf(url));
    MF.state.lightbox = { urls: list, index: index };
    appendOverlay(lightboxMarkup(), '.lightbox-close');
  };

  MF.stepLightbox = function (delta) {
    const state = MF.state.lightbox;
    if (!state || !state.urls || !state.urls.length) return;
    state.index = (state.index + delta + state.urls.length) % state.urls.length;
    refreshLightbox();
  };

  function fileToCompactDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const raw = String(reader.result || '');
        if (raw.length < 1300000) { resolve(raw); return; }
        const image = new Image();
        image.onload = function () {
          const max = 1500;
          const scale = Math.min(1, max / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.88));
        };
        image.onerror = function () { resolve(raw); };
        image.src = raw;
      };
      reader.onerror = function () { reject(new Error('Не удалось прочитать файл.')); };
      reader.readAsDataURL(file);
    });
  }

  MF.pickImageFor = async function (form) {
    if (!form) return;
    if (MF.isNative) {
      try {
        const result = await MF.invoke('pickImage', { kind: form.getAttribute('data-form-type') || 'image' }, { timeoutMs: 300000 });
        if (result && result.url) {
          setFormImage(form, result.url);
          MF.toast('Изображение добавлено', result.name || 'Файл сохранён рядом с летописью.', 'success');
        }
      } catch (error) {
        MF.toast('Не удалось добавить изображение', error.message || 'Проверьте файл и попробуйте снова.', 'error');
      }
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async function () {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        MF.toast('Это не изображение', 'Выберите PNG, JPG или WebP.', 'error');
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        MF.toast('Файл слишком большой', 'Выберите изображение до 12 МБ.', 'error');
        return;
      }
      try {
        const dataUrl = await fileToCompactDataUrl(file);
        setFormImage(form, dataUrl);
        MF.toast('Изображение добавлено', file.name, 'success');
      } catch (error) {
        MF.toast('Не удалось прочитать изображение', error.message, 'error');
      }
    });
    input.click();
  };

  /* ---------- Confirm dialogs ---------- */
  MF.openConfirm = function (options) {
    const opts = options || {};
    const overlay = appendOverlay('<div class="overlay" data-overlay><div class="modal modal--small" role="dialog" aria-modal="true">' +
      '<div class="confirm-body"><div class="confirm-icon">' + MF.icon(opts.icon || 'i-alert') + '</div>' +
      '<h2 class="confirm-title">' + MF.esc(opts.title || 'Вы уверены?') + '</h2>' +
      '<p class="confirm-text">' + (opts.html || MF.esc(opts.text || 'Это действие нельзя отменить.')) + '</p></div>' +
      '<div class="confirm-actions"><button type="button" class="btn btn-ghost confirm-cancel">Отмена</button>' +
      '<button type="button" class="btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger') + ' confirm-yes">' + MF.esc(opts.confirmLabel || 'Удалить') + '</button></div></div></div>', '.confirm-cancel');
    if (!overlay) return;
    overlay.querySelector('.confirm-cancel').addEventListener('click', MF.closeTopOverlay);
    overlay.querySelector('.confirm-yes').addEventListener('click', async function (event) {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        if (opts.onConfirm) await opts.onConfirm();
        MF.closeTopOverlay();
      } catch (error) {
        button.disabled = false;
        MF.toast('Не удалось выполнить действие', error.message || 'Попробуйте снова.', 'error');
      }
    });
  };

  MF.openStartClean = function () {
    const overlay = appendOverlay('<div class="overlay" data-overlay><div class="modal modal--small" role="dialog" aria-modal="true">' +
      '<div class="confirm-body" style="text-align:left;padding-bottom:8px"><div class="confirm-icon" style="margin:0 0 14px;color:var(--gold);border-color:rgba(197,161,95,.3);background:rgba(197,161,95,.07)">' + MF.icon('i-sparkles') + '</div>' +
      '<h2 class="confirm-title">Создать свой мир</h2>' +
      '<p class="confirm-text" style="margin-left:0;margin-right:0">Демонстрационная летопись будет заменена пустым миром. Если хотите сохранить её, сначала сделайте резервную копию в настройках.</p>' +
      '<ul class="start-clean-list" style="margin-top:14px"><li>Все персонажи, локации и события будут удалены.</li><li>Изображения останутся в папке данных.</li><li>Тему и настройки приложения это не затронет.</li></ul>' +
      '<div class="form-field"><label class="field-label" for="cleanWorldName">Название нового мира <span class="req">✦</span></label>' +
      '<input class="input" id="cleanWorldName" value="' + MF.esc(MF.state.data.world.isDemo ? MF.t('Мой мир') : MF.state.data.world.name) + '" maxlength="80"></div></div>' +
      '<div class="confirm-actions" style="justify-content:flex-end;padding-top:8px"><button type="button" class="btn btn-ghost" data-clean-cancel>Отмена</button>' +
      '<button type="button" class="btn btn-primary" data-clean-create>Начать летопись</button></div></div></div>', '#cleanWorldName');
    if (!overlay) return;
    overlay.querySelector('[data-clean-cancel]').addEventListener('click', MF.closeTopOverlay);
    overlay.querySelector('[data-clean-create]').addEventListener('click', async function (event) {
      const button = event.currentTarget;
      const input = overlay.querySelector('#cleanWorldName');
      const name = String(input.value || '').trim();
      if (!name) { input.focus(); MF.toast('Назовите мир', 'У нового мира должно быть имя.', 'error'); return; }
      button.disabled = true;
      try {
        MF.state.data = MF.normalizeData(MF.createBlankData(name));
        MF.state.tree.userAdjusted = false;
        MF.state.tree.layoutKey = '';
        MF.state.ui.charSearch = '';
        MF.state.ui.locSearch = '';
        MF.state.ui.notesSearch = '';
        MF.closeAllOverlays();
        await MF.saveNow();
        if (MF.applyNavConfig) MF.applyNavConfig();
        MF.refreshNavCounts();
        MF.navigate('dashboard');
        MF.toast('Новый мир создан', '«' + name + '» ждёт первой записи · ' + nowLabel(), 'success');
      } catch (error) {
        button.disabled = false;
        MF.toast('Не удалось создать мир', error.message || 'Проверьте папку данных.', 'error');
      }
    });
  };

  /* ---------- Save forms ---------- */
  function valueOf(form, name) {
    const field = form.elements[name];
    if (!field) return '';
    if (typeof field.value === 'string') return field.value.trim();
    return '';
  }
  function checkedValues(form, name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) { return input.value; });
  }
  function tagValues(form) {
    const raw = valueOf(form, 'tags');
    return raw.split(',').map(function (tag) { return tag.trim(); }).filter(Boolean).filter(function (tag, index, all) { return all.indexOf(tag) === index; });
  }

  function markActivity(entityType, kind, entityId, title) {
    MF.addActivity(kind, entityType, entityId, MF.activityTitle(entityType, kind, title));
  }

  async function saveEntityForm(form) {
    const type = form.getAttribute('data-form-type');
    const id = form.getAttribute('data-entity-id');
    const isEdit = !!id;
    const now = MF.nowISO();
    const data = MF.state.data;
    const world = data.world;
    let page = null;
    let displayName = '';

    if (type === 'character') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Имя обязательно', 'Назовите героя, чтобы сохранить запись.', 'error'); return false; }
      const existing = isEdit ? MF.getCharacter(id) : null;
      if (isEdit && !existing) return false;
      const fatherId = valueOf(form, 'fatherId');
      const motherId = valueOf(form, 'motherId');
      if (isEdit && (fatherId === id || motherId === id)) { MF.toast('Нельзя быть своим предком', 'Выберите другого персонажа.', 'error'); return false; }
      if (isEdit) {
        const descendants = descendantIds(id);
        if (descendants.indexOf(fatherId) !== -1 || descendants.indexOf(motherId) !== -1) {
          MF.toast('Нарушена линия рода', 'Потомок не может быть родителем этого персонажа.', 'error');
          return false;
        }
      }
      const entity = existing || {
        id: MF.uid('ch'), createdAt: now, spouseIds: [], tags: [], portrait: '', gallery: [], palette: [], audio: []
      };
      entity.name = name;
      if (form.elements.title) entity.title = valueOf(form, 'title');
      else entity.title = entity.title || '';
      if (form.elements.role) entity.role = valueOf(form, 'role');
      else entity.role = entity.role || '';
      if (form.elements.raceId || form.elements.race) {
        const raceId = valueOf(form, 'raceId');
        const raceText = valueOf(form, 'race');
        let race = raceId ? MF.getRace(raceId) : null;
        if (!race && raceText) race = MF.findOrCreateRace(raceText);
        entity.raceId = race ? race.id : '';
        entity.race = race ? race.name : (raceText || '');
      } else {
        entity.raceId = entity.raceId || '';
        entity.race = entity.race || '';
      }
      if (form.elements.gender) entity.gender = valueOf(form, 'gender') || (MF.LANG === 'en' ? 'Not specified' : 'Не указан');
      else entity.gender = entity.gender || (MF.LANG === 'en' ? 'Not specified' : 'Не указан');
      if (form.elements.age) entity.age = valueOf(form, 'age');
      else entity.age = entity.age || '';
      if (form.elements.status) entity.status = valueOf(form, 'status') || (MF.LANG === 'en' ? 'Unknown' : 'Неизвестно');
      else entity.status = entity.status || (MF.LANG === 'en' ? 'Unknown' : 'Неизвестно');
      if (form.elements.factionId) entity.factionId = valueOf(form, 'factionId');
      else entity.factionId = entity.factionId || '';
      if (form.elements.locationId) entity.locationId = valueOf(form, 'locationId');
      else entity.locationId = entity.locationId || '';
      if (form.elements.quote) entity.quote = valueOf(form, 'quote');
      else entity.quote = entity.quote || '';
      if (form.elements.description) entity.description = valueOf(form, 'description');
      else entity.description = entity.description || '';
      if (form.elements.personality) entity.personality = valueOf(form, 'personality');
      else entity.personality = entity.personality || '';
      if (form.elements.appearance) entity.appearance = valueOf(form, 'appearance');
      else entity.appearance = entity.appearance || '';
      if (form.elements.tags) entity.tags = tagValues(form);
      else entity.tags = entity.tags || [];
      if (form.elements.fatherId) entity.fatherId = fatherId;
      else entity.fatherId = entity.fatherId || '';
      if (form.elements.motherId) entity.motherId = motherId;
      else entity.motherId = entity.motherId || '';
      if (form.elements.image) entity.portrait = valueOf(form, 'image');
      else entity.portrait = entity.portrait || '';
      if (form.elements.gallery) {
        try {
          const gallery = JSON.parse(valueOf(form, 'gallery') || '[]');
          entity.gallery = Array.isArray(gallery) ? gallery.filter(Boolean).slice(0, 24) : [];
        } catch (e) {
          entity.gallery = [];
        }
      } else {
        entity.gallery = entity.gallery || [];
      }
      if (form.elements.palette) {
        try {
          const palette = JSON.parse(valueOf(form, 'palette') || '[]');
          entity.palette = Array.isArray(palette)
            ? palette.map(function (color) { return String(color || '').toUpperCase(); }).filter(function (color) { return /^#[0-9A-F]{6}$/.test(color); }).slice(0, 8)
            : [];
        } catch (e) {
          entity.palette = [];
        }
      } else {
        entity.palette = entity.palette || [];
      }
      if (form.elements.audio) {
        try {
          const audio = JSON.parse(valueOf(form, 'audio') || '[]');
          entity.audio = Array.isArray(audio) ? audio.filter(function (track) {
            return track && track.url;
          }).map(function (track) {
            return { id: track.id || MF.uid('aud'), url: track.url, title: String(track.title || 'Аудио'), kind: track.kind === 'music' ? 'music' : 'voice' };
          }).slice(0, 12) : [];
        } catch (e) {
          entity.audio = [];
        }
      } else {
        entity.audio = entity.audio || [];
      }
      const spouseIds = form.elements.spouseIds
        ? checkedValues(form, 'spouseIds').filter(function (spouseId) { return spouseId !== entity.id; })
        : (Array.isArray(entity.spouseIds) ? entity.spouseIds : []);
      entity.spouseIds = spouseIds;
      entity.customFields = customFieldValues(form);
      entity.updatedAt = now;
      if (!existing) data.characters.push(entity);
      data.characters.forEach(function (character) {
        if (character.id === entity.id) return;
        character.spouseIds = Array.isArray(character.spouseIds) ? character.spouseIds : [];
        if (spouseIds.indexOf(character.id) !== -1) {
          if (character.spouseIds.indexOf(entity.id) === -1) character.spouseIds.push(entity.id);
        } else {
          character.spouseIds = character.spouseIds.filter(function (spouseId) { return spouseId !== entity.id; });
        }
      });
      displayName = entity.name;
      page = 'characters';
      markActivity('character', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'location') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'Дайте месту имя.', 'error'); return false; }
      const existing = isEdit ? MF.getLocation(id) : null;
      const entity = existing || { id: MF.uid('loc'), createdAt: now, tags: [], image: '' };
      entity.name = name;
      entity.type = valueOf(form, 'type') || 'Другое';
      const regionId = valueOf(form, 'regionId');
      const region = regionId ? MF.getRegion(regionId) : null;
      entity.regionId = region ? region.id : '';
      entity.region = region ? region.name : '';
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.locations.push(entity);
      displayName = entity.name;
      page = 'regions';
      markActivity('location', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'faction') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'У силы должно быть имя.', 'error'); return false; }
      const existing = isEdit ? MF.getFaction(id) : null;
      const entity = existing || { id: MF.uid('fac'), createdAt: now, tags: [], emblem: '' };
      entity.name = name;
      entity.type = valueOf(form, 'type') || 'Другое';
      entity.status = valueOf(form, 'status') || 'Действует';
      entity.regionId = valueOf(form, 'regionId');
      entity.locationId = valueOf(form, 'locationId');
      entity.leaderId = valueOf(form, 'leaderId');
      entity.color = valueOf(form, 'color') || '#c5a15f';
      entity.ideology = valueOf(form, 'ideology');
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.emblem = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.factions.push(entity);
      displayName = entity.name;
      page = 'factions';
      markActivity('faction', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'region') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'Дайте региону имя.', 'error'); return false; }
      const existing = isEdit ? MF.getRegion(id) : null;
      const entity = existing || { id: MF.uid('rg'), createdAt: now, tags: [], image: '' };
      entity.name = name;
      entity.type = valueOf(form, 'type') || 'Регион';
      entity.climate = valueOf(form, 'climate');
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.regions.push(entity);
      displayName = entity.name;
      page = 'regions';
      markActivity('region', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'race') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'Дайте расе имя.', 'error'); return false; }
      const existing = isEdit ? MF.getRace(id) : null;
      const entity = existing || { id: MF.uid('race'), createdAt: now, tags: [], image: '' };
      entity.name = name;
      entity.type = valueOf(form, 'type') || 'Народ';
      entity.traits = valueOf(form, 'traits');
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.races.push(entity);
      displayName = entity.name;
      page = 'races';
      markActivity('race', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'lore') {
      const title = valueOf(form, 'title');
      if (!title) { MF.toast('Заголовок обязателен', 'Назовите статью.', 'error'); return false; }
      const existing = isEdit ? MF.getEntity('lore', id) : null;
      const entity = existing || { id: MF.uid('lr'), createdAt: now, tags: [], image: '' };
      entity.title = title;
      entity.category = valueOf(form, 'category') || 'Другое';
      entity.sourceId = valueOf(form, 'sourceId');
      const source = entity.sourceId ? MF.getBook(entity.sourceId) : null;
      entity.sourceTitle = source ? source.title : '';
      if (!source) entity.sourceId = '';
      entity.summary = valueOf(form, 'summary');
      entity.content = valueOf(form, 'content');
      entity.tags = tagValues(form);
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.lore.push(entity);
      displayName = entity.title;
      page = 'lore';
      markActivity('lore', isEdit ? 'update' : 'create', entity.id, entity.title);
    }

    if (type === 'book') {
      const title = valueOf(form, 'title');
      if (!title) { MF.toast('Название обязательно', 'Укажите название источника.', 'error'); return false; }
      const existing = isEdit ? MF.getBook(id) : null;
      const entity = existing || { id: MF.uid('book'), createdAt: now, tags: [], cover: '', image: '' };
      entity.title = title;
      entity.name = title;
      entity.type = valueOf(form, 'type') || 'Книга';
      entity.author = valueOf(form, 'author');
      entity.year = valueOf(form, 'year');
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.cover = valueOf(form, 'image');
      entity.image = entity.cover;
      entity.updatedAt = now;
      if (!existing) data.books.push(entity);
      data.lore.forEach(function (article) {
        if (article.sourceId === entity.id) article.sourceTitle = entity.title;
      });
      displayName = entity.title;
      page = 'library';
      markActivity('book', isEdit ? 'update' : 'create', entity.id, entity.title);
    }

    if (type === 'dndSheet') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Имя обязательно', 'Дайте персонажу имя.', 'error'); return false; }
      const existing = isEdit ? (data.dndSheets || []).find(function (item) { return item.id === id; }) : null;
      const entity = existing || { id: MF.uid('dnd'), createdAt: now, abilities: {}, saves: [], skills: [] };
      entity.name = name;
      entity.edition = valueOf(form, 'edition') === '2024' ? '2024' : '5e';
      entity.className = valueOf(form, 'className');
      entity.subclass = valueOf(form, 'subclass');
      entity.level = MF.clamp(Number(valueOf(form, 'level')) || 1, 1, 30);
      entity.species = valueOf(form, 'species');
      entity.background = valueOf(form, 'background');
      entity.alignment = valueOf(form, 'alignment');
      entity.abilities = {};
      MF.DND_ABILITIES.forEach(function (ability) {
        entity.abilities[ability.id] = MF.clamp(Number(valueOf(form, ability.id)) || 10, 1, 30);
      });
      entity.proficiency = valueOf(form, 'proficiency') || String(MF.dndProficiency(entity.level));
      entity.ac = Number(valueOf(form, 'ac')) || 10;
      entity.hpMax = Number(valueOf(form, 'hpMax')) || 10;
      entity.hpCurrent = Number(valueOf(form, 'hpCurrent'));
      if (isNaN(entity.hpCurrent)) entity.hpCurrent = entity.hpMax;
      entity.speed = Number(valueOf(form, 'speed')) || 30;
      entity.hitDice = valueOf(form, 'hitDice') || 'd8';
      entity.saves = checkedValues(form, 'saves');
      entity.skills = checkedValues(form, 'skills');
      entity.equipment = valueOf(form, 'equipment');
      entity.spells = valueOf(form, 'spells');
      entity.features = valueOf(form, 'features');
      entity.notes = valueOf(form, 'notes');
      entity.updatedAt = now;
      if (!existing) {
        if (!Array.isArray(data.dndSheets)) data.dndSheets = [];
        data.dndSheets.push(entity);
      }
      displayName = entity.name;
      page = 'dnd';
      markActivity('dndSheet', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'catalogItem') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'Дайте записи имя.', 'error'); return false; }
      const catalogId = valueOf(form, 'catalogId');
      const catalog = MF.catalogMeta(catalogId);
      if (!catalog) { MF.toast('Раздел не найден', 'Откройте раздел и попробуйте снова.', 'error'); return false; }
      const existing = isEdit ? data.catalogItems.find(function (item) { return item.id === id; }) : null;
      const entity = existing || { id: MF.uid('ci'), createdAt: now, tags: [], image: '' };
      entity.catalogId = catalogId;
      entity.name = name;
      entity.type = valueOf(form, 'type');
      entity.description = valueOf(form, 'description');
      entity.tags = tagValues(form);
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.catalogItems.push(entity);
      displayName = entity.name;
      page = 'catalog:' + catalogId;
      markActivity('catalogItem', isEdit ? 'update' : 'create', entity.id, entity.name);
    }

    if (type === 'catalog') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название обязательно', 'Дайте разделу имя.', 'error'); return false; }
      const catalog = MF.catalogMeta(id);
      if (!catalog) return false;
      catalog.name = name;
      catalog.title = name;
      catalog.nameEn = name;
      catalog.icon = valueOf(form, 'icon') || catalog.icon || 'i-scroll';
      catalog.description = valueOf(form, 'description');
      catalog.descriptionEn = catalog.description;
      catalog.updatedAt = now;
      if (MF.state.nav) {
        MF.state.nav.extras.forEach(function (extra) {
          if (extra.catalogId === catalog.id) { extra.label = name; extra.labelEn = name; }
        });
        MF.saveNavConfig();
      }
      displayName = name;
      page = 'catalog:' + catalog.id;
      MF.applyNavConfig();
    }

    if (type === 'event') {
      const title = valueOf(form, 'title');
      if (!title) { MF.toast('Название обязательно', 'У события должно быть имя.', 'error'); return false; }
      const existing = isEdit ? MF.getEntity('event', id) : null;
      const entity = existing || { id: MF.uid('ev'), createdAt: now, participantIds: [], image: '' };
      entity.title = title;
      entity.dateText = valueOf(form, 'dateText');
      const sortYearRaw = valueOf(form, 'sortYear');
      entity.sortYear = sortYearRaw === '' ? '' : Number(sortYearRaw);
      if (isNaN(entity.sortYear)) entity.sortYear = '';
      entity.era = valueOf(form, 'era');
      entity.type = valueOf(form, 'type') || 'other';
      entity.locationId = valueOf(form, 'locationId');
      entity.description = valueOf(form, 'description');
      entity.participantIds = checkedValues(form, 'participantIds');
      entity.image = valueOf(form, 'image');
      entity.updatedAt = now;
      if (!existing) data.events.push(entity);
      displayName = entity.title;
      page = 'timeline';
      markActivity('event', isEdit ? 'update' : 'create', entity.id, entity.title);
    }

    if (type === 'note') {
      const title = valueOf(form, 'title');
      if (!title) { MF.toast('Заголовок обязателен', 'У заметки должно быть имя.', 'error'); return false; }
      const existing = isEdit ? MF.getEntity('note', id) : null;
      const entity = existing || { id: MF.uid('n'), createdAt: now };
      entity.title = title;
      entity.content = valueOf(form, 'content');
      entity.color = valueOf(form, 'color') || 'gold';
      entity.pinned = !!form.querySelector('input[name="pinned"]') && form.querySelector('input[name="pinned"]').checked;
      entity.updatedAt = now;
      if (!existing) data.notes.push(entity);
      displayName = entity.title;
      page = 'notes';
      markActivity('note', isEdit ? 'update' : 'create', entity.id, entity.title);
    }

    if (type === 'world') {
      const name = valueOf(form, 'name');
      if (!name) { MF.toast('Название мира обязательно', 'Дайте миру имя.', 'error'); return false; }
      world.name = name;
      world.genre = valueOf(form, 'genre');
      world.era = valueOf(form, 'era');
      world.currentYear = valueOf(form, 'currentYear');
      world.tagline = valueOf(form, 'tagline');
      world.description = valueOf(form, 'description');
      world.cover = valueOf(form, 'image');
      world.updatedAt = now;
      data.activity = data.activity || [];
      data.activity.unshift({ id: MF.uid('a'), kind: 'update', entityType: 'world', entityId: '', title: 'Обновлён профиль мира «' + world.name + '»', at: now });
      data.activity = data.activity.slice(0, 120);
      displayName = world.name;
    }

    world.updatedAt = now;
    MF.closeAllOverlays();
    if (page && !isEdit) {
      MF.navigate(page);
      await MF.saveData({ silent: true });
    } else {
      await MF.commit({ touchWorld: false });
    }
    MF.refreshNavCounts();
    MF.refreshStorageLabels();
    const savedAt = MF.state.lastSavedAt || now;
    MF.toast(isEdit ? 'Изменения сохранены' : 'Запись создана', (displayName ? '«' + displayName + '» · ' : '') + MF.formatDate(savedAt), 'success');
    return true;
  }

  /* ---------- Delete ---------- */
  MF.deleteEntity = function (type, id) {
    const info = MF.ENTITY[type];
    if (!info) return;
    const item = MF.getEntity(type, id);
    if (!item) return;
    const name = item.name || item.title || 'без названия';
    MF.openConfirm({
      title: 'Удалить ' + info.accusative + '?',
      html: 'Запись <strong>«' + MF.esc(name) + '»</strong> будет удалена без возможности отмены. Связанные упоминания будут очищены.',
      confirmLabel: 'Удалить',
      onConfirm: async function () {
        const data = MF.state.data;
        const collection = MF.collectionFor(type);
        data.tombstones = Array.isArray(data.tombstones) ? data.tombstones : [];
        data.tombstones.push({ type: type, id: id, at: MF.nowISO() });
        data.tombstones = data.tombstones.slice(-1000);
        data[collection] = data[collection].filter(function (entity) { return entity.id !== id; });
        if (type === 'character') {
          data.characters.forEach(function (character) {
            if (character.fatherId === id) character.fatherId = '';
            if (character.motherId === id) character.motherId = '';
            character.spouseIds = (character.spouseIds || []).filter(function (spouseId) { return spouseId !== id; });
          });
          data.events.forEach(function (event) {
            event.participantIds = (event.participantIds || []).filter(function (participantId) { return participantId !== id; });
          });
          data.factions.forEach(function (faction) { if (faction.leaderId === id) faction.leaderId = ''; });
        }
        if (type === 'location') {
          data.characters.forEach(function (character) { if (character.locationId === id) character.locationId = ''; });
          data.events.forEach(function (event) { if (event.locationId === id) event.locationId = ''; });
          data.factions.forEach(function (faction) { if (faction.locationId === id) faction.locationId = ''; });
        }
        if (type === 'faction') {
          data.characters.forEach(function (character) { if (character.factionId === id) character.factionId = ''; });
        }
        if (type === 'region') {
          data.locations.forEach(function (location) { if (location.regionId === id) { location.regionId = ''; location.region = ''; } });
          data.factions.forEach(function (faction) { if (faction.regionId === id) faction.regionId = ''; });
        }
        if (type === 'race') {
          data.characters.forEach(function (character) { if (character.raceId === id) { character.raceId = ''; character.race = ''; } });
        }
        if (type === 'book') {
          data.lore.forEach(function (article) {
            if (article.sourceId === id) { article.sourceId = ''; article.sourceTitle = ''; article.updatedAt = MF.nowISO(); }
          });
          if (MF.state.ui.loreSource === id) MF.state.ui.loreSource = 'all';
        }
        MF.addActivity('delete', type, id, 'Удалено из летописи: «' + name + '»');
        MF.state.tree.userAdjusted = false;
        MF.state.tree.layoutKey = '';
        MF.closeAllOverlays();
        await MF.commit({ touchWorld: true });
        MF.toast('Запись удалена', '«' + name + '» больше не в летописи.', 'success');
      }
    });
  };

  /* ---------- DeepSeek: ключ и импорт из старых чатов ---------- */
  function aiText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }
  function aiArray(value) {
    return Array.isArray(value) ? value.filter(function (item) { return item && typeof item === 'object'; }) : [];
  }
  function aiTags(value) {
    if (Array.isArray(value)) return value.map(aiText).filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(aiText).filter(Boolean);
    return [];
  }
  function aiObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function aiGender(value) {
    const text = MF.normalize(value);
    if (text.indexOf('жен') !== -1) return 'Женский';
    if (text.indexOf('муж') !== -1) return 'Мужской';
    if (text.indexOf('ин') === 0 || text.indexOf('друг') !== -1) return 'Иной';
    return 'Не указан';
  }
  function aiType(value, collection, fallback) {
    const text = aiText(value);
    if (!text) return fallback;
    if (collection.indexOf(text) !== -1) return text;
    return fallback;
  }
  function aiEventType(value) {
    const text = MF.normalize(value);
    const keys = Object.keys(MF.EVENT_TYPES);
    for (let i = 0; i < keys.length; i++) {
      if (text === keys[i] || text.indexOf(MF.normalize(MF.EVENT_TYPES[keys[i]].label)) !== -1) return keys[i];
    }
    return 'other';
  }
  function aiFindByName(list, name) {
    const key = MF.normalize(name);
    if (!key) return null;
    return list.find(function (item) { return MF.normalize(item.name) === key; }) || null;
  }
  function aiCharacterByName(list, name) {
    const key = MF.normalize(name);
    if (!key) return null;
    return list.find(function (item) { return MF.normalize(item.name) === key; }) || null;
  }
  function aiApply(entity, fields, merge) {
    const isNew = entity.__aiNew === true;
    Object.keys(fields).forEach(function (key) {
      const value = fields[key];
      if (value == null || value === '') return;
      const current = entity[key];
      const empty = current == null || current === '' || (Array.isArray(current) && !current.length);
      if (isNew || merge || empty) entity[key] = value;
    });
  }
  function aiEnsure(list, name, factory, merge, stats) {
    const text = aiText(name);
    if (!text) return null;
    let entity = aiFindByName(list, text);
    if (!entity) {
      entity = factory(text);
      entity.createdAt = MF.nowISO();
      entity.updatedAt = entity.createdAt;
      try { Object.defineProperty(entity, '__aiNew', { value: true, enumerable: false, configurable: true }); } catch (e) { entity.__aiNew = true; }
      list.push(entity);
      stats.created++;
    } else if (merge) {
      stats.updated++;
    }
    return entity;
  }

  MF.saveApiSettings = async function () {
    if (!MF.isNative) { MF.toast('Только в приложении', 'API DeepSeek доступен в настольной версии.', 'info'); return; }
    const keyEl = MF.$('#deepSeekKey');
    const modelEl = MF.$('#deepSeekModel');
    const apiKey = keyEl ? keyEl.value.trim() : '';
    const model = modelEl ? modelEl.value : (MF.state.api.model || 'deepseek-chat');
    try {
      MF.state.api = await MF.invoke('saveApiSettings', { apiKey: apiKey, model: model, clear: false });
      MF.renderCurrentPage({ keepScroll: true });
      MF.toast(apiKey ? 'Ключ DeepSeek сохранён' : 'Настройки DeepSeek сохранены', apiKey ? 'Ключ зашифрован и остаётся на этом компьютере.' : 'Модель обновлена.', 'success');
    } catch (error) {
      MF.toast('Не удалось сохранить ключ', error.message || 'Проверьте настройки и попробуйте снова.', 'error');
    }
  };

  MF.clearApiSettings = async function () {
    if (!MF.isNative) return;
    try {
      MF.state.api = await MF.invoke('saveApiSettings', { apiKey: '', model: MF.state.api.model || 'deepseek-chat', clear: true });
      MF.renderCurrentPage({ keepScroll: true });
      MF.toast('Ключ удалён', 'DeepSeek больше не сможет получать запросы до добавления нового ключа.', 'success');
    } catch (error) {
      MF.toast('Не удалось удалить ключ', error.message, 'error');
    }
  };

  MF.openChatImport = function () {
    if (!MF.isNative) {
      MF.toast('Только в приложении', 'Импорт через DeepSeek доступен в настольной версии.', 'info');
      return;
    }
    if (!MF.state.api || !MF.state.api.hasKey) {
      MF.toast('Сначала добавьте ключ', 'Откройте Настройки → DeepSeek и сохраните API-ключ.', 'error');
      if (MF.state.page !== 'settings') MF.navigate('settings');
      return;
    }
    const model = MF.state.api.model || 'deepseek-chat';
    const body = '<div class="form-grid">' +
      '<div class="form-field span-full"><label class="field-label" for="chatImportText">Текст старых чатов</label>' +
      '<textarea class="textarea form-textarea-xl" id="chatImportText" maxlength="60000" placeholder="Вставьте сюда переписку из старых чатов: описания мира, обсуждения героев, названия земель, случайные идеи…"></textarea>' +
      '<span class="field-hint">До 60 000 символов. Можно вставить несколько сообщений подряд. DeepSeek выделит только то, что действительно есть в тексте.</span></div>' +
      '<div class="form-field span-full"><label class="field-label" for="chatImportModel">Модель</label><select class="select" id="chatImportModel">' +
      MF.DEEPSEEK_MODELS.map(function (entry) { return '<option value="' + MF.esc(entry.id) + '"' + (entry.id === model ? ' selected' : '') + '>' + MF.esc(entry.label) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-inline-note">' + MF.icon('i-info') + ' Текст будет отправлен в DeepSeek. Перед добавлением в летопись вы увидите предпросмотр и сможете отказаться.</div></div>';
    appendOverlay(modalShell({
      title: 'Импорт из старых чатов',
      eyebrow: 'DeepSeek',
      subtitle: 'Нейросеть прочитает переписку и соберёт из неё структуру мира. Ничего не изменится без вашего подтверждения.',
      size: 'wide', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button>' +
        '<button class="btn btn-primary" data-action="run-chat-import">' + MF.icon('i-sparkles') + 'Разобрать</button>'
    }), '#chatImportText');
  };

  MF.runChatImport = async function (button) {
    const textEl = MF.$('#chatImportText');
    const modelEl = MF.$('#chatImportModel');
    const text = textEl ? textEl.value.trim() : '';
    if (text.length < 20) { MF.toast('Слишком короткий текст', 'Вставьте переписку или описание мира — хотя бы пару предложений.', 'error'); return; }
    if (text.length > 60000) { MF.toast('Текст слишком длинный', 'Разбейте переписку на части до 60 000 символов.', 'error'); return; }
    const original = button ? button.innerHTML : '';
    if (button) { button.disabled = true; button.innerHTML = MF.icon('i-sparkles') + 'DeepSeek читает…'; }
    try {
      const result = await MF.invoke('deepseekExtract', {
        text: text,
        model: modelEl ? modelEl.value : (MF.state.api.model || 'deepseek-chat')
      }, { timeoutMs: 180000 });
      if (!result || !result.data) throw new Error('DeepSeek не вернул данные для импорта.');
      MF.closeTopOverlay();
      MF.openImportPreview(result.data, result.model);
      if (result.usage && result.usage.total_tokens) MF.toast('Разбор готов', 'Использовано ' + result.usage.total_tokens + ' токенов.', 'success');
    } catch (error) {
      if (button) { button.disabled = false; button.innerHTML = original; }
      MF.toast('DeepSeek не смог разобрать текст', error.message || 'Проверьте ключ, соединение и попробуйте снова.', 'error');
    }
  };

  MF.openImportPreview = function (raw, model) {
    const parsed = aiObject(raw);
    MF.state.pendingImport = { data: parsed, model: model || '' };
    const groups = [
      ['Регионы', aiArray(parsed.regions)],
      ['Расы', aiArray(parsed.races)],
      ['Локации', aiArray(parsed.locations)],
      ['Фракции', aiArray(parsed.factions)],
      ['Персонажи', aiArray(parsed.characters)],
      ['События', aiArray(parsed.events)],
      ['Лор', aiArray(parsed.lore)],
      ['Заметки', aiArray(parsed.notes)]
    ];
    const list = groups.map(function (group) {
      const names = group[1].map(function (item) { return aiText(item.name || item.title); }).filter(Boolean).slice(0, 8);
      return '<div class="ai-preview-group"><div class="ai-preview-group-head"><strong>' + MF.esc(group[0]) + '</strong><span>' + group[1].length + '</span></div>' +
        (names.length ? '<p>' + names.map(MF.esc).join(' · ') + (group[1].length > names.length ? ' …' : '') + '</p>' : '<p class="ai-empty">не найдено</p>') + '</div>';
    }).join('');
    const world = aiObject(parsed.world);
    const body = '<div class="ai-preview">' +
      (aiText(world.name) ? '<div class="ai-preview-world"><span>Мир</span><strong>' + MF.esc(aiText(world.name)) + '</strong>' + (aiText(world.genre) ? '<small>' + MF.esc(aiText(world.genre)) + '</small>' : '') + '</div>' : '') +
      '<div class="ai-preview-grid">' + list + '</div>' +
      '<label class="toggle-line"><span class="toggle-line-copy"><strong>Обновлять существующие записи</strong><span>Если выключено, совпадающие по имени записи останутся без изменений. Новые всё равно добавятся.</span></span>' +
      '<span class="switch"><input type="checkbox" id="aiMergeExisting"><span class="switch-track"></span></span></label>' +
      '<div class="form-inline-note">' + MF.icon('i-info') + ' Проверьте список. Импорт не затрагивает изображения и существующие связи, если вы не включили обновление.</div></div>';
    appendOverlay(modalShell({
      title: 'Что удалось найти',
      eyebrow: 'Предпросмотр импорта',
      subtitle: 'DeepSeek предлагает записи для вашего мира. Добавьте их только после проверки.',
      size: 'wide', body: body,
      footer: '<button class="btn btn-ghost" data-action="close-overlay">Отмена</button>' +
        '<button class="btn btn-primary" data-action="confirm-chat-import">' + MF.icon('i-check') + 'Добавить в мир</button>'
    }), '.modal-close');
  };

  MF.importExtractedData = async function (parsed, mergeExisting) {
    const data = MF.state.data;
    const merge = !!mergeExisting;
    const stats = { created: 0, updated: 0 };
    const now = MF.nowISO();
    const source = aiObject(parsed);

    const worldIn = aiObject(source.world);
    if (Object.keys(worldIn).length) {
      const fields = {
        name: aiText(worldIn.name), genre: aiText(worldIn.genre), era: aiText(worldIn.era),
        currentYear: aiText(worldIn.currentYear), tagline: aiText(worldIn.tagline), description: aiText(worldIn.description)
      };
      Object.keys(fields).forEach(function (key) {
        if (!fields[key]) return;
        if (merge || !data.world[key]) data.world[key] = fields[key];
      });
      data.world.updatedAt = now;
    }

    aiArray(source.regions).forEach(function (input) {
      const entity = aiEnsure(data.regions, input.name, function (name) {
        return { id: MF.uid('rg'), name: name, type: 'Регион', climate: '', description: '', image: '', tags: [] };
      }, merge, stats);
      if (!entity) return;
      aiApply(entity, {
        type: aiType(input.type, MF.REGION_TYPES, 'Регион'),
        climate: aiText(input.climate),
        description: aiText(input.description),
        tags: aiTags(input.tags)
      }, merge);
    });

    aiArray(source.races).forEach(function (input) {
      const entity = aiEnsure(data.races, input.name, function (name) {
        return { id: MF.uid('race'), name: name, type: 'Народ', traits: '', description: '', image: '', tags: [] };
      }, merge, stats);
      if (!entity) return;
      aiApply(entity, {
        type: aiType(input.type, MF.RACE_TYPES, 'Народ'),
        traits: aiText(input.traits),
        description: aiText(input.description),
        tags: aiTags(input.tags)
      }, merge);
    });

    aiArray(source.locations).forEach(function (input) {
      const entity = aiEnsure(data.locations, input.name, function (name) {
        return { id: MF.uid('loc'), name: name, type: 'Другое', regionId: '', region: '', description: '', image: '', tags: [] };
      }, merge, stats);
      if (!entity) return;
      const region = aiFindByName(data.regions, input.region);
      aiApply(entity, {
        type: aiType(input.type, MF.LOCATION_TYPES, 'Другое'),
        regionId: region ? region.id : '',
        region: region ? region.name : aiText(input.region),
        description: aiText(input.description),
        tags: aiTags(input.tags)
      }, merge);
    });

    const factionCharacters = [];
    const createdCharacterIds = {};
    aiArray(source.factions).forEach(function (input) {
      const before = stats.created;
      const entity = aiEnsure(data.factions, input.name, function (name) {
        return { id: MF.uid('fac'), name: name, type: 'Другое', status: 'Действует', leaderId: '', color: '#c5a15f', ideology: '', description: '', emblem: '', regionId: '', locationId: '', tags: [] };
      }, merge, stats);
      if (!entity) return;
      const region = aiFindByName(data.regions, input.region);
      const location = aiFindByName(data.locations, input.location);
      aiApply(entity, {
        type: aiType(input.type, MF.FACTION_TYPES, 'Другое'),
        status: aiText(input.status) || 'Действует',
        ideology: aiText(input.ideology),
        description: aiText(input.description),
        regionId: region ? region.id : '',
        locationId: location ? location.id : '',
        tags: aiTags(input.tags)
      }, merge);
      if (aiText(input.leader)) factionCharacters.push({ faction: entity, leader: aiText(input.leader), isNew: stats.created > before });
    });

    const relations = [];
    aiArray(source.characters).forEach(function (input) {
      const before = stats.created;
      const entity = aiEnsure(data.characters, input.name, function (name) {
        return { id: MF.uid('ch'), name: name, title: '', role: '', race: '', raceId: '', gender: 'Не указан', age: '', status: 'Неизвестно', factionId: '', locationId: '', quote: '', description: '', personality: '', appearance: '', tags: [], fatherId: '', motherId: '', spouseIds: [], portrait: '', gallery: [], palette: [], audio: [] };
      }, merge, stats);
      if (!entity) return;
      const isNew = stats.created > before;
      if (isNew) createdCharacterIds[entity.id] = true;
      const race = aiFindByName(data.races, input.race);
      const faction = aiFindByName(data.factions, input.faction);
      const location = aiFindByName(data.locations, input.location);
      aiApply(entity, {
        title: aiText(input.title),
        role: aiText(input.role),
        raceId: race ? race.id : '',
        race: race ? race.name : aiText(input.race),
        gender: aiGender(input.gender),
        age: aiText(input.age),
        status: aiText(input.status) || 'Неизвестно',
        factionId: faction ? faction.id : '',
        locationId: location ? location.id : '',
        quote: aiText(input.quote),
        appearance: aiText(input.appearance),
        description: aiText(input.description),
        personality: aiText(input.personality),
        tags: aiTags(input.tags)
      }, merge);
      relations.push({
        entity: entity,
        isNew: isNew,
        father: aiText(input.father),
        mother: aiText(input.mother),
        spouses: aiTags(input.spouses),
        children: aiTags(input.children)
      });
    });

    relations.forEach(function (relation) {
      if (!merge && !relation.isNew) return;
      const character = relation.entity;
      const father = aiCharacterByName(data.characters, relation.father);
      const mother = aiCharacterByName(data.characters, relation.mother);
      if (father) character.fatherId = father.id;
      if (mother) character.motherId = mother.id;
      relation.spouses.forEach(function (name) {
        const spouse = aiCharacterByName(data.characters, name);
        if (!spouse || spouse.id === character.id) return;
        character.spouseIds = Array.isArray(character.spouseIds) ? character.spouseIds : [];
        if (character.spouseIds.indexOf(spouse.id) === -1) character.spouseIds.push(spouse.id);
        if (merge || createdCharacterIds[spouse.id]) {
          spouse.spouseIds = Array.isArray(spouse.spouseIds) ? spouse.spouseIds : [];
          if (spouse.spouseIds.indexOf(character.id) === -1) spouse.spouseIds.push(character.id);
        }
      });
      relation.children.forEach(function (name) {
        const child = aiCharacterByName(data.characters, name);
        if (!child || child.id === character.id) return;
        if (!merge && !createdCharacterIds[child.id]) return;
        if (character.gender === 'Женский') child.motherId = character.id;
        else child.fatherId = character.id;
      });
    });

    factionCharacters.forEach(function (item) {
      if (!merge && !item.isNew) return;
      const leader = aiCharacterByName(data.characters, item.leader);
      if (leader) item.faction.leaderId = leader.id;
    });

    aiArray(source.events).forEach(function (input) {
      const entity = aiEnsure(data.events, input.title || input.name, function (title) {
        return { id: MF.uid('ev'), title: title, dateText: '', sortYear: 0, era: '', type: 'other', locationId: '', participantIds: [], description: '', image: '' };
      }, merge, stats);
      if (!entity) return;
      const location = aiFindByName(data.locations, input.location);
      const participants = aiTags(input.participants).map(function (name) {
        const character = aiCharacterByName(data.characters, name);
        return character ? character.id : null;
      }).filter(Boolean);
      aiApply(entity, {
        dateText: aiText(input.dateText),
        sortYear: Number(input.sortYear) || 0,
        era: aiText(input.era),
        type: aiEventType(input.type),
        locationId: location ? location.id : '',
        participantIds: participants,
        description: aiText(input.description)
      }, merge);
    });

    aiArray(source.lore).forEach(function (input) {
      const entity = aiEnsure(data.lore, input.title || input.name, function (title) {
        return { id: MF.uid('lr'), title: title, category: 'Другое', summary: '', content: '', image: '', tags: [] };
      }, merge, stats);
      if (!entity) return;
      aiApply(entity, {
        category: aiType(input.category, MF.LORE_CATEGORIES, 'Другое'),
        summary: aiText(input.summary),
        content: aiText(input.content),
        tags: aiTags(input.tags)
      }, merge);
    });

    aiArray(source.notes).forEach(function (input) {
      const entity = aiEnsure(data.notes, input.title || input.name, function (title) {
        return { id: MF.uid('n'), title: title, content: '', color: 'gold', pinned: false };
      }, merge, stats);
      if (!entity) return;
      const color = MF.NOTE_COLORS.some(function (entry) { return entry.id === input.color; }) ? input.color : 'gold';
      aiApply(entity, {
        content: aiText(input.content),
        color: color,
        pinned: !!input.pinned
      }, merge);
    });

    MF.state.data = MF.normalizeData(data);
    MF.addActivity('create', 'world', '', 'Импорт из переписки: +' + stats.created + (stats.updated ? ', обновлено ' + stats.updated : ''));
    MF.closeAllOverlays();
    await MF.saveNow();
    MF.refreshNavCounts();
    MF.navigate('dashboard');
    MF.toast('Импорт завершён', 'Добавлено записей: ' + stats.created + (stats.updated ? ' · обновлено: ' + stats.updated : ''), 'success');
    return stats;
  };

  /* ---------- Backup / storage ---------- */
  function downloadJsonBackup() {
    const data = JSON.stringify(MF.state.data, null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = 'chronica-backup-' + stamp + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  MF.exportWorld = async function (format) {
    if (!MF.isNative) {
      MF.toast('Только в приложении', 'Экспорт Word и Excel доступен в настольной версии.', 'info');
      return;
    }
    const labels = { docx: 'Word', xlsx: 'Excel', json: 'JSON' };
    const label = labels[format] || format;
    try {
      await MF.saveNow();
      const result = await MF.invoke('exportWorld', { format: format }, { timeoutMs: 300000 });
      if (result && result.path) MF.toast('Экспорт готов', label + ' · ' + result.path, 'success');
    } catch (error) {
      MF.toast('Не удалось экспортировать', error.message || 'Проверьте папку и попробуйте снова.', 'error');
    }
  };

  MF.uploadFont = async function () {
    if (!MF.isNative) { MF.toast('Только в приложении', 'Загрузка шрифтов доступна в настольной версии.', 'info'); return; }
    try {
      const result = await MF.invoke('pickFont', null, { timeoutMs: 300000 });
      if (!result || !result.url) return;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const family = 'ChronicaFont_' + id;
      const name = String(result.displayName || result.name || 'Свой шрифт').replace(/[_-]+/g, ' ').trim();
      MF.CUSTOM_FONTS.push({ id: id, family: family, name: name || 'Свой шрифт', url: result.url });
      MF.saveCustomFonts();
      MF.ensureCustomFontFaces();
      MF.setFont('custom:' + id, { announce: true });
      MF.renderCurrentPage({ keepScroll: true });
    } catch (error) {
      MF.toast('Не удалось загрузить шрифт', error.message || 'Проверьте файл и попробуйте снова.', 'error');
    }
  };

  MF.uploadBackground = async function () {
    if (!MF.isNative) { MF.toast('Только в приложении', 'Загрузка фона доступна в настольной версии.', 'info'); return; }
    try {
      const result = await MF.invoke('pickBackground', null, { timeoutMs: 300000 });
      if (!result || !result.url) return;
      MF.background.url = result.url;
      MF.saveBackground();
      MF.applyBackground();
      MF.renderCurrentPage({ keepScroll: true });
      MF.toast('Фон обновлён', 'Размытие и затемнение можно настроить ниже.', 'success');
    } catch (error) {
      MF.toast('Не удалось загрузить фон', error.message || 'Проверьте изображение и попробуйте снова.', 'error');
    }
  };

  MF.resetBackground = function () {
    MF.background.url = '';
    MF.saveBackground();
    MF.applyBackground();
    MF.renderCurrentPage({ keepScroll: true });
    MF.toast('Фон убран', 'Снова используется оформление темы.', 'success');
  };

  MF.uploadCustomIcon = async function (key) {
    if (!MF.isNative) { MF.toast('Только в приложении', 'Загрузка иконок доступна в настольной версии.', 'info'); return; }
    try {
      const result = await MF.invoke('pickImage', { kind: 'icon' }, { timeoutMs: 300000 });
      if (!result || !result.url) return;
      MF.customIcons[key] = result.url;
      MF.saveCustomIcons();
      MF.applyCustomIcons();
      MF.renderCurrentPage({ keepScroll: true });
      MF.toast('Иконка обновлена', 'Новый знак появился в меню слева.', 'success');
    } catch (error) {
      MF.toast('Не удалось загрузить иконку', error.message || 'Проверьте файл и попробуйте снова.', 'error');
    }
  };

  MF.resetCustomIcon = function (key) {
    delete MF.customIcons[key];
    MF.saveCustomIcons();
    MF.applyCustomIcons();
    MF.renderCurrentPage({ keepScroll: true });
    MF.toast('Иконка сброшена', 'Возвращён знак темы.', 'success');
  };

  MF.makeBackup = async function () {
    if (!MF.isNative) {
      downloadJsonBackup();
      MF.toast('Копия сохранена', 'JSON-файл летописи скачан браузером.', 'success');
      return;
    }
    try {
      const result = await MF.invoke('createBackup');
      MF.toast('Резервная копия создана', result && result.path ? result.path : nowLabel(), 'success');
    } catch (error) {
      MF.toast('Не удалось создать копию', error.message || 'Проверьте папку данных.', 'error');
    }
  };

  MF.restoreBackup = async function () {
    if (!MF.isNative) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', async function () {
        const file = input.files && input.files[0];
        document.body.removeChild(input);
        if (!file) return;
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          MF.installRestoredData(parsed, file.name);
        } catch (error) {
          MF.toast('Не удалось восстановить', error.message || 'Файл повреждён.', 'error');
        }
      });
      input.click();
      return;
    }
    MF.openConfirm({
      title: 'Восстановить летопись?',
      text: 'Вы выберете архив с резервной копией. Текущие данные сначала будут сохранены в автоматическую копию.',
      confirmLabel: 'Выбрать архив',
      danger: false,
      onConfirm: async function () {
        const result = await MF.invoke('restoreBackup', null, { timeoutMs: 300000 });
        if (!result || !result.json) return;
        let parsed = null;
        try { parsed = JSON.parse(result.json); } catch (error) { throw new Error('Архив содержит повреждённые данные.'); }
        MF.installRestoredData(parsed, result.path || 'резервная копия');
        MF.toast('Летопись восстановлена', result.path || nowLabel(), 'success');
      }
    });
  };

  MF.installRestoredData = function (parsed, source) {
    const normalized = MF.normalizeData(parsed);
    if (!normalized) throw new Error('Не удалось прочитать данные мира.');
    MF.state.data = normalized;
    MF.state.tree.userAdjusted = false;
    MF.state.tree.layoutKey = '';
    MF.closeAllOverlays();
    if (MF.applyNavConfig) MF.applyNavConfig();
    MF.refreshNavCounts();
    MF.saveNow().then(function () {
      MF.navigate('dashboard');
      MF.toast('Летопись загружена', 'Источник: ' + source, 'success');
    });
  };

  MF.refreshInfo = async function () {
    if (!MF.isNative) return;
    try {
      MF.state.info = await MF.invoke('getInfo');
      MF.refreshStorageLabels();
    } catch (error) {}
  };

  /* ---------- Journal ---------- */
  MF.openJournal = function () {
    const items = (MF.getRecentActivity(80) || []);
    const body = items.length ? '<div class="activity-list">' + items.map(function (entry) {
      const typeInfo = entry.entityType === 'world' ? { label: 'Мир', icon: 'i-globe' } : (MF.ENTITY[entry.entityType] || { label: 'Запись', icon: 'i-scroll' });
      return '<button class="activity-item" data-action="open-activity" data-entity-type="' + MF.esc(entry.entityType) + '" data-entity-id="' + MF.esc(entry.entityId || '') + '">' +
        '<span class="activity-icon">' + MF.icon(typeInfo.icon) + '</span>' +
        '<span class="activity-main"><span class="activity-title">' + MF.esc(entry.title) + '</span><span class="activity-sub">' + MF.esc(typeInfo.label) + ' · ' + MF.esc(MF.formatDate(entry.at)) + '</span></span>' +
        '<span class="activity-time"><strong>' + MF.esc(MF.formatRelative(entry.at)) + '</strong>' + MF.esc(MF.formatDateShort(entry.at)) + ' · ' + MF.esc(MF.formatTime(entry.at)) + '</span></button>';
    }).join('') + '</div>' : '<div class="activity-empty">Журнал пока пуст.</div>';
    appendOverlay(modalShell({
      title: 'Журнал летописи', eyebrow: 'Последние записи', subtitle: 'Все изменения, созданные в этом мире, с датой и временем.',
      size: 'medium', body: body, footer: '<button class="btn btn-ghost" data-action="close-overlay">Закрыть</button>'
    }), '.modal-close');
  };

  /* ---------- Search ---------- */
  MF.searchIndex = function () {
    const data = MF.state.data;
    const entries = [];
    const searchTypes = ['character', 'region', 'location', 'faction', 'race', 'lore', 'book', 'catalogItem', 'event', 'note'];
    if (MF.EDITION === 'dnd') searchTypes.push('dndSheet');
    searchTypes.forEach(function (type) {
      const collection = MF.collectionFor(type);
      const info = MF.ENTITY[type];
      (data[collection] || []).forEach(function (item) {
        const title = item.name || item.title || 'Без названия';
        const subtitle = type === 'character'
          ? [item.title, MF.raceName(item), item.gender].filter(function (v) { return v && v !== 'Не указан'; }).join(' · ')
          : type === 'region' ? [item.type, item.climate].filter(Boolean).join(' · ')
          : type === 'location' ? [item.type, (MF.getRegion(item.regionId) || {}).name || item.region].filter(Boolean).join(' · ')
          : type === 'faction' ? [item.type, item.status].filter(Boolean).join(' · ')
          : type === 'race' ? [item.type, item.traits].filter(Boolean).join(' · ')
          : type === 'lore' ? [item.category, item.sourceTitle, MF.clampText(item.summary, 70)].filter(Boolean).join(' · ')
          : type === 'book' ? [item.type, item.author, item.year].filter(Boolean).join(' · ')
          : type === 'catalogItem' ? [MF.catalogName(MF.catalogMeta(item.catalogId)), item.type].filter(Boolean).join(' · ')
          : type === 'dndSheet' ? [MF.dndClassLabel(item.className), item.species, item.level ? (MF.LANG === 'en' ? 'lvl ' : 'ур. ') + item.level : ''].filter(Boolean).join(' · ')
          : type === 'event' ? [item.dateText, item.era].filter(Boolean).join(' · ')
          : [MF.noteColorLabel(item.color), item.pinned ? 'закреплена' : ''].filter(Boolean).join(' · ');
        entries.push({
          type: type, id: item.id, title: title, subtitle: subtitle, label: info.label, icon: info.icon,
          haystack: MF.normalize([title, subtitle, item.appearance, item.description, item.content, item.summary, item.race, item.traits, item.climate, item.role, item.title, ((item.audio || []).map(function (track) { return track.title || ''; }).join(' ')), ((item.customFields || []).map(function (field) { return (field.label || '') + ' ' + (field.value || ''); }).join(' ')), (item.tags || []).join(' ')].join(' '))
        });
      });
    });
    return entries;
  };

  MF.searchPageEntries = function () {
    const pages = [
      ['dashboard', 'Обзор мира', 'Сводка, прогресс и последние записи'],
      ['characters', 'Персонажи', 'Галерея героев'],
      ['regions', 'Регионы', 'Земли и пределы'],
      ['factions', 'Фракции', 'Силы мира'],
      ['races', 'Расы', 'Народы мира'],
      ['lore', 'Лор', 'Знания и предания'],
      ['library', 'Библиотека', 'Книги и источники лора'],
      ['map', 'Карта мира', 'Атлас и метки'],
      ['timeline', 'Хронология', 'События и эпохи'],
      ['tree', 'Древо рода', 'Родственные связи'],
      ['notes', 'Заметки', 'Мастерская автора'],
      ['settings', 'Настройки', 'Тема, копии и данные']
    ];
    if (MF.EDITION === 'dnd') pages.push(['dnd', 'D&D', 'Листы, правила и кубы']);
    MF.state.data.catalogs.forEach(function (catalog) {
      pages.push(['catalog:' + catalog.id, MF.catalogName(catalog), 'Раздел мира']);
    });
    return pages.map(function (entry) {
      return { page: entry[0], title: entry[1], subtitle: entry[2], haystack: MF.normalize(entry[1] + ' ' + entry[2]) };
    });
  };

  MF.openSearch = function () {
    if (!MF.state.data) return;
    MF.closeAllOverlays();
    lastFocused = document.activeElement;
    const root = searchRoot();
    if (!root) return;
    root.innerHTML = '<div class="search-overlay" data-search-overlay>' +
      '<div class="command-palette" role="dialog" aria-modal="true" aria-label="Поиск по миру">' +
      '<div class="command-search">' + MF.icon('i-search') +
      '<input class="command-input" id="commandInput" type="text" placeholder="Найти героя, землю, событие…" autocomplete="off" spellcheck="false" aria-label="Поиск">' +
      '<span class="command-esc">ESC</span></div>' +
      '<div class="command-results" id="commandResults"></div>' +
      '<div class="command-foot"><span><span class="key-group"><kbd>↑</kbd><kbd>↓</kbd></span> выбрать</span><span><kbd>Enter</kbd> открыть</span><span><kbd>Ctrl K</kbd> поиск</span></div></div></div>';
    syncBodyLock();
    const overlay = root.querySelector('[data-search-overlay]');
    const input = MF.$('#commandInput');
    const results = MF.$('#commandResults');
    MF.state.search.query = '';
    MF.state.search.selectedIndex = -1;
    setTimeout(function () { if (input) input.focus(); }, 20);

    function introHtml() {
      return '<div class="command-intro"><p>Начните вводить имя или слово. Или перейдите в раздел:</p><div class="command-nav-grid">' +
        MF.searchPageEntries().map(function (entry) {
          return '<button type="button" class="command-nav" data-command-nav="' + entry.page + '">' + MF.icon('i-chevron-right') + MF.esc(entry.title) + '</button>';
        }).join('') + '</div></div>';
    }

    function renderResults() {
      const query = MF.normalize(input.value);
      MF.state.search.query = input.value;
      MF.state.search.selectedIndex = -1;
      if (!query) {
        results.innerHTML = introHtml();
        return;
      }
      const pages = MF.searchPageEntries().filter(function (entry) { return entry.haystack.indexOf(query) !== -1; }).slice(0, 3);
      const entries = MF.searchIndex().filter(function (entry) { return entry.haystack.indexOf(query) !== -1; });
      entries.sort(function (a, b) {
        const at = MF.normalize(a.title);
        const bt = MF.normalize(b.title);
        const aStart = at.indexOf(query) === 0 ? 0 : 1;
        const bStart = bt.indexOf(query) === 0 ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return at.localeCompare(bt, 'ru');
      });
      const groups = [];
      if (pages.length) {
        groups.push('<div class="command-group"><div class="command-group-title">Разделы</div>' + pages.map(function (entry) {
          return '<button type="button" class="command-item" data-command-nav="' + entry.page + '"><span class="command-item-icon">' + MF.icon('i-compass') + '</span>' +
            '<span class="command-item-copy"><span class="command-item-title">' + MF.highlight(entry.title, input.value) + '</span><span class="command-item-meta">' + MF.esc(entry.subtitle) + '</span></span>' +
            '<span class="command-item-type">Раздел</span></button>';
        }).join('') + '</div>');
      }
      if (entries.length) {
        const limited = entries.slice(0, 34);
        groups.push('<div class="command-group"><div class="command-group-title">Записи мира</div>' + limited.map(function (entry) {
          return '<button type="button" class="command-item" data-command-open data-entity-type="' + entry.type + '" data-entity-id="' + MF.esc(entry.id) + '">' +
            '<span class="command-item-icon">' + MF.icon(entry.icon) + '</span><span class="command-item-copy"><span class="command-item-title">' + MF.highlight(entry.title, input.value) + '</span>' +
            '<span class="command-item-meta">' + MF.esc(entry.subtitle || entry.label) + '</span></span><span class="command-item-type">' + MF.esc(entry.label) + '</span></button>';
        }).join('') + '</div>');
      }
      if (!groups.length) {
        groups.push('<div class="command-empty"><strong>Тишина</strong>По запросу «' + MF.esc(input.value) + '» ничего не нашлось. Попробуйте другое слово.</div>');
      }
      results.innerHTML = groups.join('');
    }

    function items() { return MF.$$('.command-item', results); }
    function select(index) {
      const list = items();
      if (!list.length) return;
      const next = (index + list.length) % list.length;
      list.forEach(function (item, itemIndex) { item.classList.toggle('is-selected', itemIndex === next); });
      MF.state.search.selectedIndex = next;
      list[next].scrollIntoView({ block: 'nearest' });
    }
    function activate(item) {
      if (!item) return;
      if (item.hasAttribute('data-command-nav')) {
        MF.closeSearch();
        MF.navigate(item.getAttribute('data-command-nav'));
      } else if (item.hasAttribute('data-command-open')) {
        MF.closeSearch();
        const type = item.getAttribute('data-entity-type');
        const id = item.getAttribute('data-entity-id');
        if (type === 'dndSheet') MF.openDndSheetForm(id);
        else MF.openEntity(type, id);
      }
    }

    input.addEventListener('input', renderResults);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) { MF.closeSearch(); return; }
      const item = event.target.closest('.command-item, .command-nav');
      if (item) activate(item);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); select(MF.state.search.selectedIndex + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); select(MF.state.search.selectedIndex - 1); }
      else if (event.key === 'Enter') {
        event.preventDefault();
        const list = items();
        const target = list[MF.state.search.selectedIndex] || list[0];
        activate(target);
      }
    });
    renderResults();
  };

  MF.closeSearch = function () {
    const root = searchRoot();
    if (!root) return;
    root.innerHTML = '';
    syncBodyLock();
    if (MF.state.search) { MF.state.search.query = ''; MF.state.search.selectedIndex = -1; }
    if (lastFocused && document.contains(lastFocused)) {
      try { lastFocused.focus({ preventScroll: true }); } catch (e) {}
    }
    lastFocused = null;
  };

  MF.isSearchOpen = function () {
    return !!MF.$('#searchRoot .search-overlay');
  };

  MF.handleEscape = function () {
    if (MF.isSearchOpen()) { MF.closeSearch(); return; }
    if (MF.closeTopOverlay()) return;
    if (MF.closeCreateMenu) MF.closeCreateMenu();
  };

  /* ---------- Actions ---------- */
  function getActionTarget(event) {
    return event.target.closest ? event.target.closest('[data-action]') : null;
  }

  MF.bindCardKeyboard = function () {
    if (MF.bindCardKeyboard.done) return;
    MF.bindCardKeyboard.done = true;
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target;
      if (!target || !target.matches || !target.matches('[role="button"][tabindex="0"]')) return;
      if (!target.hasAttribute('data-action')) return;
      event.preventDefault();
      target.click();
    });
  };

  document.addEventListener('submit', async function (event) {
    const form = event.target.closest('form[data-form-type]');
    if (!form) return;
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      await saveEntityForm(form);
    } catch (error) {
      MF.toast('Не удалось сохранить', error.message || 'Проверьте данные и попробуйте снова.', 'error');
      if (submit) submit.disabled = false;
    }
  });

  document.addEventListener('click', async function (event) {
    const actionEl = getActionTarget(event);
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');
    const id = actionEl.getAttribute('data-id');
    if (!action) return;

    if (action === 'close-overlay') {
      event.preventDefault();
      MF.closeTopOverlay();
      return;
    }
    if (action === 'new-character') { event.preventDefault(); MF.openCharacterForm(); return; }
    if (action === 'new-region') { event.preventDefault(); MF.openRegionForm(); return; }
    if (action === 'new-location') { event.preventDefault(); MF.openLocationForm(); return; }
    if (action === 'new-location-in-region') { event.preventDefault(); MF.openLocationForm(null, actionEl.getAttribute('data-id')); return; }
    if (action === 'new-faction') { event.preventDefault(); MF.openFactionForm(); return; }
    if (action === 'new-race') { event.preventDefault(); MF.openRaceForm(); return; }
    if (action === 'new-lore') { event.preventDefault(); MF.openLoreForm(); return; }
    if (action === 'new-book') { event.preventDefault(); MF.openBookForm(); return; }
    if (action === 'new-dnd-sheet') { event.preventDefault(); MF.openDndSheetForm(); return; }
    if (action === 'edit-dnd-sheet') { event.preventDefault(); MF.openDndSheetForm(id); return; }
    if (action === 'delete-dnd-sheet') {
      event.preventDefault();
      MF.openConfirm({
        title: 'Удалить лист D&D?', text: 'Лист будет удалён без возможности отмены.', confirmLabel: 'Удалить',
        onConfirm: async function () {
          const data = MF.state.data;
          data.tombstones = Array.isArray(data.tombstones) ? data.tombstones : [];
          data.tombstones.push({ type: 'dndSheet', id: id, at: MF.nowISO() });
          data.dndSheets = (data.dndSheets || []).filter(function (item) { return item.id !== id; });
          MF.closeAllOverlays();
          await MF.saveNow();
          MF.renderCurrentPage({ keepScroll: true });
          MF.toast('Лист удалён', 'D&D Edition обновлён.', 'success');
        }
      });
      return;
    }
    if (action === 'dnd-import-race') {
      event.preventDefault();
      const ref = MF.DND_RACES.find(function (race) { return race.id === actionEl.getAttribute('data-id'); });
      if (!ref) return;
      const race = MF.findOrCreateRace(MF.dndLabel(ref, 'name'));
      if (race) {
        race.type = MF.LANG === 'en' ? 'D&D people' : 'Народ D&D';
        race.traits = MF.dndLabel(ref, 'traits');
        race.updatedAt = MF.nowISO();
        MF.saveNow().then(function () {
          MF.toast('Раса добавлена в мир', 'Откройте раздел «Расы», чтобы дополнить её.', 'success');
        });
      }
      return;
    }
    if (action === 'dnd-roll-custom') {
      event.preventDefault();
      const input = MF.$('#dndFormula');
      MF.dndRoll(input ? input.value : 'd20', MF.state.diceMode || 'normal');
      return;
    }
    if (action === 'new-map-marker') { event.preventDefault(); MF.openMapMarkerForm(); return; }
    if (action === 'new-map-label') { event.preventDefault(); MF.openMapLabelForm(); return; }
    if (action === 'auto-place-map') { event.preventDefault(); MF.autoPlaceMapLocations(); return; }
    if (action === 'upload-map-image') { event.preventDefault(); await MF.uploadMapImage(); return; }
    if (action === 'clear-map-image') {
      event.preventDefault();
      MF.state.data.map.image = '';
      MF.state.data.map.updatedAt = MF.nowISO();
      await MF.saveNow();
      MF.renderCurrentPage({ keepScroll: true });
      return;
    }
    if (action === 'add-nav-item') { event.preventDefault(); MF.openNavItemForm(); return; }
    if (action === 'remove-nav-extra') { event.preventDefault(); MF.removeNavExtra(actionEl.getAttribute('data-key')); return; }
    if (action === 'reset-nav') { event.preventDefault(); MF.resetNavConfig(); MF.toast('Меню обновлено', 'Возвращён набор пунктов для текущего жанра.', 'success'); return; }
    if (action === 'new-catalog-item') { event.preventDefault(); MF.openCatalogItemForm(actionEl.getAttribute('data-catalog-id')); return; }
    if (action === 'open-catalog-item') { event.preventDefault(); MF.openCatalogItemSheet(id, actionEl.getAttribute('data-catalog-id')); return; }
    if (action === 'edit-catalog-item') { event.preventDefault(); MF.openCatalogItemForm(actionEl.getAttribute('data-catalog-id'), id); return; }
    if (action === 'edit-catalog') { event.preventDefault(); MF.openCatalogForm(id); return; }
    if (action === 'delete-catalog-item') {
      event.preventDefault();
      const catalogId = actionEl.getAttribute('data-catalog-id');
      MF.openConfirm({
        title: 'Удалить запись?', text: 'Запись будет удалена без возможности отмены.', confirmLabel: 'Удалить',
        onConfirm: async function () {
          const data = MF.state.data;
          data.tombstones = Array.isArray(data.tombstones) ? data.tombstones : [];
          data.tombstones.push({ type: 'catalogItem', id: id, at: MF.nowISO() });
          data.tombstones = data.tombstones.slice(-1000);
          data.catalogItems = data.catalogItems.filter(function (item) { return item.id !== id; });
          MF.closeAllOverlays();
          await MF.saveNow();
          MF.refreshNavCounts();
          MF.renderCurrentPage({ keepScroll: true });
          MF.toast('Запись удалена', 'Раздел обновлён.', 'success');
        }
      });
      return;
    }
    if (action === 'new-event') { event.preventDefault(); MF.openEventForm(); return; }
    if (action === 'new-note') { event.preventDefault(); MF.openNoteForm(); return; }
    if (action === 'quick-create-race') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (form) MF.openQuickRaceForm(form);
      return;
    }
    if (action === 'chat-import') { event.preventDefault(); MF.openChatImport(); return; }
    if (action === 'save-api') { event.preventDefault(); await MF.saveApiSettings(); return; }
    if (action === 'clear-api') {
      event.preventDefault();
      MF.openConfirm({
        title: 'Удалить ключ DeepSeek?',
        text: 'Ключ будет удалён с этого компьютера. Импорт из чатов перестанет работать до добавления нового ключа.',
        confirmLabel: 'Удалить ключ',
        onConfirm: async function () { await MF.clearApiSettings(); }
      });
      return;
    }
    if (action === 'run-chat-import') { event.preventDefault(); await MF.runChatImport(actionEl); return; }
    if (action === 'confirm-chat-import') {
      event.preventDefault();
      const pending = MF.state.pendingImport;
      if (!pending || !pending.data) { MF.toast('Нет данных для импорта', 'Сначала разберите текст через DeepSeek.', 'error'); return; }
      const mergeEl = MF.$('#aiMergeExisting');
      actionEl.disabled = true;
      try {
        await MF.importExtractedData(pending.data, !!(mergeEl && mergeEl.checked));
        MF.state.pendingImport = null;
      } catch (error) {
        actionEl.disabled = false;
        MF.toast('Не удалось импортировать', error.message || 'Проверьте данные и попробуйте снова.', 'error');
      }
      return;
    }
    if (action === 'edit-world') { event.preventDefault(); MF.openWorldForm(); return; }
    if (action === 'edit-character') { event.preventDefault(); MF.openCharacterForm(id); return; }
    if (action === 'edit-region') { event.preventDefault(); MF.openRegionForm(id); return; }
    if (action === 'edit-location') { event.preventDefault(); MF.openLocationForm(id); return; }
    if (action === 'edit-faction') { event.preventDefault(); MF.openFactionForm(id); return; }
    if (action === 'edit-race') { event.preventDefault(); MF.openRaceForm(id); return; }
    if (action === 'edit-lore') { event.preventDefault(); MF.openLoreForm(id); return; }
    if (action === 'edit-book') { event.preventDefault(); MF.openBookForm(id); return; }
    if (action === 'edit-event') { event.preventDefault(); MF.openEventForm(id); return; }
    if (action === 'edit-note') { event.preventDefault(); MF.openNoteForm(id); return; }
    if (action === 'open-character') { event.preventDefault(); MF.openCharacterSheet(id); return; }
    if (action === 'open-region') { event.preventDefault(); MF.openRegionSheet(id); return; }
    if (action === 'open-location') { event.preventDefault(); MF.openLocationSheet(id); return; }
    if (action === 'open-faction') { event.preventDefault(); MF.openFactionSheet(id); return; }
    if (action === 'open-race') { event.preventDefault(); MF.openRaceSheet(id); return; }
    if (action === 'open-lore') { event.preventDefault(); MF.openLoreSheet(id); return; }
    if (action === 'open-book') { event.preventDefault(); MF.openBookSheet(id); return; }
    if (action === 'open-event') { event.preventDefault(); MF.openEventSheet(id); return; }
    if (action === 'open-note') { event.preventDefault(); MF.openNoteSheet(id); return; }
    if (action === 'open-activity') {
      event.preventDefault();
      const type = actionEl.getAttribute('data-entity-type');
      const entityId = actionEl.getAttribute('data-entity-id');
      if (type === 'world') MF.openWorldForm();
      else if (type === 'catalogItem' && entityId) {
        const item = MF.state.data.catalogItems.find(function (entry) { return entry.id === entityId; });
        if (item) MF.openCatalogItemSheet(item.id, item.catalogId);
      } else if (type === 'dndSheet' && entityId) {
        MF.openDndSheetForm(entityId);
      } else if (type && entityId) MF.openEntity(type, entityId);
      return;
    }
    if (action === 'show-journal') { event.preventDefault(); MF.openJournal(); return; }
    if (action === 'start-clean') { event.preventDefault(); MF.openStartClean(); return; }
    if (action === 'dismiss-demo') {
      event.preventDefault();
      try { localStorage.setItem('mifarium.demoDismissed', '1'); } catch (e) {}
      MF.renderCurrentPage({ keepScroll: true });
      return;
    }
    if (action === 'delete-character' || action === 'delete-region' || action === 'delete-location' || action === 'delete-faction' || action === 'delete-race' || action === 'delete-lore' || action === 'delete-book' || action === 'delete-event' || action === 'delete-note') {
      event.preventDefault();
      MF.deleteEntity(action.replace('delete-', ''), id);
      return;
    }
    if (action === 'pin-note') {
      event.preventDefault();
      const note = MF.getEntity('note', id);
      if (!note) return;
      note.pinned = !note.pinned;
      note.updatedAt = MF.nowISO();
      MF.state.data.world.updatedAt = MF.nowISO();
      MF.saveNow().then(function () {
        MF.renderCurrentPage({ keepScroll: true });
        if (MF.$('.overlay--drawer')) MF.openNoteSheet(note.id);
        MF.toast(note.pinned ? 'Заметка закреплена' : 'Заметка откреплена', '«' + note.title + '» · ' + MF.formatDate(note.updatedAt), 'success');
      });
      return;
    }
    if (action === 'pick-image') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (form) MF.pickImageFor(form);
      return;
    }
    if (action === 'remove-image') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (form) setFormImage(form, '');
      return;
    }
    if (action === 'add-gallery') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (form) MF.pickGalleryFor(form);
      return;
    }
    if (action === 'remove-gallery') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (!form) return;
      const index = Number(actionEl.getAttribute('data-index'));
      const list = galleryValues(form);
      if (index >= 0 && index < list.length) {
        list.splice(index, 1);
        setGalleryValues(form, list);
      }
      return;
    }
    if (action === 'add-audio') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (form) MF.pickAudioFor(form);
      return;
    }
    if (action === 'remove-audio') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (!form) return;
      const index = Number(actionEl.getAttribute('data-index'));
      const list = audioValues(form);
      if (index >= 0 && index < list.length) {
        list.splice(index, 1);
        setAudioValues(form, list);
      }
      return;
    }
    if (action === 'add-custom-field') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (!form) return;
      const list = form.querySelector('#characterCustomFields');
      if (!list) return;
      const empty = list.querySelector('.custom-fields-empty');
      if (empty) empty.remove();
      list.insertAdjacentHTML('beforeend', customFieldRow({ id: MF.uid('cf') }));
      const rows = list.querySelectorAll('[data-custom-field-row]');
      const last = rows[rows.length - 1];
      if (last) last.querySelector('.custom-field-label').focus();
      return;
    }
    if (action === 'remove-custom-field') {
      event.preventDefault();
      const list = actionEl.closest('#characterCustomFields');
      const row = actionEl.closest('[data-custom-field-row]');
      if (row && row.parentNode) row.parentNode.removeChild(row);
      if (list && !list.querySelector('[data-custom-field-row]')) list.innerHTML = '<div class="custom-fields-empty">' + MF.t('Своих полей пока нет.') + '</div>';
      return;
    }
    if (action === 'add-palette') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (!form) return;
      const list = paletteValues(form);
      if (list.length >= 8) { MF.toast('Палитра заполнена', 'Можно добавить не больше восьми цветов.', 'info'); return; }
      list.push('#C5A15F');
      setPaletteValues(form, list);
      return;
    }
    if (action === 'remove-palette') {
      event.preventDefault();
      const form = actionEl.closest('form[data-form-type]');
      if (!form) return;
      const index = Number(actionEl.getAttribute('data-index'));
      const list = paletteValues(form);
      if (index >= 0 && index < list.length) {
        list.splice(index, 1);
        setPaletteValues(form, list);
      }
      return;
    }
    if (action === 'view-image') {
      event.preventDefault();
      const url = actionEl.getAttribute('data-url');
      if (!url) return;
      const box = actionEl.closest('.detail-gallery, .gallery-field-thumbs');
      let urls = [url];
      if (box) {
        const found = MF.$$('img', box).map(function (img) { return img.getAttribute('src'); }).filter(Boolean);
        if (found.length) urls = found;
      }
      MF.openLightbox(url, urls);
      return;
    }
    if (action === 'close-lightbox') {
      event.preventDefault();
      MF.closeTopOverlay();
      MF.state.lightbox = null;
      return;
    }
    if (action === 'lightbox-prev') { event.preventDefault(); MF.stepLightbox(-1); return; }
    if (action === 'lightbox-next') { event.preventDefault(); MF.stepLightbox(1); return; }
    if (action === 'backup') { event.preventDefault(); MF.makeBackup(); return; }
    if (action === 'restore') { event.preventDefault(); MF.restoreBackup(); return; }
    if (action === 'export-word') { event.preventDefault(); await MF.exportWorld('docx'); return; }
    if (action === 'export-excel') { event.preventDefault(); await MF.exportWorld('xlsx'); return; }
    if (action === 'export-json') { event.preventDefault(); await MF.exportWorld('json'); return; }
    if (action === 'save-app-name') {
      event.preventDefault();
      const input = MF.$('#appNameInput');
      MF.setAppName(input ? input.value : '', { announce: true });
      return;
    }
    if (action === 'check-updates') { event.preventDefault(); await MF.checkUpdates(); return; }
    if (action === 'download-update') { event.preventDefault(); MF.downloadUpdate(); return; }
    if (action === 'save-github') { event.preventDefault(); await MF.saveGithubRepo(false); return; }
    if (action === 'open-github') { event.preventDefault(); MF.openGithub(); return; }
    if (action === 'bloom-rose') {
      event.preventDefault();
      const button = actionEl;
      button.classList.remove('is-blooming');
      void button.offsetWidth;
      button.classList.add('is-blooming');
      for (let i = 0; i < 8; i++) {
        const petal = document.createElement('span');
        petal.className = 'rose-falling-petal';
        petal.style.setProperty('--petal-angle', (i * 45) + 'deg');
        petal.style.setProperty('--petal-delay', (i * 35) + 'ms');
        button.appendChild(petal);
        setTimeout(function () { if (petal.parentNode) petal.parentNode.removeChild(petal); }, 1600 + i * 30);
      }
      setTimeout(function () { button.classList.remove('is-blooming'); }, 1200);
      return;
    }
    if (action === 'reset-ui-scale') { event.preventDefault(); MF.setUiScale(100, { announce: true }); return; }
    if (action === 'reset-character-fields') { event.preventDefault(); MF.resetCharacterFields(); MF.renderCurrentPage({ keepScroll: true }); MF.toast('Поля персонажа', 'Все стандартные поля снова включены.', 'success'); return; }
    if (action === 'choose-sync-folder') { event.preventDefault(); await MF.chooseSyncFolder(); return; }
    if (action === 'save-sync-settings') { event.preventDefault(); await MF.saveSyncSettings(false); return; }
    if (action === 'sync-now') { event.preventDefault(); await MF.syncNow({ silent: false }); return; }
    if (action === 'upload-font') { event.preventDefault(); await MF.uploadFont(); return; }
    if (action === 'upload-background') { event.preventDefault(); await MF.uploadBackground(); return; }
    if (action === 'reset-background') { event.preventDefault(); MF.resetBackground(); return; }
    if (action === 'upload-icon') { event.preventDefault(); await MF.uploadCustomIcon(actionEl.getAttribute('data-nav-key')); return; }
    if (action === 'reset-icon') { event.preventDefault(); MF.resetCustomIcon(actionEl.getAttribute('data-nav-key')); return; }
    if (action === 'open-data-folder') {
      event.preventDefault();
      if (!MF.isNative) { MF.toast('Режим предпросмотра', 'В настольном приложении откроется папка с данными.', 'info'); return; }
      try { await MF.invoke('openDataFolder'); } catch (error) { MF.toast('Не удалось открыть папку', error.message, 'error'); }
      return;
    }
    if (action === 'refresh-info') { event.preventDefault(); MF.refreshInfo(); return; }
    if (action === 'restore-demo') {
      event.preventDefault();
      MF.openConfirm({
        title: 'Вернуть демо-мир?',
        text: 'Текущие записи будут заменены демонстрационным миром «Вереск и Пепел».',
        confirmLabel: 'Вернуть демо',
        onConfirm: async function () {
          MF.state.data = MF.normalizeData(MF.createDemoData());
          MF.closeAllOverlays();
          await MF.saveNow();
          MF.navigate('dashboard');
          MF.toast('Демо-мир восстановлен', nowLabel(), 'success');
        }
      });
      return;
    }
  });

  document.addEventListener('click', function (event) {
    const colorButton = event.target.closest ? event.target.closest('[data-pick-color]') : null;
    if (!colorButton) return;
    event.preventDefault();
    const value = colorButton.getAttribute('data-pick-color');
    const form = colorButton.closest('form');
    if (!form) return;
    const hidden = form.querySelector('#noteColorValue');
    if (hidden) hidden.value = value;
    MF.$$('[data-pick-color]', form).forEach(function (button) { button.classList.toggle('active', button === colorButton); });
  });

  document.addEventListener('input', function (event) {
    if (event.target && event.target.matches && event.target.matches('[data-audio-title]')) {
      updateAudioTrack(event.target);
    }
    if (event.target && event.target.matches && event.target.matches('.palette-input')) {
      const form = event.target.closest('form[data-form-type]');
      if (!form) return;
      const index = Number(event.target.getAttribute('data-palette-index'));
      const list = paletteValues(form);
      if (index < 0 || index >= list.length) return;
      const value = String(event.target.value || '').toUpperCase();
      list[index] = value;
      const hidden = form.querySelector('.js-palette-value');
      if (hidden) hidden.value = JSON.stringify(list);
      const swatch = event.target.closest('.palette-swatch');
      if (swatch) {
        swatch.style.setProperty('--swatch', value);
        const hex = swatch.querySelector('.palette-hex');
        if (hex) hex.textContent = value;
      }
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target && event.target.matches && event.target.matches('[data-audio-kind]')) {
      updateAudioTrack(event.target);
    }
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest) return;
    const backdrop = event.target;
    if (!backdrop.classList || !backdrop.classList.contains('overlay')) return;
    if (event.target.closest('.modal, .drawer')) return;
    MF.closeTopOverlay();
  });

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented) return;
    const target = event.target;
    const inInput = target && (target.matches && target.matches('input, textarea, select, [contenteditable="true"]'));
    if (inInput) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (document.querySelector('#modalRoot .overlay, #searchRoot .search-overlay')) return;
    const key = String(event.key || '').toLowerCase();
    if (key === 'c') { event.preventDefault(); MF.openCharacterForm(); }
    else if (key === 'n') { event.preventDefault(); MF.openNoteForm(); }
    else if (key === 't') { event.preventDefault(); MF.navigate('tree'); }
    else if (key === 'd') { event.preventDefault(); MF.toggleTheme(); }
  });

  MF.bindCardKeyboard();
})();
