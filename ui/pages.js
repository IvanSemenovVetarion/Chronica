/* =========================================================
   Chronica — хронология, заметки и настройки
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  /* ---------- Timeline ---------- */
  MF.filteredEvents = function () {
    const ui = MF.state.ui;
    return MF.state.data.events.filter(function (event) {
      if (ui.timelineEra !== 'all' && event.era !== ui.timelineEra) return false;
      if (ui.timelineType !== 'all' && event.type !== ui.timelineType) return false;
      return true;
    }).sort(function (a, b) {
      const ay = Number(a.sortYear);
      const by = Number(b.sortYear);
      const av = isNaN(ay) ? 0 : ay;
      const bv = isNaN(by) ? 0 : by;
      if (av !== bv) return av - bv;
      return String(a.dateText || '').localeCompare(String(b.dateText || ''), 'ru');
    });
  };

  MF.timelineCard = function (event) {
    const location = MF.getLocation(event.locationId);
    const participants = (event.participantIds || []).map(function (id) { return MF.characterName(id); }).filter(Boolean);
    const type = MF.EVENT_TYPES[event.type] || MF.EVENT_TYPES.other;
    const peopleLabel = participants.slice(0, 3).join(', ') + (participants.length > 3 ? (MF.LANG === 'en' ? ' and ' + (participants.length - 3) + ' more' : ' и ещё ' + (participants.length - 3)) : '');
    return '<article class="timeline-item">' +
      '<div class="timeline-date"><span class="era">' + MF.esc(event.era || 'Вне эпох') + '</span>' +
      '<strong>' + MF.esc(MF.eventYearLabel(event)) + '</strong></div>' +
      '<div class="timeline-marker"></div>' +
      '<div class="timeline-card" role="button" tabindex="0" data-action="open-event" data-id="' + MF.esc(event.id) + '" aria-label="Открыть событие ' + MF.esc(event.title) + '">' +
      '<div class="timeline-card-head"><div>' + MF.eventTypeBadge(event.type) + '</div>' +
      '<span class="date-stamp" title="Добавлено: ' + MF.esc(MF.formatDateFull(event.createdAt)) + '">' + MF.icon('i-clock') + MF.formatDateShort(event.createdAt) + ' · ' + MF.formatTime(event.createdAt) + '</span></div>' +
      '<h3 class="timeline-title">' + MF.esc(event.title) + '</h3>' +
      (event.dateText ? '<div class="timeline-meta" style="border:0;padding:0;margin-top:4px;color:var(--gold)"><span>' + MF.icon('i-calendar') + MF.esc(event.dateText) + '</span></div>' : '') +
      '<p class="timeline-description">' + MF.esc(MF.clampText(event.description || 'Подробности этого события ещё ждут летописца.', 280)) + '</p>' +
      '<div class="timeline-meta">' +
      (location ? '<span>' + MF.icon('i-pin') + MF.esc(location.name) + '</span>' : '') +
      (peopleLabel ? '<span>' + MF.icon('i-users') + MF.esc(peopleLabel) + '</span>' : '') +
      '<span class="meta-spacer">' + type.label + '</span></div>' +
      '</div></article>';
  };

  MF.renderTimelineList = function () {
    const events = MF.filteredEvents();
    if (!events.length) {
      if (!MF.state.data.events.length) {
        return '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-hourglass') + '</div>' +
          '<h2 class="empty-title">Время ещё не началось</h2>' +
          '<p class="empty-text">Запишите первое событие: основание королевства, битву, рождение наследника или магический катаклизм. Хронология соберёт их в единую летопись.</p>' +
          '<button class="btn btn-primary" data-action="new-event">' + MF.icon('i-plus') + 'Добавить событие</button></div>';
      }
      return '<div class="no-results"><strong>В этой части хроники пусто</strong>Снимите фильтры или выберите другую эпоху.</div>';
    }
    return '<div class="timeline-list">' + events.map(MF.timelineCard).join('') + '</div>';
  };

  MF.renderTimeline = function () {
    const data = MF.state.data;
    const ui = MF.state.ui;
    const eras = Array.from(new Set(data.events.map(function (event) { return event.era; }).filter(Boolean)));
    const typeCounts = {};
    data.events.forEach(function (event) { typeCounts[event.type] = (typeCounts[event.type] || 0) + 1; });
    const types = Object.keys(MF.EVENT_TYPES).filter(function (type) { return typeCounts[type]; });
    const chips = '<button class="chip ' + (ui.timelineType === 'all' ? 'active' : '') + '" data-timeline-type="all">Все <span class="count">' + data.events.length + '</span></button>' +
      types.map(function (type) {
        return '<button class="chip ' + (ui.timelineType === type ? 'active' : '') + '" data-timeline-type="' + MF.esc(type) + '">' + MF.esc(MF.EVENT_TYPES[type].label) + ' <span class="count">' + typeCounts[type] + '</span></button>';
      }).join('');
    const eraOptions = '<option value="all">Все эпохи</option>' + eras.map(function (era) {
      return '<option value="' + MF.esc(era) + '"' + (ui.timelineEra === era ? ' selected' : '') + '>' + MF.esc(era) + '</option>';
    }).join('');
    const has = data.events.length > 0;
    const visibleCount = MF.filteredEvents().length;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Летопись мира</div><h1 class="page-title">Хронология</h1>' +
      '<p class="page-subtitle">События, которые изменили мир: войны и союзы, рождение и смерть, магия и случай. Время здесь не линия, а река с водоворотами.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-event">' + MF.icon('i-plus') + 'Новое событие</button></div></div>' +
      (has ? '<div class="timeline-toolbar"><div class="toolbar-left"><div class="chip-row">' + chips + '</div></div>' +
        '<div class="toolbar-right"><select class="select-compact" id="timelineEraFilter" aria-label="Фильтр по эпохе">' + eraOptions + '</select>' +
        '<span class="result-count" id="timelineResultCount">' + visibleCount + ' ' + MF.plural(visibleCount, 'событие', 'события', 'событий') + '</span></div></div>' +
        '<div class="timeline-legend" style="justify-content:flex-end;margin-top:-12px;margin-bottom:12px">' + MF.icon('i-clock') + 'От старых событий к новым · ' + data.events.length + ' в летописи</div>' : '') +
      '<div class="timeline-shell" id="timelineShell">' + MF.renderTimelineList() + '</div></div>';
  };

  MF.bindTimelineFilters = function () {
    MF.$$('[data-timeline-type]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.ui.timelineType = button.getAttribute('data-timeline-type');
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
    const eraSelect = MF.$('#timelineEraFilter');
    if (eraSelect) {
      eraSelect.addEventListener('change', function () {
        MF.state.ui.timelineEra = eraSelect.value;
        MF.renderCurrentPage({ keepScroll: true });
      });
    }
  };

  /* ---------- Notes ---------- */
  MF.filteredNotes = function () {
    const ui = MF.state.ui;
    const query = MF.normalize(ui.notesSearch);
    return MF.state.data.notes.filter(function (note) {
      if (ui.notesFilter === 'pinned' && !note.pinned) return false;
      if (!query) return true;
      return MF.normalize([note.title, note.content, note.color].join(' ')).indexOf(query) !== -1;
    }).sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  };

  MF.noteColorLabel = function (id) {
    const entry = MF.NOTE_COLORS.find(function (color) { return color.id === id; });
    return entry ? entry.label : 'Заметка';
  };

  MF.noteCard = function (note) {
    const color = MF.NOTE_COLORS.some(function (item) { return item.id === note.color; }) ? note.color : 'gold';
    return '<article class="note-card note-card--' + color + (note.pinned ? ' is-pinned' : '') + '" role="button" tabindex="0" data-action="open-note" data-id="' + MF.esc(note.id) + '" aria-label="Открыть заметку ' + MF.esc(note.title) + '">' +
      '<div class="note-top"><span class="note-kicker">' + MF.icon(note.pinned ? 'i-pin' : 'i-feather') + (note.pinned ? 'Закреплено' : MF.esc(MF.noteColorLabel(color))) + '</span>' +
      '<button class="note-pin-btn ' + (note.pinned ? 'is-pinned' : '') + '" data-action="pin-note" data-id="' + MF.esc(note.id) + '" aria-label="' + (note.pinned ? 'Открепить заметку' : 'Закрепить заметку') + '" title="' + (note.pinned ? 'Открепить' : 'Закрепить') + '">' + MF.icon('i-pin') + '</button></div>' +
      '<h3 class="note-title">' + MF.esc(note.title || 'Без названия') + '</h3>' +
      '<p class="note-text">' + MF.esc(MF.clampText(note.content || MF.t('Заметка пока пуста.'), 420)) + '</p>' +
      '<div class="note-footer"><span class="date-stamp" title="Создано: ' + MF.esc(MF.formatDateFull(note.createdAt)) + '">' + MF.icon('i-clock') + MF.formatDate(note.createdAt) + '</span>' +
      '<span class="note-color-dot"></span></div></article>';
  };

  MF.renderNotesBoard = function () {
    const notes = MF.filteredNotes();
    if (!notes.length) {
      if (!MF.state.data.notes.length) {
        return '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-feather') + '</div>' +
          '<h2 class="empty-title">Поле для мыслей</h2>' +
          '<p class="empty-text">Здесь живут сцены, которые ещё не написаны, имена без судеб и вопросы без ответов. Заметки можно закреплять, чтобы важное всегда было на виду.</p>' +
          '<button class="btn btn-primary" data-action="new-note">' + MF.icon('i-plus') + 'Создать заметку</button></div>';
      }
      return '<div class="no-results"><strong>Заметок не нашлось</strong>Измените запрос или покажите все записи.</div>';
    }
    return notes.map(MF.noteCard).join('') +
      '<button class="note-add" data-action="new-note"><span class="add-plus">' + MF.icon('i-plus') + '</span>Новая заметка</button>';
  };

  MF.renderNotes = function () {
    const data = MF.state.data;
    const pinned = data.notes.filter(function (note) { return note.pinned; }).length;
    const has = data.notes.length > 0;
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Мастерская автора</div><h1 class="page-title">Заметки</h1>' +
      '<p class="page-subtitle">Сцены, догадки и обрывки диалогов. Всё, что пока не стало каноном, но уже просится на страницу.</p></div>' +
      '<div class="page-head-actions"><button class="btn btn-primary" data-action="new-note">' + MF.icon('i-plus') + 'Новая заметка</button></div></div>' +
      (has ? '<div class="toolbar"><div class="toolbar-left">' +
        '<div class="search-field">' + MF.icon('i-search') + '<input id="notesSearch" type="search" placeholder="Найти заметку…" value="' + MF.esc(MF.state.ui.notesSearch) + '" autocomplete="off"></div>' +
        '<div class="chip-row"><button class="chip ' + (MF.state.ui.notesFilter === 'all' ? 'active' : '') + '" data-notes-filter="all">Все <span class="count">' + data.notes.length + '</span></button>' +
        '<button class="chip ' + (MF.state.ui.notesFilter === 'pinned' ? 'active' : '') + '" data-notes-filter="pinned">' + MF.icon('i-pin') + 'Закреплённые <span class="count">' + pinned + '</span></button></div>' +
        '</div><div class="toolbar-right"><span class="result-count" id="notesResultCount">' + MF.filteredNotes().length + ' ' + MF.plural(MF.filteredNotes().length, 'заметка', 'заметки', 'заметок') + '</span></div></div>' : '') +
      (has ? '<div class="notes-board" id="notesBoard">' + MF.renderNotesBoard() + '</div>' :
        '<div class="empty-state"><div class="empty-medallion">' + MF.icon('i-feather') + '</div><h2 class="empty-title">Поле для мыслей</h2><p class="empty-text">Здесь живут сцены, которые ещё не написаны, имена без судеб и вопросы без ответов.</p><button class="btn btn-primary" data-action="new-note">' + MF.icon('i-plus') + 'Создать заметку</button></div>') +
      '</div>';
  };

  MF.bindNotesFilters = function () {
    const search = MF.$('#notesSearch');
    if (search) {
      search.addEventListener('input', function () {
        MF.state.ui.notesSearch = search.value;
        const board = MF.$('#notesBoard');
        const count = MF.$('#notesResultCount');
        if (board) board.innerHTML = MF.renderNotesBoard();
        const visible = MF.filteredNotes().length;
        if (count) count.textContent = visible + ' ' + MF.plural(visible, 'заметка', 'заметки', 'заметок');
        if (MF.bindCardKeyboard) MF.bindCardKeyboard();
      });
    }
    MF.$$('[data-notes-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.state.ui.notesFilter = button.getAttribute('data-notes-filter');
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
  };

  /* ---------- Settings ---------- */
  MF.settingsSigil = function () {
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width=".8" opacity=".7"/>' +
      '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 5" opacity=".35"/>' +
      '<path d="M50 12 L56.1 43.9 L88 50 L56.1 56.1 L50 88 L43.9 56.1 L12 50 L43.9 43.9 Z" fill="none" stroke="currentColor" stroke-width=".9"/>' +
      '<circle cx="50" cy="50" r="3.7" fill="currentColor"/></svg>';
  };

  MF.renderSettings = function () {
    const data = MF.state.data;
    const world = data.world;
    const info = MF.state.info || {};
    const api = MF.state.api || {};
    const native = MF.isNative;
    const worldLetter = (world.name || 'М').trim().charAt(0).toUpperCase();
    const lastUpdate = MF.formatDate(world.updatedAt);
    return '<div class="view">' +
      '<div class="page-head"><div class="page-head-main"><div class="eyebrow">Хранитель миров</div><h1 class="page-title">Настройки</h1>' +
      '<p class="page-subtitle">Внешний вид, резервные копии и сведения о мире. Всё хранится только на вашем устройстве.</p></div></div>' +
      '<div class="settings-grid"><div class="settings-column">' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-globe') + 'Язык</h2><span class="section-kicker">' + (MF.LANG === 'en' ? 'Interface language' : 'Интерфейс') + '</span></div>' +
      '<p class="settings-description">Выберите язык интерфейса. Все подписи, формы и подсказки переключатся сразу.</p>' +
      '<div class="language-switch"><button class="language-switch-btn ' + (MF.LANG === 'ru' ? 'active' : '') + '" data-language-choice="ru"><b>RU</b><span>Русский</span></button>' +
      '<button class="language-switch-btn ' + (MF.LANG === 'en' ? 'active' : '') + '" data-language-choice="en"><b>EN</b><span>English</span></button></div></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-moon') + 'Оформление</h2><span class="section-kicker">Палитра и шрифт</span></div>' +
      '<p class="settings-description">Выберите настроение летописи: благородные тёмные палитры, тёплый пергамент и книжный шрифт. Всё меняется сразу и сохраняется.</p>' +
      '<div class="settings-subhead">Палитра</div>' +
      '<div class="theme-list">' +
      MF.THEMES.map(function (theme) {
        return '<button class="theme-row ' + (MF.getTheme() === theme.id ? 'active' : '') + '" data-theme-choice="' + MF.esc(theme.id) + '" aria-label="Тема ' + MF.esc(theme.label) + '">' +
          '<span class="theme-row-swatch" style="background:linear-gradient(145deg,' + MF.esc(theme.bg) + ',' + MF.esc(theme.surface) + ');border-color:' + MF.esc(theme.accent) + '77">' +
          '<i style="background:' + MF.esc(theme.bg) + '"></i><i style="background:' + MF.esc(theme.surface) + '"></i><i style="background:' + MF.esc(theme.accent) + '"></i></span>' +
          '<span class="theme-row-copy"><strong>' + MF.esc(theme.label) + '</strong><small>' + MF.esc(theme.hint) + '</small></span>' +
          '<span class="chk">' + MF.icon('i-check') + '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="settings-subhead">Узор фона</div>' +
      '<div class="pattern-grid">' + MF.PATTERNS.map(function (pattern) {
        return '<button class="pattern-option ' + (MF.getPattern() === pattern.id ? 'active' : '') + '" data-pattern-choice="' + MF.esc(pattern.id) + '" aria-label="' + MF.esc(pattern.label) + '">' +
          '<span class="pattern-swatch" data-pattern-swatch="' + MF.esc(pattern.id) + '"></span>' +
          '<span class="pattern-option-copy"><strong>' + MF.esc(MF.t(pattern.label)) + '</strong><small>' + MF.esc(MF.t(pattern.hint)) + '</small></span></button>';
      }).join('') + '</div>' +
      '<div class="settings-subhead">Масштаб интерфейса</div>' +
      '<div class="ui-scale-row"><input type="range" id="uiScale" min="70" max="160" step="5" value="' + MF.getUiScale() + '"><output id="uiScaleValue">' + MF.getUiScale() + '%</output>' +
      '<button class="btn btn-subtle btn-sm" data-action="reset-ui-scale">100%</button></div>' +
      '<p class="field-hint">Подходит для разных мониторов: 80–95% — компактнее, 110–130% — крупнее.</p>' +
      '<div class="settings-subhead">Шрифт</div>' +
      '<div class="font-options">' +
      MF.allFonts().map(function (font) {
        const sampleClass = font.custom ? '' : ' font-sample--' + MF.esc(font.id);
        const sampleStyle = font.custom ? ' style="font-family:&quot;' + MF.esc(font.family) + '&quot;, Georgia, serif"' : '';
        return '<button class="font-option ' + (MF.getFont() === font.id ? 'active' : '') + '" data-font-choice="' + MF.esc(font.id) + '" aria-label="Шрифт ' + MF.esc(font.label) + '">' +
          '<span class="font-sample' + sampleClass + '"' + sampleStyle + '>' + MF.esc(font.sample) + '</span>' +
          '<span class="font-option-copy"><strong>' + MF.esc(font.label) + (font.custom ? ' <span class="custom-font-badge">свой</span>' : '') + '</strong><small>' + MF.esc(font.hint) + '</small></span>' +
          '<span class="chk">' + MF.icon('i-check') + '</span></button>';
      }).join('') +
      '</div>' +
      '<div class="custom-font-tools"><button class="btn btn-soft btn-sm" data-action="upload-font">' + MF.icon('i-font') + 'Загрузить свой шрифт</button>' +
      '<span class="field-hint">TTF, OTF, WOFF или WOFF2 · до 20 МБ. Для кириллицы проверьте поддержку в шрифте.</span></div>' +
      '<div class="settings-subhead">Название программы</div>' +
      '<div class="app-name-row"><input class="input" id="appNameInput" value="' + MF.esc(MF.getAppName()) + '" maxlength="48" placeholder="Chronica"><button class="btn btn-soft btn-sm" data-action="save-app-name">' + MF.icon('i-check') + 'Сохранить</button></div>' +
      '<p class="field-hint">Название меняется в шапке, на заставке и в заголовке окна. Технические папки и ярлыки остаются прежними.</p></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-sparkles') + 'Жанр и стиль</h2><span class="section-kicker">Настроение мира</span></div>' +
      '<p class="settings-description">Жанр подбирает палитру, шрифт и узор. Любой стиль можно выбрать отдельно — он сохранится вместе с летописью.</p>' +
      '<div class="settings-genre-grid">' + MF.GENRES.map(function (genre) {
        const active = MF.getGenreId() === genre.id || (!MF.getGenreId() && genre.id === 'fantasy');
        return '<button class="settings-genre ' + (active ? 'active' : '') + '" data-genre-choice="' + MF.esc(genre.id) + '">' +
          '<span>' + MF.icon(genre.icon) + '</span><strong>' + MF.esc(MF.LANG === 'en' ? genre.labelEn : genre.label) + '</strong>' +
          '<small>' + MF.esc(MF.LANG === 'en' ? genre.hintEn : genre.hint) + '</small></button>';
      }).join('') + '</div>' +
      '<div class="settings-subhead">Стили жанра</div>' +
      '<div class="settings-style-grid">' + MF.genreMeta(MF.getGenreId() || 'fantasy').themes.map(function (themeId) {
        const theme = MF.themeMeta(themeId);
        return '<button class="settings-style ' + (MF.getTheme() === theme.id ? 'active' : '') + '" data-style-choice="' + MF.esc(theme.id) + '">' +
          '<span class="settings-style-swatch" style="background:linear-gradient(145deg,' + MF.esc(theme.bg) + ',' + MF.esc(theme.surface) + ');border-color:' + MF.esc(theme.accent) + '77"></span>' +
          '<span><strong>' + MF.esc(MF.t(theme.label)) + '</strong><small>' + MF.esc(MF.t(theme.hint)) + '</small></span></button>';
      }).join('') + '</div></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-users') + 'Поля персонажа</h2><span class="section-kicker">Карточка героя</span></div>' +
      '<p class="settings-description">Отключите стандартные поля, которые не нужны вашему миру. Данные при этом сохранятся и вернутся, если поле снова включить.</p>' +
      '<div class="character-fields-grid">' + MF.STANDARD_CHARACTER_FIELDS.map(function (field) {
        return '<label class="character-field-toggle"><span class="switch"><input type="checkbox" data-character-field="' + MF.esc(field.key) + '"' + (MF.isCharacterFieldVisible(field.key) ? ' checked' : '') + '><span class="switch-track"></span></span><span>' + MF.esc(MF.t(field.label)) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="settings-row" style="margin-top:12px"><div class="settings-row-copy"><strong>Свои поля в карточке</strong><span>Цветок, запах, талисман, любимый напиток — добавляются прямо в форме героя.</span></div>' +
      '<button class="btn btn-subtle btn-sm" data-action="reset-character-fields">' + MF.icon('i-refresh') + 'Вернуть все</button></div></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-globe') + 'Профиль мира</h2><span class="section-kicker">Текущий мир</span></div>' +
      '<div class="world-mini"><div class="world-mini-mark">' + MF.esc(worldLetter) + '</div><div class="world-mini-copy"><strong>' + MF.esc(world.name) + '</strong>' +
      '<small>' + MF.esc([world.genre || 'Фэнтези', world.era, world.currentYear].filter(Boolean).join(' · ')) + '</small></div>' +
      '<button class="btn btn-soft btn-sm" data-action="edit-world">' + MF.icon('i-edit') + 'Изменить</button></div>' +
      '<div class="storage-stats"><span><strong>' + data.characters.length + '</strong> персонажей</span><span><strong>' + data.regions.length + '</strong> регионов</span><span><strong>' + data.locations.length + '</strong> локаций</span><span><strong>' + data.races.length + '</strong> рас</span><span><strong>' + data.events.length + '</strong> событий</span><span>обновлён ' + MF.esc(lastUpdate) + '</span></div>' +
      '<div class="settings-row" style="margin-top:12px"><div class="settings-row-copy"><strong>Начать новую летопись</strong><span>Очистить все записи и создать пустой мир. Текущие данные можно сначала сохранить в резервную копию.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="start-clean">Создать мир</button></div></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-folder') + 'Данные</h2><span class="section-kicker">' + (MF.isAndroid ? 'На этом телефоне' : native ? 'На этом компьютере' : 'Предпросмотр') + '</span></div>' +
      '<p class="settings-description">Записи автоматически сохраняются в JSON, изображения — в отдельную папку. Резервная копия собирает их в один архив.</p>' +
      '<div class="settings-row"><div class="settings-row-copy"><strong>Резервная копия</strong><span>Создать архив всех миров и изображений.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="backup">' + MF.icon('i-download') + 'Сохранить копию</button></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><strong>Восстановление</strong><span>Загрузить летопись из архива. Перед заменой текущие данные сохранятся автоматически.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="restore">' + MF.icon('i-upload') + 'Восстановить</button></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><strong>Экспорт в Word</strong><span>Красивый документ со всеми героями, землями и историями. Удобно для печати и чтения.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="export-word">' + MF.icon('i-doc') + 'Word</button></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><strong>Экспорт в Excel</strong><span>Таблицы по персонажам, регионам, локациям, фракциям, событиям и лору.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="export-excel">' + MF.icon('i-table') + 'Excel</button></div>' +
      '<div class="settings-row"><div class="settings-row-copy"><strong>Экспорт JSON</strong><span>Полная летопись одним файлом для переноса или обработки.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="export-json">' + MF.icon('i-download') + 'JSON</button></div>' +
      (MF.isAndroid ? '' : '<div class="settings-row"><div class="settings-row-copy"><strong>Папка данных</strong><span>Открыть расположение файлов в проводнике.</span></div>' +
      '<button class="btn btn-soft btn-sm" data-action="open-data-folder">' + MF.icon('i-external') + 'Открыть</button></div>') +
      '<div class="storage-path" id="storageInfoPath">' + MF.esc(info.storagePath || (native ? 'Определяем…' : 'Локальное хранилище браузера (режим предпросмотра)')) + '</div>' +
      '<div class="storage-stats"><span>Размер летописи: <strong id="storageInfoSize">' + (info.dataSize ? MF.formatBytes(info.dataSize) : '—') + '</strong></span>' +
      '<span>Иллюстрации: <strong id="storageInfoImages">' + (info.imageCount != null ? info.imageCount + ' ' + MF.plural(info.imageCount, 'файл', 'файла', 'файлов') : '—') + '</strong></span>' +
      '<span>Аудио: <strong id="storageInfoAudio">' + (info.audioCount != null ? info.audioCount + ' ' + MF.plural(info.audioCount, 'файл', 'файла', 'файлов') : '—') + '</strong></span>' +
      '<span>Формат: <strong>JSON</strong></span></div></section>' +

      '<section class="panel settings-card ai-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-sparkles') + 'DeepSeek</h2><span class="section-kicker">Импорт из чатов</span></div>' +
      '<p class="settings-description">Подключите API DeepSeek, чтобы разобрать старые переписки и перенести из них мир, героев, регионы, расы, события и лор. Ключ хранится только на этом компьютере.</p>' +
      '<div class="api-status ' + (api.hasKey ? 'is-ready' : '') + '"><span class="api-status-dot"></span><span>' + (api.hasKey ? 'Ключ сохранён · ' + MF.esc(api.keyHint || '') : (native ? 'Ключ ещё не добавлен' : 'Доступно в настольном приложении')) + '</span></div>' +
      '<div class="api-key-row"><div class="form-field"><label class="field-label" for="deepSeekKey">API-ключ DeepSeek</label>' +
      '<input class="input" id="deepSeekKey" type="password" autocomplete="off" spellcheck="false" placeholder="' + (api.hasKey ? 'Оставьте пустым, чтобы не менять' : 'sk-...') + '"' + (native ? '' : ' disabled') + '></div>' +
      '<div class="form-field"><label class="field-label" for="deepSeekModel">Модель</label><select class="select" id="deepSeekModel"' + (native ? '' : ' disabled') + '>' +
      MF.DEEPSEEK_MODELS.map(function (model) {
        return '<option value="' + MF.esc(model.id) + '"' + ((api.model || 'deepseek-chat') === model.id ? ' selected' : '') + '>' + MF.esc(model.label) + '</option>';
      }).join('') + '</select></div></div>' +
      '<div class="api-actions"><button class="btn btn-soft btn-sm" data-action="save-api"' + (native ? '' : ' disabled') + '>' + MF.icon('i-check') + 'Сохранить ключ</button>' +
      (api.hasKey ? '<button class="btn btn-subtle btn-sm" data-action="clear-api">Удалить ключ</button>' : '') +
      '<button class="btn btn-primary btn-sm" data-action="chat-import"' + (native ? '' : ' disabled') + '>' + MF.icon('i-sparkles') + 'Импорт из старых чатов</button></div>' +
      '<p class="field-hint">Ключ шифруется средствами Windows (DPAPI) и сохраняется в settings.json рядом с летописью. Текст переписки отправляется напрямую в DeepSeek только по нажатию «Разобрать».</p></section>' +

      '</div><div class="settings-column">' +
      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-compass') + 'Меню и разделы</h2><span class="section-kicker">Левое меню</span></div>' +
      '<p class="settings-description">Пункты меню подстраиваются под жанр: в стимпанке и постапокалипсисе появляются оружие и транспорт, в фэнтези — артефакты и бестиарий. Ненужные пункты можно скрыть, а свои — добавить.</p>' +
      '<div class="menu-config">' + MF.NAV_GROUPS.map(function (group) {
        const core = MF.CORE_NAV_ITEMS.filter(function (item) { return item.group === group.id && (!item.edition || item.edition === MF.EDITION); });
        const extras = (MF.state.nav && MF.state.nav.extras || []).filter(function (item) { return item.group === group.id; });
        return '<div class="menu-config-group"><div class="menu-config-title">' + MF.esc(MF.t(group.label)) + '</div>' +
          core.map(function (item) {
            return '<label class="menu-config-row"><span class="switch"><input type="checkbox" data-menu-core="' + MF.esc(item.page) + '"' + ((MF.state.nav && MF.state.nav.hiddenCore || []).indexOf(item.page) === -1 ? ' checked' : '') + '><span class="switch-track"></span></span>' + MF.icon(item.icon) + '<span>' + MF.esc(MF.t(item.label)) + '</span><em>' + MF.t('стандартный') + '</em></label>';
          }).join('') +
          extras.map(function (item) {
            return '<div class="menu-config-row"><span class="menu-extra-dot"></span>' + MF.icon(item.icon || 'i-scroll') + '<span>' + MF.esc(MF.LANG === 'en' ? (item.labelEn || item.label) : item.label) + '</span><em>' + (item.custom ? MF.t('свой') : MF.t('жанр')) + '</em>' +
              '<button class="icon-btn is-danger menu-remove" data-action="remove-nav-extra" data-key="' + MF.esc(item.key) + '" title="' + MF.t('Убрать пункт') + '">' + MF.icon('i-x') + '</button></div>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="menu-config-actions"><button class="btn btn-soft btn-sm" data-action="add-nav-item">' + MF.icon('i-plus') + 'Добавить пункт</button>' +
      '<button class="btn btn-subtle btn-sm" data-action="reset-nav">' + MF.icon('i-refresh') + 'Меню жанра</button></div>' +
      '<p class="bg-hint">Скрытые стандартные пункты не удаляются из данных. Кнопка «Меню жанра» возвращает набор, подходящий текущему жанру.</p></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-image') + 'Фон программы</h2><span class="section-kicker">Атмосфера</span></div>' +
      '<p class="settings-description">Своя картина за рабочим столом летописи. Фон виден за карточками и в боковой панели; панели и текст остаются читаемыми благодаря затемнению.</p>' +
      '<div class="bg-preview' + (MF.background.url ? ' has-image' : '') + '" id="bgPreview"' + (MF.background.url ? ' style="background-image:url(&quot;' + MF.esc(MF.background.url) + '&quot;)"' : '') + '></div>' +
      '<div class="bg-actions"><button class="btn btn-soft btn-sm" data-action="upload-background">' + MF.icon('i-upload') + 'Загрузить фон</button>' +
      (MF.background.url ? '<button class="btn btn-subtle btn-sm" data-action="reset-background">' + MF.icon('i-trash') + 'Убрать</button>' : '') + '</div>' +
      '<div class="bg-controls"><label class="bg-control"><span>Размытие</span><input type="range" id="bgBlur" min="0" max="30" step="1" value="' + MF.background.blur + '"><output id="bgBlurValue">' + MF.background.blur + ' px</output></label>' +
      '<label class="bg-control"><span>Затемнение</span><input type="range" id="bgDim" min="0" max="80" step="4" value="' + MF.background.dim + '"><output id="bgDimValue">' + MF.background.dim + '%</output></label></div>' +
      '<p class="bg-hint">Рекомендуемое разрешение фона: <strong>2560×1440 px</strong> (подойдёт 1920×1080), горизонтальный кадр, JPG/PNG/WebP, до 30 МБ. Края лучше оставлять свободными: изображение растягивается на весь экран.</p></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-gallery') + 'Иконки разделов</h2><span class="section-kicker">Свои знаки</span></div>' +
      '<p class="settings-description">Замените стандартные иконки бокового меню своими. Пока иконка не загружена, остаётся знак темы.</p>' +
      '<div class="icon-custom-grid">' + MF.NAV_ICONS.map(function (entry) {
        const custom = MF.customIcons[entry.key] || '';
        return '<div class="icon-custom-row"><span class="icon-custom-preview">' +
          (custom ? '<img src="' + MF.esc(custom) + '" alt="">' : MF.icon(entry.icon)) + '</span>' +
          '<span class="icon-custom-label">' + MF.esc(entry.label) + '</span>' +
          '<button class="btn btn-subtle btn-sm" data-action="upload-icon" data-nav-key="' + MF.esc(entry.key) + '">' + (custom ? 'Заменить' : 'Загрузить') + '</button>' +
          (custom ? '<button class="btn btn-ghost btn-sm" data-action="reset-icon" data-nav-key="' + MF.esc(entry.key) + '">' + MF.icon('i-x') + '</button>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<p class="bg-hint">Иконки: <strong>128×128 px</strong> (минимум 64×64), квадратные PNG или SVG с прозрачным фоном, до 5 МБ. Они отображаются в меню слева.</p></section>' +

      '<section class="panel settings-card sync-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-link') + 'Совместная работа</h2><span class="section-kicker">Общая папка</span></div>' +
      '<p class="settings-description">Выберите папку, которую синхронизирует Яндекс Диск, Google Drive или OneDrive. Каждый участник работает со своей копией, а Chronica объединяет изменения по времени записи.</p>' +
      '<div class="sync-status" id="syncStatus">Не подключено</div>' +
      '<div class="sync-folder-row"><input class="input" id="syncFolderInput" readonly placeholder="Папка не выбрана"><button class="btn btn-soft btn-sm" data-action="choose-sync-folder">' + MF.icon('i-folder') + 'Выбрать</button></div>' +
      '<div class="sync-grid"><div class="form-field"><label class="field-label" for="syncNameInput">Ваше имя в команде</label><input class="input" id="syncNameInput" maxlength="40" placeholder="Например, Анна"></div>' +
      '<label class="toggle-line sync-auto"><span class="toggle-line-copy"><strong>Автосинхронизация</strong><span>Проверять общую папку каждые 20 секунд.</span></span><span class="switch"><input type="checkbox" id="syncAutoInput" checked><span class="switch-track"></span></span></label>' +
      '<label class="toggle-line sync-auto"><span class="toggle-line-copy"><strong>Копировать изображения, аудио и шрифты</strong><span>Файлы будут складываться в ChronicaAssets. Это может увеличить размер облачной папки.</span></span><span class="switch"><input type="checkbox" id="syncAssetsInput" checked><span class="switch-track"></span></span></label></div>' +
      '<div class="sync-actions"><button class="btn btn-primary btn-sm" data-action="sync-now">' + MF.icon('i-refresh') + 'Синхронизировать</button><button class="btn btn-subtle btn-sm" data-action="save-sync-settings">' + MF.icon('i-check') + 'Сохранить</button></div>' +
      '<div class="sync-meta"><span id="syncPath">Папка не выбрана</span><span>Последняя синхронизация: <b id="syncLast">ещё не было</b></span></div>' +
      '<p class="bg-hint">Авторизация в облаке выполняется в Яндекс Диске или Google Drive. Chronica не получает пароли и не использует собственный сервер. Для старта выберите папку с файлом <strong>ChronicaShared.json</strong> у всех участников.</p></section>' +

      '<section class="panel settings-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-compass') + 'Быстрые клавиши</h2></div>' +
      '<div class="shortcuts-grid">' +
      '<div class="shortcut-row"><span>Поиск по миру</span><kbd class="key">Ctrl K</kbd></div>' +
      '<div class="shortcut-row"><span>Закрыть окно</span><kbd class="key">Esc</kbd></div>' +
      '<div class="shortcut-row"><span>Создать персонажа</span><kbd class="key">C</kbd></div>' +
      '<div class="shortcut-row"><span>Создать заметку</span><kbd class="key">N</kbd></div>' +
      '<div class="shortcut-row"><span>Древо рода</span><kbd class="key">T</kbd></div>' +
      '<div class="shortcut-row"><span>Сменить тему</span><kbd class="key">D</kbd></div></div>' +
      '<p class="field-hint" style="margin-top:10px">Горячие клавиши работают, когда курсор не находится в поле ввода.</p></section>' +

      '<section class="panel settings-card update-card"><div class="section-heading"><h2 class="section-title">' + MF.icon('i-refresh') + 'Обновления</h2><span class="section-kicker">GitHub Releases</span></div>' +
      '<p class="settings-description">Chronica проверяет последний релиз в вашем GitHub-репозитории и может скачать установщик обновления. Репозиторий и релизы должны быть публичными.</p>' +
      '<div class="update-current">Текущая версия: <strong id="updateCurrentVersion">v' + MF.esc(MF.VERSION) + '</strong></div>' +
      '<div class="github-row"><input class="input" id="githubRepoInput" value="' + MF.esc((MF.state.info && MF.state.info.githubRepo) || 'IvanSemenovVetarion/Chronica') + '" placeholder="владелец/репозиторий"><button class="btn btn-subtle btn-sm" data-action="save-github">' + MF.icon('i-check') + 'Сохранить</button></div>' +
      '<div class="update-actions"><button class="btn btn-soft btn-sm" data-action="check-updates">' + MF.icon('i-refresh') + 'Проверить обновления</button>' +
      '<button class="btn btn-subtle btn-sm" data-action="open-github">' + MF.icon('i-external') + 'GitHub</button>' +
      '<button class="btn btn-primary btn-sm is-hidden" id="updateDownloadBtn" data-action="download-update">' + MF.icon('i-download') + 'Скачать обновление</button></div>' +
      '<div class="update-status" id="updateStatus">Проверка ещё не выполнялась.</div>' +
      '<p class="bg-hint">Для обновления добавьте в GitHub Release файл установщика <strong>' + (MF.EDITION === 'dnd' ? 'ChronicaDnDSetup.exe' : 'ChronicaSetup.exe') + '</strong>. Приложение скачает его и предложит запустить.</p></section>' +

      '<section class="panel settings-card about-card"><div class="about-sigil" style="color:var(--gold)">' + MF.settingsSigil() + '</div>' +
      '<div class="about-title">' + MF.esc(MF.getAppName()) + '</div><div class="about-version">' + (MF.EDITION === 'dnd' ? 'D&D Edition' : 'хранитель миров') + ' · v' + MF.esc(MF.VERSION) + (MF.isAndroid && MF.state.info && MF.state.info.build ? ' · сборка ' + MF.esc(String(MF.state.info.build)) : '') + '</div>' +
      '<p class="about-text">Тихий кабинет для больших историй. Ваши миры, герои, рисунки и хроники остаются только у вас — без облака и регистрации.</p>' +
      '<div class="about-love"><span>' + MF.t('Сделано с любовью для') + '</span> <a class="about-love-link" href="https://vk.ru/titzero" target="_blank" rel="noreferrer">@Titzero</a>' +
      '<button type="button" class="about-rose" data-action="bloom-rose" title="' + MF.t('Нажмите на розу') + '" aria-label="' + MF.t('Нажмите на розу') + '">' +
      '<svg viewBox="0 0 54 54" aria-hidden="true"><path class="rose-stem" d="M27 28C25 36 24 43 22 50"/><path class="rose-leaf" d="M25 39c-7-3-9-8-6-12 5 1 8 5 6 12z"/><path class="rose-leaf rose-leaf--two" d="M24 45c6-3 9-8 7-12-5 1-8 5-7 12z"/>' +
      '<g class="rose-petals"><path d="M27 10c5 0 9 4 9 9 0 6-4 10-9 10s-9-4-9-10c0-5 4-9 9-9z"/><path d="M18 15c-4 3-4 9 0 13 3 3 7 3 10 0"/><path d="M36 15c4 3 4 9 0 13-3 3-7 3-10 0"/><path d="M22 25c2 4 8 4 10 0"/></g></svg></button></div>' +
      '<div class="about-dedication">Автор проекта<span>Vetarion</span></div>' +
      '<button class="btn btn-subtle btn-sm about-github" data-action="open-github">' + MF.icon('i-external') + 'GitHub проекта</button>' +
      '<div class="about-foot">Создано для художников, писателей и мастеров воображаемых земель.<br>' + (MF.isAndroid ? 'Мобильное издание · Android' : native ? 'Настольное издание · Windows' : 'Веб-предпросмотр') + '</div></section>' +
      '</div></div></div>';
  };

  MF.bindSettings = function () {
    MF.$$('[data-language-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.switchLanguage(button.getAttribute('data-language-choice'));
      });
    });
    MF.$$('[data-menu-core]').forEach(function (button) {
      button.addEventListener('change', function () {
        MF.setCoreNavVisible(button.getAttribute('data-menu-core'), button.checked);
      });
    });
    MF.$$('[data-character-field]').forEach(function (button) {
      button.addEventListener('change', function () {
        MF.setCharacterFieldVisible(button.getAttribute('data-character-field'), button.checked);
      });
    });
    MF.$$('[data-pattern-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.setPattern(button.getAttribute('data-pattern-choice'), { announce: true });
      });
    });
    MF.$$('[data-genre-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.applyGenre(button.getAttribute('data-genre-choice'), { announce: true });
      });
    });
    MF.$$('[data-style-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.setTheme(button.getAttribute('data-style-choice'), { announce: true });
        MF.renderCurrentPage({ keepScroll: true });
      });
    });
    MF.$$('[data-theme-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.setTheme(button.getAttribute('data-theme-choice'), { announce: true });
        MF.refreshStorageLabels();
      });
    });
    MF.$$('[data-font-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        MF.setFont(button.getAttribute('data-font-choice'), { announce: true });
      });
    });
    const appNameInput = MF.$('#appNameInput');
    if (appNameInput) {
      appNameInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        MF.setAppName(appNameInput.value, { announce: true });
      });
    }
    const uiScale = MF.$('#uiScale');
    if (uiScale) uiScale.addEventListener('input', function (e) { MF.setUiScale(e.target.value); });
    const blur = MF.$('#bgBlur');
    if (blur) blur.addEventListener('input', function (e) { MF.setBackgroundBlur(e.target.value); });
    const dim = MF.$('#bgDim');
    if (dim) dim.addEventListener('input', function (e) { MF.setBackgroundDim(e.target.value); });
    MF.applyBackground();
    MF.applyCustomIcons();
    MF.syncUiScaleControls();
    MF.refreshSyncStatus();
    MF.refreshUpdateUI();
    MF.syncThemeOptions();
    MF.syncFontOptions();
    MF.refreshStorageLabels();
  };
})();
