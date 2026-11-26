/* =========================================================
   Chronica — процедурные портреты и иллюстрации
   ========================================================= */
(function () {
  'use strict';
  const MF = window.MF;

  function hashStr(str) {
    let h = 0;
    const s = String(str || 'mifarium');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  MF.hashStr = hashStr;

  const PORTRAIT_PALETTES = [
    { sky1: '#22343e', sky2: '#0b151b', halo: '#e0c181', hill: '#17262d', robe1: '#314a55', robe2: '#101b21', accent: '#d8b974', line: '#e9d4a3' },
    { sky1: '#302735', sky2: '#100e17', halo: '#d2a28d', hill: '#231b27', robe1: '#433344', robe2: '#151017', accent: '#c99a86', line: '#e0bba6' },
    { sky1: '#20322b', sky2: '#09130f', halo: '#b7d0a8', hill: '#17251e', robe1: '#304b3c', robe2: '#0d1812', accent: '#a9c79c', line: '#d0e0bd' },
    { sky1: '#252d40', sky2: '#0c101a', halo: '#a9c2dd', hill: '#19202e', robe1: '#314055', robe2: '#0d141d', accent: '#9cb7d2', line: '#cfddec' },
    { sky1: '#362e22', sky2: '#130f09', halo: '#e3b97b', hill: '#251e13', robe1: '#493c27', robe2: '#171109', accent: '#d6aa69', line: '#eed1a0' },
    { sky1: '#2d2b24', sky2: '#10100c', halo: '#c7c19f', hill: '#1f1e17', robe1: '#3e3e30', robe2: '#14140f', accent: '#beb893', line: '#ddd6b8' }
  ];

  function portraitFigure(variant, p, uid) {
    const robe = 'url(#' + uid + 'robe)';
    const hood = 'url(#' + uid + 'hood)';
    const gold = 'url(#' + uid + 'gold)';
    if (variant === 1) {
      return '' +
        '<path d="M38 400 C48 332 86 294 134 284 L186 284 C234 294 272 332 282 400 Z" fill="' + robe + '" />' +
        '<path d="M101 400 C108 350 128 325 160 325 C192 325 212 350 219 400 Z" fill="' + p.robe2 + '" opacity=".75"/>' +
        '<circle cx="160" cy="232" r="48" fill="#111b20"/>' +
        '<path d="M122 202 C129 165 141 147 160 147 C179 147 191 165 198 202 C184 185 173 180 160 180 C147 180 136 185 122 202Z" fill="' + p.robe2 + '"/>' +
        '<path d="M121 187 L141 155 L160 174 L179 155 L199 187 L189 195 L181 176 L163 192 L157 192 L139 176 L131 195 Z" fill="' + gold + '" opacity=".9"/>' +
        '<path d="M139 196 L160 169 L181 196 L171 203 L163 192 L157 192 L149 203 Z" fill="' + p.halo + '" opacity=".28"/>' +
        '<path d="M118 254 C134 244 146 240 160 240 C174 240 186 244 202 254" stroke="' + gold + '" stroke-width="1.6" opacity=".6" fill="none"/>' +
        '<path d="M160 264 L166 274 L160 284 L154 274 Z" fill="' + p.accent + '" opacity=".8"/>';
    }
    if (variant === 2) {
      return '' +
        '<path d="M31 400 C44 326 84 288 134 277 L186 277 C236 288 276 326 289 400 Z" fill="' + robe + '" />' +
        '<path d="M104 400 C112 351 131 327 160 327 C189 327 208 351 216 400 Z" fill="' + p.robe2 + '" opacity=".72"/>' +
        '<path d="M105 243 C103 187 126 150 160 150 C194 150 217 187 215 243 C204 267 184 280 160 280 C136 280 116 267 105 243 Z" fill="' + p.robe2 + '"/>' +
        '<path d="M130 246 C136 213 143 196 160 196 C177 196 184 213 190 246 C181 261 171 269 160 269 C149 269 139 261 130 246 Z" fill="#080f13" opacity=".82"/>' +
        '<path d="M113 201 C96 172 101 145 118 139 C106 159 110 178 124 193 Z" fill="' + gold + '" opacity=".55"/>' +
        '<path d="M207 201 C224 172 219 145 202 139 C214 159 210 178 196 193 Z" fill="' + gold + '" opacity=".55"/>' +
        '<path d="M122 270 C139 260 149 255 160 255 C171 255 181 260 198 270" stroke="' + gold + '" stroke-width="1.4" opacity=".45" fill="none"/>';
    }
    if (variant === 3) {
      return '' +
        '<path d="M37 400 C48 334 85 294 134 283 L186 283 C236 294 273 334 283 400 Z" fill="' + robe + '" />' +
        '<path d="M91 250 C88 185 121 146 160 146 C199 146 232 185 229 250 C214 280 189 294 160 294 C131 294 106 280 91 250 Z" fill="' + p.robe2 + '" opacity=".65"/>' +
        '<path d="M127 254 C133 215 142 194 160 194 C178 194 187 215 193 254 C184 274 173 284 160 284 C147 284 136 274 127 254 Z" fill="#070d10" opacity=".8"/>' +
        '<path d="M84 260 C68 291 71 342 91 372" stroke="' + p.halo + '" stroke-width="1" opacity=".25" fill="none"/>' +
        '<path d="M236 260 C252 291 249 342 229 372" stroke="' + p.halo + '" stroke-width="1" opacity=".25" fill="none"/>' +
        '<path d="M100 247 C113 229 132 217 160 217 C188 217 207 229 220 247" stroke="' + gold + '" stroke-width="1.5" opacity=".38" fill="none"/>' +
        '<path d="M160 295 L164 307 L160 318 L156 307 Z" fill="' + p.accent + '" opacity=".6"/>';
    }
    return '' +
      '<path d="M35 400 C47 329 86 291 134 280 L186 280 C234 291 273 329 285 400 Z" fill="' + robe + '" />' +
      '<path d="M103 246 C101 186 125 148 160 148 C195 148 219 186 217 246 C207 270 184 283 160 283 C136 283 113 270 103 246 Z" fill="' + hood + '" />' +
      '<path d="M126 247 C132 212 142 193 160 193 C178 193 188 212 194 247 C184 266 173 274 160 274 C147 274 136 266 126 247 Z" fill="#071015" opacity=".86"/>' +
      '<path d="M112 156 C138 136 182 136 208 156 C196 143 179 136 160 136 C141 136 124 143 112 156Z" fill="' + p.halo + '" opacity=".18"/>' +
      '<path d="M121 272 C138 260 148 255 160 255 C172 255 182 260 199 272" stroke="' + gold + '" stroke-width="1.5" opacity=".42" fill="none"/>' +
      '<circle cx="160" cy="285" r="2" fill="' + p.accent + '" opacity=".8"/>';
  }

  MF.portraitArt = function (character) {
    const seed = hashStr((character && (character.id || character.name)) || 'герой');
    const p = PORTRAIT_PALETTES[seed % PORTRAIT_PALETTES.length];
    const variant = seed % 4;
    const uid = 'pfa' + seed;
    const initial = MF.initials(character && character.name);
    const stars = [];
    for (let i = 0; i < 13; i++) {
      const x = 28 + ((seed * (i + 17) * 31) % 264);
      const y = 30 + ((seed * (i + 11) * 19) % 220);
      const r = i % 5 === 0 ? 1.3 : .75;
      stars.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.line + '" opacity="' + (.18 + (i % 4) * .1) + '"/>');
    }
    return '<div class="portrait-fallback">' +
      '<svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="' + uid + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p.sky1 + '"/><stop offset="1" stop-color="' + p.sky2 + '"/></linearGradient>' +
      '<radialGradient id="' + uid + 'glow" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="' + p.halo + '" stop-opacity=".28"/><stop offset=".6" stop-color="' + p.halo + '" stop-opacity=".05"/><stop offset="1" stop-color="' + p.halo + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + uid + 'robe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.robe1 + '"/><stop offset="1" stop-color="' + p.robe2 + '"/></linearGradient>' +
      '<linearGradient id="' + uid + 'hood" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="' + p.robe1 + '"/><stop offset="1" stop-color="' + p.robe2 + '"/></linearGradient>' +
      '<linearGradient id="' + uid + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.line + '"/><stop offset="1" stop-color="' + p.accent + '"/></linearGradient>' +
      '</defs>' +
      '<rect width="320" height="400" fill="url(#' + uid + 'sky)"/>' +
      '<rect width="320" height="400" fill="url(#' + uid + 'glow)"/>' +
      '<circle cx="232" cy="102" r="37" fill="none" stroke="' + p.halo + '" stroke-width=".7" opacity=".2"/>' +
      '<circle cx="232" cy="102" r="23" fill="' + p.halo + '" opacity=".08"/>' +
      stars.join('') +
      '<path d="M-12 292 L52 237 L94 261 L150 210 L202 267 L253 228 L332 286 L332 400 L-12 400 Z" fill="' + p.hill + '" opacity=".72"/>' +
      '<path d="M-10 327 L58 289 L111 315 L173 269 L236 312 L286 281 L340 306 L340 400 L-10 400 Z" fill="' + p.sky2 + '" opacity=".72"/>' +
      '<g>' +
      '<path d="M18 400 C32 336 72 301 132 288 L188 288 C248 301 288 336 302 400 Z" fill="' + p.robe2 + '" opacity=".55"/>' +
      portraitFigure(variant, { halo: p.halo, accent: p.accent, robe1: p.robe1, robe2: p.robe2 }, uid) +
      '</g>' +
      '<g fill="none" stroke="' + p.line + '" stroke-width=".7" opacity=".2">' +
      '<path d="M28 40 C50 26 70 26 92 40"/>' +
      '<path d="M228 344 C252 330 272 330 294 344"/>' +
      '<circle cx="160" cy="200" r="137" stroke-dasharray="1 7"/>' +
      '</g>' +
      '<g fill="' + p.line + '" opacity=".5">' +
      '<path d="M26 62 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>' +
      '<path d="M291 72 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>' +
      '</g>' +
      '<rect x="10" y="10" width="300" height="380" fill="none" stroke="' + p.line + '" stroke-width=".6" opacity=".14"/>' +
      '</svg>' +
      '<span class="portrait-letter">' + MF.esc(initial) + '</span>' +
      '</div>';
  };

  MF.characterPortrait = function (character, imageClass) {
    if (!character) return '';
    if (character.portrait) {
      return '<img class="' + (imageClass || 'char-portrait-img') + '" src="' + MF.esc(character.portrait) + '" alt="Портрет: ' + MF.esc(character.name) + '" loading="lazy">';
    }
    return MF.portraitArt(character);
  };

  MF.characterAvatar = function (character, extra) {
    if (!character) return '<span class="rel-avatar ' + (extra || '') + '">?</span>';
    if (character.portrait) {
      return '<span class="rel-avatar ' + (extra || '') + '"><img src="' + MF.esc(character.portrait) + '" alt=""></span>';
    }
    return '<span class="rel-avatar ' + (extra || '') + '">' + MF.esc(MF.initials(character.name)) + '</span>';
  };

  const LAND_PALETTES = {
    forest: { sky1: '#2a3a39', sky2: '#0d1717', haze: '#9bb59f', far: '#263b34', near: '#16251f', fore: '#0c1512', accent: '#c3a86b' },
    water: { sky1: '#233647', sky2: '#0b131c', haze: '#a8c1d4', far: '#253b4a', near: '#152733', fore: '#0b151c', accent: '#d3bb83' },
    city: { sky1: '#342f30', sky2: '#111013', haze: '#d3b58d', far: '#292831', near: '#1a1d24', fore: '#0c1115', accent: '#e0bd7f' },
    desert: { sky1: '#3d3326', sky2: '#15100a', haze: '#dcb77c', far: '#3a3022', near: '#272014', fore: '#17120b', accent: '#e7c086' },
    mountain: { sky1: '#2c3341', sky2: '#0c1118', haze: '#aebdd1', far: '#293442', near: '#18222d', fore: '#0b1117', accent: '#c8d4e2' },
    magic: { sky1: '#312b43', sky2: '#0e0b17', haze: '#b7a4d7', far: '#2c2640', near: '#1b1729', fore: '#0e0b14', accent: '#d6c193' }
  };

  function landScene(type) {
    const t = String(type || '').toLowerCase();
    if (/лес|роща|чаща/.test(t)) return 'forest';
    if (/озер|мор|река|берег|остров|болот/.test(t)) return 'water';
    if (/город|столиц|крепост|замок|дерев|руин|башн|порт/.test(t)) return 'city';
    if (/пустош|пустын|степ|пепел|долин/.test(t)) return 'desert';
    if (/гор|скал|перевал|пещер/.test(t)) return 'mountain';
    if (/свят|портал|храм/.test(t)) return 'magic';
    return 'mountain';
  }

  MF.landscapeArt = function (entity) {
    const seed = hashStr((entity && (entity.id || entity.name)) || 'land');
    const pal = LAND_PALETTES[landScene(entity && entity.type)];
    const uid = 'lsa' + seed;
    let scene = '';
    if (landScene(entity && entity.type) === 'forest') {
      scene = '<g fill="' + pal.fore + '">' +
        '<path d="M34 330 L48 240 L62 330 Z"/><path d="M68 330 L86 210 L104 330 Z"/><path d="M120 330 L136 255 L152 330 Z"/>' +
        '<path d="M480 330 L500 225 L520 330 Z"/><path d="M524 330 L544 195 L564 330 Z"/><path d="M578 330 L594 248 L610 330 Z"/>' +
        '<path d="M236 328 L248 276 L260 328 Z"/><path d="M280 328 L292 295 L304 328 Z"/></g>' +
        '<g stroke="' + pal.haze + '" opacity=".16" stroke-width="1"><path d="M0 306 C120 280 220 323 330 297 C450 269 554 306 640 285"/><path d="M0 320 C131 295 225 342 360 313 C486 286 565 319 640 304"/></g>';
    } else if (landScene(entity && entity.type) === 'water') {
      scene = '<g>' +
        '<ellipse cx="330" cy="305" rx="300" ry="43" fill="' + pal.fore + '" opacity=".7"/>' +
        '<path d="M78 273 C190 252 284 285 396 263 C493 244 560 267 640 255" stroke="' + pal.haze + '" stroke-width="1" opacity=".25" fill="none"/>' +
        '<path d="M120 288 C228 271 306 298 418 281 C501 268 562 282 620 274" stroke="' + pal.accent + '" stroke-width=".8" opacity=".2" fill="none"/>' +
        '<path d="M440 300 L472 257 L504 300 Z" fill="' + pal.near + '"/>' +
        '<path d="M462 302 L477 273 L492 302 Z" fill="' + pal.fore + '"/>' +
        '</g>';
    } else if (landScene(entity && entity.type) === 'city') {
      scene = '<g fill="' + pal.fore + '">' +
        '<path d="M250 327 L250 225 L274 209 L298 225 L298 327 Z"/>' +
        '<path d="M300 327 L300 188 L329 166 L358 188 L358 327 Z"/>' +
        '<path d="M362 327 L362 236 L384 220 L406 236 L406 327 Z"/>' +
        '<path d="M230 327 L430 327 L430 338 L230 338 Z"/>' +
        '<path d="M204 231 L222 199 L240 231 Z"/>' +
        '<path d="M410 243 L429 214 L448 243 Z"/>' +
        '</g>' +
        '<g fill="' + pal.accent + '" opacity=".48">' +
        '<rect x="309" y="212" width="4" height="8" rx="1"/><rect x="322" y="212" width="4" height="8" rx="1"/>' +
        '<rect x="309" y="240" width="4" height="8" rx="1"/><rect x="335" y="240" width="4" height="8" rx="1"/>' +
        '<rect x="262" y="249" width="3" height="6" rx="1"/><rect x="375" y="253" width="3" height="6" rx="1"/>' +
        '</g>' +
        '<path d="M0 329 C119 312 210 333 330 321 C445 309 552 329 640 316 L640 360 L0 360Z" fill="' + pal.near + '"/>';
    } else if (landScene(entity && entity.type) === 'desert') {
      scene = '<path d="M0 302 C110 264 188 287 281 276 C411 260 486 285 640 252 L640 360 L0 360 Z" fill="' + pal.near + '"/>' +
        '<path d="M0 329 C155 300 251 344 396 321 C502 304 566 326 640 314 L640 360 L0 360 Z" fill="' + pal.fore + '"/>' +
        '<path d="M432 318 L432 252 L444 235 L456 252 L456 318 Z" fill="' + pal.fore + '" opacity=".9"/>' +
        '<path d="M444 235 L444 216" stroke="' + pal.accent + '" stroke-width="1" opacity=".3"/>' +
        '<g stroke="' + pal.haze + '" opacity=".13" stroke-width="1"><path d="M20 338 C120 320 190 348 286 334"/><path d="M350 347 C448 331 548 348 620 338"/></g>';
    } else if (landScene(entity && entity.type) === 'magic') {
      scene = '<g>' +
        '<circle cx="405" cy="143" r="48" fill="none" stroke="' + pal.haze + '" stroke-width=".8" opacity=".35"/>' +
        '<circle cx="405" cy="143" r="35" fill="none" stroke="' + pal.haze + '" stroke-width=".6" stroke-dasharray="2 5" opacity=".4"/>' +
        '<path d="M405 109 L415 133 L439 143 L415 153 L405 177 L395 153 L371 143 L395 133 Z" fill="none" stroke="' + pal.accent + '" stroke-width=".9" opacity=".55"/>' +
        '<path d="M279 327 L279 236 L304 206 L329 236 L329 327 Z" fill="' + pal.fore + '"/>' +
        '<path d="M0 318 C130 292 219 331 340 305 C460 279 546 312 640 289 L640 360 L0 360Z" fill="' + pal.near + '"/>' +
        '</g>';
    } else {
      scene = '<path d="M-8 305 L107 155 L181 238 L251 173 L339 283 L420 205 L532 309 L648 230 L648 360 L-8 360Z" fill="' + pal.far + '"/>' +
        '<path d="M-8 333 L126 225 L210 295 L301 217 L412 327 L505 257 L648 324 L648 360 L-8 360Z" fill="' + pal.near + '"/>' +
        '<path d="M0 345 C130 324 212 351 330 337 C454 322 547 348 640 333 L640 360 L0 360Z" fill="' + pal.fore + '"/>';
    }
    return '<div class="landscape-fallback">' +
      '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + uid + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + pal.sky1 + '"/><stop offset="1" stop-color="' + pal.sky2 + '"/></linearGradient>' +
      '<radialGradient id="' + uid + 'glow" cx="66%" cy="37%" r="48%"><stop offset="0" stop-color="' + pal.haze + '" stop-opacity=".32"/><stop offset="1" stop-color="' + pal.haze + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="640" height="360" fill="url(#' + uid + 'sky)"/>' +
      '<rect width="640" height="360" fill="url(#' + uid + 'glow)"/>' +
      '<circle cx="423" cy="141" r="34" fill="' + pal.haze + '" opacity=".18"/>' +
      '<circle cx="423" cy="141" r="22" fill="' + pal.haze + '" opacity=".22"/>' +
      '<g fill="' + pal.haze + '" opacity=".6"><circle cx="92" cy="63" r="1"/><circle cx="184" cy="43" r=".8"/><circle cx="278" cy="82" r="1"/><circle cx="553" cy="59" r=".8"/><circle cx="506" cy="105" r="1"/><circle cx="38" cy="133" r=".7"/></g>' +
      scene +
      '<g fill="none" stroke="' + pal.accent + '" stroke-width=".65" opacity=".16"><path d="M0 343 C171 330 318 351 477 339 C543 334 592 339 640 335"/><path d="M54 352 C203 341 372 358 565 344"/></g>' +
      '<rect x="8" y="8" width="624" height="344" fill="none" stroke="' + pal.haze + '" stroke-width=".6" opacity=".1"/>' +
      '</svg>' +
      '</div>';
  };

  MF.locationMedia = function (location) {
    if (!location) return '';
    if (location.image) {
      return '<img src="' + MF.esc(location.image) + '" alt="' + MF.esc(location.name) + '" loading="lazy">';
    }
    return MF.landscapeArt(location);
  };

  const LORE_COLORS = {
    'История': ['#2a3443', '#cfaf72'],
    'Магия': ['#2c2741', '#b7a3da'],
    'Религия': ['#382d2b', '#c9a18d'],
    'Артефакты': ['#333023', '#dcc38c'],
    'Бестиарий': ['#23342e', '#a7c6a1'],
    'Культура': ['#35302a', '#cbb59c'],
    'География': ['#263437', '#9fbec2'],
    'Персоналии': ['#352a31', '#cda0ad'],
    'Другое': ['#2c2c2c', '#bdb7a8']
  };

  MF.loreArt = function (article) {
    if (!article) return '';
    if (article.image) {
      return '<img src="' + MF.esc(article.image) + '" alt="' + MF.esc(article.title) + '" loading="lazy">' +
        '<div class="lore-rune">' + MF.icon('i-book') + '</div>';
    }
    const seed = hashStr(article.id || article.title);
    const pal = LORE_COLORS[article.category] || LORE_COLORS['Другое'];
    const uid = 'lra' + seed;
    return '<div class="landscape-fallback">' +
      '<svg viewBox="0 0 640 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="' + uid + 'g" cx="62%" cy="36%" r="60%"><stop offset="0" stop-color="' + pal[1] + '" stop-opacity=".18"/><stop offset="1" stop-color="' + pal[1] + '" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="640" height="280" fill="' + pal[0] + '"/>' +
      '<rect width="640" height="280" fill="url(#' + uid + 'g)"/>' +
      '<g fill="none" stroke="' + pal[1] + '" opacity=".16">' +
      '<circle cx="456" cy="138" r="88" stroke-width=".8"/>' +
      '<circle cx="456" cy="138" r="62" stroke-width=".6" stroke-dasharray="2 6"/>' +
      '<path d="M456 54 L470 124 L540 138 L470 152 L456 222 L442 152 L372 138 L442 124 Z" stroke-width=".9"/>' +
      '<path d="M20 236 C130 209 236 249 339 222 C443 195 519 230 625 207" stroke-width=".8"/>' +
      '</g>' +
      '<g fill="' + pal[1] + '" opacity=".35"><circle cx="87" cy="55" r="1"/><circle cx="170" cy="91" r=".8"/><circle cx="276" cy="42" r=".9"/><circle cx="598" cy="82" r=".8"/><circle cx="52" cy="180" r=".7"/></g>' +
      '<g stroke="' + pal[1] + '" stroke-width=".65" opacity=".2"><path d="M28 40 C50 25 67 25 88 39"/><path d="M549 242 C572 227 591 227 614 242"/></g>' +
      '</svg></div>' +
      '<div class="lore-rune">' + MF.icon('i-book') + '</div>';
  };

  MF.factionEmblemMarkup = function (faction, extraClass) {
    const color = faction && faction.color ? faction.color : '#c5a15f';
    const emblem = faction && faction.emblem;
    const letter = faction && faction.name ? faction.name.replace(/^(Дом|Ковен|Орден|Клан|Дом)\s+/i, '').charAt(0) : '✦';
    return '<div class="faction-emblem ' + (extraClass || '') + (emblem ? ' has-image' : '') + '" style="--faction-color:' + MF.esc(color) + ';' + (emblem ? 'background-image:url(&quot;' + MF.esc(emblem) + '&quot;)' : '') + '">' +
      '<span class="emblem-ring"></span>' +
      '<span class="emblem-letter">' + MF.esc(letter.toUpperCase()) + '</span>' +
      '</div>';
  };

  MF.statusBadge = function (status) {
    const cls = MF.statusClass(status);
    return '<span class="char-status ' + cls + '"><span class="status-dot"></span>' + MF.esc(status || 'Неизвестно') + '</span>';
  };

  MF.eventTypeBadge = function (type) {
    const et = MF.EVENT_TYPES[type] || MF.EVENT_TYPES.other;
    return '<span class="event-type event-type--' + et.cls + '">' + MF.icon(et.icon) + MF.esc(et.label) + '</span>';
  };

  MF.eventYearLabel = function (event) {
    if (!event) return '—';
    const match = String(event.dateText || '').match(/-?\d+/);
    return match ? match[0].replace('-', '−') : '—';
  };

  MF.tagList = function (tags, limit) {
    if (!Array.isArray(tags) || !tags.length) return '';
    return tags.slice(0, limit || 5).map(function (t) { return '<span class="tag">' + MF.esc(t) + '</span>'; }).join('');
  };

  MF.charQuoteForDay = function () {
    const chars = MF.state.data.characters.filter(function (c) { return c.quote; });
    if (!chars.length) return null;
    const seed = Math.floor(Date.now() / 86400000);
    return chars[seed % chars.length];
  };
})();
