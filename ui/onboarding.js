/* =========================================================
   Chronica — first-run language and genre onboarding
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  MF.onboardingNeeded = function () {
    try { return localStorage.getItem('mifarium.onboarding.v1') !== '1'; } catch (e) { return true; }
  };

  function tx(ru, en) {
    return MF.LANG === 'en' ? en : ru;
  }

  function sigil() {
    return '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="onb-ring onb-ring--outer" cx="60" cy="60" r="52"/>' +
      '<circle class="onb-ring onb-ring--inner" cx="60" cy="60" r="42"/>' +
      '<circle class="onb-ring onb-ring--dash" cx="60" cy="60" r="34"/>' +
      '<path class="onb-star" d="M60 14 L67.8 51.2 L105 60 L67.8 68.8 L60 106 L52.2 68.8 L15 60 L52.2 51.2 Z"/>' +
      '<circle class="onb-core" cx="60" cy="60" r="4.6"/>' +
      '<circle class="onb-orbit" cx="60" cy="60" r="52"/>' +
    '</svg>';
  }

  function languageStep() {
    return '<div class="onboarding-step onboarding-step--language">' +
      '<div class="onboarding-sigil-wrap">' + sigil() + '</div>' +
      '<div class="onboarding-kicker">' + tx('Хранитель миров', 'Keeper of Worlds') + '</div>' +
      '<h1 class="onboarding-title">' + (MF.EDITION === 'dnd' ? 'Chronika' : 'Chronica') + '</h1>' +
      (MF.EDITION === 'dnd' ? '<div class="onboarding-edition">DnD Edition</div>' : '') +
      '<p class="onboarding-lede">' + tx('Выберите язык интерфейса. Позже его можно сменить в настройках.', 'Choose your interface language. You can change it later in settings.') + '</p>' +
      '<div class="language-choices">' +
        '<button class="language-card" data-onb-lang="ru"><span class="language-mark">RU</span><span class="language-copy"><strong>Русский</strong><small>Русский язык</small></span><span class="language-arrow">→</span></button>' +
        '<button class="language-card" data-onb-lang="en"><span class="language-mark">EN</span><span class="language-copy"><strong>English</strong><small>English language</small></span><span class="language-arrow">→</span></button>' +
      '</div>' +
      '<div class="onboarding-foot">' + tx('Ваши миры остаются только у вас', 'Your worlds stay with you') + '</div>' +
    '</div>';
  }

  function genreStep() {
    const selectedGenre = MF.genreMeta(localStorage.getItem('mifarium.genre') || (MF.EDITION === 'dnd' ? 'dnd' : 'fantasy'));
    const selectedStyle = localStorage.getItem('mifarium.initStyle') || selectedGenre.themes[0];
    const selectedPattern = localStorage.getItem('mifarium.pattern') || selectedGenre.pattern;
    const genres = MF.GENRES.map(function (genre) {
      const active = genre.id === selectedGenre.id;
      return '<button class="genre-card' + (active ? ' active' : '') + '" data-onb-genre="' + MF.esc(genre.id) + '">' +
        '<span class="genre-icon">' + MF.icon(genre.icon) + '</span>' +
        '<span class="genre-copy"><strong>' + MF.esc(MF.LANG === 'en' ? genre.labelEn : genre.label) + '</strong>' +
        '<small>' + MF.esc(MF.LANG === 'en' ? genre.hintEn : genre.hint) + '</small></span>' +
        '<span class="genre-check">' + MF.icon('i-check') + '</span></button>';
    }).join('');
    const styles = selectedGenre.themes.map(function (themeId) {
      const theme = MF.themeMeta(themeId);
      const active = theme.id === selectedStyle;
      return '<button class="onb-style' + (active ? ' active' : '') + '" data-onb-style="' + MF.esc(theme.id) + '">' +
        '<span class="onb-style-swatch" style="background:linear-gradient(145deg,' + MF.esc(theme.bg) + ',' + MF.esc(theme.surface) + ');border-color:' + MF.esc(theme.accent) + '77">' +
        '<i style="background:' + MF.esc(theme.accent) + '"></i><i style="background:' + MF.esc(theme.surface) + '"></i></span>' +
        '<span class="onb-style-copy"><strong>' + MF.esc(MF.t(theme.label)) + '</strong><small>' + MF.esc(MF.t(theme.hint)) + '</small></span></button>';
    }).join('');
    const patterns = ['contour', 'runes', 'stars', 'grid', 'waves', 'gears'].map(function (patternId) {
      const pattern = MF.PATTERNS.find(function (item) { return item.id === patternId; }) || MF.PATTERNS[0];
      return '<button class="onb-pattern' + (pattern.id === selectedPattern ? ' active' : '') + '" data-onb-pattern="' + MF.esc(pattern.id) + '" title="' + MF.esc(MF.t(pattern.label)) + '">' +
        '<span class="pattern-swatch" data-pattern-swatch="' + MF.esc(pattern.id) + '"></span><span>' + MF.esc(MF.t(pattern.label)) + '</span></button>';
    }).join('');
    return '<div class="onboarding-step onboarding-step--genre">' +
      '<div class="onboarding-heading"><div class="onboarding-kicker">' + tx('Настройка летописи', 'Chronicle setup') + '</div>' +
      '<h2 class="onboarding-title onboarding-title--small">' + tx('Выберите жанр мира', 'Choose your world genre') + '</h2>' +
      '<p class="onboarding-lede">' + tx('Chronica подберёт палитру, шрифт и узор фона. Всё можно изменить позже.', 'Chronica will pick a palette, font and background pattern. You can change everything later.') + '</p></div>' +
      '<div class="genre-grid">' + genres + '</div>' +
      '<div class="onboarding-subhead">' + tx('Стиль оформления', 'Design style') + '</div>' +
      '<div class="onb-style-grid">' + styles + '</div>' +
      '<div class="onboarding-subhead">' + tx('Узор фона', 'Background pattern') + '</div>' +
      '<div class="onb-pattern-grid">' + patterns + '</div>' +
      '<div class="onboarding-actions"><button class="btn btn-ghost" data-onb-back>← ' + tx('Язык', 'Language') + '</button>' +
      '<button class="btn btn-primary onboarding-start" data-onb-start>' + MF.icon('i-sparkles') + tx('Начать летопись', 'Begin the chronicle') + '</button></div>' +
      '<div class="onboarding-foot">' + tx('Можно изменить в настройках', 'You can change this in settings') + '</div>' +
    '</div>';
  }

  function render(step, selectedGenreId) {
    const root = MF.$('#onboardingRoot');
    if (!root) return;
    if (step === 'language') {
      root.innerHTML = '<div class="onboarding-screen">' + languageStep() + '</div>';
    } else {
      if (selectedGenreId) {
        const genre = MF.genreMeta(selectedGenreId);
        if (genre.themes.indexOf(localStorage.getItem('mifarium.initStyle')) === -1) localStorage.setItem('mifarium.initStyle', genre.themes[0]);
        localStorage.setItem('mifarium.genre', genre.id);
        localStorage.setItem('mifarium.initStyle', localStorage.getItem('mifarium.initStyle') || genre.themes[0]);
        localStorage.setItem('mifarium.pattern', genre.pattern);
        localStorage.setItem('mifarium.theme', localStorage.getItem('mifarium.initStyle') || genre.themes[0]);
        localStorage.setItem('mifarium.font', genre.font || 'forum');
      }
      const currentGenre = MF.genreMeta(localStorage.getItem('mifarium.genre') || (MF.EDITION === 'dnd' ? 'dnd' : 'fantasy'));
      const currentStyle = localStorage.getItem('mifarium.initStyle') || currentGenre.themes[0];
      const currentPattern = localStorage.getItem('mifarium.pattern') || currentGenre.pattern;
      applyPreview(currentStyle, currentPattern);
      root.innerHTML = '<div class="onboarding-screen onboarding-screen--genre">' + genreStep() + '</div>';
    }
    bind(step);
    if (MF.localizeDom && MF.LANG === 'en') MF.localizeDom(root);
  }

  function applyPreview(styleId, patternId) {
    if (styleId) {
      document.documentElement.setAttribute('data-theme', styleId);
      localStorage.setItem('mifarium.theme', styleId);
      localStorage.setItem('mifarium.initStyle', styleId);
    }
    if (patternId) {
      document.documentElement.setAttribute('data-pattern', patternId);
      localStorage.setItem('mifarium.pattern', patternId);
    }
    const genre = MF.genreMeta(localStorage.getItem('mifarium.genre') || (MF.EDITION === 'dnd' ? 'dnd' : 'fantasy'));
    if (genre.font) {
      document.documentElement.setAttribute('data-font', genre.font);
      localStorage.setItem('mifarium.font', genre.font);
    }
  }

  function bind(step) {
    const root = MF.$('#onboardingRoot');
    if (!root) return;
    if (step === 'language') {
      root.querySelectorAll('[data-onb-lang]').forEach(function (button) {
        button.addEventListener('click', function () {
          const lang = button.getAttribute('data-onb-lang');
          MF.LANG = lang;
          try { localStorage.setItem('mifarium.lang', lang); } catch (e) {}
          document.documentElement.setAttribute('lang', lang);
          MF.refreshDateFormats();
          render('genre');
        });
      });
      return;
    }
    root.querySelectorAll('[data-onb-genre]').forEach(function (button) {
      button.addEventListener('click', function () {
        const id = button.getAttribute('data-onb-genre');
        const genre = MF.genreMeta(id);
        localStorage.setItem('mifarium.genre', id);
        localStorage.setItem('mifarium.initStyle', genre.themes[0]);
        localStorage.setItem('mifarium.pattern', genre.pattern);
        applyPreview(genre.themes[0], genre.pattern);
        render('genre', id);
      });
    });
    root.querySelectorAll('[data-onb-style]').forEach(function (button) {
      button.addEventListener('click', function () {
        const style = button.getAttribute('data-onb-style');
        applyPreview(style, null);
        root.querySelectorAll('[data-onb-style]').forEach(function (item) { item.classList.toggle('active', item === button); });
      });
    });
    root.querySelectorAll('[data-onb-pattern]').forEach(function (button) {
      button.addEventListener('click', function () {
        const pattern = button.getAttribute('data-onb-pattern');
        applyPreview(null, pattern);
        root.querySelectorAll('[data-onb-pattern]').forEach(function (item) { item.classList.toggle('active', item === button); });
      });
    });
    const back = root.querySelector('[data-onb-back]');
    if (back) back.addEventListener('click', function () { render('language'); });
    const start = root.querySelector('[data-onb-start]');
    if (start) start.addEventListener('click', function () {
      const genreId = localStorage.getItem('mifarium.genre') || (MF.EDITION === 'dnd' ? 'dnd' : 'fantasy');
      const genre = MF.genreMeta(genreId);
      const style = localStorage.getItem('mifarium.initStyle') || genre.themes[0];
      localStorage.setItem('mifarium.genre', genreId);
      localStorage.setItem('mifarium.onboarding.v1', '1');
      localStorage.setItem('mifarium.theme', style);
      localStorage.setItem('mifarium.pattern', localStorage.getItem('mifarium.pattern') || genre.pattern);
      localStorage.setItem('mifarium.font', genre.font || 'forum');
      MF.pendingGenre = genreId;
      MF.state.pendingGenre = genreId;
      applyPreview(style, localStorage.getItem('mifarium.pattern'));
      const el = MF.$('#onboardingRoot');
      if (el) el.classList.add('is-leaving');
      setTimeout(function () {
        if (el) el.remove();
        document.body.classList.remove('onboarding-lock');
        MF.boot();
      }, 520);
    });
  }

  MF.startOnboarding = function () {
    let root = MF.$('#onboardingRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'onboardingRoot';
      document.body.appendChild(root);
    }
    document.body.classList.add('onboarding-lock');
    if (MF.applyUiScale) MF.applyUiScale();
    const saved = (function () { try { return localStorage.getItem('mifarium.lang'); } catch (e) { return ''; } })();
    if (saved === 'ru' || saved === 'en') {
      MF.LANG = saved;
      document.documentElement.setAttribute('lang', saved);
      MF.refreshDateFormats();
      render('genre');
    } else {
      render('language');
    }
  };
})();
